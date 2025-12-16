/**
 * Escrow Contract ABI
 *
 * Minimal ABI for frontend interactions with the Vlossom Escrow contract.
 * Full contract: contracts/contracts/core/Escrow.sol
 */

export const ESCROW_ABI = [
  // lockFunds - Customer locks USDC into escrow
  {
    type: "function",
    name: "lockFunds",
    inputs: [
      { name: "bookingId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // releaseFunds - Relayer releases funds to stylist (called by backend)
  {
    type: "function",
    name: "releaseFunds",
    inputs: [
      { name: "bookingId", type: "bytes32" },
      { name: "stylist", type: "address" },
      { name: "stylistAmount", type: "uint256" },
      { name: "treasury", type: "address" },
      { name: "platformFeeAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // refund - Relayer refunds customer (called by backend)
  {
    type: "function",
    name: "refund",
    inputs: [
      { name: "bookingId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // getEscrowBalance - Read locked balance
  {
    type: "function",
    name: "getEscrowBalance",
    inputs: [{ name: "bookingId", type: "bytes32" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // getEscrowRecord - Get full escrow record
  {
    type: "function",
    name: "getEscrowRecord",
    inputs: [{ name: "bookingId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "customer", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "FundsLocked",
    inputs: [
      { name: "bookingId", type: "bytes32", indexed: true },
      { name: "customer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      { name: "bookingId", type: "bytes32", indexed: true },
      { name: "stylist", type: "address", indexed: true },
      { name: "stylistAmount", type: "uint256", indexed: false },
      { name: "platformFeeAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "FundsRefunded",
    inputs: [
      { name: "bookingId", type: "bytes32", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * Escrow status enum (matches Solidity contract)
 */
export enum EscrowStatus {
  None = 0,
  Locked = 1,
  Released = 2,
  Refunded = 3,
}

/**
 * Escrow record structure
 */
export interface EscrowRecord {
  customer: `0x${string}`;
  amount: bigint;
  status: EscrowStatus;
}
