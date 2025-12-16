/**
 * Wagmi Configuration
 *
 * Configures wagmi for wallet interactions with Base and Arbitrum networks.
 * Supports testnet (Base Sepolia, Arbitrum Sepolia) and mainnet based on NETWORK_MODE.
 */

import { createConfig, http, type Config } from "wagmi";
import { baseSepolia, base, arbitrum, arbitrumSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import type { Address } from "viem";

// Network mode from environment
const NETWORK_MODE = process.env.NEXT_PUBLIC_NETWORK_MODE || "testnet";

// Chain selection: "base" | "base_sepolia" | "arbitrum" | "arbitrum_sepolia"
const CHAIN = process.env.NEXT_PUBLIC_CHAIN || "base_sepolia";

// RPC URLs - Base
const BASE_TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const BASE_MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || "https://mainnet.base.org";

// RPC URLs - Arbitrum (with Alchemy)
const ARB_TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL ||
  "https://arb-sepolia.g.alchemy.com/v2/zQHwv8tQDCiQOV9f6g_8E";
const ARB_MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_ARB_MAINNET_RPC_URL ||
  "https://arb-mainnet.g.alchemy.com/v2/zQHwv8tQDCiQOV9f6g_8E";

// Legacy alias for backwards compatibility
const TESTNET_RPC_URL = BASE_TESTNET_RPC_URL;
const MAINNET_RPC_URL = BASE_MAINNET_RPC_URL;

// WalletConnect Project ID (reserved for future use when SSR issues are resolved)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "9ac430b26fb8a47a8bc6a8065b81132c";

/**
 * Get chains based on network mode
 */
function getChains() {
  if (NETWORK_MODE === "mainnet") {
    return [base, arbitrum] as const;
  }
  return [baseSepolia, arbitrumSepolia] as const;
}

/**
 * Wagmi configuration
 *
 * Testnets:
 * - Base Sepolia (chainId: 84532) - Default
 * - Arbitrum Sepolia (chainId: 421614)
 *
 * Mainnets:
 * - Base (chainId: 8453)
 * - Arbitrum One (chainId: 42161)
 */
export const config: Config = createConfig({
  chains: getChains(),
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "Vlossom",
      appLogoUrl: "https://vlossom.com/logo.png",
    }),
    // WalletConnect temporarily disabled due to SSR issues with indexedDB
    // TODO: Re-enable with lazy loading on client-side only
  ],
  transports: {
    // Base networks
    [base.id]: http(BASE_MAINNET_RPC_URL),
    [baseSepolia.id]: http(BASE_TESTNET_RPC_URL),
    // Arbitrum networks
    [arbitrum.id]: http(ARB_MAINNET_RPC_URL),
    [arbitrumSepolia.id]: http(ARB_TESTNET_RPC_URL),
  },
  ssr: true, // Enable SSR support for Next.js
});

// =============================================================================
// Contract Addresses by Chain
// =============================================================================

// Base Sepolia (Testnet) - DEPLOYED Dec 13, 2025
const BASE_SEPOLIA_CONTRACTS = {
  VlossomAccountFactory: "0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d" as Address,
  VlossomPaymaster: "0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D" as Address,
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, // Circle USDC on Base Sepolia
  Escrow: "0x925E12051A6badb09D5a8a67aF9dD40ec5725E04" as Address,
  EntryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address, // ERC-4337 v0.7
} as const;

// Arbitrum Sepolia (Testnet) - NOT YET DEPLOYED
const ARB_SEPOLIA_CONTRACTS = {
  VlossomAccountFactory: "0x0000000000000000000000000000000000000000" as Address,
  VlossomPaymaster: "0x0000000000000000000000000000000000000000" as Address,
  USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address, // Official USDC on Arb Sepolia
  Escrow: "0x0000000000000000000000000000000000000000" as Address,
  EntryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address, // ERC-4337 v0.7
} as const;

