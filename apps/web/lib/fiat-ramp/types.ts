/**
 * Fiat On/Off-Ramp Provider Types
 *
 * Defines interfaces for multi-provider fiat ramp integration.
 * Supports testnet staging and production environments.
 */

/**
 * Supported fiat ramp providers
 */
export type FiatRampProvider = "transak" | "kotani" | "moonpay";

/**
 * Transaction type
 */
export type FiatRampType = "on_ramp" | "off_ramp";

/**
 * Transaction status
 */
export type FiatRampStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

/**
 * Provider configuration
 */
export interface FiatRampConfig {
  provider: FiatRampProvider;
  apiKey: string;
  environment: "staging" | "production";
  widgetUrl: string;
  webhookSecret?: string;
}

/**
 * User data for KYC
 */
export interface FiatRampUserData {
  email: string;
  walletAddress: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  countryCode?: string; // ISO 3166-1 alpha-2
}

/**
 * On-ramp request (buy crypto)
 */
export interface OnRampRequest {
  provider: FiatRampProvider;
  fiatAmount: number;
  fiatCurrency: string; // ISO 4217, e.g., "USD", "ZAR"
  cryptoCurrency: string; // e.g., "USDC"
  network: string; // e.g., "base", "base_sepolia"
  walletAddress: string;
  userData?: FiatRampUserData;
  redirectUrl?: string;
}

/**
 * Off-ramp request (sell crypto)
 */
export interface OffRampRequest {
  provider: FiatRampProvider;
  cryptoAmount: number;
  cryptoCurrency: string;
  fiatCurrency: string;
  network: string;
  walletAddress: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    iban?: string;
  };
  userData?: FiatRampUserData;
  redirectUrl?: string;
}

/**
 * Quote response from provider
 */
export interface FiatRampQuote {
  provider: FiatRampProvider;
  type: FiatRampType;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  exchangeRate: number;
  fees: {
    networkFee: number;
    processingFee: number;
    totalFee: number;
  };
  estimatedTime: string; // e.g., "5-30 minutes"
  expiresAt: string; // ISO timestamp
  quoteId?: string;
}

/**
 * Widget/redirect URL response
 */
export interface FiatRampWidgetResponse {
  provider: FiatRampProvider;
  url: string;
  orderId: string;
  expiresAt?: string;
}

/**
 * Transaction record
 */
export interface FiatRampTransaction {
  id: string;
  provider: FiatRampProvider;
  type: FiatRampType;
  status: FiatRampStatus;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  walletAddress: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Provider availability check
 */
export interface ProviderAvailability {
  provider: FiatRampProvider;
  available: boolean;
  supportedFiatCurrencies: string[];
  supportedCryptoCurrencies: string[];
  supportedNetworks: string[];
  minAmount: number;
  maxAmount: number;
  kycRequired: boolean;
  estimatedTime: string;
  message?: string;
}

/**
 * Fiat ramp adapter interface
 * Each provider implements this interface
 */
export interface FiatRampAdapter {
  /**
   * Provider identifier
   */
  readonly provider: FiatRampProvider;

  /**
   * Check if provider is available for user/region
   */
  checkAvailability(params: {
    fiatCurrency: string;
    cryptoCurrency: string;
    network: string;
    countryCode?: string;
  }): Promise<ProviderAvailability>;

  /**
   * Get quote for on-ramp (buy crypto)
   */
  getOnRampQuote(params: {
    fiatAmount: number;
    fiatCurrency: string;
    cryptoCurrency: string;
    network: string;
  }): Promise<FiatRampQuote>;

  /**
   * Get quote for off-ramp (sell crypto)
   */
  getOffRampQuote(params: {
    cryptoAmount: number;
    cryptoCurrency: string;
    fiatCurrency: string;
    network: string;
  }): Promise<FiatRampQuote>;

  /**
   * Initialize on-ramp widget/redirect
   */
  initiateOnRamp(request: OnRampRequest): Promise<FiatRampWidgetResponse>;

  /**
   * Initialize off-ramp widget/redirect
   */
  initiateOffRamp(request: OffRampRequest): Promise<FiatRampWidgetResponse>;

  /**
   * Get transaction status
   */
  getTransaction(orderId: string): Promise<FiatRampTransaction>;

  /**
   * Handle webhook from provider
   */
  handleWebhook(payload: unknown, signature?: string): Promise<{
    event: string;
    transaction: FiatRampTransaction;
  }>;
}

/**
 * Provider registry for multi-provider support
 */
export interface FiatRampRegistry {
  /**
   * Get all registered providers
   */
  getProviders(): FiatRampProvider[];

  /**
   * Get adapter for specific provider
   */
  getAdapter(provider: FiatRampProvider): FiatRampAdapter | null;

  /**
   * Get best available provider for user/region
   */
  getBestProvider(params: {
    fiatCurrency: string;
    cryptoCurrency: string;
    network: string;
    countryCode?: string;
    preferredProvider?: FiatRampProvider;
  }): Promise<{
    provider: FiatRampProvider;
    availability: ProviderAvailability;
  } | null>;

  /**
   * Get availability for all providers
   */
  checkAllProviders(params: {
    fiatCurrency: string;
    cryptoCurrency: string;
    network: string;
    countryCode?: string;
  }): Promise<ProviderAvailability[]>;
}
