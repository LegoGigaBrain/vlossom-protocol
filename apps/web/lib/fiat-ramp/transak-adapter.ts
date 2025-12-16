/**
 * Transak Fiat Ramp Adapter
 *
 * Integration with Transak for fiat on/off-ramp.
 * Uses staging API key for testnet: 4a85d63b-0fd9-4c43-ad7b-e4fc69253d9c
 *
 * Documentation: https://docs.transak.com/
 */

import type {
  FiatRampAdapter,
  FiatRampProvider,
  ProviderAvailability,
  FiatRampQuote,
  OnRampRequest,
  OffRampRequest,
  FiatRampWidgetResponse,
  FiatRampTransaction,
  FiatRampStatus,
} from "./types";

// Transak API keys
const TRANSAK_STAGING_API_KEY = "4a85d63b-0fd9-4c43-ad7b-e4fc69253d9c";
const TRANSAK_PRODUCTION_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || "";

// Environment detection
const isProduction = process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_NETWORK_MODE === "mainnet";

// API configuration
const config = {
  apiKey: isProduction ? TRANSAK_PRODUCTION_API_KEY : TRANSAK_STAGING_API_KEY,
  environment: isProduction ? "production" : "staging",
  widgetUrl: isProduction
    ? "https://global.transak.com"
    : "https://global-stg.transak.com",
  apiUrl: isProduction
    ? "https://api.transak.com"
    : "https://api-stg.transak.com",
};

// Network mapping for Transak
const networkMap: Record<string, string> = {
  base: "base",
  base_sepolia: "base", // Transak staging uses same network name
  mainnet: "ethereum",
  sepolia: "ethereum", // Staging
};

// Currency support
const SUPPORTED_FIAT = ["USD", "EUR", "GBP", "ZAR", "KES", "NGN", "GHS"];
const SUPPORTED_CRYPTO = ["USDC", "ETH", "DAI"];
const SUPPORTED_NETWORKS = ["base", "base_sepolia"];

/**
 * Map Transak status to our status
 */
function mapTransakStatus(status: string): FiatRampStatus {
  const statusMap: Record<string, FiatRampStatus> = {
    AWAITING_PAYMENT_FROM_USER: "pending",
    PAYMENT_DONE_MARKED_BY_USER: "processing",
    PROCESSING: "processing",
    PENDING_DELIVERY_FROM_TRANSAK: "processing",
    ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK: "processing",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    FAILED: "failed",
    REFUNDED: "failed",
    EXPIRED: "expired",
  };
  return statusMap[status] || "pending";
}

/**
 * Build Transak widget URL with parameters
 */
function buildWidgetUrl(params: {
  type: "buy" | "sell";
  cryptoCurrency: string;
  fiatCurrency: string;
  network: string;
  walletAddress: string;
  fiatAmount?: number;
  cryptoAmount?: number;
  email?: string;
  redirectUrl?: string;
}): string {
  const url = new URL(config.widgetUrl);

  // Required params
  url.searchParams.set("apiKey", config.apiKey);
  url.searchParams.set("productsAvailed", params.type === "buy" ? "BUY" : "SELL");
  url.searchParams.set("cryptoCurrencyCode", params.cryptoCurrency);
  url.searchParams.set("defaultCryptoCurrency", params.cryptoCurrency);
  url.searchParams.set("fiatCurrency", params.fiatCurrency);
  url.searchParams.set("network", networkMap[params.network] || params.network);
  url.searchParams.set("walletAddress", params.walletAddress);

  // Optional params
  if (params.fiatAmount) {
    url.searchParams.set("defaultFiatAmount", params.fiatAmount.toString());
  }
  if (params.cryptoAmount) {
    url.searchParams.set("defaultCryptoAmount", params.cryptoAmount.toString());
  }
  if (params.email) {
    url.searchParams.set("email", params.email);
  }
  if (params.redirectUrl) {
    url.searchParams.set("redirectURL", params.redirectUrl);
  }

  // Customization
  url.searchParams.set("themeColor", "D4AF37"); // Vlossom gold
  url.searchParams.set("hideMenu", "true");
  url.searchParams.set("disableWalletAddressForm", "true");

  return url.toString();
}

/**
 * Transak adapter implementation
 */
