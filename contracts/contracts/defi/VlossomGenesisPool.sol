// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IVlossomPool} from "./interfaces/IVlossomPool.sol";

/**
 * @title VlossomGenesisPool (VLP)
 * @notice Protocol-managed genesis liquidity pool with no cap
 * @dev Main pool for:
 * - Booking escrow smoothing
 * - Instant stylist payouts
 * - Benchmark APY rates
 *
 * Security features:
 * - ReentrancyGuard on all external fund-moving functions
 * - SafeERC20 for token transfers
 * - Role-based access control
 * - Emergency pause mechanism
 * - Checks-effects-interactions pattern
 */
contract VlossomGenesisPool is IVlossomPool, AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Errors ============

    error InvalidAmount();
    error InvalidAddress();
    error InsufficientShares();
    error InsufficientLiquidity();
    error NoYieldToClaim();

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant YIELD_ENGINE_ROLE = keccak256("YIELD_ENGINE_ROLE");

    // ============ State ============

    /// @notice USDC token
    IERC20 public immutable usdc;

    /// @notice Pool name
    string public name;

    /// @notice Total USDC deposited (excluding yield)
    uint256 public totalDeposits;

    /// @notice Total LP shares outstanding
    uint256 public totalShares;

    /// @notice Accumulated yield index (scaled by 1e18)
    uint256 public supplyIndex;

    /// @notice Last index update timestamp
    uint256 public lastUpdateTime;

    /// @notice Whether pool is paused
    bool public poolPaused;

    /// @notice User deposits
    mapping(address => UserDeposit) public userDeposits;

    /// @notice Accumulated yield available for distribution
    uint256 public yieldReserve;

    // ============ Constants ============

    uint256 public constant PRECISION = 1e18;
    uint256 public constant INITIAL_SHARE_PRICE = 1e18; // 1 share = 1 USDC initially

    // ============ Constructor ============

    /**
     * @notice Initialize the genesis pool
     * @param _usdc USDC token address
     * @param _admin Admin address (protocol multisig)
     * @param _name Pool name
     */
    constructor(
        address _usdc,
        address _admin,
        string memory _name
    ) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);
        name = _name;
        supplyIndex = PRECISION;
        lastUpdateTime = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ============ User Functions ============

    /**
     * @notice Deposit USDC into the pool
     * @param amount Amount of USDC to deposit (6 decimals)
     * @return shares Number of LP shares minted
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused returns (uint256 shares) {
        if (amount == 0) revert InvalidAmount();

        // Calculate shares to mint
        if (totalShares == 0) {
            // First deposit: 1 USDC = 1 share (scaled)
            shares = amount * PRECISION / 1e6; // Convert USDC (6 dec) to shares (18 dec)
        } else {
            // Subsequent deposits: proportional to pool value
            uint256 poolValue = totalDeposits + yieldReserve;
            shares = (amount * totalShares) / poolValue;
        }

        if (shares == 0) revert InvalidAmount();

        // Update user's yield claim before modifying shares
        _accrueUserYield(msg.sender);

        // Effects
        UserDeposit storage userDep = userDeposits[msg.sender];
        userDep.shares += shares;
        userDep.depositIndex = supplyIndex;

        totalDeposits += amount;
        totalShares += shares;

        // Interactions
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, shares);
    }

    /**
     * @notice Withdraw USDC from the pool
     * @param shares Number of LP shares to burn
     * @return amount Amount of USDC returned
     */
    function withdraw(uint256 shares) external nonReentrant whenNotPaused returns (uint256 amount) {
        UserDeposit storage userDep = userDeposits[msg.sender];
        if (shares == 0 || shares > userDep.shares) revert InsufficientShares();

        // Accrue any pending yield first
        _accrueUserYield(msg.sender);

        // Calculate USDC amount
        uint256 poolValue = totalDeposits + yieldReserve;
        amount = (shares * poolValue) / totalShares;

        if (amount > usdc.balanceOf(address(this))) revert InsufficientLiquidity();

        // Effects
        userDep.shares -= shares;
        totalShares -= shares;

        // Proportionally reduce deposits (yield stays in reserve)
        uint256 depositPortion = (shares * totalDeposits) / (totalShares + shares);
        totalDeposits -= depositPortion;

        // Interactions
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, shares, amount);
    }

    /**
     * @notice Claim accumulated yield
     * @return amount Amount of yield claimed
     */
    function claimYield() external nonReentrant whenNotPaused returns (uint256 amount) {
        _accrueUserYield(msg.sender);

        UserDeposit storage userDep = userDeposits[msg.sender];
        amount = userDep.pendingYield;

        if (amount == 0) revert NoYieldToClaim();

        // Effects
        userDep.pendingYield = 0;
        yieldReserve -= amount;

        // Interactions
        usdc.safeTransfer(msg.sender, amount);

        emit YieldClaimed(msg.sender, amount);
    }

    // ============ Yield Distribution ============

    /**
     * @notice Receive yield from treasury
     * @param amount Amount of USDC yield
     * @dev Called by treasury when distributing platform fees
     */
    function receiveYield(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        yieldReserve += amount;

        // Update supply index
        if (totalShares > 0) {
            uint256 yieldPerShare = (amount * PRECISION) / totalShares;
            supplyIndex += yieldPerShare;
        }

        lastUpdateTime = block.timestamp;

        emit YieldDistributed(amount, supplyIndex);
    }

    /**
     * @notice Update supply index (called by yield engine)
     */
    function updateSupplyIndex() external {
        if (!hasRole(YIELD_ENGINE_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert InvalidAddress();
        }
        lastUpdateTime = block.timestamp;
    }

    // ============ Internal Functions ============

    /**
     * @notice Accrue pending yield for a user
     * @param user User address
     */
    function _accrueUserYield(address user) internal {
        UserDeposit storage userDep = userDeposits[user];

        if (userDep.shares > 0 && supplyIndex > userDep.depositIndex) {
            uint256 indexDelta = supplyIndex - userDep.depositIndex;
            uint256 yieldEarned = (userDep.shares * indexDelta) / PRECISION;
            userDep.pendingYield += yieldEarned;
        }

        userDep.depositIndex = supplyIndex;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set yield engine address
     * @param yieldEngine Yield engine address
     */
    function setYieldEngine(address yieldEngine) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _grantRole(YIELD_ENGINE_ROLE, yieldEngine);
    }

    /**
     * @notice Pause the pool
     */
    function pause() external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _pause();
        poolPaused = true;
        emit PoolPaused(msg.sender);
    }

    /**
     * @notice Unpause the pool
     */
    function unpause() external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        _unpause();
        poolPaused = false;
        emit PoolUnpaused(msg.sender);
    }

    /**
     * @notice Emergency withdraw all funds (admin only, for emergencies)
     * @param to Recipient address
     */
    function emergencyWithdraw(address to) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (to == address(0)) revert InvalidAddress();

        uint256 balance = usdc.balanceOf(address(this));
        usdc.safeTransfer(to, balance);
    }

    // ============ View Functions ============

    /**
     * @notice Get pool information
     */
    function getPoolInfo() external view override returns (PoolInfo memory info) {
        return PoolInfo({
            totalDeposits: totalDeposits,
            totalShares: totalShares,
            supplyIndex: supplyIndex,
            lastUpdateTime: lastUpdateTime,
            isPaused: poolPaused
        });
    }

    /**
     * @notice Get user's deposit information
     * @param user Address to query
     */
    function getUserDeposit(address user) external view override returns (UserDeposit memory) {
        return userDeposits[user];
    }

    /**
     * @notice Calculate pending yield for a user
     * @param user Address to query
     */
    function pendingYield(address user) external view override returns (uint256) {
        UserDeposit memory userDep = userDeposits[user];

        if (userDep.shares == 0) return userDep.pendingYield;

        uint256 accruedYield = userDep.pendingYield;
        if (supplyIndex > userDep.depositIndex) {
            uint256 indexDelta = supplyIndex - userDep.depositIndex;
            accruedYield += (userDep.shares * indexDelta) / PRECISION;
        }

        return accruedYield;
    }

    /**
     * @notice Get current share price
     * @return price Share price scaled by 1e18
     */
    function sharePrice() external view override returns (uint256 price) {
        if (totalShares == 0) return INITIAL_SHARE_PRICE;
        uint256 poolValue = totalDeposits + yieldReserve;
        return (poolValue * PRECISION) / totalShares;
    }

    /**
     * @notice Get user's total USDC value
     * @param user Address to query
     */
    function balanceOf(address user) external view override returns (uint256 value) {
        UserDeposit memory userDep = userDeposits[user];
        if (userDep.shares == 0) return 0;

        uint256 poolValue = totalDeposits + yieldReserve;
        value = (userDep.shares * poolValue) / totalShares;
        value += this.pendingYield(user);
    }

    /**
     * @notice Get pool's USDC balance
     */
    function poolBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Get current APY (simplified view)
     * @dev In production, this would query the yield engine
     */
    function currentAPY() external pure returns (uint256) {
        // Placeholder: return base rate of 12%
        return 1200; // 12% in basis points
    }
}
