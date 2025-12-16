// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IEscrow} from "../interfaces/IEscrow.sol";

/**
 * @title Escrow
 * @notice Secure USDC escrow contract for Vlossom Protocol beauty service bookings
 * @dev Implements multi-party settlement with checks-effects-interactions pattern
 *
 * Security features:
 * - ReentrancyGuard on all external fund-moving functions
 * - SafeERC20 for token transfers
 * - Role-based access control via OpenZeppelin AccessControl (C-1 fix)
 * - Multi-relayer support to eliminate single point of failure
 * - Single-use escrow records (cannot be reused after release/refund)
 * - Total amount validation on release
 * - Emergency pause mechanism (Pausable)
 * - Time-locked emergency recovery for stuck funds (M-3 fix)
 *
 * Invariants:
 * - Each bookingId can only have one escrow record
 * - Escrow can only move from Locked -> Released or Locked -> Refunded
 * - Total released must equal total locked (no partial refunds in v1)
 * - Only addresses with RELAYER_ROLE can trigger settlements/refunds
 */
contract Escrow is IEscrow, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @dev Custom errors for gas optimization
    error InvalidAmount();
    error InvalidAddress();
    error BookingAlreadyExists();
    error BookingNotFound();
    error InvalidEscrowStatus();
    error UnauthorizedCaller();
    error AmountMismatch();
    error InsufficientEscrowBalance();
    error EmergencyRecoveryNotRequested();
    error EmergencyRecoveryDelayNotMet();
    error EmergencyRecoveryAlreadyRequested();

    /// @notice Role identifier for authorized relayers (C-1 fix: multi-relayer support)
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    /// @notice Role identifier for admin operations
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Emergency recovery delay period (M-3 fix)
    uint256 public constant EMERGENCY_RECOVERY_DELAY = 7 days;

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Mapping of booking IDs to escrow records
    mapping(bytes32 => EscrowRecord) public escrows;

    /// @notice Emergency recovery request structure (M-3 fix)
    struct EmergencyRecoveryRequest {
        address recipient;
        uint256 requestedAt;
    }

    /// @notice Pending emergency recoveries
    mapping(bytes32 => EmergencyRecoveryRequest) public emergencyRecoveries;

    /// @dev Modifier to restrict access to authorized relayers
    modifier onlyRelayer() {
        if (!hasRole(RELAYER_ROLE, msg.sender)) revert UnauthorizedCaller();
        _;
    }

    /// @dev Modifier to restrict access to admins
    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert UnauthorizedCaller();
        _;
    }

    /**
     * @notice Initialize the escrow contract
     * @param _usdc Address of the USDC token contract
     * @param _initialOwner Address of the contract owner/admin
     * @param _initialRelayer Address of the initial authorized relayer
     * @dev C-1 fix: Uses AccessControl for role-based multi-relayer support
     */
    constructor(
        address _usdc,
        address _initialOwner,
        address _initialRelayer
    ) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_initialOwner == address(0)) revert InvalidAddress();
        if (_initialRelayer == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);

        // Setup role hierarchy
        _grantRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _grantRole(ADMIN_ROLE, _initialOwner);
        _grantRole(RELAYER_ROLE, _initialRelayer);

        emit RelayerAdded(_initialRelayer);
    }

    /**
     * @notice Lock USDC funds from customer into escrow
     * @param bookingId Unique identifier for the booking
     * @param amount Amount of USDC to lock (in smallest unit, typically 6 decimals)
     *
     * @dev Requirements:
     * - amount must be > 0
     * - bookingId must not already exist
     * - caller must have approved this contract to transfer USDC
     * - caller must have sufficient USDC balance
     *
     * Effects:
     * - Creates escrow record with status Locked
     * - Transfers USDC from msg.sender to this contract
     * - Emits FundsLocked event
     */
    function lockFunds(bytes32 bookingId, uint256 amount) external nonReentrant whenNotPaused {
        // Input validation
        if (amount == 0) revert InvalidAmount();
        if (escrows[bookingId].status != EscrowStatus.None) revert BookingAlreadyExists();

        // Effects: Update state before external call
        escrows[bookingId] = EscrowRecord({
            customer: msg.sender,
            amount: amount,
            status: EscrowStatus.Locked
        });

        // Interactions: External call comes last
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit FundsLocked(bookingId, msg.sender, amount);
    }

    /**
     * @notice Release escrowed funds to stylist and platform treasury
     * @param bookingId Unique identifier for the booking
     * @param stylist Address of the stylist receiving payment
     * @param stylistAmount Amount to send to stylist
     * @param treasury Address of the platform treasury
     * @param platformFeeAmount Amount to send to treasury as platform fee
     *
     * @dev Requirements:
     * - caller must be authorized relayer
     * - escrow must exist and be in Locked status
     * - stylist and treasury addresses must be valid
     * - stylistAmount + platformFeeAmount must equal locked amount
     *
     * Effects:
     * - Updates escrow status to Released
     * - Transfers funds to stylist and treasury
     * - Emits FundsReleased event
     */
    function releaseFunds(
        bytes32 bookingId,
        address stylist,
        uint256 stylistAmount,
        address treasury,
        uint256 platformFeeAmount
    ) external onlyRelayer nonReentrant whenNotPaused {
        // Input validation
        if (stylist == address(0) || treasury == address(0)) revert InvalidAddress();

        EscrowRecord storage record = escrows[bookingId];
        if (record.status != EscrowStatus.Locked) revert InvalidEscrowStatus();

        uint256 totalAmount = stylistAmount + platformFeeAmount;
        if (totalAmount != record.amount) revert AmountMismatch();

        // Effects: Update state before external calls
        record.status = EscrowStatus.Released;

        // Interactions: External calls come last
        if (stylistAmount > 0) {
            usdc.safeTransfer(stylist, stylistAmount);
        }
        if (platformFeeAmount > 0) {
            usdc.safeTransfer(treasury, platformFeeAmount);
        }

        emit FundsReleased(bookingId, stylist, stylistAmount, platformFeeAmount);
    }

    /**
     * @notice Refund escrowed funds to customer or specified recipient
     * @param bookingId Unique identifier for the booking
     * @param amount Amount to refund (must equal full locked amount - no partial refunds in v1)
     * @param recipient Address to receive the refund
     *
     * @dev Requirements:
     * - caller must be authorized relayer
     * - escrow must exist and be in Locked status
     * - recipient address must be valid
     * - amount must exactly equal locked amount (no partial refunds)
     *
     * Effects:
     * - Updates escrow status to Refunded
     * - Transfers refund amount to recipient
     * - Emits FundsRefunded event
     *
     * Security note: Partial refunds are disabled in v1 to prevent funds from being
     * permanently locked. The full locked amount must be refunded in a single call.
     */
    function refund(
        bytes32 bookingId,
        uint256 amount,
        address recipient
    ) external onlyRelayer nonReentrant whenNotPaused {
        // Input validation
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        EscrowRecord storage record = escrows[bookingId];
        if (record.status != EscrowStatus.Locked) revert InvalidEscrowStatus();
        // SECURITY FIX (C-1): Require exact amount match to prevent funds from being locked
        if (amount != record.amount) revert AmountMismatch();

        // Effects: Update state before external call
        record.status = EscrowStatus.Refunded;

        // Interactions: External call comes last
        usdc.safeTransfer(recipient, amount);

        emit FundsRefunded(bookingId, recipient, amount);
    }

    /**
     * @notice Get the locked balance for a booking
     * @param bookingId Unique identifier for the booking
     * @return The amount currently locked in escrow
     */
    function getEscrowBalance(bytes32 bookingId) external view returns (uint256) {
        EscrowRecord memory record = escrows[bookingId];
        if (record.status == EscrowStatus.Locked) {
            return record.amount;
        }
        return 0;
    }

    /**
     * @notice Get complete escrow record details
     * @param bookingId Unique identifier for the booking
     * @return record The complete escrow record
     */
    function getEscrowRecord(bytes32 bookingId) external view returns (EscrowRecord memory) {
        return escrows[bookingId];
    }

    /**
     * @notice Add a new relayer address (C-1 fix: multi-relayer support)
     * @param newRelayer Address of the new relayer
     * @dev Only callable by admin. Supports multiple relayers for redundancy.
     */
    function addRelayer(address newRelayer) external onlyAdmin {
        if (newRelayer == address(0)) revert InvalidAddress();
        _grantRole(RELAYER_ROLE, newRelayer);
        emit RelayerAdded(newRelayer);
    }

    /**
     * @notice Remove a relayer address (C-1 fix: multi-relayer support)
     * @param relayerToRemove Address of the relayer to remove
     * @dev Only callable by admin
     */
    function removeRelayer(address relayerToRemove) external onlyAdmin {
        if (!hasRole(RELAYER_ROLE, relayerToRemove)) revert UnauthorizedCaller();
        _revokeRole(RELAYER_ROLE, relayerToRemove);
        emit RelayerRemoved(relayerToRemove);
    }

    /**
     * @notice Check if an address is an authorized relayer
     * @param account Address to check
     * @return True if the address has RELAYER_ROLE
     */
    function isRelayer(address account) external view returns (bool) {
        return hasRole(RELAYER_ROLE, account);
    }

    /**
     * @notice Get the current relayer address (deprecated - use isRelayer instead)
     * @return The address of the first relayer (for backward compatibility)
     * @dev This function is kept for backward compatibility but should not be relied upon
     *      as there can be multiple relayers now.
     */
    function getRelayer() external view returns (address) {
        // Note: This returns address(0) as we no longer track a single relayer
        // Use isRelayer(address) to check if an address is a relayer
        return address(0);
    }

    /**
     * @notice Pause the contract - emergency stop mechanism
     * @dev Only callable by admin
     * When paused, lockFunds, releaseFunds, and refund will revert
     */
    function pause() external onlyAdmin {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @notice Unpause the contract - resume normal operations
     * @dev Only callable by admin
     */
    function unpause() external onlyAdmin {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // ============ Emergency Recovery Functions (M-3 fix) ============

    /**
     * @notice Request emergency recovery of stuck funds
     * @param bookingId Booking ID to recover
     * @param recipient Where to send the recovered funds
     * @dev Only callable by admin. Requires 7-day delay before execution.
     *      This is a safety mechanism in case relayer keys are lost.
     */
    function requestEmergencyRecovery(
        bytes32 bookingId,
        address recipient
    ) external onlyAdmin {
        if (recipient == address(0)) revert InvalidAddress();

        EscrowRecord storage record = escrows[bookingId];
        if (record.status != EscrowStatus.Locked) revert InvalidEscrowStatus();
        if (emergencyRecoveries[bookingId].requestedAt != 0) {
            revert EmergencyRecoveryAlreadyRequested();
        }

        emergencyRecoveries[bookingId] = EmergencyRecoveryRequest({
            recipient: recipient,
            requestedAt: block.timestamp
        });

        emit EmergencyRecoveryRequested(
            bookingId,
            recipient,
            block.timestamp + EMERGENCY_RECOVERY_DELAY
        );
    }

    /**
     * @notice Execute emergency recovery after delay period
     * @param bookingId Booking ID to recover
     * @dev Only callable by admin after 7-day delay has passed
     */
    function executeEmergencyRecovery(
        bytes32 bookingId
    ) external onlyAdmin nonReentrant {
        EmergencyRecoveryRequest storage request = emergencyRecoveries[bookingId];
        if (request.requestedAt == 0) revert EmergencyRecoveryNotRequested();
        if (block.timestamp < request.requestedAt + EMERGENCY_RECOVERY_DELAY) {
            revert EmergencyRecoveryDelayNotMet();
        }

        EscrowRecord storage record = escrows[bookingId];
        if (record.status != EscrowStatus.Locked) revert InvalidEscrowStatus();

        uint256 amount = record.amount;
        address recipient = request.recipient;

        // Effects
        record.status = EscrowStatus.Refunded;
        delete emergencyRecoveries[bookingId];

        // Interactions
        usdc.safeTransfer(recipient, amount);

        emit EmergencyRecoveryExecuted(bookingId, recipient, amount);
    }

    /**
     * @notice Cancel a pending emergency recovery request
     * @param bookingId Booking ID
     * @dev Only callable by admin
     */
    function cancelEmergencyRecovery(bytes32 bookingId) external onlyAdmin {
        if (emergencyRecoveries[bookingId].requestedAt == 0) {
            revert EmergencyRecoveryNotRequested();
        }

        delete emergencyRecoveries[bookingId];
        emit EmergencyRecoveryCancelled(bookingId);
    }

    /**
     * @notice Get emergency recovery request details
     * @param bookingId Booking ID
     * @return recipient The recipient address
     * @return requestedAt When the request was made
     * @return executeAfter When the request can be executed
     */
    function getEmergencyRecoveryRequest(
        bytes32 bookingId
    ) external view returns (address recipient, uint256 requestedAt, uint256 executeAfter) {
        EmergencyRecoveryRequest storage request = emergencyRecoveries[bookingId];
        return (
            request.recipient,
            request.requestedAt,
            request.requestedAt > 0 ? request.requestedAt + EMERGENCY_RECOVERY_DELAY : 0
        );
    }
}
