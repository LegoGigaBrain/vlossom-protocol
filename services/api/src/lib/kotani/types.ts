/**
 * Kotani Pay Type Definitions
 * Based on Kotani Pay API V3 documentation
 * https://apispec.kotanipay.com/
 */

export type KotaniMode = "sandbox" | "production";

/**
 * Supported payment channels for Kotani Pay
 */
export type PaymentChannel =
  | "mobile_money"  // MTN, Vodafone, etc.
  | "bank_transfer" // Direct bank transfer
  | "card"          // Card payments (future)
  | "ussd";         // USSD payments

/**
 * Supported countries/currencies
 */
export type SupportedCurrency = "ZAR" | "KES" | "GHS" | "NGN" | "UGX";

export interface KotaniConfig {
  apiUrl: string;
  apiKey: string;
  webhookSecret?: string;
  mode: KotaniMode;
}

/**
 * On-ramp (Fiat to Crypto) request
 */
export interface OnrampRequest {
  userId: string;
  walletAddress: string;
  fiatAmount: number;
  fiatCurrency: SupportedCurrency;
  cryptoCurrency: "USDC";
  paymentChannel: PaymentChannel;
  phoneNumber?: string;     // For mobile money
  bankAccount?: string;     // For bank transfer
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}

/**
 * On-ramp response from Kotani
 */
export interface OnrampResponse {
  success: boolean;
  transactionId?: string;
  paymentReference?: string;
  paymentUrl?: string;           // Redirect URL for payment
  paymentInstructions?: string;  // For USSD/Mobile Money
  estimatedCryptoAmount?: number;
  exchangeRate?: number;
  fees?: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
  };
  expiresAt?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Off-ramp (Crypto to Fiat) request
 */
export interface OfframpRequest {
  userId: string;
  walletAddress: string;
  cryptoAmount: number;
  cryptoCurrency: "USDC";
  fiatCurrency: SupportedCurrency;
  paymentChannel: PaymentChannel;
  phoneNumber?: string;       // For mobile money payout
  bankAccount?: string;       // For bank transfer
  bankCode?: string;          // Bank routing code
  accountName?: string;       // Account holder name
  customerEmail?: string;
  metadata?: Record<string, string>;
}

/**
 * Off-ramp response from Kotani
 */
export interface OfframpResponse {
  success: boolean;
  transactionId?: string;
  estimatedFiatAmount?: number;
  exchangeRate?: number;
  fees?: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
  };
  processingTime?: string;  // e.g., "1-24 hours"
  error?: string;
  errorCode?: string;
}

/**
 * Transaction status check
 */
export interface TransactionStatusRequest {
  transactionId: string;
}

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface TransactionStatusResponse {
  transactionId: string;
  status: TransactionStatus;
  type: "onramp" | "offramp";
  fiatAmount: number;
  fiatCurrency: SupportedCurrency;
  cryptoAmount: number;
  cryptoCurrency: string;
  walletAddress: string;
  exchangeRate: number;
  fees: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
  };
  paymentReference?: string;
  txHash?: string;           // On-chain tx hash if completed
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

/**
 * Exchange rate request
 */
export interface ExchangeRateRequest {
  fiatCurrency: SupportedCurrency;
  cryptoCurrency: "USDC";
  amount: number;
  type: "buy" | "sell";  // buy = onramp, sell = offramp
}

export interface ExchangeRateResponse {
  fiatCurrency: SupportedCurrency;
  cryptoCurrency: string;
  buyRate: number;        // Rate for buying crypto
  sellRate: number;       // Rate for selling crypto
  fiatAmount: number;
  cryptoAmount: number;
  fees: {
    kotaniFee: number;
    networkFee: number;
    totalFee: number;
    feePercentage: number;
  };
  validUntil: string;     // Rate expiration time
}

/**
 * Webhook payload from Kotani
 */
export interface KotaniWebhookPayload {
  event: "transaction.completed" | "transaction.failed" | "transaction.pending";
  transactionId: string;
  type: "onramp" | "offramp";
  status: TransactionStatus;
  fiatAmount: number;
  fiatCurrency: SupportedCurrency;
  cryptoAmount: number;
  cryptoCurrency: string;
  walletAddress: string;
  txHash?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

/**
 * Supported banks for South Africa
 */
export const SOUTH_AFRICA_BANKS = [
  { code: "ABSA", name: "ABSA Bank" },
  { code: "FNB", name: "First National Bank" },
  { code: "NEDBANK", name: "Nedbank" },
  { code: "STANDARDBANK", name: "Standard Bank" },
  { code: "CAPITEC", name: "Capitec Bank" },
  { code: "INVESTEC", name: "Investec" },
  { code: "TYMEBANK", name: "TymeBank" },
  { code: "AFRICANBANK", name: "African Bank" },
] as const;

/**
 * Limits configuration
 */
export interface KotaniLimits {
  minOnramp: number;      // Minimum fiat for onramp
  maxOnramp: number;      // Maximum fiat for onramp
  minOfframp: number;     // Minimum crypto for offramp
  maxOfframp: number;     // Maximum crypto for offramp
  dailyLimit: number;     // Daily transaction limit
  monthlyLimit: number;   // Monthly transaction limit
}

export const DEFAULT_LIMITS: KotaniLimits = {
  minOnramp: 50,          // R50 minimum
  maxOnramp: 50000,       // R50,000 maximum
  minOfframp: 5,          // 5 USDC minimum
  maxOfframp: 5000,       // 5,000 USDC maximum
  dailyLimit: 100000,     // R100,000 daily
  monthlyLimit: 500000,   // R500,000 monthly
};