// Base Mainnet
const BASE_MAINNET_CONTRACTS = {
  VlossomAccountFactory:
    (process.env.NEXT_PUBLIC_BASE_FACTORY_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000",
  VlossomPaymaster:
    (process.env.NEXT_PUBLIC_BASE_PAYMASTER_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // Real USDC on Base
  Escrow:
    (process.env.NEXT_PUBLIC_BASE_ESCROW_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000",
  EntryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address,
} as const;

// Arbitrum Mainnet
const ARB_MAINNET_CONTRACTS = {
  VlossomAccountFactory:
    (process.env.NEXT_PUBLIC_ARB_FACTORY_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000",
  VlossomPaymaster:
    (process.env.NEXT_PUBLIC_ARB_PAYMASTER_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000",
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address, // Native USDC on Arbitrum
  Escrow:
    (process.env.NEXT_PUBLIC_ARB_ESCROW_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000",
  EntryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address,
} as const;

// Legacy aliases for backwards compatibility
const TESTNET_CONTRACTS = BASE_SEPOLIA_CONTRACTS;
const MAINNET_CONTRACTS = BASE_MAINNET_CONTRACTS;

/**
 * Get contract addresses based on chain selection
 */
function getContractsForChain() {
  switch (CHAIN) {
    case "base":
      return BASE_MAINNET_CONTRACTS;
    case "base_sepolia":
      return BASE_SEPOLIA_CONTRACTS;
    case "arbitrum":
      return ARB_MAINNET_CONTRACTS;
    case "arbitrum_sepolia":
      return ARB_SEPOLIA_CONTRACTS;
    default:
      return NETWORK_MODE === "mainnet" ? BASE_MAINNET_CONTRACTS : BASE_SEPOLIA_CONTRACTS;
  }
}

export const CONTRACTS = getContractsForChain();

// Legacy export for backwards compatibility
export const BASE_SEPOLIA_RPC = TESTNET_RPC_URL;

// =============================================================================
// Chain Configuration Helpers
// =============================================================================

/**
 * Get chain configuration based on current selection
 */
function getChainConfig() {
  switch (CHAIN) {
    case "base":
      return {
        chainId: base.id,
        chainName: base.name,
        rpcUrl: BASE_MAINNET_RPC_URL,
        blockExplorer: "https://basescan.org",
        nativeCurrency: base.nativeCurrency,
        isArbitrum: false,
      };
    case "base_sepolia":
      return {
        chainId: baseSepolia.id,
        chainName: baseSepolia.name,
        rpcUrl: BASE_TESTNET_RPC_URL,
        blockExplorer: "https://sepolia.basescan.org",
        nativeCurrency: baseSepolia.nativeCurrency,
        isArbitrum: false,
      };
    case "arbitrum":
      return {
        chainId: arbitrum.id,
        chainName: arbitrum.name,
        rpcUrl: ARB_MAINNET_RPC_URL,
        blockExplorer: "https://arbiscan.io",
        nativeCurrency: arbitrum.nativeCurrency,
        isArbitrum: true,
      };
    case "arbitrum_sepolia":
      return {
        chainId: arbitrumSepolia.id,
        chainName: arbitrumSepolia.name,
        rpcUrl: ARB_TESTNET_RPC_URL,
        blockExplorer: "https://sepolia.arbiscan.io",
        nativeCurrency: arbitrumSepolia.nativeCurrency,
        isArbitrum: true,
      };
    default:
      // Default to Base Sepolia
      return {
        chainId: baseSepolia.id,
        chainName: baseSepolia.name,
        rpcUrl: BASE_TESTNET_RPC_URL,
        blockExplorer: "https://sepolia.basescan.org",
        nativeCurrency: baseSepolia.nativeCurrency,
        isArbitrum: false,
      };
  }
}

export const CHAIN_CONFIG = getChainConfig();

/**
 * Get current chain object
 */
export function getCurrentChain() {
  switch (CHAIN) {
    case "base":
      return base;
    case "base_sepolia":
      return baseSepolia;
    case "arbitrum":
      return arbitrum;
    case "arbitrum_sepolia":
      return arbitrumSepolia;
    default:
      return NETWORK_MODE === "mainnet" ? base : baseSepolia;
  }
}

/**
 * Get current chain name
 */
export function getCurrentChainName(): string {
  return CHAIN;
}

/**
 * Get current network mode
 */
export function getNetworkMode(): "testnet" | "mainnet" {
  return NETWORK_MODE as "testnet" | "mainnet";
}

/**
 * Check if we're on testnet
 */
export function isTestnet(): boolean {
  return NETWORK_MODE !== "mainnet";
}

/**
 * Check if we're on Arbitrum
 */
export function isArbitrum(): boolean {
  return CHAIN === "arbitrum" || CHAIN === "arbitrum_sepolia";
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${CHAIN_CONFIG.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  return `${CHAIN_CONFIG.blockExplorer}/address/${address}`;
}

/**
 * Get all supported chains
 */
export function getSupportedChains() {
  return {
    testnets: [
      { id: "base_sepolia", name: "Base Sepolia", chainId: baseSepolia.id },
      { id: "arbitrum_sepolia", name: "Arbitrum Sepolia", chainId: arbitrumSepolia.id },
    ],
    mainnets: [
      { id: "base", name: "Base", chainId: base.id },
      { id: "arbitrum", name: "Arbitrum One", chainId: arbitrum.id },
    ],
  };
}
