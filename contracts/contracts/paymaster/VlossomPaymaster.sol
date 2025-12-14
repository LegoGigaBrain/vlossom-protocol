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
 * - Rate limiting: Prevents abuse via per-wallet operation caps per time window
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
    error RateLimitExceeded();
    error InvalidRateLimit();

    /// @notice Whitelisted target contracts that can be sponsored
    mapping(address => bool) private _whitelist;

    /// @notice Rate limiting: operations per wallet per window
    mapping(address => uint256) private _operationCounts;

    /// @notice Rate limiting: window start timestamps per wallet
    mapping(address => uint256) private _windowStarts;

    /// @notice Maximum operations per wallet per window
    uint256 public maxOpsPerWindow;

    /// @notice Rate limit window duration in seconds
    uint256 public windowSeconds;

    /// @notice Default rate limit: 50 operations per day
    uint256 private constant DEFAULT_MAX_OPS = 50;
    uint256 private constant DEFAULT_WINDOW = 1 days;

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
        if (userOp.callData.length >= 36) {
            // Skip 4-byte selector, read address from bytes 4-36 (address is in last 20 bytes)
            bytes memory callData = userOp.callData;
            assembly {
                // Load 32 bytes starting at position 4 (after selector), mask to address
                target := and(mload(add(add(callData, 32), 4)), 0xffffffffffffffffffffffffffffffffffffffff)
            }
        }

        // Check whitelist
        if (!_whitelist[target]) revert TargetNotWhitelisted();

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
     * @dev Reverts if rate limit exceeded
     */
    function _checkAndUpdateRateLimit(address wallet) private {
        uint256 windowStart = _windowStarts[wallet];
        uint256 currentTime = block.timestamp;

        // Reset window if expired
        if (currentTime >= windowStart + windowSeconds) {
            _windowStarts[wallet] = currentTime;
            _operationCounts[wallet] = 1;
            return;
        }

        // Check limit
        uint256 count = _operationCounts[wallet];
        if (count >= maxOpsPerWindow) revert RateLimitExceeded();

        // Increment
        _operationCounts[wallet] = count + 1;
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
