// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title MockEntryPoint
 * @notice Minimal mock of ERC-4337 EntryPoint for testing
 * @dev Only implements functions needed for VlossomAccount and VlossomPaymaster tests
 */
contract MockEntryPoint is IERC165 {
    // Track deposits per address
    mapping(address => uint256) private _deposits;

    // Track nonces per sender
    mapping(address => mapping(uint192 => uint256)) private _nonces;

    // PackedUserOperation struct (ERC-4337 v0.7)
    struct PackedUserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        bytes32 accountGasLimits;
        uint256 preVerificationGas;
        bytes32 gasFees;
        bytes paymasterAndData;
        bytes signature;
    }

    /// @notice Deposit ETH for an account
    function depositTo(address account) external payable {
        _deposits[account] += msg.value;
    }

    /// @notice Get balance for an account
    function balanceOf(address account) external view returns (uint256) {
        return _deposits[account];
    }

    /// @notice Withdraw from deposit
    function withdrawTo(address payable to, uint256 amount) external {
        require(_deposits[msg.sender] >= amount, "Insufficient balance");
        _deposits[msg.sender] -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /// @notice Get nonce for an account
    function getNonce(address sender, uint192 key) external view returns (uint256) {
        return _nonces[sender][key];
    }

    /// @notice Get the hash of a UserOperation
    function getUserOpHash(PackedUserOperation calldata userOp) external view returns (bytes32) {
        return keccak256(abi.encode(
            userOp.sender,
            userOp.nonce,
            keccak256(userOp.initCode),
            keccak256(userOp.callData),
            userOp.accountGasLimits,
            userOp.preVerificationGas,
            userOp.gasFees,
            keccak256(userOp.paymasterAndData),
            block.chainid,
            address(this)
        ));
    }

    /// @notice Add stake (mock - no-op)
    function addStake(uint32) external payable {}

    /// @notice Unlock stake (mock - no-op)
    function unlockStake() external {}

    /// @notice Withdraw stake (mock - no-op)
    function withdrawStake(address payable) external {}

    /// @notice Check interface support - returns true for IEntryPoint
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IEntryPoint).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    /// @notice Receive ETH
    receive() external payable {}
}
