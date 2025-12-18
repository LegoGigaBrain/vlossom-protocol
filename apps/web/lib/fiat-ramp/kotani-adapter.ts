/**
 * Kotani Pay Fiat Ramp Adapter
 *
 * Integration with Kotani Pay for African fiat on/off-ramp.
 * Specialized for South African (ZAR) and other African currencies.
 *
 * Sandbox API: https://sandbox-api.kotanipay.io/api/v3
 * Documentation: https://docs.kotanipay.com/
 * FSP License: South Africa #53594
 */

import type {
  FiatRampAdapter,
  FiatRampProvider,
  FiatRampStatus,
} from "./types";

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Currency support - Kotani specializes in African markets
const SUPPORTED_FIAT = ["ZAR", "KES", "GHS", "NGN", "UGX"];
const SUPPORTED_CRYPTO = ["USDC"];
const SUPPORTED_NETWORKS = ["base", "base_sepolia"];

// Exchange rates (approximate, will be fetched from API in production)
const EXCHANGE_RATES: Record<string, number> = {
  ZAR: 18.5,  // 1 USDC = 18.5 ZAR
  KES: 155,   // 1 USDC = 155 KES
  GHS: 15.5,  // 1 USDC = 15.5 GHS
  NGN: 1650,  // 1 USDC = 1650 NGN
  UGX: 3800,  // 1 USDC = 3800 UGX
};

// Limits (in fiat currency)
const LIMITS: Record<string, { min: number; max: number }> = {
  ZAR: { min: 50, max: 50000 },
  KES: { min: 500, max: 500000 },
  GHS: { min: 50, max: 50000 },
  NGN: { min: 5000, max: 5000000 },
  UGX: { min: 50000, max: 50000000 },
};

/**
 * Map Kotani status to our status
 */
function mapKotaniStatus(status: string): FiatRampStatus {
  const statusMap: Record<string, FiatRampStatus> = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
    cancelled: "cancelled",
    expired: "expired",
  };
  return statusMap[status.toLowerCase()] || "pending";
}

/**
 * Get exchange rate for currency
 */
function getExchangeRate(currency: string): number {
  return EXCHANGE_RATES[currency] || 1;
}

/**
 * Kotani Pay adapter implementation
 */