export const transakAdapter: FiatRampAdapter = {
  provider: "transak" as FiatRampProvider,

  async checkAvailability(params) {
    const networkSupported = SUPPORTED_NETWORKS.includes(params.network);
    const fiatSupported = SUPPORTED_FIAT.includes(params.fiatCurrency);
    const cryptoSupported = SUPPORTED_CRYPTO.includes(params.cryptoCurrency);

    return {
      provider: "transak",
      available: networkSupported && fiatSupported && cryptoSupported,
      supportedFiatCurrencies: SUPPORTED_FIAT,
      supportedCryptoCurrencies: SUPPORTED_CRYPTO,
      supportedNetworks: SUPPORTED_NETWORKS,
      minAmount: 30, // $30 minimum
      maxAmount: 5000, // $5000 without advanced KYC
      kycRequired: true,
      estimatedTime: "5-30 minutes",
      message: !networkSupported
        ? `Network ${params.network} not supported`
        : !fiatSupported
        ? `Currency ${params.fiatCurrency} not supported`
        : !cryptoSupported
        ? `Crypto ${params.cryptoCurrency} not supported`
        : undefined,
    };
  },

  async getOnRampQuote(params) {
    // For staging, we return mock quotes
    // In production, this would call Transak API
    const exchangeRate = params.fiatCurrency === "USD" ? 1.0 : 0.95;
    const processingFee = params.fiatAmount * 0.015; // 1.5% fee
    const networkFee = 0.5; // $0.50 network fee estimate
    const totalFee = processingFee + networkFee;
    const cryptoAmount = (params.fiatAmount - totalFee) * exchangeRate;

    return {
      provider: "transak",
      type: "on_ramp",
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount,
      cryptoCurrency: params.cryptoCurrency,
      exchangeRate,
      fees: {
        networkFee,
        processingFee,
        totalFee,
      },
      estimatedTime: "5-30 minutes",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
    };
  },

  async getOffRampQuote(params) {
    const exchangeRate = params.fiatCurrency === "USD" ? 0.98 : 0.93;
    const processingFee = params.cryptoAmount * 0.02; // 2% fee
    const networkFee = 1.0; // $1 network fee estimate
    const totalFee = processingFee + networkFee;
    const fiatAmount = (params.cryptoAmount - totalFee) * exchangeRate;

    return {
      provider: "transak",
      type: "off_ramp",
      fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount: params.cryptoAmount,
      cryptoCurrency: params.cryptoCurrency,
      exchangeRate,
      fees: {
        networkFee,
        processingFee,
        totalFee,
      },
      estimatedTime: "1-3 business days",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async initiateOnRamp(request) {
    const orderId = `transak-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const url = buildWidgetUrl({
      type: "buy",
      cryptoCurrency: request.cryptoCurrency,
      fiatCurrency: request.fiatCurrency,
      network: request.network,
      walletAddress: request.walletAddress,
      fiatAmount: request.fiatAmount,
      email: request.userData?.email,
      redirectUrl: request.redirectUrl,
    });

    return {
      provider: "transak",
      url,
      orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    };
  },

  async initiateOffRamp(request) {
    const orderId = `transak-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const url = buildWidgetUrl({
      type: "sell",
      cryptoCurrency: request.cryptoCurrency,
      fiatCurrency: request.fiatCurrency,
      network: request.network,
      walletAddress: request.walletAddress,
      cryptoAmount: request.cryptoAmount,
      email: request.userData?.email,
      redirectUrl: request.redirectUrl,
    });

    return {
      provider: "transak",
      url,
      orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  },

  async getTransaction(orderId) {
    // In production, this would call Transak API
    // For staging, return mock pending transaction
    return {
      id: orderId,
      provider: "transak",
      type: "on_ramp",
      status: "pending",
      fiatAmount: 100,
      fiatCurrency: "USD",
      cryptoAmount: 98.5,
      cryptoCurrency: "USDC",
      walletAddress: "0x0000000000000000000000000000000000000000",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async handleWebhook(payload, signature) {
    // Verify webhook signature in production
    // Parse Transak webhook payload
    const data = payload as {
      eventID: string;
      webhookData: {
        id: string;
        status: string;
        fiatAmount: number;
        fiatCurrency: string;
        cryptoAmount: number;
        cryptoCurrency: string;
        walletAddress: string;
        transactionHash?: string;
        createdAt: string;
        completedAt?: string;
      };
    };

    return {
      event: data.eventID,
      transaction: {
        id: data.webhookData.id,
        provider: "transak",
        type: "on_ramp",
        status: mapTransakStatus(data.webhookData.status),
        fiatAmount: data.webhookData.fiatAmount,
        fiatCurrency: data.webhookData.fiatCurrency,
        cryptoAmount: data.webhookData.cryptoAmount,
        cryptoCurrency: data.webhookData.cryptoCurrency,
        walletAddress: data.webhookData.walletAddress,
        txHash: data.webhookData.transactionHash,
        createdAt: data.webhookData.createdAt,
        updatedAt: new Date().toISOString(),
        completedAt: data.webhookData.completedAt,
      },
    };
  },
};

export default transakAdapter;
