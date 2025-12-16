// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IYieldEngine} from "./interfaces/IYieldEngine.sol";

/**
 * @title VlossomYieldEngine
 * @notice Calculates APY based on utilization curve (Aave-style)
 * @dev All rates in basis points (1 bp = 0.01%)
 *
 * APY Curve:
 * - Below optimal utilization: linear increase with slope1
 * - Above optimal utilization: steep increase with slope2 (discourages full utilization)
 *
 * Formula:
 * if U < Uoptimal: APY = baseRate + (U * slope1 / 10000)
 * if U >= Uoptimal: APY = baseRate + (Uoptimal * slope1 / 10000) + ((U - Uoptimal) * slope2 / 10000)
 */
contract VlossomYieldEngine is IYieldEngine, AccessControl {
    // ============ Errors ============

    error InvalidParams();
    error Unauthorized();

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant POOL_ROLE = keccak256("POOL_ROLE");

    // ============ State ============

    /// @notice Base APY rate (basis points)
    uint256 public baseRate;

    /// @notice Slope for utilization 0 to optimal (basis points)
    uint256 public slope1;

    /// @notice Slope for utilization optimal to 100% (basis points)
    uint256 public slope2;

    /// @notice Optimal utilization point (basis points, e.g., 8000 = 80%)
    uint256 public optimalUtilization;

    /// @notice Pool supply indices (scaled by 1e18)
    mapping(address => uint256) public poolIndices;

    /// @notice Last update timestamp per pool
    mapping(address => uint256) public lastUpdateTime;

    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ============ Constructor ============

    /**
     * @notice Initialize yield engine with default parameters
     * @param _admin Admin address
     *
     * Default parameters (Year 1 launch phase):
     * - baseRate: 400 (4%)
     * - slope1: 1000 (10% additional at 80% utilization)
     * - slope2: 10000 (100% additional slope above optimal)
     * - optimalUtilization: 8000 (80%)
     */
    constructor(address _admin) {
        if (_admin == address(0)) revert InvalidParams();

        // Year 1 launch parameters (attractive yields)
        baseRate = 400;           // 4% base
        slope1 = 1000;            // +10% at optimal
        slope2 = 10000;           // +100% slope above optimal
        optimalUtilization = 8000; // 80%

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ============ APY Calculation ============

    /**
     * @notice Calculate APY based on utilization
     * @param utilization Pool utilization in basis points (0-10000)
     * @return apy Current APY in basis points
     */
    function calculateAPY(uint256 utilization) external view override returns (uint256 apy) {
        if (utilization > BASIS_POINTS) {
            utilization = BASIS_POINTS; // Cap at 100%
        }

        if (utilization <= optimalUtilization) {
            // Linear increase up to optimal
            apy = baseRate + (utilization * slope1) / BASIS_POINTS;
        } else {
            // Base + optimal portion + excess portion with steep slope
            uint256 optimalPortion = (optimalUtilization * slope1) / BASIS_POINTS;
            uint256 excessUtilization = utilization - optimalUtilization;
            uint256 excessPortion = (excessUtilization * slope2) / BASIS_POINTS;
            apy = baseRate + optimalPortion + excessPortion;
        }

        return apy;
    }

    /**
     * @notice Get APY as percentage (for display)
     * @param utilization Pool utilization in basis points
     * @return apyPercent APY as percentage with 2 decimals (e.g., 1200 = 12.00%)
     */
    function getAPYPercent(uint256 utilization) external view returns (uint256 apyPercent) {
        return this.calculateAPY(utilization);
    }

    // ============ Pool Index Management ============

    /**
     * @notice Update pool's supply index based on time elapsed and APY
     * @param pool Pool address
     * @dev Called on deposits/withdrawals to accrue yield
     */
    function updatePoolIndex(address pool) external override {
        if (!hasRole(POOL_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert Unauthorized();
        }

        uint256 lastUpdate = lastUpdateTime[pool];
        if (lastUpdate == 0) {
            // First update, initialize
            poolIndices[pool] = PRECISION;
            lastUpdateTime[pool] = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - lastUpdate;
        if (timeElapsed == 0) return;

        // Get current utilization (simplified: assume 50% average utilization)
        // In production, this would query actual pool utilization
        uint256 utilization = 5000; // 50% placeholder

        uint256 apy = this.calculateAPY(utilization);

        // Calculate yield for elapsed time
        // yield = principal * apy * timeElapsed / (SECONDS_PER_YEAR * BASIS_POINTS)
        uint256 yieldMultiplier = (PRECISION * apy * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS);
        uint256 newIndex = poolIndices[pool] + (poolIndices[pool] * yieldMultiplier) / PRECISION;

        poolIndices[pool] = newIndex;
        lastUpdateTime[pool] = block.timestamp;

        emit PoolIndexUpdated(pool, newIndex);
    }

    /**
     * @notice Distribute yield to a pool (called by treasury)
     * @param pool Pool address
     * @param amount USDC amount distributed
     */
    function distributeYield(address pool, uint256 amount) external override {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();

        emit YieldDistributedToPool(pool, amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update APY parameters
     * @param _baseRate New base rate (basis points)
     * @param _slope1 New slope1
     * @param _slope2 New slope2
     * @param _optimalUtilization New optimal utilization (basis points)
     */
    function setAPYParams(
        uint256 _baseRate,
        uint256 _slope1,
        uint256 _slope2,
        uint256 _optimalUtilization
    ) external override {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        if (_optimalUtilization > BASIS_POINTS) revert InvalidParams();

        baseRate = _baseRate;
        slope1 = _slope1;
        slope2 = _slope2;
        optimalUtilization = _optimalUtilization;

        emit APYParamsUpdated(_baseRate, _slope1, _slope2, _optimalUtilization);
    }

    /**
     * @notice Register a pool for index tracking
     * @param pool Pool address
     */
    function registerPool(address pool) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
        _grantRole(POOL_ROLE, pool);

        poolIndices[pool] = PRECISION;
        lastUpdateTime[pool] = block.timestamp;
    }

    // ============ View Functions ============

    /**
     * @notice Get current APY parameters
     */
    function getAPYParams() external view override returns (APYParams memory params) {
        return APYParams({
            baseRate: baseRate,
            slope1: slope1,
            slope2: slope2,
            optimalUtilization: optimalUtilization
        });
    }

    /**
     * @notice Get pool's current index
     * @param pool Pool address
     */
    function getPoolIndex(address pool) external view returns (uint256) {
        return poolIndices[pool];
    }

    /**
     * @notice Calculate projected yield for an amount over time
     * @param amount Principal amount
     * @param utilization Current utilization
     * @param duration Time in seconds
     * @return yield Projected yield amount
     */
    function projectYield(
        uint256 amount,
        uint256 utilization,
        uint256 duration
    ) external view returns (uint256 yield) {
        uint256 apy = this.calculateAPY(utilization);
        yield = (amount * apy * duration) / (SECONDS_PER_YEAR * BASIS_POINTS);
    }
}
