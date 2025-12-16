// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IYieldEngine
 * @notice Interface for Vlossom yield calculation engine
 */
interface IYieldEngine {
    // ============ Structs ============

    struct APYParams {
        uint256 baseRate;           // Base APY in basis points (e.g., 400 = 4%)
        uint256 slope1;             // Slope for 0-optimal utilization
        uint256 slope2;             // Slope for optimal-100% utilization
        uint256 optimalUtilization; // Optimal utilization in basis points (e.g., 8000 = 80%)
    }

    // ============ Events ============

    event APYParamsUpdated(
        uint256 baseRate,
        uint256 slope1,
        uint256 slope2,
        uint256 optimalUtilization
    );
    event PoolIndexUpdated(address indexed pool, uint256 newIndex);
    event YieldDistributedToPool(address indexed pool, uint256 amount);

    // ============ Functions ============

    /**
     * @notice Calculate current APY for a pool based on utilization
     * @param utilization Pool utilization in basis points (0-10000)
     * @return apy Current APY in basis points
     */
    function calculateAPY(uint256 utilization) external view returns (uint256 apy);

    /**
     * @notice Update a pool's supply index based on time elapsed
     * @param pool Address of the pool to update
     */
    function updatePoolIndex(address pool) external;

    /**
     * @notice Distribute yield to a pool from treasury
     * @param pool Address of the pool
     * @param amount Amount of USDC to distribute
     */
    function distributeYield(address pool, uint256 amount) external;

    /**
     * @notice Get current APY parameters
     * @return params Current APY configuration
     */
    function getAPYParams() external view returns (APYParams memory params);

    /**
     * @notice Update APY parameters (admin only)
     * @param baseRate New base rate in basis points
     * @param slope1 New slope1
     * @param slope2 New slope2
     * @param optimalUtilization New optimal utilization
     */
    function setAPYParams(
        uint256 baseRate,
        uint256 slope1,
        uint256 slope2,
        uint256 optimalUtilization
    ) external;
}
