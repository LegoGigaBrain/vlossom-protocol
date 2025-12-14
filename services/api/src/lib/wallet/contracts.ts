/**
 * Contract ABIs and addresses for Vlossom AA Wallet
 */

import { type Address } from "viem";

// Contract addresses from environment (deployed addresses)
export const ENTRY_POINT_ADDRESS = (process.env.ENTRY_POINT_ADDRESS ||
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032") as Address; // v0.7 canonical
export const FACTORY_ADDRESS = (process.env.FACTORY_ADDRESS || "") as Address;
export const PAYMASTER_ADDRESS = (process.env.PAYMASTER_ADDRESS || "") as Address;
export const USDC_ADDRESS = (process.env.USDC_ADDRESS ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as Address; // Base mainnet USDC

/**
 * VlossomAccountFactory ABI (minimal for SDK operations)
 */
export const FACTORY_ABI = [
  {
    type: "function",
    name: "createAccount",
    inputs: [
      { name: "userId", type: "bytes32" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "account", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAddress",
    inputs: [
      { name: "userId", type: "bytes32" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accountOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AccountCreated",
    inputs: [
      { name: "userId", type: "bytes32", indexed: true },
      { name: "account", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
    ],
  },
] as const;

/**
 * VlossomAccount ABI (minimal for SDK operations)
 */
export const ACCOUNT_ABI = [
  {
    type: "function",
    name: "execute",
    inputs: [
      { name: "dest", type: "address" },
      { name: "value", type: "uint256" },
      { name: "func", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeBatch",
    inputs: [
      { name: "dest", type: "address[]" },
      { name: "value", type: "uint256[]" },
      { name: "func", type: "bytes[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "entryPoint",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNonce",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addGuardian",
    inputs: [{ name: "guardian", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeGuardian",
    inputs: [{ name: "guardian", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isGuardian",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGuardianCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * ERC-20 (USDC) ABI for token operations
 */
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * VlossomPaymaster ABI (minimal for SDK operations)
 */
export const PAYMASTER_ABI = [
  {
    type: "function",
    name: "isWhitelisted",
    inputs: [{ name: "target", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOperationCount",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRateLimitSettings",
    inputs: [],
    outputs: [
      { type: "uint256" },
      { type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

/**
 * USDC decimals (6 for USDC on all chains)
 */
export const USDC_DECIMALS = 6;

/**
 * Convert USDC amount to smallest unit (6 decimals)
 */
export function toUsdcUnits(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));
}

/**
 * Convert USDC smallest unit to decimal amount
 */
export function fromUsdcUnits(units: bigint): number {
  return Number(units) / 10 ** USDC_DECIMALS;
}
