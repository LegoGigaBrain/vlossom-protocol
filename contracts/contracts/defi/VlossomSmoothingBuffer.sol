// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VlossomSmoothingBuffer
 * @notice Handles instant stylist payouts before escrow settlement
 * @dev Bridges timing gap between service completion and escrow release
 *
 * Flow:
 * 1. Stylist completes service
 * 2. Buffer provides instant payout (if liquidity available)
 * 3. Escrow releases funds later
 * 4. Buffer is replenished from escrow release
 *
 * Replenishment sources:
 * - Escrow releases (primary)
 * - Treasury distributions
 * - Genesis Pool (emergency)
 */
contract VlossomSmoothingBuffer is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientBuffer();
    error PayoutAlreadyProcessed();
    error PayoutNotFound();

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAYOUT_ROLE = keccak256("PAYOUT_ROLE");
    bytes32 public constant REPLENISH_ROLE = keccak256("REPLENISH_ROLE");

    // ============ Structs ============

    struct PayoutRecord {
        address stylist;
        uint256 amount;
        bytes32 bookingId;
        uint256 paidAt;
        bool replenished;
    }

    // ============ State ============

    /// @notice USDC token
    IERC20 public immutable usdc;

    /// @notice Genesis pool address (for emergency draws)
    address public genesisPool;

    /// @notice Treasury address
    address public treasury;

    /// @notice Total payouts made
    uint256 public totalPayouts;

    /// @notice Total replenishments received
    uint256 public totalReplenishments;

    /// @notice Pending replenishments (payouts awaiting escrow release)
    uint256 public pendingReplenishments;

    /// @notice Minimum buffer threshold (triggers replenishment request)
    uint256 public minBufferThreshold;

    /// @notice Payout records by booking ID
    mapping(bytes32 => PayoutRecord) public payouts;

    /// @notice Whether a booking has been paid out
    mapping(bytes32 => bool) public bookingPaidOut;

    // ============ Events ============

    event InstantPayoutMade(
        bytes32 indexed bookingId,
        address indexed stylist,
        uint256 amount
    );
    event BufferReplenished(address indexed from, uint256 amount);
    event PayoutReconciled(bytes32 indexed bookingId, uint256 amount);
    event ThresholdUpdated(uint256 newThreshold);
    event EmergencyDraw(address indexed from, uint256 amount);

    // ============ Constructor ============

    /**
     * @notice Initialize the smoothing buffer
     * @param _usdc USDC token address
     * @param _admin Admin address
     * @param _minThreshold Minimum buffer threshold
     */
    constructor(
        address _usdc,
        address _admin,
        uint256 _minThreshold
    ) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);
        minBufferThreshold = _minThreshold;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PAYOUT_ROLE, _admin);
        _grantRole(REPLENISH_ROLE, _admin);
    }

    // ============ Payout Functions ============

    /**
     * @notice Make instant payout to stylist
     * @param bookingId Unique booking identifier
     * @param stylist Stylist address
     * @param amount Payout amount
     * @dev Called by backend when service is completed
     */
    function instantPayout(
        bytes32 bookingId,
        address stylist,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (!hasRole(PAYOUT_ROLE, msg.sender)) revert InvalidAddress();
        if (stylist == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (bookingPaidOut[bookingId]) revert PayoutAlreadyProcessed();

        uint256 currentBalance = usdc.balanceOf(address(this));
        if (currentBalance < amount) revert InsufficientBuffer();

        // Effects
        bookingPaidOut[bookingId] = true;
        payouts[bookingId] = PayoutRecord({
            stylist: stylist,
            amount: amount,
            bookingId: bookingId,
            paidAt: block.timestamp,
            replenished: false
        });

        totalPayouts += amount;
        pendingReplenishments += amount;

        // Interactions
        usdc.safeTransfer(stylist, amount);

        emit InstantPayoutMade(bookingId, stylist, amount);
    }

    /**
     * @notice Batch instant payouts (gas efficient)
     * @param bookingIds Array of booking IDs
     * @param stylists Array of stylist addresses
     * @param amounts Array of amounts
     */
    function batchInstantPayout(
        bytes32[] calldata bookingIds,
        address[] calldata stylists,
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused {
        if (!hasRole(PAYOUT_ROLE, msg.sender)) revert InvalidAddress();

        uint256 len = bookingIds.length;
        require(len == stylists.length && len == amounts.length, "Array length mismatch");

        uint256 totalAmount;
        for (uint256 i = 0; i < len; i++) {
            totalAmount += amounts[i];
        }

        if (usdc.balanceOf(address(this)) < totalAmount) revert InsufficientBuffer();

        for (uint256 i = 0; i < len; i++) {
            if (bookingPaidOut[bookingIds[i]]) continue;

            bookingPaidOut[bookingIds[i]] = true;
            payouts[bookingIds[i]] = PayoutRecord({
                stylist: stylists[i],
                amount: amounts[i],
                bookingId: bookingIds[i],
                paidAt: block.timestamp,
                replenished: false
            });

            usdc.safeTransfer(stylists[i], amounts[i]);
            emit InstantPayoutMade(bookingIds[i], stylists[i], amounts[i]);
        }

        totalPayouts += totalAmount;
        pendingReplenishments += totalAmount;
    }

    // ============ Replenishment Functions ============

    /**
     * @notice Replenish buffer from escrow release
     * @param amount Amount to replenish
     * @dev Called when escrow releases funds
     */
    function replenish(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalReplenishments += amount;

        if (pendingReplenishments >= amount) {
            pendingReplenishments -= amount;
        } else {
            pendingReplenishments = 0;
        }

        emit BufferReplenished(msg.sender, amount);
    }

    /**
     * @notice Reconcile a specific payout (mark as replenished)
     * @param bookingId Booking ID to reconcile
     */
    function reconcilePayout(bytes32 bookingId) external {
        if (!hasRole(REPLENISH_ROLE, msg.sender)) revert InvalidAddress();

        PayoutRecord storage record = payouts[bookingId];
        if (record.paidAt == 0) revert PayoutNotFound();
        if (record.replenished) revert PayoutAlreadyProcessed();

        record.replenished = true;

        emit PayoutReconciled(bookingId, record.amount);
    }

    /**
     * @notice Emergency draw from genesis pool
     * @param amount Amount to draw
     * @dev Only used when buffer is critically low
     */
    function emergencyDrawFromPool(uint256 amount) external nonReentrant {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (genesisPool == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        usdc.safeTransferFrom(genesisPool, address(this), amount);

        emit EmergencyDraw(genesisPool, amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set connected addresses
     * @param _genesisPool Genesis pool address
     * @param _treasury Treasury address
     */
    function setAddresses(address _genesisPool, address _treasury) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();

        genesisPool = _genesisPool;
        treasury = _treasury;
    }

    /**
     * @notice Update minimum buffer threshold
     * @param _threshold New threshold
     */
    function setMinThreshold(uint256 _threshold) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();

        minBufferThreshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }

    /**
     * @notice Grant payout role to an address
     * @param account Address to grant role
     */
    function grantPayoutRole(address account) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _grantRole(PAYOUT_ROLE, account);
    }

    /**
     * @notice Pause the buffer
     */
    function pause() external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _pause();
    }

    /**
     * @notice Unpause the buffer
     */
    function unpause() external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get current buffer balance
     */
    function bufferBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Check if buffer needs replenishment
     */
    function needsReplenishment() external view returns (bool) {
        return usdc.balanceOf(address(this)) < minBufferThreshold;
    }

    /**
     * @notice Get buffer health metrics
     */
    function getBufferHealth() external view returns (
        uint256 balance,
        uint256 threshold,
        uint256 pending,
        bool healthy
    ) {
        balance = usdc.balanceOf(address(this));
        threshold = minBufferThreshold;
        pending = pendingReplenishments;
        healthy = balance >= threshold;
    }

    /**
     * @notice Get payout record
     * @param bookingId Booking ID
     */
    function getPayoutRecord(bytes32 bookingId) external view returns (PayoutRecord memory) {
        return payouts[bookingId];
    }
}
