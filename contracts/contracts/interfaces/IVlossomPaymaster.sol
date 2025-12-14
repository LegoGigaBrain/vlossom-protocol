// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IVlossomPaymaster
 * @notice Interface for Vlossom gas sponsorship contract
 * @dev Implements ERC-4337 Paymaster with whitelisting and rate limiting
 */
interface IVlossomPaymaster {
    /// @notice Emitted when a target contract is whitelisted or removed from whitelist
    /// @param target The contract address
    /// @param allowed True if whitelisted, false if removed
    event WhitelistUpdated(address indexed target, bool allowed);

    /// @notice Emitted when rate limit settings are updated
    /// @param maxOpsPerWindow Maximum operations per wallet per window
    /// @param windowSeconds Duration of the rate limit window in seconds
    event RateLimitUpdated(uint256 maxOpsPerWindow, uint256 windowSeconds);

    /// @notice Emitted when the paymaster receives ETH funding
    /// @param sender Address that sent the funds
    /// @param amount Amount of ETH deposited
    event Funded(address indexed sender, uint256 amount);

    /// @notice Emitted when the paymaster is paused
    /// @param account Address that triggered the pause
    event PaymasterPaused(address indexed account);

    /// @notice Emitted when the paymaster is unpaused
    /// @param account Address that triggered the unpause
    event PaymasterUnpaused(address indexed account);

    /// @notice Set whether a target contract is whitelisted for gas sponsorship
    /// @param target The contract address to whitelist/unwhitelist
    /// @param allowed True to whitelist, false to remove
    /// @dev Only callable by owner
    function setWhitelistedTarget(address target, bool allowed) external;

    /// @notice Check if a target contract is whitelisted
    /// @param target The contract address to check
    /// @return True if the target is whitelisted
    function isWhitelisted(address target) external view returns (bool);

    /// @notice Set rate limiting parameters
    /// @param maxOpsPerWindow Maximum operations per wallet per window
    /// @param windowSeconds Duration of the rate limit window in seconds
    /// @dev Only callable by owner
    function setRateLimit(uint256 maxOpsPerWindow, uint256 windowSeconds) external;

    /// @notice Get the operation count for a wallet in the current window
    /// @param wallet The wallet address to check
    /// @return count The number of operations used in the current window
    function getOperationCount(address wallet) external view returns (uint256 count);

    /// @notice Get current rate limit settings
    /// @return maxOpsPerWindow Maximum operations per window
    /// @return windowSeconds Window duration in seconds
    function getRateLimitSettings() external view returns (uint256 maxOpsPerWindow, uint256 windowSeconds);

    // Note: deposit(), getDeposit(), and withdrawTo() are inherited from BasePaymaster

    /// @notice Pause the paymaster (emergency stop)
    /// @dev Only callable by owner. Blocks all gas sponsorship when paused.
    function pause() external;

    /// @notice Unpause the paymaster
    /// @dev Only callable by owner
    function unpause() external;

    // Note: paused() view function is inherited from OpenZeppelin Pausable
}
