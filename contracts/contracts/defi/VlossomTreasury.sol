// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VlossomTreasury
 * @notice Protocol treasury for collecting platform fees and distributing yield
 * @dev Receives 10% platform fee from bookings, distributes to VLP/Buffer/Operations
 *
 * Fee Split (configurable):
 * - 50% Operations (dev, legal, audits)
 * - 40% VLP Yield (LP rewards)
 * - 10% Smoothing Buffer reserve
 */
contract VlossomTreasury is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidSplit();
    error InsufficientBalance();

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // ============ State ============

    /// @notice USDC token
    IERC20 public immutable usdc;

    /// @notice Genesis pool address (receives LP yield)
    address public genesisPool;

    /// @notice Smoothing buffer address
    address public smoothingBuffer;

    /// @notice Operations wallet (dev, legal, audits)
    address public operationsWallet;

    /// @notice Fee split percentages (basis points, must sum to 10000)
    uint256 public operationsSplit;   // Default: 5000 (50%)
    uint256 public lpYieldSplit;      // Default: 4000 (40%)
    uint256 public bufferSplit;       // Default: 1000 (10%)

    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    /// @notice Total distributed to each destination
    uint256 public totalToOperations;
    uint256 public totalToLPYield;
    uint256 public totalToBuffer;

    // ============ Events ============

    event FeesCollected(address indexed from, uint256 amount);
    event FeesDistributed(
        uint256 toOperations,
        uint256 toLPYield,
        uint256 toBuffer
    );
    event SplitUpdated(
        uint256 operationsSplit,
        uint256 lpYieldSplit,
        uint256 bufferSplit
    );
    event AddressesUpdated(
        address genesisPool,
        address smoothingBuffer,
        address operationsWallet
    );
    event EmergencyWithdrawal(address indexed to, uint256 amount);

    // ============ Constructor ============

    /**
     * @notice Initialize the treasury
     * @param _usdc USDC token address
     * @param _admin Admin address
     * @param _operationsWallet Operations wallet address
     */
    constructor(
        address _usdc,
        address _admin,
        address _operationsWallet
    ) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_operationsWallet == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);
        operationsWallet = _operationsWallet;

        // Default split: 50% ops, 40% LP, 10% buffer
        operationsSplit = 5000;
        lpYieldSplit = 4000;
        bufferSplit = 1000;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(DISTRIBUTOR_ROLE, _admin);
    }

    // ============ External Functions ============

    /**
     * @notice Collect fees into treasury
     * @param amount Amount of USDC to collect
     * @dev Caller must have approved this contract
     */
    function collectFees(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        totalFeesCollected += amount;

        emit FeesCollected(msg.sender, amount);
    }

    /**
     * @notice Distribute collected fees according to split
     * @dev Only callable by distributor role
     */
    function distributeFees() external nonReentrant whenNotPaused {
        if (!hasRole(DISTRIBUTOR_ROLE, msg.sender)) revert InvalidAddress();

        uint256 currentBalance = usdc.balanceOf(address(this));
        if (currentBalance == 0) revert InsufficientBalance();

        uint256 toOperations = (currentBalance * operationsSplit) / 10000;
        uint256 toLPYield = (currentBalance * lpYieldSplit) / 10000;
        uint256 toBuffer = currentBalance - toOperations - toLPYield; // Remainder to avoid rounding issues

        // Transfer to operations
        if (toOperations > 0 && operationsWallet != address(0)) {
            usdc.safeTransfer(operationsWallet, toOperations);
            totalToOperations += toOperations;
        }

        // Transfer to genesis pool for LP yield
        if (toLPYield > 0 && genesisPool != address(0)) {
            usdc.safeTransfer(genesisPool, toLPYield);
            totalToLPYield += toLPYield;
        }

        // Transfer to smoothing buffer
        if (toBuffer > 0 && smoothingBuffer != address(0)) {
            usdc.safeTransfer(smoothingBuffer, toBuffer);
            totalToBuffer += toBuffer;
        }

        emit FeesDistributed(toOperations, toLPYield, toBuffer);
    }

    /**
     * @notice Direct fund transfer to VLP (for yield injection)
     * @param amount Amount to send to genesis pool
     */
    function fundVLP(uint256 amount) external nonReentrant whenNotPaused {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (genesisPool == address(0)) revert InvalidAddress();

        uint256 currentBalance = usdc.balanceOf(address(this));
        if (currentBalance < amount) revert InsufficientBalance();

        usdc.safeTransfer(genesisPool, amount);
        totalToLPYield += amount;

        emit FeesDistributed(0, amount, 0);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update fee split percentages
     * @param _operationsSplit Operations percentage (basis points)
     * @param _lpYieldSplit LP yield percentage (basis points)
     * @param _bufferSplit Buffer percentage (basis points)
     * @dev Must sum to 10000, LP split must be 30-70%
     */
    function setSplit(
        uint256 _operationsSplit,
        uint256 _lpYieldSplit,
        uint256 _bufferSplit
    ) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (_operationsSplit + _lpYieldSplit + _bufferSplit != 10000) revert InvalidSplit();
        // Guardrails: LP share must be between 30-70%
        if (_lpYieldSplit < 3000 || _lpYieldSplit > 7000) revert InvalidSplit();

        operationsSplit = _operationsSplit;
        lpYieldSplit = _lpYieldSplit;
        bufferSplit = _bufferSplit;

        emit SplitUpdated(_operationsSplit, _lpYieldSplit, _bufferSplit);
    }

    /**
     * @notice Update destination addresses
     * @param _genesisPool Genesis pool address
     * @param _smoothingBuffer Smoothing buffer address
     * @param _operationsWallet Operations wallet address
     */
    function setAddresses(
        address _genesisPool,
        address _smoothingBuffer,
        address _operationsWallet
    ) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();

        genesisPool = _genesisPool;
        smoothingBuffer = _smoothingBuffer;
        if (_operationsWallet != address(0)) {
            operationsWallet = _operationsWallet;
        }

        emit AddressesUpdated(_genesisPool, _smoothingBuffer, _operationsWallet);
    }

    /**
     * @notice Emergency withdrawal of stuck funds
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (to == address(0)) revert InvalidAddress();

        usdc.safeTransfer(to, amount);
        emit EmergencyWithdrawal(to, amount);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get current treasury balance
     */
    function balance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Get fee split configuration
     */
    function getSplit() external view returns (
        uint256 _operationsSplit,
        uint256 _lpYieldSplit,
        uint256 _bufferSplit
    ) {
        return (operationsSplit, lpYieldSplit, bufferSplit);
    }

    /**
     * @notice Get distribution totals
     */
    function getDistributionTotals() external view returns (
        uint256 _totalToOperations,
        uint256 _totalToLPYield,
        uint256 _totalToBuffer
    ) {
        return (totalToOperations, totalToLPYield, totalToBuffer);
    }
}
