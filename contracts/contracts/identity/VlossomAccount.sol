// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {BaseAccount} from "@account-abstraction/contracts/core/BaseAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {TokenCallbackHandler} from "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@account-abstraction/contracts/core/Helpers.sol";
import {IVlossomAccount} from "../interfaces/IVlossomAccount.sol";

/**
 * @title VlossomAccount
 * @notice ERC-4337 compliant smart account for Vlossom Protocol users
 * @dev Extends account-abstraction's BaseAccount with guardian-based recovery support
 *
 * Security features:
 * - Owner-only execution for sensitive operations
 * - Guardian system for social recovery (up to 5 guardians)
 * - Immutable EntryPoint reference
 * - UUPS upgradeable pattern
 * - No seed phrase required for users
 *
 * Invariants:
 * - One owner per account
 * - Owner can add/remove guardians
 * - Guardians cannot directly execute transactions (future recovery flow)
 * - Only EntryPoint or owner can execute transactions
 */
contract VlossomAccount is BaseAccount, TokenCallbackHandler, UUPSUpgradeable, Initializable, IVlossomAccount {
    /// @dev Custom errors for gas optimization
    error InvalidGuardian();
    error GuardianAlreadyExists();
    error GuardianNotFound();
    error NotOwner();
    error NotEntryPointOrOwner();
    error MaxGuardiansReached();
    // M-1 fix: Recovery errors
    error NotGuardian();
    error RecoveryAlreadyActive();
    error NoActiveRecovery();
    error AlreadyApproved();
    error RecoveryDelayNotMet();
    error InsufficientApprovals();
    error InvalidNewOwner();

    /// @notice Maximum number of guardians per account
    uint256 public constant MAX_GUARDIANS = 5;

    /// @notice M-1 fix: Recovery delay (48 hours)
    uint256 public constant RECOVERY_DELAY = 48 hours;

    /// @notice M-1 fix: Minimum guardian approvals required
    uint256 public constant MIN_RECOVERY_APPROVALS = 2;

    /// @notice The account owner (signer)
    address private _owner;

    /// @notice The EntryPoint contract (immutable)
    IEntryPoint private immutable _entryPoint;

    /// @notice Mapping of guardian addresses
    mapping(address => bool) private _guardians;

    /// @notice Count of active guardians
    uint256 private _guardianCount;

    // ============================================================================
    // M-1 Fix: Recovery State
    // ============================================================================

    /// @notice M-1 fix: Recovery request structure
    /// @dev H-2 fix: Added nonce to invalidate stale approvals
    struct RecoveryRequest {
        address newOwner;
        uint256 initiatedAt;
        uint256 approvalCount;
        bool isActive;
        uint256 nonce;  // H-2 fix: Recovery nonce for approval invalidation
    }

    /// @notice M-1 fix: Current recovery request
    RecoveryRequest private _recoveryRequest;

    /// @notice H-2 fix: Recovery nonce counter - increments on each new recovery
    uint256 private _recoveryNonce;

    /// @notice H-2 fix: Mapping of guardian approvals keyed by (guardian, nonce)
    /// @dev Using nested mapping ensures old approvals are automatically invalidated
    mapping(address => mapping(uint256 => bool)) private _recoveryApprovals;

    /// @notice Emitted when the account is initialized
    event VlossomAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);

    /// @dev Modifier to restrict to owner only
    modifier onlyAccountOwner() {
        if (msg.sender != _owner && msg.sender != address(this)) revert NotOwner();
        _;
    }

    /// @dev Modifier to restrict to guardians only (M-1 fix)
    modifier onlyGuardian() {
        if (!_guardians[msg.sender]) revert NotGuardian();
        _;
    }

    /**
     * @notice Constructor sets the immutable EntryPoint
     * @param anEntryPoint The ERC-4337 EntryPoint contract address
     * @dev Disables initializers to prevent implementation contract initialization
     */
    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override(BaseAccount, IVlossomAccount) returns (IEntryPoint) {
        return _entryPoint;
    }

    /// @notice Receive ETH
    receive() external payable {}

    /**
     * @notice Initialize the account with an owner
     * @param anOwner The initial owner of the account
     * @dev Can only be called once via proxy
     */
    function initialize(address anOwner) public virtual initializer {
        _initialize(anOwner);
    }

    /**
     * @dev Internal initialization logic
     * @param anOwner The owner address
     */
    function _initialize(address anOwner) internal virtual {
        _owner = anOwner;
        emit VlossomAccountInitialized(_entryPoint, anOwner);
    }

    /**
     * @notice Execute a transaction
     * @param dest Destination address
     * @param value ETH value to send
     * @param func Calldata to execute
     * @dev Only callable by EntryPoint or owner
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * @notice Execute a batch of transactions
     * @param dest Array of destination addresses
     * @param value Array of ETH values (can be empty for zero-value calls)
     * @param func Array of calldata
     * @dev Only callable by EntryPoint or owner
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external {
        _requireFromEntryPointOrOwner();
        if (dest.length != func.length || (value.length != 0 && value.length != func.length)) {
            revert("wrong array lengths");
        }
        if (value.length == 0) {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], 0, func[i]);
            }
        } else {
            for (uint256 i = 0; i < dest.length; i++) {
                _call(dest[i], value[i], func[i]);
            }
        }
    }

    /// @inheritdoc IVlossomAccount
    function owner() external view override returns (address) {
        return _owner;
    }

    /// @inheritdoc IVlossomAccount
    function addGuardian(address guardian) external override onlyAccountOwner {
        if (guardian == address(0)) revert InvalidGuardian();
        if (guardian == _owner) revert InvalidGuardian();
        if (_guardians[guardian]) revert GuardianAlreadyExists();
        if (_guardianCount >= MAX_GUARDIANS) revert MaxGuardiansReached();

        _guardians[guardian] = true;
        _guardianCount++;

        emit GuardianAdded(guardian);
    }

    /// @inheritdoc IVlossomAccount
    function removeGuardian(address guardian) external override onlyAccountOwner {
        if (!_guardians[guardian]) revert GuardianNotFound();

        _guardians[guardian] = false;
        _guardianCount--;

        emit GuardianRemoved(guardian);
    }

    /// @inheritdoc IVlossomAccount
    function isGuardian(address account) external view override returns (bool) {
        return _guardians[account];
    }

    /// @inheritdoc IVlossomAccount
    function getGuardianCount() external view override returns (uint256) {
        return _guardianCount;
    }

    /**
     * @notice Check current account deposit in the EntryPoint
     * @return The deposit balance
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * @notice Deposit more funds for this account in the EntryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice Withdraw value from the account's EntryPoint deposit
     * @param withdrawAddress Target address to send to
     * @param amount Amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public onlyAccountOwner {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    /**
     * @dev Require call came from EntryPoint or owner
     */
    function _requireFromEntryPointOrOwner() internal view {
        if (msg.sender != address(entryPoint()) && msg.sender != _owner) {
            revert NotEntryPointOrOwner();
        }
    }

    /**
     * @dev Validate the signature of a UserOperation
     * @param userOp The user operation
     * @param userOpHash Hash of the user operation
     * @return validationData 0 for valid signature, 1 for invalid
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view virtual override returns (uint256 validationData) {
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        if (_owner != ECDSA.recover(hash, userOp.signature)) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    /**
     * @dev Execute a call to a target address
     * @param target The target address
     * @param value ETH value to send
     * @param data Calldata to execute
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @dev Authorize upgrade (UUPS pattern)
     * @param newImplementation The new implementation address
     */
    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        if (msg.sender != _owner && msg.sender != address(this)) revert NotOwner();
    }

    // ============================================================================
    // M-1 Fix: Guardian Recovery Implementation
    // ============================================================================

    /**
     * @notice Initiate account recovery (M-1 fix)
     * @param newOwner The proposed new owner address
     * @dev Only callable by guardians. Starts 48-hour timelock.
     */
    function initiateRecovery(address newOwner) external override onlyGuardian {
        if (newOwner == address(0)) revert InvalidNewOwner();
        if (newOwner == _owner) revert InvalidNewOwner();
        if (_recoveryRequest.isActive) revert RecoveryAlreadyActive();
        if (_guardianCount < MIN_RECOVERY_APPROVALS) revert InsufficientApprovals();

        // H-2 fix: Increment nonce to invalidate all previous approvals
        uint256 newNonce = ++_recoveryNonce;

        _recoveryRequest = RecoveryRequest({
            newOwner: newOwner,
            initiatedAt: block.timestamp,
            approvalCount: 1,
            isActive: true,
            nonce: newNonce
        });

        // Initiating guardian auto-approves (using current nonce)
        _recoveryApprovals[msg.sender][newNonce] = true;

        emit RecoveryInitiated(msg.sender, newOwner, block.timestamp + RECOVERY_DELAY);
    }

    /**
     * @notice Approve a pending recovery (M-1 fix)
     * @dev Only callable by guardians who haven't already approved
     * @dev H-2 fix: Approvals are keyed by nonce to prevent stale approval reuse
     */
    function approveRecovery() external override onlyGuardian {
        if (!_recoveryRequest.isActive) revert NoActiveRecovery();
        uint256 currentNonce = _recoveryRequest.nonce;
        if (_recoveryApprovals[msg.sender][currentNonce]) revert AlreadyApproved();

        _recoveryApprovals[msg.sender][currentNonce] = true;
        _recoveryRequest.approvalCount++;

        emit RecoveryApproved(msg.sender, _recoveryRequest.approvalCount);
    }

    /**
     * @notice Execute recovery after delay and approvals (M-1 fix)
     * @dev Anyone can call once conditions are met
     */
    function executeRecovery() external override {
        if (!_recoveryRequest.isActive) revert NoActiveRecovery();
        if (block.timestamp < _recoveryRequest.initiatedAt + RECOVERY_DELAY) {
            revert RecoveryDelayNotMet();
        }
        if (_recoveryRequest.approvalCount < MIN_RECOVERY_APPROVALS) {
            revert InsufficientApprovals();
        }

        address oldOwner = _owner;
        address newOwner = _recoveryRequest.newOwner;

        // Transfer ownership
        _owner = newOwner;

        // Clear recovery state
        _clearRecoveryState();

        emit RecoveryExecuted(oldOwner, newOwner);
    }

    /**
     * @notice Cancel an active recovery (M-1 fix)
     * @dev Only callable by current owner
     */
    function cancelRecovery() external override onlyAccountOwner {
        if (!_recoveryRequest.isActive) revert NoActiveRecovery();

        _clearRecoveryState();

        emit RecoveryCancelled(msg.sender);
    }

    /**
     * @notice Get current recovery request details (M-1 fix)
     */
    function getRecoveryRequest() external view override returns (
        address newOwner,
        uint256 initiatedAt,
        uint256 approvalCount,
        bool isActive
    ) {
        return (
            _recoveryRequest.newOwner,
            _recoveryRequest.initiatedAt,
            _recoveryRequest.approvalCount,
            _recoveryRequest.isActive
        );
    }

    /**
     * @notice Check if a guardian has approved current recovery (M-1 fix)
     * @param guardian Guardian address to check
     * @dev H-2 fix: Only returns true if approved for current nonce
     */
    function hasApprovedRecovery(address guardian) external view returns (bool) {
        if (!_recoveryRequest.isActive) return false;
        return _recoveryApprovals[guardian][_recoveryRequest.nonce];
    }

    /**
     * @dev Clear recovery state (M-1 fix)
     * @dev H-2 fix: No need to clear approval mappings - nonce increment handles this
     *      When a new recovery starts, it uses a new nonce, making old approvals invalid
     */
    function _clearRecoveryState() private {
        // Reset the recovery request (keep nonce for reference)
        uint256 oldNonce = _recoveryRequest.nonce;
        _recoveryRequest = RecoveryRequest({
            newOwner: address(0),
            initiatedAt: 0,
            approvalCount: 0,
            isActive: false,
            nonce: oldNonce  // Preserve nonce for hasApprovedRecovery queries
        });
        // H-2 fix: No need to clear _recoveryApprovals mappings
        // Old approvals are automatically invalid because:
        // 1. hasApprovedRecovery checks isActive first
        // 2. New recoveries will use incremented nonce
    }

    /**
     * @notice Get current recovery nonce
     * @dev Useful for tracking recovery attempts
     */
    function getRecoveryNonce() external view returns (uint256) {
        return _recoveryNonce;
    }
}
