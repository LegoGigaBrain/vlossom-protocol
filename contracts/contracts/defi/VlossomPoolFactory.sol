// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {VlossomCommunityPool} from "./VlossomCommunityPool.sol";

/**
 * @title VlossomPoolFactory
 * @notice Factory for deploying community liquidity pools
 * @dev Uses minimal proxy (clone) pattern for gas-efficient deployments
 *
 * Tier System:
 * - Tier 1 (Top 5% referrers): No cap, $1,000 creation fee, 5% creator yield
 * - Tier 2 (Top 15% referrers): $100k cap, $2,500 creation fee, 3% creator yield
 * - Tier 3 (Top 30% referrers): $20k cap, $5,000 creation fee, 1% creator yield
 *
 * The factory validates creator eligibility via the ReferralEngine interface
 */
contract VlossomPoolFactory is AccessControl {
    using SafeERC20 for IERC20;
    using Clones for address;

    // ============ Errors ============

    error InvalidAddress();
    error InvalidTier();
    error InsufficientTier();
    error InsufficientCreationFee();
    error PoolNameTaken();
    error PoolNotFound();

    // ============ Roles ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TIER_VALIDATOR_ROLE = keccak256("TIER_VALIDATOR_ROLE");

    // ============ Structs ============

    struct TierConfig {
        uint256 cap;           // Pool deposit cap (6 decimals, 0 = no cap)
        uint256 creationFee;   // Fee to create pool (6 decimals)
        uint256 creatorFeeBps; // Creator's yield share (basis points)
    }

    struct PoolRecord {
        address poolAddress;
        address creator;
        string name;
        uint8 tier;
        uint256 createdAt;
        bool isActive;
    }

    // ============ State ============

    /// @notice USDC token
    IERC20 public immutable usdc;

    /// @notice Community pool implementation (for cloning)
    address public poolImplementation;

    /// @notice Treasury address (receives creation fees)
    address public treasury;

    /// @notice Tier configurations
    mapping(uint8 => TierConfig) public tierConfigs;

    /// @notice All deployed pools
    PoolRecord[] public pools;

    /// @notice Pool address => index in pools array
    mapping(address => uint256) public poolIndex;

    /// @notice Creator => their pools
    mapping(address => address[]) public creatorPools;

    /// @notice Pool name => exists
    mapping(string => bool) public poolNameExists;

    /// @notice User tier cache (set by tier validator)
    mapping(address => uint8) public userTiers;

    /// @notice Total pools created
    uint256 public totalPools;

    // ============ Events ============

    event PoolCreated(
        address indexed pool,
        address indexed creator,
        string name,
        uint8 tier,
        uint256 cap
    );
    event TierConfigUpdated(uint8 tier, uint256 cap, uint256 creationFee, uint256 creatorFeeBps);
    event UserTierUpdated(address indexed user, uint8 tier);
    event PoolPaused(address indexed pool);
    event PoolUnpaused(address indexed pool);

    // ============ Constructor ============

    /**
     * @notice Initialize the factory
     * @param _usdc USDC token address
     * @param _poolImplementation Community pool implementation address
     * @param _treasury Treasury address for fees
     * @param _admin Admin address
     */
    constructor(
        address _usdc,
        address _poolImplementation,
        address _treasury,
        address _admin
    ) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_poolImplementation == address(0)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();

        usdc = IERC20(_usdc);
        poolImplementation = _poolImplementation;
        treasury = _treasury;

        // Initialize tier configs
        // Tier 1: No cap, $1,000 fee, 5% creator yield
        tierConfigs[1] = TierConfig({
            cap: 0,
            creationFee: 1000 * 1e6,  // $1,000
            creatorFeeBps: 500        // 5%
        });

        // Tier 2: $100k cap, $2,500 fee, 3% creator yield
        tierConfigs[2] = TierConfig({
            cap: 100_000 * 1e6,       // $100,000
            creationFee: 2500 * 1e6,  // $2,500
            creatorFeeBps: 300        // 3%
        });

        // Tier 3: $20k cap, $5,000 fee, 1% creator yield
        tierConfigs[3] = TierConfig({
            cap: 20_000 * 1e6,        // $20,000
            creationFee: 5000 * 1e6,  // $5,000
            creatorFeeBps: 100        // 1%
        });

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(TIER_VALIDATOR_ROLE, _admin);
    }

    // ============ Pool Creation ============

    /**
     * @notice Create a new community pool
     * @param name Pool name (must be unique)
     * @param tier Creator's tier (1, 2, or 3)
     * @return pool Address of the new pool
     *
     * @dev Caller must:
     * - Have their tier registered (via setUserTier)
     * - Have approved creation fee
     * - Choose a unique pool name
     */
    function createPool(
        string memory name,
        uint8 tier
    ) external returns (address pool) {
        // Validate tier
        if (tier < 1 || tier > 3) revert InvalidTier();

        // Check user's tier eligibility
        uint8 userTier = userTiers[msg.sender];
        if (userTier == 0 || userTier > tier) revert InsufficientTier();

        // Check name uniqueness
        if (poolNameExists[name]) revert PoolNameTaken();

        TierConfig memory config = tierConfigs[tier];

        // Collect creation fee
        if (config.creationFee > 0) {
            usdc.safeTransferFrom(msg.sender, treasury, config.creationFee);
        }

        // Deploy pool clone
        pool = poolImplementation.clone();

        // Initialize pool
        VlossomCommunityPool(pool).initialize(
            address(usdc),
            address(this),
            msg.sender,
            name,
            tier,
            config.cap,
            config.creatorFeeBps
        );

        // Record pool
        uint256 index = pools.length;
        pools.push(PoolRecord({
            poolAddress: pool,
            creator: msg.sender,
            name: name,
            tier: tier,
            createdAt: block.timestamp,
            isActive: true
        }));

        poolIndex[pool] = index;
        creatorPools[msg.sender].push(pool);
        poolNameExists[name] = true;
        totalPools++;

        emit PoolCreated(pool, msg.sender, name, tier, config.cap);
    }

    // ============ Pool Management ============

    /**
     * @notice Pause a pool (admin only)
     * @param pool Pool address
     */
    function pausePool(address pool) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();

        VlossomCommunityPool(pool).pause();

        uint256 idx = poolIndex[pool];
        pools[idx].isActive = false;

        emit PoolPaused(pool);
    }

    /**
     * @notice Unpause a pool (admin only)
     * @param pool Pool address
     */
    function unpausePool(address pool) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();

        VlossomCommunityPool(pool).unpause();

        uint256 idx = poolIndex[pool];
        pools[idx].isActive = true;

        emit PoolUnpaused(pool);
    }

    /**
     * @notice Update pool cap (admin only)
     * @param pool Pool address
     * @param newCap New cap
     */
    function updatePoolCap(address pool, uint256 newCap) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();

        VlossomCommunityPool(pool).setCap(newCap);
    }

    // ============ Tier Management ============

    /**
     * @notice Set a user's tier (called by backend/validator)
     * @param user User address
     * @param tier User's tier (1, 2, 3, or 0 for no tier)
     *
     * @dev H-4 Security Note: After calling this, call syncPoolsToTier()
     *      to update any pools created by this user
     */
    function setUserTier(address user, uint8 tier) external {
        if (!hasRole(TIER_VALIDATOR_ROLE, msg.sender)) revert InvalidAddress();
        if (tier > 3) revert InvalidTier();

        userTiers[user] = tier;

        emit UserTierUpdated(user, tier);
    }

    /**
     * @notice H-4 fix: Sync pool parameters when creator's tier changes
     * @param creator Creator address whose pools should be synced
     * @dev Called by admin after tier downgrade to enforce new limits
     */
    function syncPoolsToTier(address creator) external {
        if (!hasRole(TIER_VALIDATOR_ROLE, msg.sender)) revert InvalidAddress();

        uint8 newTier = userTiers[creator];
        if (newTier == 0) return; // No tier, nothing to sync

        TierConfig memory newConfig = tierConfigs[newTier];
        address[] memory userPools = creatorPools[creator];

        for (uint256 i = 0; i < userPools.length; i++) {
            address poolAddr = userPools[i];
            VlossomCommunityPool pool = VlossomCommunityPool(poolAddr);

            // Only downgrade if current tier is better than new tier
            if (pool.tier() < newTier) {
                pool.updateTierParams(newTier, newConfig.cap, newConfig.creatorFeeBps);
            }
        }
    }

    /**
     * @notice H-4 fix: Sync a single pool to creator's current tier
     * @param poolAddr Pool address to sync
     */
    function syncPoolToTier(address poolAddr) external {
        if (!hasRole(TIER_VALIDATOR_ROLE, msg.sender)) revert InvalidAddress();

        uint256 idx = poolIndex[poolAddr];
        if (pools.length == 0 || pools[idx].poolAddress != poolAddr) revert PoolNotFound();

        PoolRecord memory record = pools[idx];
        uint8 newTier = userTiers[record.creator];

        if (newTier == 0 || newTier >= record.tier) return; // No downgrade needed

        TierConfig memory newConfig = tierConfigs[newTier];
        VlossomCommunityPool(poolAddr).updateTierParams(newTier, newConfig.cap, newConfig.creatorFeeBps);
    }

    /**
     * @notice Batch set user tiers
     * @param users Array of user addresses
     * @param tiers Array of tiers
     */
    function batchSetUserTiers(address[] calldata users, uint8[] calldata tiers) external {
        if (!hasRole(TIER_VALIDATOR_ROLE, msg.sender)) revert InvalidAddress();
        require(users.length == tiers.length, "Array length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            if (tiers[i] > 3) revert InvalidTier();
            userTiers[users[i]] = tiers[i];
            emit UserTierUpdated(users[i], tiers[i]);
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Update tier configuration
     * @param tier Tier number (1, 2, 3)
     * @param cap Pool cap (6 decimals)
     * @param creationFee Creation fee (6 decimals)
     * @param creatorFeeBps Creator yield share (basis points)
     */
    function setTierConfig(
        uint8 tier,
        uint256 cap,
        uint256 creationFee,
        uint256 creatorFeeBps
    ) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (tier < 1 || tier > 3) revert InvalidTier();

        tierConfigs[tier] = TierConfig({
            cap: cap,
            creationFee: creationFee,
            creatorFeeBps: creatorFeeBps
        });

        emit TierConfigUpdated(tier, cap, creationFee, creatorFeeBps);
    }

    /**
     * @notice Update pool implementation (for future upgrades)
     * @param _implementation New implementation address
     */
    function setPoolImplementation(address _implementation) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (_implementation == address(0)) revert InvalidAddress();

        poolImplementation = _implementation;
    }

    /**
     * @notice Update treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
        if (_treasury == address(0)) revert InvalidAddress();

        treasury = _treasury;
    }

    // ============ View Functions ============

    /**
     * @notice Get tier configuration
     * @param tier Tier number
     */
    function getTierConfig(uint8 tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }

    /**
     * @notice Get user's tier
     * @param user User address
     */
    function getUserTier(address user) external view returns (uint8) {
        return userTiers[user];
    }

    /**
     * @notice Check if user can create a pool of given tier
     * @param user User address
     * @param tier Desired tier
     */
    function canCreatePool(address user, uint8 tier) external view returns (bool) {
        uint8 userTier = userTiers[user];
        return userTier > 0 && userTier <= tier;
    }

    /**
     * @notice Get creation fee for tier
     * @param tier Tier number
     */
    function getCreationFee(uint8 tier) external view returns (uint256) {
        return tierConfigs[tier].creationFee;
    }

    /**
     * @notice Get all pools
     */
    function getAllPools() external view returns (PoolRecord[] memory) {
        return pools;
    }

    /**
     * @notice Get pools by creator
     * @param creator Creator address
     */
    function getPoolsByCreator(address creator) external view returns (address[] memory) {
        return creatorPools[creator];
    }

    /**
     * @notice Get pool count
     */
    function getPoolCount() external view returns (uint256) {
        return pools.length;
    }

    /**
     * @notice Get pool record
     * @param pool Pool address
     */
    function getPoolRecord(address pool) external view returns (PoolRecord memory) {
        return pools[poolIndex[pool]];
    }

    /**
     * @notice Get active pools
     */
    function getActivePools() external view returns (PoolRecord[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (pools[i].isActive) activeCount++;
        }

        PoolRecord[] memory activePools = new PoolRecord[](activeCount);
        uint256 j = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (pools[i].isActive) {
                activePools[j] = pools[i];
                j++;
            }
        }

        return activePools;
    }
}
