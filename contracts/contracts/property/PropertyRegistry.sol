// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

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
 */
contract PropertyRegistry is Ownable, ReentrancyGuard, Pausable {
    /// @dev Custom errors for gas optimization
    error InvalidPropertyId();
    error PropertyAlreadyRegistered();
    error PropertyNotFound();
    error UnauthorizedOwner();
    error InvalidStatus();

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

    /// @notice Mapping of owner address to their property IDs
    mapping(address => bytes32[]) public ownerProperties;

    /// @notice Total registered properties
    uint256 public totalProperties;

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

    event PropertyStatusChanged(
        bytes32 indexed propertyId,
        PropertyStatus previousStatus,
        PropertyStatus newStatus,
        uint256 timestamp
    );

    event PropertyMetadataUpdated(
        bytes32 indexed propertyId,
        bytes32 previousHash,
        bytes32 newHash,
        uint256 timestamp
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

        ownerProperties[msg.sender].push(propertyId);
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

        // Add to new owner's list
        ownerProperties[newOwner].push(propertyId);

        // Note: We don't remove from previous owner's list to save gas
        // The owner field in PropertyRecord is the source of truth

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

    /**
     * @notice Suspend a property (admin only)
     * @param propertyId Property to suspend
     */
    function suspendProperty(bytes32 propertyId) external onlyOwner {
        PropertyRecord storage record = properties[propertyId];
        if (record.registeredAt == 0) revert PropertyNotFound();
        if (record.status == PropertyStatus.Revoked) revert InvalidStatus();

        PropertyStatus previousStatus = record.status;
        record.status = PropertyStatus.Suspended;
        record.updatedAt = block.timestamp;

        emit PropertyStatusChanged(propertyId, previousStatus, PropertyStatus.Suspended, block.timestamp);
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
     * @notice Get count of properties owned by an address
     * @param owner Address to query
     * @return count Number of properties
     */
    function getOwnerPropertyCount(address owner) external view returns (uint256 count) {
        return ownerProperties[owner].length;
    }

    /**
     * @notice Get property IDs owned by an address
     * @param owner Address to query
     * @return propertyIds Array of property IDs
     */
    function getOwnerProperties(address owner) external view returns (bytes32[] memory propertyIds) {
        return ownerProperties[owner];
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
