// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVlossomPool} from "./interfaces/IVlossomPool.sol";

/**
 * @title VlossomCommunityPool
 * @notice Community-created liquidity pool (Stokvel-inspired)
 * @dev Deployed via minimal proxy pattern by VlossomPoolFactory
 *
 * Features:
 * - Tiered caps based on creator's referral tier
 * - Creator receives percentage of pool yield
 * - Protocol can pause individual pools
 *
 * Tier System:
 * - Tier 1 (Top 5%): No hard cap, 5% creator fee
 * - Tier 2 (Top 15%): $100k cap, 3% creator fee
 * - Tier 3 (Top 30%): $20k cap, 1% creator fee
 */
contract VlossomCommunityPool is IVlossomPool, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Errors ============

    error InvalidAmount();
    error InvalidAddress();
    error InsufficientShares();
    error InsufficientLiquidity();
    error NoYieldToClaim();
    error PoolAtCapacity();
    error PoolIsPaused();
    error NotCreator();
    error NotProtocol();
    error AlreadyInitialized();

    // ============ State ============

    /// @notice Whether pool is initialized (for proxy pattern)
    bool public initialized;

    /// @notice USDC token
    IERC20 public usdc;

    /// @notice Pool factory address (protocol)
    address public factory;

    /// @notice Pool creator address
    address public creator;

    /// @notice Pool name
    string public name;

    /// @notice Pool tier (1, 2, or 3)
    uint8 public tier;

    /// @notice Pool deposit cap (0 = no cap)
    uint256 public cap;

    /// @notice Creator fee percentage (basis points)
    uint256 public creatorFeeBps;

    /// @notice Total USDC deposited
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

    /// @notice Accumulated yield reserve
    uint256 public yieldReserve;

    /// @notice Creator's accumulated fees
    uint256 public creatorFees;

    // ============ Constants ============

    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;

    // ============ Modifiers ============

    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    modifier onlyProtocol() {
        if (msg.sender != factory) revert NotProtocol();
        _;
    }

    modifier whenNotPoolPaused() {
        if (poolPaused) revert PoolIsPaused();
        _;
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the pool (called by factory)
     * @param _usdc USDC token address
     * @param _factory Factory address
     * @param _creator Pool creator address
     * @param _name Pool name
     * @param _tier Pool tier (1, 2, 3)
     * @param _cap Deposit cap (6 decimals)
     * @param _creatorFeeBps Creator fee in basis points
     */
    function initialize(
        address _usdc,
        address _factory,
        address _creator,
        string memory _name,
        uint8 _tier,
        uint256 _cap,
        uint256 _creatorFeeBps
    ) external {
        if (initialized) revert AlreadyInitialized();

        usdc = IERC20(_usdc);
        factory = _factory;
        creator = _creator;
        name = _name;
        tier = _tier;
        cap = _cap;
        creatorFeeBps = _creatorFeeBps;

        supplyIndex = PRECISION;
        lastUpdateTime = block.timestamp;
        initialized = true;
    }

    // ============ User Functions ============

    /**
     * @notice Deposit USDC into the pool
     * @param amount Amount of USDC to deposit (6 decimals)
     * @return shares Number of LP shares minted
     */
    function deposit(uint256 amount) external nonReentrant whenNotPoolPaused returns (uint256 shares) {
        if (amount == 0) revert InvalidAmount();

        // Check cap
        if (cap > 0 && totalDeposits + amount > cap) revert PoolAtCapacity();

        // Calculate shares
        if (totalShares == 0) {
            shares = amount * PRECISION / 1e6;
        } else {
            uint256 poolValue = totalDeposits + yieldReserve;
            shares = (amount * totalShares) / poolValue;
        }

        if (shares == 0) revert InvalidAmount();

        // Accrue user yield
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
    function withdraw(uint256 shares) external nonReentrant whenNotPoolPaused returns (uint256 amount) {
        UserDeposit storage userDep = userDeposits[msg.sender];
        if (shares == 0 || shares > userDep.shares) revert InsufficientShares();

        _accrueUserYield(msg.sender);

        uint256 poolValue = totalDeposits + yieldReserve;
        amount = (shares * poolValue) / totalShares;

        if (amount > usdc.balanceOf(address(this))) revert InsufficientLiquidity();

        // Effects
        userDep.shares -= shares;
        totalShares -= shares;

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
    function claimYield() external nonReentrant whenNotPoolPaused returns (uint256 amount) {
        _accrueUserYield(msg.sender);

        UserDeposit storage userDep = userDeposits[msg.sender];
        amount = userDep.pendingYield;

        if (amount == 0) revert NoYieldToClaim();

        userDep.pendingYield = 0;
        yieldReserve -= amount;

        usdc.safeTransfer(msg.sender, amount);

        emit YieldClaimed(msg.sender, amount);
    }

    // ============ Yield Distribution ============

    /**
     * @notice Receive yield distribution
     * @param amount Amount of USDC yield
     */
    function receiveYield(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate creator fee
        uint256 creatorCut = (amount * creatorFeeBps) / BASIS_POINTS;
        uint256 lpYield = amount - creatorCut;

        creatorFees += creatorCut;
        yieldReserve += lpYield;

        // Update supply index
        if (totalShares > 0) {
            uint256 yieldPerShare = (lpYield * PRECISION) / totalShares;
            supplyIndex += yieldPerShare;
        }

        lastUpdateTime = block.timestamp;

        emit YieldDistributed(lpYield, supplyIndex);
    }

    // ============ Creator Functions ============

    /**
     * @notice Creator claims accumulated fees
     */
    function claimCreatorFees() external nonReentrant onlyCreator {
        uint256 fees = creatorFees;
        if (fees == 0) revert NoYieldToClaim();

        creatorFees = 0;
        usdc.safeTransfer(creator, fees);
    }

    /**
     * @notice Update pool name (creator only)
     * @param _name New name
     */
    function setName(string memory _name) external onlyCreator {
        name = _name;
    }

    // ============ Protocol Functions ============

    /**
     * @notice Pause the pool (protocol only)
     */
    function pause() external onlyProtocol {
        poolPaused = true;
        emit PoolPaused(msg.sender);
    }

    /**
     * @notice Unpause the pool (protocol only)
     */
    function unpause() external onlyProtocol {
        poolPaused = false;
        emit PoolUnpaused(msg.sender);
    }

    /**
     * @notice Update pool cap (protocol only)
     * @param _cap New cap
     */
    function setCap(uint256 _cap) external onlyProtocol {
        cap = _cap;
    }

    // ============ Internal Functions ============

    function _accrueUserYield(address user) internal {
        UserDeposit storage userDep = userDeposits[user];

        if (userDep.shares > 0 && supplyIndex > userDep.depositIndex) {
            uint256 indexDelta = supplyIndex - userDep.depositIndex;
            uint256 yieldEarned = (userDep.shares * indexDelta) / PRECISION;
            userDep.pendingYield += yieldEarned;
        }

        userDep.depositIndex = supplyIndex;
    }

    // ============ View Functions ============

    function getPoolInfo() external view override returns (PoolInfo memory info) {
        return PoolInfo({
            totalDeposits: totalDeposits,
            totalShares: totalShares,
            supplyIndex: supplyIndex,
            lastUpdateTime: lastUpdateTime,
            isPaused: poolPaused
        });
    }

    function getUserDeposit(address user) external view override returns (UserDeposit memory) {
        return userDeposits[user];
    }

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

    function sharePrice() external view override returns (uint256 price) {
        if (totalShares == 0) return PRECISION;
        uint256 poolValue = totalDeposits + yieldReserve;
        return (poolValue * PRECISION) / totalShares;
    }

    function balanceOf(address user) external view override returns (uint256 value) {
        UserDeposit memory userDep = userDeposits[user];
        if (userDep.shares == 0) return 0;

        uint256 poolValue = totalDeposits + yieldReserve;
        value = (userDep.shares * poolValue) / totalShares;
        value += this.pendingYield(user);
    }

    /**
     * @notice Get remaining capacity
     */
    function remainingCapacity() external view returns (uint256) {
        if (cap == 0) return type(uint256).max;
        if (totalDeposits >= cap) return 0;
        return cap - totalDeposits;
    }

    /**
     * @notice Get pool details
     */
    function getPoolDetails() external view returns (
        string memory _name,
        address _creator,
        uint8 _tier,
        uint256 _cap,
        uint256 _totalDeposits,
        uint256 _creatorFeeBps,
        bool _isPaused
    ) {
        return (name, creator, tier, cap, totalDeposits, creatorFeeBps, poolPaused);
    }
}
