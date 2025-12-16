/**
 * Wallet Module
 *
 * Wallet and payment functions for Vlossom SDK.
 */

import { VlossomClient } from './client';

export interface WalletInfo {
  id: string;
  address: string;
  chainId: number;
  isDeployed: boolean;
  balance: {
    usdc: string;
    usdcFormatted: string;
    fiatValue: number;
  };
}

export interface WalletBalance {
  usdc: string;
  usdcFormatted: string;
  fiatValue: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'SEND' | 'RECEIVE' | 'ESCROW_DEPOSIT' | 'ESCROW_RELEASE' | 'ESCROW_REFUND' | 'FAUCET';
  amount: string;
  amountFormatted: string;
  token: string;
  counterparty: string | null;
  txHash: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  memo: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface TransferParams {
  toAddress: string;
  amount: string;
  memo?: string;
}

export interface TransferResult {
  success: boolean;
  transactionId: string;
  userOpHash?: string;
  txHash?: string;
}

export interface WalletModule {
  /** Get wallet info and balance */
  getWallet(): Promise<WalletInfo>;
  /** Get current balance */
  getBalance(): Promise<WalletBalance>;
  /** Get wallet address */
  getAddress(): Promise<{ address: string; isDeployed: boolean; chainId: number }>;
  /** Get transaction history */
  getTransactions(page?: number, limit?: number): Promise<{
    transactions: Transaction[];
    pagination: { total: number; page: number; limit: number; hasMore: boolean };
  }>;
  /** Send USDC to another address */
  transfer(params: TransferParams): Promise<TransferResult>;
  /** Claim testnet tokens from faucet */
  claimFaucet(): Promise<{ success: boolean; txHash: string; amount: string }>;
}

/**
 * Create wallet module bound to a client instance
 */
export function createWalletModule(client: VlossomClient): WalletModule {
  return {
    async getWallet() {
      const response = await client.get<WalletInfo>('/wallet');
      return response.data;
    },

    async getBalance() {
      const response = await client.get<WalletBalance>('/wallet/balance');
      return response.data;
    },

    async getAddress() {
      const response = await client.get<{ address: string; isDeployed: boolean; chainId: number }>('/wallet/address');
      return response.data;
    },

    async getTransactions(page = 1, limit = 20) {
      const response = await client.get<{
        transactions: Transaction[];
        pagination: { total: number; page: number; limit: number; hasMore: boolean };
      }>(`/wallet/transactions?page=${page}&limit=${limit}`);
      return response.data;
    },

    async transfer(params: TransferParams) {
      const response = await client.post<TransferResult>('/wallet/transfer', params);
      return response.data;
    },

    async claimFaucet() {
      const response = await client.post<{ success: boolean; txHash: string; amount: string }>('/wallet/faucet');
      return response.data;
    },
  };
}
