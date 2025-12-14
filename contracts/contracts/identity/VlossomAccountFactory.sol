// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {VlossomAccount} from "./VlossomAccount.sol";
import {IVlossomAccountFactory} from "../interfaces/IVlossomAccountFactory.sol";

/**
 * @title VlossomAccountFactory
 * @notice Factory for deterministic VlossomAccount wallet creation via CREATE2
 * @dev Enables counterfactual deployment - addresses can be computed before deployment
 *
 * Security features:
 * - Deterministic addresses (same userId always produces same address)
 * - Immutable account implementation
 * - Idempotent creation (returns existing account if already deployed)
 *
 * Invariants:
 * - Each userId can only have one account
 * - Addresses are predictable before deployment
 * - Account ownership is set at creation time and cannot be changed by factory
 */
contract VlossomAccountFactory is IVlossomAccountFactory, Ownable {
    /// @dev Custom errors for gas optimization
    error InvalidOwner();

    /// @notice The VlossomAccount implementation contract (immutable)
    VlossomAccount public immutable override accountImplementation;

    /// @notice The EntryPoint contract address
    IEntryPoint private immutable _entryPoint;

    /// @notice Mapping of userId to deployed account address
    mapping(bytes32 => address) private _accounts;

    /// @notice Mapping of owner to their account address (reverse lookup)
    mapping(address => address) private _ownerToAccount;

    /**
     * @notice Initialize the factory
     * @param anEntryPoint The ERC-4337 EntryPoint address
     * @param initialOwner The factory owner (for admin functions)
     * @dev Deploys the account implementation contract
     */
    constructor(
        IEntryPoint anEntryPoint,
        address initialOwner
    ) Ownable(initialOwner) {
        _entryPoint = anEntryPoint;
        accountImplementation = new VlossomAccount(anEntryPoint);
    }

    /// @inheritdoc IVlossomAccountFactory
    function entryPoint() external view override returns (address) {
        return address(_entryPoint);
    }

    /// @inheritdoc IVlossomAccountFactory
    function createAccount(
        bytes32 userId,
        address owner
    ) external override returns (address account) {
        if (owner == address(0)) revert InvalidOwner();

        // Check if already deployed - return existing (idempotent)
        address existing = _accounts[userId];
        if (existing != address(0)) {
            return existing;
        }

        // Use userId as salt for deterministic deployment
        bytes32 salt = userId;

        // Encode initialization data
        bytes memory initData = abi.encodeCall(
            VlossomAccount.initialize,
            (owner)
        );

        // Deploy proxy pointing to implementation via CREATE2
        account = address(
            new ERC1967Proxy{salt: salt}(
                address(accountImplementation),
                initData
            )
        );

        // Store mappings
        _accounts[userId] = account;
        _ownerToAccount[owner] = account;

        emit AccountCreated(userId, account, owner);
    }

    /// @inheritdoc IVlossomAccountFactory
    function getAddress(bytes32 userId, address owner) external view override returns (address) {
        // Return existing if deployed
        address existing = _accounts[userId];
        if (existing != address(0)) {
            return existing;
        }

        // Compute counterfactual address
        bytes memory initData = abi.encodeCall(
            VlossomAccount.initialize,
            (owner)
        );

        bytes32 salt = userId;
        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(address(accountImplementation), initData)
        );

        return Create2.computeAddress(salt, keccak256(bytecode));
    }

    /// @inheritdoc IVlossomAccountFactory
    function accountOf(address owner) external view override returns (address) {
        return _ownerToAccount[owner];
    }

    /**
     * @notice Get account by userId directly
     * @param userId The user identifier
     * @return The account address (zero if not deployed)
     */
    function getAccountByUserId(bytes32 userId) external view returns (address) {
        return _accounts[userId];
    }
}
