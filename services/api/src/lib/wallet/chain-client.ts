/**
 * Chain client setup for viem and ERC-4337
 * Provides configured clients for Base mainnet/testnet
 */

import { createPublicClient, createWalletClient, http, type Chain, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, localhost } from "viem/chains";

// Environment variables
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "8453");
export const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
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
 * Configured public client for reading chain state
 */
export const publicClient: PublicClient = createPublicClient({
  chain: getChain(),
  transport: http(RPC_URL),
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
 */
export function getRelayerWalletClient(): WalletClient {
  const account = getRelayerAccount();
  return createWalletClient({
    account,
    chain: getChain(),
    transport: http(RPC_URL),
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
 */
export const chainConfig = {
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
  bundlerUrl: BUNDLER_URL,
  chain: getChain(),
} as const;

/**
 * Export CHAIN for backward compatibility
 */
export const CHAIN = getChain();
