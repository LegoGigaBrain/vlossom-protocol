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
}
