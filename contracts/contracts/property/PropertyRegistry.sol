// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title PropertyRegistry
 * @notice On-chain property ownership and verification registry for Vlossom Protocol
 * @dev Stores property registration hashes that can be verified off-chain
 *
 * This contract provides:
 * - Property ownership verification through on-chain registration
 * - Property status tracking (verified, suspended, etc.)
 * - Event emission for indexing property changes
 *
 * Security features:
 * - Ownable for admin functions
 * - ReentrancyGuard for protection
 * - Pausable for emergency stops
 * - H-2 fix: EnumerableSet for O(1) property ownership tracking
 */
contract PropertyRegistry is Ownable, ReentrancyGuard, Pausable {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    /// @dev Custom errors for gas optimization
    error InvalidPropertyId();
    error PropertyAlreadyRegistered();
    error PropertyNotFound();
    error UnauthorizedOwner();
    error InvalidStatus();
    // M-2 fix: Timelock errors
    error SuspensionAlreadyPending();
    error NoSuspensionPending();
    error SuspensionDelayNotMet();
    error PropertyUnderDispute();
    error NoActiveDispute();

    /// @notice Property status enum
    enum PropertyStatus {
        Pending,    // Awaiting verification
        Verified,   // Verified and active
        Suspended,  // Temporarily suspended
        Revoked     // Permanently revoked
    }

    /// @notice Property record stored on-chain
    struct PropertyRecord {
        address owner;          // Wallet address of property owner
        bytes32 metadataHash;   // Hash of off-chain metadata (location, details)
        PropertyStatus status;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    /// @notice Mapping of property ID to record
    mapping(bytes32 => PropertyRecord) public properties;

    /// @notice Mapping of owner address to their property IDs (H-2 fix: EnumerableSet for O(1) operations)
    mapping(address => EnumerableSet.Bytes32Set) private _ownerProperties;

    /// @notice Total registered properties
    uint256 public totalProperties;

    // ============================================================================
    // M-2 Fix: Suspension Timelock State
    // ============================================================================

    /// @notice M-2 fix: Suspension delay (24 hours)
    uint256 public constant SUSPENSION_DELAY = 24 hours;

    /// @notice M-2 fix: Pending suspension request
    struct SuspensionRequest {
        bytes32 propertyId;
        uint256 requestedAt;
        string reason;
        bool isActive;
        bool disputed;
    }

    /// @notice M-2 fix: Mapping of property ID to suspension request
    mapping(bytes32 => SuspensionRequest) public suspensionRequests;

    /// @notice Events
    event PropertyRegistered(
        bytes32 indexed propertyId,
        address indexed owner,
        bytes32 metadataHash,
        uint256 timestamp
    );

    event PropertyTransferred(
        bytes32 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    /// @dev M-4: Added indexed to status fields for efficient filtering by property status
    event PropertyStatusChanged(
        bytes32 indexed propertyId,
        PropertyStatus indexed previousStatus,
        PropertyStatus indexed newStatus,
        uint256 timestamp
    );

    event PropertyMetadataUpdated(
        bytes32 indexed propertyId,
        bytes32 previousHash,
        bytes32 newHash,
        uint256 timestamp
    );

    // M-2 fix: Suspension timelock events
    event SuspensionRequested(
        bytes32 indexed propertyId,
        string reason,
        uint256 executeAfter
    );

    event SuspensionExecuted(
        bytes32 indexed propertyId,
        uint256 timestamp
    );

    event SuspensionCancelled(
        bytes32 indexed propertyId
    );

    event DisputeRaised(
        bytes32 indexed propertyId,
        address indexed propertyOwner
    );

    event DisputeResolved(
        bytes32 indexed propertyId,
        bool upheld
    );

    /**
     * @notice Initialize the property registry
     * @param _initialOwner Address of the contract owner (admin)
     */
    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @notice Register a new property
     * @param propertyId Unique identifier for the property (UUID as bytes32)
     * @param metadataHash Hash of property metadata (location, name, etc.)
     */
    function registerProperty(
        bytes32 propertyId,
        bytes32 metadataHash
    ) external nonReentrant whenNotPaused {
        if (propertyId == bytes32(0)) revert InvalidPropertyId();
        if (properties[propertyId].registeredAt != 0) revert PropertyAlreadyRegistered();

        properties[propertyId] = PropertyRecord({
            owner: msg.sender,
            metadataHash: metadataHash,
            status: PropertyStatus.Pending,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // H-2 fix: Use EnumerableSet for O(1) add
        _ownerProperties[msg.sender].add(propertyId);
        totalProperties++;

        emit PropertyRegistered(propertyId, msg.sender, metadataHash, block.timestamp);
    }

    /**
     * @notice Transfer property ownership to a new address
     * @param propertyId Property to transfer
     * @param newOwner New owner address
     */
    function transferProperty(
        bytes32 propertyId,
        address newOwner
    ) external nonReentrant whenNotPaused {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.owner != msg.sender) revert UnauthorizedOwner();
        if (newOwner == address(0)) revert UnauthorizedOwner();

        address previousOwner = record.owner;
        record.owner = newOwner;
        record.updatedAt = block.timestamp;

        // H-2 fix: Use EnumerableSet for O(1) remove and add
        _ownerProperties[previousOwner].remove(propertyId);
        _ownerProperties[newOwner].add(propertyId);

        emit PropertyTransferred(propertyId, previousOwner, newOwner, block.timestamp);
    }

    /**
     * @notice Update property metadata hash
     * @param propertyId Property to update
     * @param newMetadataHash New metadata hash
     */
    function updateMetadata(
        bytes32 propertyId,
        bytes32 newMetadataHash
    ) external nonReentrant whenNotPaused {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.owner != msg.sender) revert UnauthorizedOwner();

        bytes32 previousHash = record.metadataHash;
        record.metadataHash = newMetadataHash;
        record.updatedAt = block.timestamp;

        emit PropertyMetadataUpdated(propertyId, previousHash, newMetadataHash, block.timestamp);
    }

    /**
     * @notice Verify a property (admin only)
     * @param propertyId Property to verify
     */
    function verifyProperty(bytes32 propertyId) external onlyOwner {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.status != PropertyStatus.Pending) revert InvalidStatus();

        PropertyStatus previousStatus = record.status;
        record.status = PropertyStatus.Verified;
        record.updatedAt = block.timestamp;

        emit PropertyStatusChanged(propertyId, previousStatus, PropertyStatus.Verified, block.timestamp);
    }

    // ============================================================================
    // M-2 Fix: Suspension Timelock Functions
    // ============================================================================

    /**
     * @notice Request to suspend a property with 24-hour delay (M-2 fix)
     * @param propertyId Property to suspend
     * @param reason Reason for suspension
     */
    function requestSuspension(bytes32 propertyId, string calldata reason) external onlyOwner {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.status == PropertyStatus.Revoked) revert InvalidStatus();
        if (record.status == PropertyStatus.Suspended) revert InvalidStatus();
        if (suspensionRequests[propertyId].isActive) revert SuspensionAlreadyPending();

        suspensionRequests[propertyId] = SuspensionRequest({
            propertyId: propertyId,
            requestedAt: block.timestamp,
            reason: reason,
            isActive: true,
            disputed: false
        });

        emit SuspensionRequested(propertyId, reason, block.timestamp + SUSPENSION_DELAY);
    }

    /**
     * @notice Execute suspension after delay (M-2 fix)
     * @param propertyId Property to suspend
     */
    function executeSuspension(bytes32 propertyId) external onlyOwner {
        SuspensionRequest storage request = suspensionRequests[propertyId];
        if (!request.isActive) revert NoSuspensionPending();
        if (request.disputed) revert PropertyUnderDispute();
        if (block.timestamp < request.requestedAt + SUSPENSION_DELAY) {
            revert SuspensionDelayNotMet();
        }

        PropertyRecord storage record = properties[propertyId];
        PropertyStatus previousStatus = record.status;
        record.status = PropertyStatus.Suspended;
        record.updatedAt = block.timestamp;

        // Clear the suspension request
        delete suspensionRequests[propertyId];

        emit SuspensionExecuted(propertyId, block.timestamp);
        emit PropertyStatusChanged(propertyId, previousStatus, PropertyStatus.Suspended, block.timestamp);
    }

    /**
     * @notice Cancel a pending suspension (M-2 fix)
     * @param propertyId Property with pending suspension
     */
    function cancelSuspension(bytes32 propertyId) external onlyOwner {
        SuspensionRequest storage request = suspensionRequests[propertyId];
        if (!request.isActive) revert NoSuspensionPending();

        delete suspensionRequests[propertyId];

        emit SuspensionCancelled(propertyId);
    }

    /**
     * @notice Raise a dispute against pending suspension (M-2 fix)
     * @param propertyId Property with pending suspension
     * @dev Only callable by property owner
     */
    function raiseDispute(bytes32 propertyId) external {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.owner != msg.sender) revert UnauthorizedOwner();

        SuspensionRequest storage request = suspensionRequests[propertyId];
        if (!request.isActive) revert NoSuspensionPending();
        if (request.disputed) revert PropertyUnderDispute(); // Already disputed

        request.disputed = true;

        emit DisputeRaised(propertyId, msg.sender);
    }

    /**
     * @notice Resolve a dispute (M-2 fix)
     * @param propertyId Property under dispute
     * @param upholdSuspension True to proceed with suspension, false to cancel
     */
    function resolveDispute(bytes32 propertyId, bool upholdSuspension) external onlyOwner {
        SuspensionRequest storage request = suspensionRequests[propertyId];
        if (!request.isActive) revert NoSuspensionPending();
        if (!request.disputed) revert NoActiveDispute();

        if (upholdSuspension) {
            // Execute suspension immediately (dispute rejected)
            PropertyRecord storage record = properties[propertyId];
            PropertyStatus previousStatus = record.status;
            record.status = PropertyStatus.Suspended;
            record.updatedAt = block.timestamp;

            delete suspensionRequests[propertyId];

            emit DisputeResolved(propertyId, true);
            emit PropertyStatusChanged(propertyId, previousStatus, PropertyStatus.Suspended, block.timestamp);
        } else {
            // Cancel suspension (dispute upheld - property owner wins)
            delete suspensionRequests[propertyId];

            emit DisputeResolved(propertyId, false);
            emit SuspensionCancelled(propertyId);
        }
    }

    /**
     * @notice Get suspension request details (M-2 fix)
     * @param propertyId Property to query
     */
    function getSuspensionRequest(bytes32 propertyId) external view returns (
        uint256 requestedAt,
        string memory reason,
        bool isActive,
        bool disputed,
        uint256 executeAfter
    ) {
        SuspensionRequest storage request = suspensionRequests[propertyId];
        return (
            request.requestedAt,
            request.reason,
            request.isActive,
            request.disputed,
            request.isActive ? request.requestedAt + SUSPENSION_DELAY : 0
        );
    }

    /**
     * @notice Unsuspend a property back to verified status (admin only)
     * @param propertyId Property to unsuspend
     */
    function unsuspendProperty(bytes32 propertyId) external onlyOwner {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.status != PropertyStatus.Suspended) revert InvalidStatus();

        PropertyStatus previousStatus = record.status;
        record.status = PropertyStatus.Verified;
        record.updatedAt = block.timestamp;

        emit PropertyStatusChanged(propertyId, previousStatus, PropertyStatus.Verified, block.timestamp);
    }

    /**
     * @notice Revoke a property permanently (admin only)
     * @param propertyId Property to revoke
     */
    function revokeProperty(bytes32 propertyId) external onlyOwner {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();

        PropertyStatus previousStatus = record.status;
        record.status = PropertyStatus.Revoked;
        record.updatedAt = block.timestamp;

        emit PropertyStatusChanged(propertyId, previousStatus, PropertyStatus.Revoked, block.timestamp);
    }

    // ============================================================================
    // View Functions
    // ============================================================================

    /**
     * @notice Get property record
     * @param propertyId Property ID to query
     * @return owner Property owner address
     * @return metadataHash Hash of property metadata
     * @return status Current property status
     * @return registeredAt Registration timestamp
     * @return updatedAt Last update timestamp
     */
    function getProperty(bytes32 propertyId) external view returns (
        address owner,
        bytes32 metadataHash,
        PropertyStatus status,
        uint256 registeredAt,
        uint256 updatedAt
    ) {
        PropertyRecord storage record = properties[propertyId];
        return (
            record.owner,
            record.metadataHash,
            record.status,
            record.registeredAt,
            record.updatedAt
        );
    }

    /**
     * @notice Check if a property exists
     * @param propertyId Property ID to check
     * @return exists True if property is registered
     */
    function propertyExists(bytes32 propertyId) external view returns (bool exists) {
        return properties[propertyId].registeredAt != 0;
    }

    /**
     * @notice Check if a property is verified and active
     * @param propertyId Property ID to check
     * @return verified True if property status is Verified
     */
    function isPropertyVerified(bytes32 propertyId) external view returns (bool verified) {
        return properties[propertyId].status == PropertyStatus.Verified;
    }

    /**
     * @notice Get the owner of a property
     * @param propertyId Property ID to query
     * @return owner Property owner address
     */
    function propertyOwner(bytes32 propertyId) external view returns (address owner) {
        return properties[propertyId].owner;
    }

    /**
     * @notice Get count of properties owned by an address (H-2 fix: accurate count)
     * @param owner Address to query
     * @return count Number of properties
     */
    function getOwnerPropertyCount(address owner) external view returns (uint256 count) {
        return _ownerProperties[owner].length();
    }

    /**
     * @notice Get property IDs owned by an address (H-2 fix: only current properties)
     * @param owner Address to query
     * @return propertyIds Array of property IDs
     */
    function getOwnerProperties(address owner) external view returns (bytes32[] memory propertyIds) {
        uint256 length = _ownerProperties[owner].length();
        propertyIds = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            propertyIds[i] = _ownerProperties[owner].at(i);
        }
        return propertyIds;
    }

    /**
     * @notice Get property ID at specific index for an owner (H-2 fix)
     * @param owner Address to query
     * @param index Index in the set
     * @return propertyId The property ID at that index
     */
    function getOwnerPropertyAt(address owner, uint256 index) external view returns (bytes32) {
        return _ownerProperties[owner].at(index);
    }

    /**
     * @notice Check if an owner has a specific property (H-2 fix)
     * @param owner Address to query
     * @param propertyId Property ID to check
     * @return True if owner has this property
     */
    function ownerHasProperty(address owner, bytes32 propertyId) external view returns (bool) {
        return _ownerProperties[owner].contains(propertyId);
    }

    // ============================================================================
    // Admin Functions
    // ============================================================================

    /**
     * @notice Pause the contract (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (admin only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
