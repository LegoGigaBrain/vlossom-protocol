// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IPropertyRegistry
 * @notice Interface for the PropertyRegistry contract
 */
interface IPropertyRegistry {
    /// @notice Property status enum
    enum PropertyStatus {
        Pending,
        Verified,
        Suspended,
        Revoked
    }

    /// @notice Property record structure
    struct PropertyRecord {
        address owner;
        bytes32 metadataHash;
        PropertyStatus status;
        uint256 registeredAt;
        uint256 updatedAt;
    }

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

    /// @notice Register a new property
    function registerProperty(bytes32 propertyId, bytes32 metadataHash) external;

    /// @notice Transfer property ownership
    function transferProperty(bytes32 propertyId, address newOwner) external;

    /// @notice Update property metadata
    function updateMetadata(bytes32 propertyId, bytes32 newMetadataHash) external;

    /// @notice Verify a property (admin)
    function verifyProperty(bytes32 propertyId) external;

    /// @notice Suspend a property (admin)
    function suspendProperty(bytes32 propertyId) external;

    /// @notice Unsuspend a property (admin)
    function unsuspendProperty(bytes32 propertyId) external;

    /// @notice Revoke a property (admin)
    function revokeProperty(bytes32 propertyId) external;

    /// @notice Get property record
    function getProperty(bytes32 propertyId) external view returns (
        address owner,
        bytes32 metadataHash,
        PropertyStatus status,
        uint256 registeredAt,
        uint256 updatedAt
    );

    /// @notice Check if property exists
    function propertyExists(bytes32 propertyId) external view returns (bool exists);

    /// @notice Check if property is verified
    function isPropertyVerified(bytes32 propertyId) external view returns (bool verified);

    /// @notice Get property owner
    function propertyOwner(bytes32 propertyId) external view returns (address owner);

    /// @notice Get count of properties owned by address
    function getOwnerPropertyCount(address owner) external view returns (uint256 count);

    /// @notice Get properties owned by address
    function getOwnerProperties(address owner) external view returns (bytes32[] memory propertyIds);

    /// @notice Get total registered properties
    function totalProperties() external view returns (uint256);
}
