/**
 * Wallet Store (V6.8.0)
 *
 * Zustand store for managing wallet state.
 * Handles balance, transactions, fund/withdraw, and P2P transfers.
 */

import { create } from 'zustand';
import {
  getWallet,
  getBalance,
  getTransactions,
  sendTransfer,
  createPaymentRequest as createPaymentRequestAPI,
  initiateOnramp,
  initiateOfframp,
  getFiatConfig,
  getExchangeRate,
  claimFaucet as claimFaucetAPI,
  type WalletInfo,
  type WalletBalance,
  type Transaction,
  type FiatConfig,
  type ExchangeRate,
  type OnrampRequest,
  type OnrampResponse,
  type OfframpRequest,
  type OfframpResponse,
  type TransferRequest,
  type CreatePaymentRequestResponse,
} from '../api/wallet';

// ============================================================================
// Types
// ============================================================================

interface WalletState {
  // Wallet info
  wallet: WalletInfo | null;
  balance: WalletBalance | null;
  walletLoading: boolean;
  walletError: string | null;

  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  hasMoreTransactions: boolean;
  transactionPage: number;

  // Fiat config
  fiatConfig: FiatConfig | null;
  exchangeRate: ExchangeRate | null;

  // Operation states
  sendLoading: boolean;
  sendError: string | null;
  fundLoading: boolean;
  fundError: string | null;
  withdrawLoading: boolean;
  withdrawError: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  fetchTransactions: (refresh?: boolean) => Promise<void>;
  fetchFiatConfig: () => Promise<void>;
  fetchExchangeRate: (amount?: number, type?: 'buy' | 'sell') => Promise<void>;
  send: (request: TransferRequest) => Promise<boolean>;
  fund: (request: OnrampRequest) => Promise<OnrampResponse | null>;
  withdraw: (request: OfframpRequest) => Promise<OfframpResponse | null>;
  createPaymentRequest: (amount: string, memo?: string) => Promise<CreatePaymentRequestResponse | null>;
  claimFaucet: () => Promise<boolean>;
  clearErrors: () => void;
  clearFundError: () => void;
  clearWithdrawError: () => void;
  clearSendError: () => void;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  wallet: null,
  balance: null,
  walletLoading: false,
  walletError: null,

  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  hasMoreTransactions: false,
  transactionPage: 1,

  fiatConfig: null,
  exchangeRate: null,

  sendLoading: false,
  sendError: null,
  fundLoading: false,
  fundError: null,
  withdrawLoading: false,
  withdrawError: null,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initialState,

  /**
   * Fetch wallet info including balance
   */
  fetchWallet: async () => {
    set({ walletLoading: true, walletError: null });

    try {
      const wallet = await getWallet();
      set({
        wallet,
        balance: wallet.balance as WalletBalance,
        walletLoading: false,
      });
    } catch (error) {
      set({
        walletLoading: false,
        walletError: error instanceof Error ? error.message : 'Failed to fetch wallet',
      });
    }
  },

  /**
   * Fetch balance only (lightweight refresh)
   */
  fetchBalance: async () => {
    try {
      const balance = await getBalance();
      set({ balance });
    } catch (error) {
      console.warn('Failed to refresh balance:', error);
    }
  },

  /**
   * Fetch transaction history
   */
  fetchTransactions: async (refresh = false) => {
    const state = get();
    if (state.transactionsLoading) return;

    const page = refresh ? 1 : state.transactionPage;
    set({ transactionsLoading: true, transactionsError: null });

    try {
      const response = await getTransactions({ page, limit: 20 });

      set({
        transactions: refresh
          ? response.transactions
          : [...state.transactions, ...response.transactions],
        hasMoreTransactions: response.pagination.hasMore,
        transactionPage: page + 1,
        transactionsLoading: false,
      });
    } catch (error) {
      set({
        transactionsLoading: false,
        transactionsError: error instanceof Error ? error.message : 'Failed to fetch transactions',
      });
    }
  },

  /**
   * Fetch fiat configuration (limits, fees, banks)
   */
  fetchFiatConfig: async () => {
    try {
      const config = await getFiatConfig();
      set({ fiatConfig: config });
    } catch (error) {
      console.warn('Failed to fetch fiat config:', error);
    }
  },

