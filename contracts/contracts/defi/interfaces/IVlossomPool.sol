// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IVlossomPool
 * @notice Interface for Vlossom liquidity pools (Genesis and Community)
 */
interface IVlossomPool {
    // ============ Structs ============

    struct PoolInfo {
        uint256 totalDeposits;
        uint256 totalShares;
        uint256 supplyIndex;       // Accumulated yield index (scaled by 1e18)
        uint256 lastUpdateTime;
        bool isPaused;
    }

    struct UserDeposit {
        uint256 shares;
        uint256 depositIndex;      // User's index at deposit time
        uint256 pendingYield;
    }

    // ============ Events ============

    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);
    event YieldDistributed(uint256 amount, uint256 newSupplyIndex);
    event PoolPaused(address indexed by);
    event PoolUnpaused(address indexed by);

    // H-2 fix: Emergency withdrawal events with timelock
    event EmergencyProposed(bytes32 indexed proposalId, address indexed recipient, uint256 executeAfter);
    event EmergencyExecuted(bytes32 indexed proposalId, address indexed recipient, uint256 amount);
    event EmergencyCancelled(bytes32 indexed proposalId);

    // ============ User Functions ============

    /**
     * @notice Deposit USDC into the pool
     * @param amount Amount of USDC to deposit (6 decimals)
     * @return shares Number of LP shares minted
     */
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Withdraw USDC from the pool
     * @param shares Number of LP shares to burn
     * @param minAmountOut Minimum USDC to receive (slippage protection, C-2 fix)
     * @return amount Amount of USDC returned
     */
    function withdraw(uint256 shares, uint256 minAmountOut) external returns (uint256 amount);

    /**
     * @notice Claim accumulated yield
     * @return amount Amount of yield claimed
     */
    function claimYield() external returns (uint256 amount);

    // ============ View Functions ============

    /**
     * @notice Get pool information
     * @return info Pool state
     */
    function getPoolInfo() external view returns (PoolInfo memory info);

    /**
     * @notice Get user's deposit information
     * @param user Address to query
     * @return deposit User's deposit state
     */
    function getUserDeposit(address user) external view returns (UserDeposit memory deposit);

    /**
     * @notice Calculate pending yield for a user
     * @param user Address to query
     * @return yield Pending yield amount
     */
    function pendingYield(address user) external view returns (uint256 yield);

    /**
     * @notice Get current share price (USDC per share)
     * @return price Share price scaled by 1e18
     */
    function sharePrice() external view returns (uint256 price);

    /**
     * @notice Get user's USDC value (principal + yield)
     * @param user Address to query
     * @return value Total USDC value
     */
    function balanceOf(address user) external view returns (uint256 value);
}
