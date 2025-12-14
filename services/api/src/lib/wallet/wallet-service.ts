/**
 * WalletService - Core AA wallet operations
 * Handles wallet creation, balance queries, and transaction history
 */

import { type Address, keccak256, toBytes } from "viem";
import { prisma } from "../prisma";
import { publicClient, getRelayerAccount } from "./chain-client";
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  USDC_ADDRESS,
  ERC20_ABI,
  fromUsdcUnits,
} from "./contracts";
import type { Wallet, WalletTransaction, TransactionStatus } from "@prisma/client";

export interface WalletInfo {
  address: string;
  isDeployed: boolean;
  chainId: number;
}

export interface WalletBalance {
  usdc: bigint;
  usdcFormatted: number;
  fiatValue: number; // USD equivalent (1:1 for USDC)
}

export interface TransactionPage {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Generate a deterministic salt (bytes32) from user ID
 * Used for CREATE2 address computation
 */
export function generateSalt(userId: string): `0x${string}` {
  return keccak256(toBytes(userId));
}

/**
 * Create a new AA wallet for a user
 * Uses counterfactual deployment - wallet address is computed, not deployed
 * Actual deployment happens on first UserOperation
 */
export async function createWallet(userId: string): Promise<WalletInfo> {
  // Check if wallet already exists
  const existing = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (existing) {
    return {
      address: existing.address,
      isDeployed: existing.isDeployed,
      chainId: existing.chainId,
    };
  }

  // Generate deterministic salt from user ID
  const salt = generateSalt(userId);

  // Get relayer account as owner (for MVP)
  // In production, this would be the user's embedded wallet or passkey
  const relayerAccount = getRelayerAccount();

  if (!FACTORY_ADDRESS) {
    throw new Error("FACTORY_ADDRESS environment variable not set");
  }

  // Compute counterfactual address via factory
  const counterfactualAddress = (await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAddress",
    args: [salt, relayerAccount.address],
  })) as Address;

  // Store wallet in database
  const wallet = await prisma.wallet.create({
    data: {
      userId,
      address: counterfactualAddress,
      salt,
      chainId: publicClient.chain?.id ?? 8453,
      isDeployed: false,
    },
  });

  return {
    address: wallet.address,
    isDeployed: wallet.isDeployed,
    chainId: wallet.chainId,
  };
}

/**
 * Get wallet info for a user
 */
export async function getWallet(userId: string): Promise<Wallet | null> {
  return prisma.wallet.findUnique({
    where: { userId },
  });
}

/**
 * Get wallet by address
 */
export async function getWalletByAddress(address: string): Promise<Wallet | null> {
  return prisma.wallet.findUnique({
    where: { address },
  });
}

/**
 * Get USDC balance for a wallet address
 */
export async function getBalance(address: string): Promise<WalletBalance> {
  const balance = (await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address as Address],
  })) as bigint;

  const formatted = fromUsdcUnits(balance);

  return {
    usdc: balance,
    usdcFormatted: formatted,
    fiatValue: formatted, // 1:1 for USDC to USD
  };
}

/**
 * Get paginated transaction history for a wallet
 */
export async function getTransactions(
  walletId: string,
  page: number = 1,
  limit: number = 20
): Promise<TransactionPage> {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({
      where: { walletId },
    }),
  ]);

  return {
    transactions,
    total,
    page,
    limit,
    hasMore: skip + transactions.length < total,
  };
}

/**
 * Update wallet deployment status
 * Called after first successful UserOperation deploys the wallet
 */
export async function markWalletDeployed(walletId: string): Promise<void> {
  await prisma.wallet.update({
    where: { id: walletId },
    data: { isDeployed: true },
  });
}

/**
 * Check if a wallet is deployed on-chain
 */
export async function checkWalletDeployed(address: string): Promise<boolean> {
  const code = await publicClient.getCode({ address: address as Address });
  return code !== undefined && code !== "0x";
}

/**
 * Record a transaction in the database
 */
export async function recordTransaction(
  walletId: string,
  type: WalletTransaction["type"],
  amount: bigint,
  options: {
    counterparty?: string;
    txHash?: string;
    userOpHash?: string;
    memo?: string;
    status?: TransactionStatus;
  } = {}
): Promise<WalletTransaction> {
  return prisma.walletTransaction.create({
    data: {
      walletId,
      type,
      amount,
      counterparty: options.counterparty,
      txHash: options.txHash,
      userOpHash: options.userOpHash,
      memo: options.memo,
      status: options.status ?? "PENDING",
    },
  });
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  txHash?: string
): Promise<WalletTransaction> {
  return prisma.walletTransaction.update({
    where: { id: transactionId },
    data: {
      status,
      txHash,
      confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
    },
  });
}

/**
 * Get wallet address for user (convenience method)
 */
export async function getWalletAddress(userId: string): Promise<string | null> {
  const wallet = await getWallet(userId);
  return wallet?.address ?? null;
}
