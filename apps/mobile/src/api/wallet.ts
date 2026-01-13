/**
 * Wallet API Client (V6.8.0)
 *
 * Wallet endpoints: balance, transactions, P2P transfers.
 * Fiat endpoints: Kotani Pay onramp/offramp.
 */

import { apiRequest, APIError } from './client';

// ============================================================================
// Types - Core Wallet
// ============================================================================

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
  /** Fiat equivalent in ZAR */
  zar?: string;
}

export interface Transaction {
  id: string;
  type: 'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';
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

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface TransferRequest {
  toAddress: string;
  amount: string;
  memo?: string;
}

export interface TransferResponse {
  success: boolean;
  transactionId: string;
  userOpHash?: string;
  txHash?: string;
}

export interface PaymentRequest {
  id: string;
  amount: string;
  amountFormatted: string;
  memo: string | null;
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export interface CreatePaymentRequestResponse {
  requestId: string;
  /** Alias for requestId */
  id?: string;
  recipientAddress: string;
  amount: string;
  amountFormatted: string;
  memo: string | null;
  expiresAt: string;
  qrData: string;
  /** QR code image URL */
  qrCodeUrl?: string;
  /** Deep link for mobile payment apps */
  deepLink?: string;
}

// ============================================================================
// Types - Fiat (Kotani Pay)
// ============================================================================

export interface FiatConfig {
  mode: 'sandbox' | 'production';
  supportedCurrencies: string[];
  defaultCurrency: string;
  paymentChannels: string[];
  limits: {
    minOnramp: number;
    maxOnramp: number;
    minOfframp: number;
    maxOfframp: number;
  };
  banks: Bank[];
  fees: {
    onrampPercent: number;
    offrampPercent: number;
    networkFee: number;
  };
}

export interface Bank {
  code: string;
  name: string;
}

export interface ExchangeRate {
  fiatCurrency: string;
  cryptoCurrency: string;
  buyRate: number;
  sellRate: number;
  fiatAmount: number;
  cryptoAmount: number;
  fees: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
    feePercentage: number;
  };
  validUntil: string;
  mode: 'sandbox' | 'production';
}

export interface OnrampRequest {
  /** Amount in fiat currency */
  fiatAmount?: number;
  /** Alias for fiatAmount (for wallet store compatibility) */
  amount?: number;
  /** Currency code (e.g., ZAR) */
  fiatCurrency?: string;
  /** Alias for fiatCurrency */
  currency?: string;
  /** Payment channel */
  paymentChannel?: 'bank_transfer' | 'mobile_money' | 'ussd';
  /** Alias for paymentChannel */
  paymentMethod?: 'bank_transfer' | 'mobile_money' | 'ussd' | 'card';
  phoneNumber?: string;
}

export interface OnrampResponse {
  success: boolean;
  transactionId: string;
  paymentReference: string;
  /** Alias for paymentReference (for wallet store compatibility) */
  reference?: string;
  paymentUrl?: string;
  paymentInstructions?: string;
  estimatedCryptoAmount: number;
  exchangeRate: number;
  fees: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
  };
  expiresAt: string;
  mode: 'sandbox' | 'production';
}

export interface OfframpRequest {
  /** Amount in crypto */
  cryptoAmount?: number;
  /** Alias for cryptoAmount */
  amount?: number;
  fiatCurrency?: string;
  /** Alias for fiatCurrency */
  currency?: string;
  paymentChannel?: 'bank_transfer' | 'mobile_money';
  /** Alias for paymentChannel */
  paymentMethod?: 'bank_transfer' | 'mobile_money';
  phoneNumber?: string;
  bankAccount?: string;
  /** Alias for bankAccount */
  accountNumber?: string;
  bankCode?: string;
  accountName?: string;
}

export interface OfframpResponse {
  success: boolean;
  transactionId: string;
  /** Alias for transactionId */
  reference?: string;
  estimatedFiatAmount: number;
  exchangeRate: number;
  fees: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
  };
  processingTime: string;
  mode: 'sandbox' | 'production';
}

export interface FiatTransaction {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'onramp' | 'offramp';
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  walletAddress: string;
  exchangeRate: number;
  fees: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
  };
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Core Wallet API Functions
// ============================================================================

/**
 * Get wallet info including balance
 */
export async function getWallet(): Promise<WalletInfo> {
  return apiRequest<WalletInfo>('/api/v1/wallet', { method: 'GET' });
}

/**
 * Get wallet balance only
 */
export async function getBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/api/v1/wallet/balance', { method: 'GET' });
}

/**
 * Get transaction history
 */
export async function getTransactions(options?: {
  page?: number;
  limit?: number;
}): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());

  const queryString = params.toString();
  const url = queryString ? `/api/v1/wallet/transactions?${queryString}` : '/api/v1/wallet/transactions';

  return apiRequest<TransactionsResponse>(url, { method: 'GET' });
}

/**
 * Send P2P USDC transfer
 */
