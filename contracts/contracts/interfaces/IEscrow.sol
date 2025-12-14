// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IEscrow
 * @notice Interface for the Vlossom Protocol escrow contract
 * @dev Manages USDC escrow for beauty service bookings
 */
interface IEscrow {
    /// @notice Status of an escrow record
    enum EscrowStatus {
        None,      // No escrow exists
        Locked,    // Funds are locked in escrow
        Released,  // Funds have been released to stylist
        Refunded   // Funds have been refunded to customer
    }

    /// @notice Escrow record structure
    struct EscrowRecord {
        address customer;
        uint256 amount;
        EscrowStatus status;
    }

    /// @notice Emitted when funds are locked in escrow
    /// @param bookingId Unique identifier for the booking
    /// @param customer Address of the customer
    /// @param amount Amount of USDC locked (in smallest unit)
    event FundsLocked(
        bytes32 indexed bookingId,
        address indexed customer,
        uint256 amount
    );

    /// @notice Emitted when funds are released from escrow
    /// @param bookingId Unique identifier for the booking
    /// @param stylist Address of the stylist receiving funds
    /// @param stylistAmount Amount sent to stylist
    /// @param platformFeeAmount Amount sent to treasury as platform fee
    event FundsReleased(
        bytes32 indexed bookingId,
        address indexed stylist,
        uint256 stylistAmount,
        uint256 platformFeeAmount
    );

    /// @notice Emitted when funds are refunded from escrow
    /// @param bookingId Unique identifier for the booking
    /// @param recipient Address receiving the refund
    /// @param amount Amount refunded
    event FundsRefunded(
        bytes32 indexed bookingId,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when the relayer address is updated
    /// @param oldRelayer Previous relayer address
    /// @param newRelayer New relayer address
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    /// @notice Emitted when contract is paused
    event ContractPaused(address indexed account);

    /// @notice Emitted when contract is unpaused
    event ContractUnpaused(address indexed account);

    /// @notice Lock funds from customer into escrow
    /// @param bookingId Unique identifier for the booking
    /// @param amount Amount of USDC to lock
    /// @dev Transfers USDC from msg.sender to this contract
    function lockFunds(bytes32 bookingId, uint256 amount) external;

    /// @notice Release funds to stylist and treasury
    /// @param bookingId Unique identifier for the booking
    /// @param stylist Address of the stylist
    /// @param stylistAmount Amount to send to stylist
    /// @param treasury Address of the platform treasury
    /// @param platformFeeAmount Amount to send to treasury
    /// @dev Only callable by authorized relayer
    function releaseFunds(
        bytes32 bookingId,
        address stylist,
        uint256 stylistAmount,
        address treasury,
        uint256 platformFeeAmount
    ) external;

    /// @notice Refund funds to customer
    /// @param bookingId Unique identifier for the booking
    /// @param amount Amount to refund
    /// @param recipient Address to receive the refund
    /// @dev Only callable by authorized relayer
    function refund(
        bytes32 bookingId,
        uint256 amount,
        address recipient
    ) external;

    /// @notice Get the locked balance for a booking
    /// @param bookingId Unique identifier for the booking
    /// @return amount The amount locked in escrow
    function getEscrowBalance(bytes32 bookingId) external view returns (uint256);

    /// @notice Set the authorized relayer address
    /// @param newRelayer Address of the new relayer
    /// @dev Only callable by owner
    function setRelayer(address newRelayer) external;

    /// @notice Get the current relayer address
    /// @return The address of the authorized relayer
    function getRelayer() external view returns (address);

    /// @notice Get escrow record details
    /// @param bookingId Unique identifier for the booking
    /// @return record The complete escrow record
    function getEscrowRecord(bytes32 bookingId) external view returns (EscrowRecord memory);

    /// @notice Pause the contract (emergency stop)
    /// @dev Only callable by owner
    function pause() external;

    /// @notice Unpause the contract
    /// @dev Only callable by owner
    function unpause() external;

    // Note: paused() view function is inherited from OpenZeppelin Pausable contract
}
