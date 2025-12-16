// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title IVlossomAccount
 * @notice Interface for Vlossom AA wallet accounts
 * @dev ERC-4337 compliant smart account with guardian support for recovery
 */
interface IVlossomAccount {
    /// @notice Emitted when a guardian is added to the account
    /// @param guardian Address of the added guardian
    event GuardianAdded(address indexed guardian);

    /// @notice Emitted when a guardian is removed from the account
    /// @param guardian Address of the removed guardian
    event GuardianRemoved(address indexed guardian);

    /// @notice Emitted when ownership is transferred via guardian recovery
    /// @param oldOwner Previous owner address
    /// @param newOwner New owner address
    event RecoveryExecuted(address indexed oldOwner, address indexed newOwner);

    /// @notice Emitted when a recovery is initiated (M-1 fix)
    /// @param guardian Guardian who initiated recovery
    /// @param newOwner Proposed new owner
    /// @param executeAfter Timestamp when recovery can be executed
    event RecoveryInitiated(address indexed guardian, address indexed newOwner, uint256 executeAfter);

    /// @notice Emitted when a guardian approves a recovery (M-1 fix)
    /// @param guardian Guardian who approved
    /// @param currentApprovals Current approval count
    event RecoveryApproved(address indexed guardian, uint256 currentApprovals);

    /// @notice Emitted when a recovery is cancelled (M-1 fix)
    /// @param cancelledBy Address that cancelled (owner)
    event RecoveryCancelled(address indexed cancelledBy);

    /// @notice Add a guardian for social recovery
    /// @param guardian Address to add as guardian
    /// @dev Only callable by account owner
    function addGuardian(address guardian) external;

    /// @notice Remove a guardian
    /// @param guardian Address to remove from guardians
    /// @dev Only callable by account owner
    function removeGuardian(address guardian) external;

    /// @notice Check if an address is a guardian
    /// @param account Address to check
    /// @return True if the address is a guardian
    function isGuardian(address account) external view returns (bool);

    /// @notice Get the number of active guardians
    /// @return The count of guardians
    function getGuardianCount() external view returns (uint256);

    /// @notice Get the current owner of the account
    /// @return The owner address
    function owner() external view returns (address);

    /// @notice Get the EntryPoint address this account is linked to
    /// @return The EntryPoint contract
    function entryPoint() external view returns (IEntryPoint);

    // ============================================================================
    // M-1 Fix: Guardian Recovery Functions
    // ============================================================================

    /// @notice Initiate account recovery to transfer ownership (M-1 fix)
    /// @param newOwner The proposed new owner address
    /// @dev Only callable by a guardian. Requires 48-hour delay and 2 guardian approvals.
    function initiateRecovery(address newOwner) external;

    /// @notice Approve a pending recovery (M-1 fix)
    /// @dev Only callable by a guardian. Each guardian can only approve once.
    function approveRecovery() external;

    /// @notice Execute the recovery after delay and approvals (M-1 fix)
    /// @dev Can be called by anyone once conditions are met.
    function executeRecovery() external;

    /// @notice Cancel an active recovery (M-1 fix)
    /// @dev Only callable by the current owner.
    function cancelRecovery() external;

    /// @notice Get current recovery request details (M-1 fix)
    /// @return newOwner Proposed new owner address
    /// @return initiatedAt When recovery was initiated
    /// @return approvalCount Number of guardian approvals
    /// @return isActive Whether recovery is pending
    function getRecoveryRequest() external view returns (
        address newOwner,
        uint256 initiatedAt,
        uint256 approvalCount,
        bool isActive
    );
}