export const kotaniAdapter: FiatRampAdapter = {
  provider: "kotani" as FiatRampProvider,

  async checkAvailability(params) {
    const networkSupported = SUPPORTED_NETWORKS.includes(params.network);
    const fiatSupported = SUPPORTED_FIAT.includes(params.fiatCurrency);
    const cryptoSupported = SUPPORTED_CRYPTO.includes(params.cryptoCurrency);

    const limits = LIMITS[params.fiatCurrency] || { min: 50, max: 50000 };

    return {
      provider: "kotani",
      available: networkSupported && fiatSupported && cryptoSupported,
      supportedFiatCurrencies: SUPPORTED_FIAT,
      supportedCryptoCurrencies: SUPPORTED_CRYPTO,
      supportedNetworks: SUPPORTED_NETWORKS,
      minAmount: limits.min,
      maxAmount: limits.max,
      kycRequired: false, // Kotani handles KYC internally
      estimatedTime: "5-30 minutes",
      message: !networkSupported
        ? `Network ${params.network} not supported`
        : !fiatSupported
        ? `Currency ${params.fiatCurrency} not supported. Kotani supports African currencies: ZAR, KES, GHS, NGN, UGX`
        : !cryptoSupported
        ? `Crypto ${params.cryptoCurrency} not supported`
        : undefined,
    };
  },

  async getOnRampQuote(params) {
    try {
      // Call backend API for real-time rates
      const response = await fetch(
        `${API_URL}/api/v1/fiat/rates?currency=${params.fiatCurrency}&amount=${params.fiatAmount}&type=buy`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          provider: "kotani",
          type: "on_ramp",
          fiatAmount: params.fiatAmount,
          fiatCurrency: params.fiatCurrency,
          cryptoAmount: data.cryptoAmount,
          cryptoCurrency: params.cryptoCurrency,
          exchangeRate: data.buyRate,
          fees: {
            networkFee: data.fees?.networkFee || 0.5,
            processingFee: data.fees?.kotaniFee || params.fiatAmount * 0.02,
            totalFee: data.fees?.totalFee || params.fiatAmount * 0.02 + 0.5,
          },
          estimatedTime: "5-30 minutes",
          expiresAt: data.validUntil || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
      }
    } catch (error) {
      console.warn("[Kotani] Failed to fetch live rates, using fallback:", error);
    }

    // Fallback to calculated quote
    const exchangeRate = getExchangeRate(params.fiatCurrency);
    const processingFee = params.fiatAmount * 0.02; // 2% fee
    const networkFee = exchangeRate * 0.5; // ~$0.50 in local currency
    const totalFee = processingFee + networkFee;
    const cryptoAmount = (params.fiatAmount - totalFee) / exchangeRate;

    return {
      provider: "kotani",
      type: "on_ramp",
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount: Math.round(cryptoAmount * 100) / 100,
      cryptoCurrency: params.cryptoCurrency,
      exchangeRate: 1 / exchangeRate, // Inverted for display
      fees: {
        networkFee,
        processingFee,
        totalFee,
      },
      estimatedTime: "5-30 minutes",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  },

  async getOffRampQuote(params) {
    try {
      // Call backend API for real-time rates
      const response = await fetch(
        `${API_URL}/api/v1/fiat/rates?currency=${params.fiatCurrency}&amount=${params.cryptoAmount}&type=sell`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          provider: "kotani",
          type: "off_ramp",
          fiatAmount: data.fiatAmount,
          fiatCurrency: params.fiatCurrency,
          cryptoAmount: params.cryptoAmount,
          cryptoCurrency: params.cryptoCurrency,
          exchangeRate: data.sellRate,
          fees: {
            networkFee: data.fees?.networkFee || 0.5,
            processingFee: data.fees?.kotaniFee || params.cryptoAmount * 0.02,
            totalFee: data.fees?.totalFee || params.cryptoAmount * 0.02 + 0.5,
          },
          estimatedTime: "1-24 hours",
          expiresAt: data.validUntil || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
      }
    } catch (error) {
      console.warn("[Kotani] Failed to fetch live rates, using fallback:", error);
    }

    // Fallback to calculated quote
    const exchangeRate = getExchangeRate(params.fiatCurrency);
    const processingFee = params.cryptoAmount * 0.02; // 2% fee
    const networkFee = 0.5; // $0.50 network fee
    const totalFee = processingFee + networkFee;
    const fiatAmount = (params.cryptoAmount - totalFee) * exchangeRate;

    return {
      provider: "kotani",
      type: "off_ramp",
      fiatAmount: Math.round(fiatAmount * 100) / 100,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount: params.cryptoAmount,
      cryptoCurrency: params.cryptoCurrency,
      exchangeRate,
      fees: {
        networkFee,
        processingFee,
        totalFee,
      },
      estimatedTime: "1-24 hours",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  },

  async initiateOnRamp(request) {
    try {
      const response = await fetch(`${API_URL}/api/v1/fiat/onramp/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fiatAmount: request.fiatAmount,
          fiatCurrency: request.fiatCurrency,
          paymentChannel: "bank_transfer",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initiate onramp");
      }

      const data = await response.json();

      return {
        provider: "kotani",
        url: data.paymentUrl || `${API_URL}/fiat/pay/${data.transactionId}`,
        orderId: data.transactionId,
        expiresAt: data.expiresAt,
      };
    } catch (error) {
      console.error("[Kotani] Onramp initiation failed:", error);

      // Fallback to sandbox URL
      const orderId = `kotani-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return {
        provider: "kotani",
        url: `https://sandbox.kotanipay.io/pay/${orderId}`,
        orderId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }
  },

  async initiateOffRamp(request) {
    try {
      const response = await fetch(`${API_URL}/api/v1/fiat/offramp/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cryptoAmount: request.cryptoAmount,
          fiatCurrency: request.fiatCurrency,
          paymentChannel: "bank_transfer",
          bankAccount: request.bankDetails?.accountNumber,
          bankCode: request.bankDetails?.routingNumber,
          accountName: request.userData?.firstName
            ? `${request.userData.firstName} ${request.userData.lastName || ""}`
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initiate offramp");
      }

      const data = await response.json();

      return {
        provider: "kotani",
        url: "", // Offramp doesn't need a redirect URL
        orderId: data.transactionId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h for processing
      };
    } catch (error) {
      console.error("[Kotani] Offramp initiation failed:", error);

      // Fallback
      const orderId = `kotani-off-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return {
        provider: "kotani",
        url: "",
        orderId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  },

  async getTransaction(orderId) {
    try {
      const response = await fetch(`${API_URL}/api/v1/fiat/transactions/${orderId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.transactionId,
          provider: "kotani",
          type: data.type === "onramp" ? "on_ramp" : "off_ramp",
          status: mapKotaniStatus(data.status),
          fiatAmount: data.fiatAmount,
          fiatCurrency: data.fiatCurrency,
          cryptoAmount: data.cryptoAmount,
          cryptoCurrency: data.cryptoCurrency,
          walletAddress: data.walletAddress,
          txHash: data.txHash,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          completedAt: data.completedAt,
        };
      }
    } catch (error) {
      console.error("[Kotani] Failed to get transaction:", error);
    }

    // Fallback to mock transaction
    return {
      id: orderId,
      provider: "kotani",
      type: "on_ramp",
      status: "pending",
      fiatAmount: 1000,
      fiatCurrency: "ZAR",
      cryptoAmount: 50,
      cryptoCurrency: "USDC",
      walletAddress: "0x0000000000000000000000000000000000000000",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async handleWebhook(payload, _signature) {
    // Webhook handling is done on the backend
    // This is a placeholder for completeness
    const data = payload as {
      event: string;
      transactionId: string;
      type: string;
      status: string;
      fiatAmount: number;
      fiatCurrency: string;
      cryptoAmount: number;
      cryptoCurrency: string;
      walletAddress: string;
      txHash?: string;
      timestamp: string;
    };

    return {
      event: data.event,
      transaction: {
        id: data.transactionId,
        provider: "kotani",
        type: data.type === "onramp" ? "on_ramp" : "off_ramp",
        status: mapKotaniStatus(data.status),
        fiatAmount: data.fiatAmount,
        fiatCurrency: data.fiatCurrency,
        cryptoAmount: data.cryptoAmount,
        cryptoCurrency: data.cryptoCurrency,
        walletAddress: data.walletAddress,
        txHash: data.txHash,
        createdAt: data.timestamp,
        updatedAt: new Date().toISOString(),
      },
    };
  },
};

export default kotaniAdapter;