  /**
   * Fetch current exchange rate
   */
  fetchExchangeRate: async (amount = 100, type: 'buy' | 'sell' = 'buy') => {
    try {
      const rate = await getExchangeRate({ amount, type });
      set({ exchangeRate: rate });
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
    }
  },

  /**
   * Send P2P transfer
   */
  send: async (request: TransferRequest) => {
    set({ sendLoading: true, sendError: null });

    try {
      await sendTransfer(request);

      // Refresh balance and transactions after send
      get().fetchBalance();
      get().fetchTransactions(true);

      set({ sendLoading: false });
      return true;
    } catch (error) {
      let errorMessage = 'Failed to send payment';

      if (error instanceof Error) {
        if (error.message.includes('INSUFFICIENT_BALANCE')) {
          errorMessage = 'Insufficient balance';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        sendLoading: false,
        sendError: errorMessage,
      });
      return false;
    }
  },

  /**
   * Fund wallet via Kotani Pay (ZAR → USDC)
   */
  fund: async (request: OnrampRequest) => {
    set({ fundLoading: true, fundError: null });

    try {
      const response = await initiateOnramp(request);

      if (!response.success) {
        set({
          fundLoading: false,
          fundError: 'Failed to initiate deposit',
        });
        return null;
      }

      set({ fundLoading: false });
      return response;
    } catch (error) {
      let errorMessage = 'Failed to initiate deposit';

      if (error instanceof Error) {
        if (error.message.includes('MIN_AMOUNT')) {
          errorMessage = 'Amount is below minimum';
        } else if (error.message.includes('MAX_AMOUNT')) {
          errorMessage = 'Amount exceeds maximum';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        fundLoading: false,
        fundError: errorMessage,
      });
      return null;
    }
  },

  /**
   * Withdraw via Kotani Pay (USDC → ZAR)
   */
  withdraw: async (request: OfframpRequest) => {
    set({ withdrawLoading: true, withdrawError: null });

    try {
      const response = await initiateOfframp(request);

      if (!response.success) {
        set({
          withdrawLoading: false,
          withdrawError: 'Failed to initiate withdrawal',
        });
        return null;
      }

      // Refresh balance after withdrawal initiated
      get().fetchBalance();

      set({ withdrawLoading: false });
      return response;
    } catch (error) {
      let errorMessage = 'Failed to initiate withdrawal';

      if (error instanceof Error) {
        if (error.message.includes('MIN_AMOUNT')) {
          errorMessage = 'Amount is below minimum ($5)';
        } else if (error.message.includes('MAX_AMOUNT')) {
          errorMessage = 'Amount exceeds maximum ($5,000)';
        } else if (error.message.includes('INSUFFICIENT_BALANCE')) {
          errorMessage = 'Insufficient balance';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        withdrawLoading: false,
        withdrawError: errorMessage,
      });
      return null;
    }
  },

  /**
   * Create payment request for receiving
   */
  createPaymentRequest: async (amount: string, memo?: string) => {
    try {
      const response = await createPaymentRequestAPI({ amount, memo });
      return response;
    } catch (error) {
      console.error('Failed to create payment request:', error);
      return null;
    }
  },

  /**
   * Claim testnet USDC from faucet
   */
  claimFaucet: async () => {
    try {
      await claimFaucetAPI();

      // Refresh balance after claiming
      get().fetchBalance();

      return true;
    } catch (error) {
      console.error('Failed to claim faucet:', error);
      return false;
    }
  },

  /**
   * Clear all error states
   */
  clearErrors: () => {
    set({
      walletError: null,
      transactionsError: null,
      sendError: null,
      fundError: null,
      withdrawError: null,
    });
  },

  /**
   * Clear fund error only
   */
  clearFundError: () => {
    set({ fundError: null });
  },

  /**
   * Clear withdraw error only
   */
  clearWithdrawError: () => {
    set({ withdrawError: null });
  },

  /**
   * Clear send error only
   */
  clearSendError: () => {
    set({ sendError: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectBalance = (state: WalletState) => state.balance;
export const selectWallet = (state: WalletState) => state.wallet;
export const selectTransactions = (state: WalletState) => state.transactions;
export const selectFiatConfig = (state: WalletState) => state.fiatConfig;
