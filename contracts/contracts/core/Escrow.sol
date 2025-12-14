// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IEscrow} from "../interfaces/IEscrow.sol";

/**
 * @title Escrow
 * @notice Secure USDC escrow contract for Vlossom Protocol beauty service bookings
 * @dev Implements multi-party settlement with checks-effects-interactions pattern
 *
 * Security features:
 * - ReentrancyGuard on all external fund-moving functions
 * - SafeERC20 for token transfers
 * - Explicit access control for settlement functions
 * - Single-use escrow records (cannot be reused after release/refund)
 * - Total amount validation on release
 * - Emergency pause mechanism (Pausable)
 * - Relayer initialized at deployment (no deployment race condition)
 *
 * Invariants:
 * - Each bookingId can only have one escrow record
 * - Escrow can only move from Locked -> Released or Locked -> Refunded
 * - Total released must equal total locked (no partial refunds in v1)
 * - Only authorized relayer can trigger settlements/refunds
 */
contract Escrow is IEscrow, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @dev Custom errors for gas optimization
    error InvalidAmount();
    error InvalidAddress();
    error BookingAlreadyExists();
    error BookingNotFound();
    error InvalidEscrowStatus();
    error UnauthorizedCaller();
    error AmountMismatch();
    error InsufficientEscrowBalance();

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Authorized relayer address (backend service)
    address private relayer;

    /// @notice Mapping of booking IDs to escrow records
    mapping(bytes32 => EscrowRecord) public escrows;

    /// @dev Modifier to restrict access to authorized relayer
    modifier onlyRelayer() {
        if (msg.sender != relayer) revert UnauthorizedCaller();
        _;
    }

    /**
     * @notice Initialize the escrow contract
     * @param _usdc Address of the USDC token contract
     * @param _initialOwner Address of the contract owner
     * @param _initialRelayer Address of the authorized relayer (must be set at deployment)
     */
    constructor(
        address _usdc,
        address _initialOwner,
        address _initialRelayer
    ) Ownable(_initialOwner) {
        if (_usdc == address(0)) revert InvalidAddress();
        if (_initialRelayer == address(0)) revert InvalidAddress();
        usdc = IERC20(_usdc);
        relayer = _initialRelayer;
        emit RelayerUpdated(address(0), _initialRelayer);
    }

    /**
     * @notice Lock USDC funds from customer into escrow
     * @param bookingId Unique identifier for the booking
     * @param amount Amount of USDC to lock (in smallest unit, typically 6 decimals)
     *
     * @dev Requirements:
     * - amount must be > 0
     * - bookingId must not already exist
     * - caller must have approved this contract to transfer USDC
     * - caller must have sufficient USDC balance
     *
     * Effects:
     * - Creates escrow record with status Locked
     * - Transfers USDC from msg.sender to this contract
     * - Emits FundsLocked event
     */
    function lockFunds(bytes32 bookingId, uint256 amount) external nonReentrant whenNotPaused {
        // Input validation
        if (amount == 0) revert InvalidAmount();
        if (escrows[bookingId].status != EscrowStatus.None) revert BookingAlreadyExists();

        // Effects: Update state before external call
        escrows[bookingId] = EscrowRecord({
            customer: msg.sender,
            amount: amount,
            status: EscrowStatus.Locked
        });

        // Interactions: External call comes last
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit FundsLocked(bookingId, msg.sender, amount);
    }

    /**
     * @notice Release escrowed funds to stylist and platform treasury
     * @param bookingId Unique identifier for the booking
     * @param stylist Address of the stylist receiving payment
     * @param stylistAmount Amount to send to stylist
     * @param treasury Address of the platform treasury
     * @param platformFeeAmount Amount to send to treasury as platform fee
     *
     * @dev Requirements:
     * - caller must be authorized relayer
     * - escrow must exist and be in Locked status
     * - stylist and treasury addresses must be valid
     * - stylistAmount + platformFeeAmount must equal locked amount
     *
     * Effects:
     * - Updates escrow status to Released
     * - Transfers funds to stylist and treasury
     * - Emits FundsReleased event
     */
    function releaseFunds(
        bytes32 bookingId,
        address stylist,
        uint256 stylistAmount,
        address treasury,
        uint256 platformFeeAmount
    ) external onlyRelayer nonReentrant whenNotPaused {
        // Input validation
        if (stylist == address(0) || treasury == address(0)) revert InvalidAddress();

        EscrowRecord storage record = escrows[bookingId];
        if (record.status != EscrowStatus.Locked) revert InvalidEscrowStatus();

        uint256 totalAmount = stylistAmount + platformFeeAmount;
        if (totalAmount != record.amount) revert AmountMismatch();

        // Effects: Update state before external calls
        record.status = EscrowStatus.Released;

        // Interactions: External calls come last
        if (stylistAmount > 0) {
            usdc.safeTransfer(stylist, stylistAmount);
        }
        if (platformFeeAmount > 0) {
            usdc.safeTransfer(treasury, platformFeeAmount);
        }

        emit FundsReleased(bookingId, stylist, stylistAmount, platformFeeAmount);
    }

    /**
     * @notice Refund escrowed funds to customer or specified recipient
     * @param bookingId Unique identifier for the booking
     * @param amount Amount to refund (must equal full locked amount - no partial refunds in v1)
     * @param recipient Address to receive the refund
     *
     * @dev Requirements:
     * - caller must be authorized relayer
     * - escrow must exist and be in Locked status
     * - recipient address must be valid
     * - amount must exactly equal locked amount (no partial refunds)
     *
     * Effects:
     * - Updates escrow status to Refunded
     * - Transfers refund amount to recipient
     * - Emits FundsRefunded event
     *
     * Security note: Partial refunds are disabled in v1 to prevent funds from being
     * permanently locked. The full locked amount must be refunded in a single call.
     */
    function refund(
        bytes32 bookingId,
        uint256 amount,
        address recipient
    ) external onlyRelayer nonReentrant whenNotPaused {
        // Input validation
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        EscrowRecord storage record = escrows[bookingId];
        if (record.status != EscrowStatus.Locked) revert InvalidEscrowStatus();
        // SECURITY FIX (C-1): Require exact amount match to prevent funds from being locked
        if (amount != record.amount) revert AmountMismatch();

        // Effects: Update state before external call
        record.status = EscrowStatus.Refunded;

        // Interactions: External call comes last
        usdc.safeTransfer(recipient, amount);

        emit FundsRefunded(bookingId, recipient, amount);
    }

    /**
     * @notice Get the locked balance for a booking
     * @param bookingId Unique identifier for the booking
     * @return The amount currently locked in escrow
     */
    function getEscrowBalance(bytes32 bookingId) external view returns (uint256) {
        EscrowRecord memory record = escrows[bookingId];
        if (record.status == EscrowStatus.Locked) {
            return record.amount;
        }
        return 0;
    }

    /**
     * @notice Get complete escrow record details
     * @param bookingId Unique identifier for the booking
     * @return record The complete escrow record
     */
    function getEscrowRecord(bytes32 bookingId) external view returns (EscrowRecord memory) {
        return escrows[bookingId];
    }

    /**
     * @notice Set the authorized relayer address
     * @param newRelayer Address of the new relayer
     *
     * @dev Only callable by contract owner
     * Requirements:
     * - newRelayer must not be zero address
     */
    function setRelayer(address newRelayer) external onlyOwner {
        if (newRelayer == address(0)) revert InvalidAddress();
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }

    /**
     * @notice Get the current relayer address
     * @return The address of the authorized relayer
     */
    function getRelayer() external view returns (address) {
        return relayer;
    }

    /**
     * @notice Pause the contract - emergency stop mechanism
     * @dev Only callable by contract owner
     * When paused, lockFunds, releaseFunds, and refund will revert
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @notice Unpause the contract - resume normal operations
     * @dev Only callable by contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
}
