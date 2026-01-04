/**
 * Wallet API Client
 * Handles wallet balance, transactions, and operations
 *
 * V8.0.0 Security Update: Migrated from Bearer tokens to httpOnly cookies
 */

import { authFetch } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export interface WalletBalance {
  usdc: string;
  usdcFormatted: number;
  fiatValue: number;
}

export interface WalletTransaction {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER_IN" | "TRANSFER_OUT" | "ESCROW_LOCK" | "ESCROW_RELEASE" | "ESCROW_REFUND" | "FAUCET_CLAIM";
  amount: string;
  counterparty: string | null;
  txHash: string | null;
  userOpHash: string | null;
  memo: string | null;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  createdAt: string;
  confirmedAt: string | null;
}

export interface WalletInfo {
  id: string;
  address: string;
  chainId: number;
  isDeployed: boolean;
  balance: WalletBalance;
}

export interface TransactionPage {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Get wallet info for authenticated user
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function getWallet(): Promise<WalletInfo> {
  const response = await authFetch(`${API_URL}/api/v1/wallet`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch wallet");
  }

  return response.json();
}

/**
 * Get wallet transaction history
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function getTransactions(
  page: number = 1,
  limit: number = 20
): Promise<TransactionPage> {
  const response = await authFetch(
    `${API_URL}/api/v1/wallet/transactions?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch transactions");
  }

  return response.json();
}

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format currency with symbol
 */
export function formatCurrency(
  amount: number,
  currency: "ZAR" | "USD" | "USDC"
): string {
  switch (currency) {
    case "ZAR":
      return `R${formatUSDC(amount * 18.5)}`; // 1 USD = ~18.5 ZAR
    case "USD":
      return `$${formatUSDC(amount)}`;
    case "USDC":
      return `${formatUSDC(amount)} USDC`;
  }
}

/**
 * Claim testnet USDC from faucet (rate-limited to 1 claim per 24 hours)
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function claimFaucet(): Promise<{
  success: boolean;
  txHash?: string;
  amount?: string;
  amountFormatted?: string;
  message?: string;
  error?: string;
  nextClaimAt?: string;
}> {
  const response = await authFetch(`${API_URL}/api/v1/wallet/faucet`, {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || "Failed to claim faucet",
      nextClaimAt: data.error?.nextClaimAt,
    };
  }

  return {
    success: true,
    txHash: data.txHash,
    amount: data.amount,
    amountFormatted: data.amountFormatted,
    message: data.message,
  };
}

/**
 * Send USDC to another wallet address (P2P transfer)
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function sendP2P(
  toAddress: string,
  amount: string, // Raw USDC units (6 decimals)
  memo?: string
): Promise<{
  success: boolean;
  transactionId?: string;
  userOpHash?: string;
  txHash?: string;
  error?: string;
}> {
  const response = await authFetch(`${API_URL}/api/v1/wallet/transfer`, {
    method: "POST",
    body: JSON.stringify({ toAddress, amount, memo }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || "Failed to send transfer",
    };
  }

  return {
    success: true,
    transactionId: data.transactionId,
    userOpHash: data.userOpHash,
    txHash: data.txHash,
  };
}

/**
 * Convert fiat/USDC amount to raw USDC units (6 decimals)
 */
export function toUsdcUnits(
  amount: number,
  currency: "ZAR" | "USD" | "USDC"
): bigint {
  let usdAmount = amount;

  if (currency === "ZAR") {
    usdAmount = amount / 18.5; // 1 USD = 18.5 ZAR
  }
  // USD and USDC are 1:1

  // Convert to 6 decimal places for USDC
  const units = Math.floor(usdAmount * 1_000_000);
  return BigInt(units);
}

/**
 * Convert raw USDC units to human-readable amount
 */
export function fromUsdcUnits(units: bigint): number {
  return Number(units) / 1_000_000;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate address for display (0x1234...5678)
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
