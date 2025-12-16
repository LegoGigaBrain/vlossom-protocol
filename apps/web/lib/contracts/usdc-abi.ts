/**
 * USDC (ERC20) Contract ABI
 *
 * Minimal ABI for frontend interactions with USDC token.
 * Only includes functions needed for escrow payment flow.
 */

export const USDC_ABI = [
  // approve - Allow escrow contract to spend USDC
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
  // allowance - Check current allowance
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
  // balanceOf - Get token balance
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // transfer - Direct token transfer
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
  // decimals - Token decimals (USDC = 6)
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
  },
  // symbol - Token symbol
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
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
 * USDC has 6 decimals
 */
export const USDC_DECIMALS = 6;

/**
 * Convert USD cents to USDC smallest unit (6 decimals)
 * Example: 1000 cents ($10.00) -> 10_000_000 (10 USDC with 6 decimals)
 */
export function centsToUsdcUnits(cents: number): bigint {
  // cents / 100 = dollars, then * 10^6 for USDC decimals
  // Simplified: cents * 10^4
  return BigInt(cents) * BigInt(10_000);
}

/**
 * Convert USDC smallest unit to USD cents
 * Example: 10_000_000 -> 1000 cents ($10.00)
 */
export function usdcUnitsToCents(units: bigint): number {
  return Number(units / BigInt(10_000));
}

/**
 * Format USDC amount for display (from smallest unit)
 * Example: 10_000_000 -> "10.00"
 */
export function formatUsdcAmount(units: bigint): string {
  const dollars = Number(units) / 10 ** USDC_DECIMALS;
  return dollars.toFixed(2);
}
