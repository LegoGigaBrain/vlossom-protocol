// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {VlossomAccount} from "../identity/VlossomAccount.sol";

/**
 * @title IVlossomAccountFactory
 * @notice Interface for the Vlossom AA wallet factory
 * @dev Manages deterministic creation of VlossomAccount wallets via CREATE2
 */
interface IVlossomAccountFactory {
    /// @notice Emitted when a new account is created
    /// @param userId The unique user identifier (hashed from backend user ID)
    /// @param account The deployed account address
    /// @param owner The owner address of the account
    event AccountCreated(
        bytes32 indexed userId,
        address indexed account,
        address indexed owner
    );

    /// @notice Create a new AA wallet for a user
    /// @param userId Unique identifier for the user (hashed backend user ID)
    /// @param owner Address that will own the account
    /// @return account The address of the created (or existing) account
    /// @dev Idempotent - returns existing account if already created for userId
    function createAccount(bytes32 userId, address owner) external returns (address account);

    /// @notice Compute the deterministic address for a userId without deploying
    /// @param userId The user identifier
    /// @param owner The owner address for the account
    /// @return The counterfactual address (same whether deployed or not)
    function getAddress(bytes32 userId, address owner) external view returns (address);

    /// @notice Get the account address for an owner (reverse lookup)
    /// @param owner The owner address to look up
    /// @return The account address (zero address if none exists)
    function accountOf(address owner) external view returns (address);

    /// @notice Get the EntryPoint address used by accounts from this factory
    /// @return The EntryPoint contract address
    function entryPoint() external view returns (address);

    /// @notice Get the account implementation contract address
    /// @return The VlossomAccount implementation contract
    function accountImplementation() external view returns (VlossomAccount);
}
