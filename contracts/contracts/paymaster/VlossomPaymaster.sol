// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IVlossomPaymaster} from "../interfaces/IVlossomPaymaster.sol";

/**
 * @title VlossomPaymaster
 * @notice Gas sponsorship contract for Vlossom Protocol
 * @dev Sponsors gas for whitelisted operations with per-wallet rate limiting
 *
 * Security features:
 * - Whitelisting: Only sponsors calls to approved Vlossom contracts
 * - H-1 fix: Function selector whitelist for fine-grained control
 * - Rate limiting: Prevents abuse via per-wallet operation caps per time window
 * - M-4 fix: Lifetime caps and cooldown periods for additional protection
 * - Pausable: Emergency stop mechanism
 * - Owner-controlled configuration
 *
 * Invariants:
 * - Users never pay gas directly (gasless guarantee)
 * - Paymaster cannot be drained by arbitrary calls (whitelist + rate limit)
 * - Rate limits are enforced per wallet per time window
 * - Only EntryPoint can call validation and postOp functions
 */
contract VlossomPaymaster is BasePaymaster, Pausable, IVlossomPaymaster {
    /// @dev Custom errors for gas optimization
    error TargetNotWhitelisted();
    error FunctionNotWhitelisted();
    error RateLimitExceeded();
    error InvalidRateLimit();
    error LifetimeLimitExceeded();
    error InCooldownPeriod();

    /// @notice Whitelisted target contracts that can be sponsored
    mapping(address => bool) private _whitelist;

    /// @notice H-1 fix: Whitelisted function selectors per target
    mapping(address => mapping(bytes4 => bool)) private _allowedFunctions;

    /// @notice H-1 fix: Whether to enforce function selector whitelist
    bool public enforceFunctionWhitelist;

    /// @notice Rate limiting: operations per wallet per window
    mapping(address => uint256) private _operationCounts;

    /// @notice Rate limiting: window start timestamps per wallet
    mapping(address => uint256) private _windowStarts;

    /// @notice Maximum operations per wallet per window
    uint256 public maxOpsPerWindow;

    /// @notice Rate limit window duration in seconds
    uint256 public windowSeconds;

    /// @notice M-4 fix: Lifetime operation counts per wallet
    mapping(address => uint256) private _lifetimeOperations;

    /// @notice M-4 fix: Maximum lifetime operations (0 = unlimited)
    uint256 public maxLifetimeOps;

    /// @notice M-4 fix: Cooldown period after hitting rate limit
    uint256 public cooldownPeriod;

    /// @notice M-4 fix: Cooldown end timestamps per wallet
    mapping(address => uint256) private _cooldownEnds;

    /// @notice Default rate limit: 50 operations per day
    uint256 private constant DEFAULT_MAX_OPS = 50;
    uint256 private constant DEFAULT_WINDOW = 1 days;
    uint256 private constant DEFAULT_COOLDOWN = 1 hours;

    /**
     * @notice Initialize the paymaster
     * @param anEntryPoint The ERC-4337 EntryPoint address
     * @param initialOwner The paymaster owner
     */
    constructor(
        IEntryPoint anEntryPoint,
        address initialOwner
    ) BasePaymaster(anEntryPoint) {
        _transferOwnership(initialOwner);
        maxOpsPerWindow = DEFAULT_MAX_OPS;
        windowSeconds = DEFAULT_WINDOW;
        cooldownPeriod = DEFAULT_COOLDOWN;
    }

    /// @inheritdoc IVlossomPaymaster
    function setWhitelistedTarget(address target, bool allowed) external override onlyOwner {
        _whitelist[target] = allowed;
        emit WhitelistUpdated(target, allowed);
    }

    /// @inheritdoc IVlossomPaymaster
    function isWhitelisted(address target) external view override returns (bool) {
        return _whitelist[target];
    }

    /// @inheritdoc IVlossomPaymaster
    function setRateLimit(uint256 _maxOpsPerWindow, uint256 _windowSeconds) external override onlyOwner {
        if (_maxOpsPerWindow == 0 || _windowSeconds == 0) revert InvalidRateLimit();
        maxOpsPerWindow = _maxOpsPerWindow;
        windowSeconds = _windowSeconds;
        emit RateLimitUpdated(_maxOpsPerWindow, _windowSeconds);
    }

    /// @inheritdoc IVlossomPaymaster
    function getOperationCount(address wallet) external view override returns (uint256 count) {
        if (block.timestamp >= _windowStarts[wallet] + windowSeconds) {
            return 0; // Window expired, count resets
        }
        return _operationCounts[wallet];
    }

    /// @inheritdoc IVlossomPaymaster
    function getRateLimitSettings() external view override returns (uint256, uint256) {
        return (maxOpsPerWindow, windowSeconds);
    }

    // ============================================================================
    // H-1 Fix: Function Selector Whitelist
    // ============================================================================

    /**
     * @notice Set allowed function selector for a target (H-1 fix)
     * @param target Target contract address
     * @param selector 4-byte function selector
     * @param allowed Whether to allow this function
     */
    function setAllowedFunction(
        address target,
        bytes4 selector,
        bool allowed
    ) external onlyOwner {
        _allowedFunctions[target][selector] = allowed;
        emit FunctionWhitelistUpdated(target, selector, allowed);
    }

    /**
     * @notice Batch set allowed functions for a target (H-1 fix)
     * @param target Target contract address
     * @param selectors Array of function selectors
     * @param allowed Whether to allow these functions
     */
    function setAllowedFunctionsBatch(
        address target,
        bytes4[] calldata selectors,
        bool allowed
    ) external onlyOwner {
        for (uint256 i = 0; i < selectors.length; i++) {
            _allowedFunctions[target][selectors[i]] = allowed;
            emit FunctionWhitelistUpdated(target, selectors[i], allowed);
        }
    }

    /**
     * @notice Check if a function is allowed for a target (H-1 fix)
     * @param target Target contract address
     * @param selector Function selector
     * @return True if function is allowed
     */
    function isFunctionAllowed(address target, bytes4 selector) external view returns (bool) {
        return _allowedFunctions[target][selector];
    }

    /**
     * @notice Enable or disable function whitelist enforcement (H-1 fix)
     * @param enforce Whether to enforce function whitelist
     */
    function setFunctionWhitelistEnforced(bool enforce) external onlyOwner {
        enforceFunctionWhitelist = enforce;
        emit FunctionWhitelistEnforcementChanged(enforce);
    }

    // ============================================================================
    // M-4 Fix: Lifetime Limits and Cooldown
    // ============================================================================

    /**
     * @notice Set lifetime operation limit (M-4 fix)
     * @param newLimit New limit (0 = unlimited)
     */
    function setLifetimeLimit(uint256 newLimit) external onlyOwner {
        maxLifetimeOps = newLimit;
        emit LifetimeLimitUpdated(newLimit);
    }

    /**
     * @notice Set cooldown period after rate limit (M-4 fix)
     * @param newPeriod New period in seconds
     */
    function setCooldownPeriod(uint256 newPeriod) external onlyOwner {
        cooldownPeriod = newPeriod;
        emit CooldownPeriodUpdated(newPeriod);
    }

    /**
     * @notice Get lifetime operation count for a wallet (M-4 fix)
     * @param wallet Wallet address
     */
    function getLifetimeOperationCount(address wallet) external view returns (uint256) {
        return _lifetimeOperations[wallet];
    }

    /**
     * @notice Check if wallet is in cooldown (M-4 fix)
     * @param wallet Wallet address
     */
    function isInCooldown(address wallet) external view returns (bool) {
        return block.timestamp < _cooldownEnds[wallet];
    }

    /**
     * @notice Get cooldown end time for a wallet (M-4 fix)
     * @param wallet Wallet address
     * @return Cooldown end timestamp (0 if not in cooldown)
     */
    function getCooldownEndTime(address wallet) external view returns (uint256) {
        return _cooldownEnds[wallet];
    }

    // ============================================================================
    // Validation
    // ============================================================================

    /**
     * @notice Validate a UserOperation for gas sponsorship
     * @dev Called by EntryPoint during validation phase
     * @param userOp The user operation to validate
     * @param userOpHash Hash of the user operation (unused)
     * @param maxCost Maximum cost of the operation (unused)
     * @return context Empty context (no post-op accounting needed)
     * @return validationData 0 for valid, 1 for invalid
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Suppress unused variable warnings
        (userOpHash, maxCost);

        // Check paused state
        if (paused()) {
            return ("", 1); // Return invalid if paused
        }

        address sender = userOp.sender;

        // Extract target address from callData
        // For execute(address dest, uint256 value, bytes calldata func)
        // Selector is 4 bytes, then address is next 32 bytes (padded)
        address target;
        bytes4 outerSelector;
        if (userOp.callData.length >= 36) {
            // Extract the outer function selector (first 4 bytes)
            outerSelector = bytes4(userOp.callData[:4]);

            // Skip 4-byte selector, read address from bytes 4-36 (address is in last 20 bytes)
            bytes memory callData = userOp.callData;
            assembly {
                // Load 32 bytes starting at position 4 (after selector), mask to address
                target := and(mload(add(add(callData, 32), 4)), 0xffffffffffffffffffffffffffffffffffffffff)
            }
        }

        // Check target whitelist
        if (!_whitelist[target]) revert TargetNotWhitelisted();

        // H-1 fix: Check function selector whitelist if enforcement is enabled
        if (enforceFunctionWhitelist) {
            // Extract inner function selector from the 'func' parameter of execute()
            // execute(address dest, uint256 value, bytes calldata func)
            // The inner selector is the first 4 bytes of the 'func' parameter
            //
            // H-1 security fix: Add comprehensive bounds checking before assembly extraction
            // CallData layout for execute():
            // - bytes 0-3: outer selector (execute)
            // - bytes 4-35: dest address (padded to 32 bytes)
            // - bytes 36-67: value (uint256)
            // - bytes 68-99: offset to func parameter (uint256)
            // - At offset: length (uint256), then actual func calldata

            uint256 callDataLen = userOp.callData.length;

            // Minimum length check: 4 + 32 + 32 + 32 = 100 bytes for the fixed parts
            if (callDataLen >= 100) {
                bytes memory callData = userOp.callData;
                bytes4 innerSelector;
                bool validExtraction = false;

                assembly {
                    // Read the offset to func parameter (at byte 68, which is 4 + 32 + 32)
                    let funcOffset := mload(add(add(callData, 32), 68))

                    // H-1 fix: Validate funcOffset is within bounds
                    // funcOffset should point to a location that can hold at least length + 4 bytes (selector)
                    // The func data starts at: 4 (outer selector) + funcOffset
                    // At that location: first 32 bytes = length, then func calldata
                    let funcLengthPosition := add(4, funcOffset)

                    // Check: funcLengthPosition + 32 (length) must be within calldata
                    if lt(add(funcLengthPosition, 32), add(callDataLen, 1)) {
                        // Read the length of func parameter
                        let funcLength := mload(add(add(callData, 32), funcLengthPosition))

                        // Check: func must have at least 4 bytes for a selector
                        // gte(a,b) = not(lt(a,b)) = a >= b
                        if iszero(lt(funcLength, 4)) {
                            // Check: the selector position must be within calldata bounds
                            let selectorPosition := add(funcLengthPosition, 32)
                            if lt(add(selectorPosition, 4), add(callDataLen, 1)) {
                                // Extract the inner selector (first 4 bytes of func calldata)
                                let funcDataStart := add(add(callData, 32), selectorPosition)
                                innerSelector := and(mload(funcDataStart), 0xffffffff00000000000000000000000000000000000000000000000000000000)
                                validExtraction := 1
                            }
                        }
                    }
                }

                // H-1 fix: Only check whitelist if we successfully extracted a selector
                // If extraction failed (malformed calldata), reject the operation
                if (validExtraction) {
                    if (!_allowedFunctions[target][innerSelector]) {
                        revert FunctionNotWhitelisted();
                    }
                } else {
                    // Malformed calldata - reject
                    revert FunctionNotWhitelisted();
                }
            }
            // Note: If callData < 100 bytes, no inner func check is performed
            // This handles direct calls or execute() with empty func parameter
        }

        // Check and update rate limit
        _checkAndUpdateRateLimit(sender);

        // Return empty context and valid (0 = valid)
        return ("", 0);
    }

    /**
     * @notice Post-operation hook
     * @dev Called by EntryPoint after operation execution
     * @param mode The post-op mode (success/revert)
     * @param context The context from validation (empty for us)
     * @param actualGasCost Actual gas used
     * @param actualUserOpFeePerGas The gas price paid
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        // Suppress unused variable warnings
        (mode, context, actualGasCost, actualUserOpFeePerGas);
        // No post-op accounting needed for v1
        // Future: Track gas spend per wallet for analytics
    }

    /**
     * @notice Check and update rate limit for a wallet
     * @param wallet The wallet address
     * @dev Reverts if rate limit exceeded. Includes M-4 fix for lifetime limits and cooldown.
     */
    function _checkAndUpdateRateLimit(address wallet) private {
        uint256 currentTime = block.timestamp;

        // M-4 fix: Check cooldown
        if (currentTime < _cooldownEnds[wallet]) {
            revert InCooldownPeriod();
        }

        // M-4 fix: Check lifetime limit
        if (maxLifetimeOps > 0 && _lifetimeOperations[wallet] >= maxLifetimeOps) {
            revert LifetimeLimitExceeded();
        }

        uint256 windowStart = _windowStarts[wallet];

        // Reset window if expired
        if (currentTime >= windowStart + windowSeconds) {
            _windowStarts[wallet] = currentTime;
            _operationCounts[wallet] = 1;
            _lifetimeOperations[wallet]++; // M-4 fix: Track lifetime ops
            return;
        }

        // Check limit
        uint256 count = _operationCounts[wallet];
        if (count >= maxOpsPerWindow) {
            // M-4 fix: Set cooldown instead of just reverting
            _cooldownEnds[wallet] = currentTime + cooldownPeriod;
            revert RateLimitExceeded();
        }

        // Increment
        _operationCounts[wallet] = count + 1;
        _lifetimeOperations[wallet]++; // M-4 fix: Track lifetime ops
    }

    // Note: deposit(), getDeposit(), and withdrawTo() are inherited from BasePaymaster

    /// @inheritdoc IVlossomPaymaster
    function pause() external override onlyOwner {
        _pause();
        emit PaymasterPaused(msg.sender);
    }

    /// @inheritdoc IVlossomPaymaster
    function unpause() external override onlyOwner {
        _unpause();
        emit PaymasterUnpaused(msg.sender);
    }

    /// @notice Receive ETH for funding
    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }
}