export async function sendTransfer(request: TransferRequest): Promise<TransferResponse> {
  return apiRequest<TransferResponse>('/api/v1/wallet/transfer', {
    method: 'POST',
    body: request,
  });
}

/**
 * Create a payment request (for receiving via QR)
 */
export async function createPaymentRequest(options: {
  amount: string;
  memo?: string;
  expiresInMinutes?: number;
}): Promise<CreatePaymentRequestResponse> {
  return apiRequest<CreatePaymentRequestResponse>('/api/v1/wallet/request', {
    method: 'POST',
    body: options,
  });
}

/**
 * Get payment request details
 */
export async function getPaymentRequest(requestId: string): Promise<PaymentRequest> {
  return apiRequest<PaymentRequest>(`/api/v1/wallet/request/${requestId}`, {
    method: 'GET',
  });
}

/**
 * Pay a payment request
 */
export async function payPaymentRequest(requestId: string): Promise<TransferResponse> {
  return apiRequest<TransferResponse>(`/api/v1/wallet/request/${requestId}/pay`, {
    method: 'POST',
  });
}

/**
 * Get pending payment requests
 */
export async function getPendingPaymentRequests(): Promise<{ requests: PaymentRequest[] }> {
  return apiRequest<{ requests: PaymentRequest[] }>('/api/v1/wallet/requests', {
    method: 'GET',
  });
}

/**
 * Claim testnet USDC from faucet
 */
export async function claimFaucet(): Promise<{
  success: boolean;
  txHash: string;
  amount: string;
  amountFormatted: string;
  message: string;
}> {
  return apiRequest('/api/v1/wallet/faucet', { method: 'POST' });
}

// ============================================================================
// Fiat API Functions (Kotani Pay)
// ============================================================================

/**
 * Get fiat configuration (limits, banks, fees)
 */
export async function getFiatConfig(): Promise<FiatConfig> {
  return apiRequest<FiatConfig>('/api/v1/fiat/config', { method: 'GET' });
}

/**
 * Get exchange rate for ZAR ↔ USDC
 */
export async function getExchangeRate(options: {
  currency?: string;
  amount: number;
  type: 'buy' | 'sell';
}): Promise<ExchangeRate> {
  const params = new URLSearchParams({
    currency: options.currency || 'ZAR',
    amount: options.amount.toString(),
    type: options.type,
  });

  return apiRequest<ExchangeRate>(`/api/v1/fiat/rates?${params}`, { method: 'GET' });
}

/**
 * Get list of supported banks
 */
export async function getBanks(country: string = 'ZA'): Promise<{ banks: Bank[] }> {
  return apiRequest<{ banks: Bank[] }>(`/api/v1/fiat/banks?country=${country}`, { method: 'GET' });
}

/**
 * Initiate onramp (Fund wallet: ZAR → USDC)
 */
export async function initiateOnramp(request: OnrampRequest): Promise<OnrampResponse> {
  return apiRequest<OnrampResponse>('/api/v1/fiat/onramp/initiate', {
    method: 'POST',
    body: {
      fiatAmount: request.fiatAmount,
      fiatCurrency: request.fiatCurrency || 'ZAR',
      paymentChannel: request.paymentChannel || 'bank_transfer',
      phoneNumber: request.phoneNumber,
    },
  });
}

/**
 * Initiate offramp (Withdraw: USDC → ZAR)
 */
export async function initiateOfframp(request: OfframpRequest): Promise<OfframpResponse> {
  return apiRequest<OfframpResponse>('/api/v1/fiat/offramp/initiate', {
    method: 'POST',
    body: {
      cryptoAmount: request.cryptoAmount,
      fiatCurrency: request.fiatCurrency || 'ZAR',
      paymentChannel: request.paymentChannel || 'bank_transfer',
      phoneNumber: request.phoneNumber,
      bankAccount: request.bankAccount,
      bankCode: request.bankCode,
      accountName: request.accountName,
    },
  });
}

/**
 * Get fiat transaction status
 */
export async function getFiatTransactionStatus(transactionId: string): Promise<FiatTransaction> {
  return apiRequest<FiatTransaction>(`/api/v1/fiat/transactions/${transactionId}`, { method: 'GET' });
}

/**
 * Get fiat transaction history
 */
export async function getFiatTransactions(): Promise<{
  transactions: FiatTransaction[];
  total: number;
  mode: 'sandbox' | 'production';
}> {
  return apiRequest('/api/v1/fiat/transactions', { method: 'GET' });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format USDC amount for display (adds $ symbol)
 */
export function formatUsdcAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${num.toFixed(2)}`;
}

/**
 * Format ZAR amount for display (adds R symbol)
 */
export function formatZarAmount(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

/**
 * Check if error is insufficient balance
 */
export function isInsufficientBalanceError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.code === 'INSUFFICIENT_BALANCE';
  }
  return false;
}

// Note: APIError is exported from client.ts via index.ts
