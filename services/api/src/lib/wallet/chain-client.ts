/**
 * Chain client setup for viem and ERC-4337
 * Provides configured clients for Base mainnet/testnet
 *
 * SECURITY AUDIT (V1.9.0):
 * - M-3: RPC failover transport for resilience
 * - M-5: Correlation ID propagation to external calls
 */

import { createPublicClient, createWalletClient, http, fallback, type Chain, type PublicClient, type WalletClient, type Transport } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, localhost } from "viem/chains";

// Environment variables
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "8453");
export const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
// M-3: Fallback RPC URL for resilience
const RPC_URL_FALLBACK = process.env.RPC_URL_FALLBACK || (
  CHAIN_ID === 84532 ? "https://base-sepolia.public.blastapi.io" :
  CHAIN_ID === 8453 ? "https://base.llamarpc.com" :
  undefined
);
const BUNDLER_URL = process.env.BUNDLER_URL || "";
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || "";

/**
 * Get the chain configuration based on chain ID
 */
export function getChain(): Chain {
  switch (CHAIN_ID) {
    case 8453:
      return base;
    case 84532:
      return baseSepolia;
    case 31337:
      return { ...localhost, id: 31337 };
    default:
      return base;
  }
}

/**
 * M-3: Create resilient transport with failover
 * Uses fallback pattern to automatically switch to backup RPC on failure
 */
function createResilientTransport(): Transport {
  if (RPC_URL_FALLBACK && !isLocalhost()) {
    return fallback([
      http(RPC_URL),
      http(RPC_URL_FALLBACK),
    ], {
      rank: true, // Automatically rank transports by latency
      retryCount: 2, // Retry failed requests
    });
  }
  // Single transport for localhost or when no fallback is configured
  return http(RPC_URL);
}

/**
 * Configured public client for reading chain state
 * M-3: Uses failover transport for resilience
 */
export const publicClient: PublicClient = createPublicClient({
  chain: getChain(),
  transport: createResilientTransport(),
});

/**
 * Get the relayer account for signing UserOperations
 * The relayer pays gas on behalf of users (sponsored by paymaster)
 */
export function getRelayerAccount() {
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error("RELAYER_PRIVATE_KEY environment variable not set");
  }
  return privateKeyToAccount(RELAYER_PRIVATE_KEY as `0x${string}`);
}

/**
 * Configured wallet client for the relayer
 * M-3: Uses resilient transport for failover
 */
export function getRelayerWalletClient(): WalletClient {
  const account = getRelayerAccount();
  return createWalletClient({
    account,
    chain: getChain(),
    transport: createResilientTransport(),
  });
}

/**
 * Get the bundler URL for submitting UserOperations
 */
export function getBundlerUrl(): string {
  if (!BUNDLER_URL) {
    throw new Error("BUNDLER_URL environment variable not set");
  }
  return BUNDLER_URL;
}

/**
 * Check if bundler is available
 */
export function hasBundler(): boolean {
  return !!BUNDLER_URL;
}

/**
 * Check if running on localhost
 */
export function isLocalhost(): boolean {
  return CHAIN_ID === 31337;
}

/**
 * Chain configuration export
 * M-3: Includes fallback RPC URL for documentation
 */
export const chainConfig = {
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
  rpcUrlFallback: RPC_URL_FALLBACK,
  bundlerUrl: BUNDLER_URL,
  chain: getChain(),
} as const;

/**
 * Export CHAIN for backward compatibility
 */
export const CHAIN = getChain();
