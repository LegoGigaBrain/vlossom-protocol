/**
 * Kotani Pay API Client
 * Handles all communication with Kotani Pay API v3
 * Sandbox: https://sandbox-api.kotanipay.io/api/v3
 * Production: https://api.kotanipay.com/api/v3
 */

import { logger } from "../logger";
import {
  KotaniMode,
  KotaniConfig,
  OnrampRequest,
  OnrampResponse,
  OfframpRequest,
  OfframpResponse,
  TransactionStatusResponse,
  ExchangeRateRequest,
  ExchangeRateResponse,
  KotaniWebhookPayload,
  DEFAULT_LIMITS,
} from "./types";

// Configuration from environment
const KOTANI_MODE: KotaniMode =
  (process.env.KOTANI_MODE as KotaniMode) || "sandbox";

const KOTANI_CONFIG: KotaniConfig = {
  apiUrl:
    KOTANI_MODE === "sandbox"
      ? "https://sandbox-api.kotanipay.io/api/v3"
      : "https://api.kotanipay.com/api/v3",
  apiKey: process.env.KOTANI_API_KEY || "",
  webhookSecret: process.env.KOTANI_WEBHOOK_SECRET,
  mode: KOTANI_MODE,
};

/**
 * Make authenticated request to Kotani API
 */
async function kotaniRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const url = `${KOTANI_CONFIG.apiUrl}${endpoint}`;

  logger.info(`[Kotani] ${method} ${endpoint}`, { mode: KOTANI_MODE });

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KOTANI_CONFIG.apiKey}`,
        "X-API-Key": KOTANI_CONFIG.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("[Kotani] API Error", {
        status: response.status,
        error: data,
        endpoint,
      });
      throw new Error(data.message || `Kotani API error: ${response.status}`);
    }

    return data as T;
  } catch (error) {
    logger.error("[Kotani] Request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      endpoint,
    });
    throw error;
  }
}

/**
 * Initiate an on-ramp transaction (Fiat → Crypto)
 */
export async function initiateOnramp(
  request: OnrampRequest
): Promise<OnrampResponse> {
  logger.info("[Kotani] Initiating onramp", {
    userId: request.userId,
    amount: request.fiatAmount,
    currency: request.fiatCurrency,
    mode: KOTANI_MODE,
  });

  // Validate limits
  if (request.fiatAmount < DEFAULT_LIMITS.minOnramp) {
    return {
      success: false,
      error: `Minimum amount is ${DEFAULT_LIMITS.minOnramp} ${request.fiatCurrency}`,
      errorCode: "MIN_AMOUNT",
    };
  }

  if (request.fiatAmount > DEFAULT_LIMITS.maxOnramp) {
    return {
      success: false,
      error: `Maximum amount is ${DEFAULT_LIMITS.maxOnramp} ${request.fiatCurrency}`,
      errorCode: "MAX_AMOUNT",
    };
  }

  // In sandbox mode, simulate the response
  if (KOTANI_MODE === "sandbox") {
    return simulateOnrampResponse(request);
  }

  // Production API call
  try {
    const response = await kotaniRequest<OnrampResponse>("/onramp/initiate", "POST", {
      amount: request.fiatAmount,
      currency: request.fiatCurrency,
      crypto_currency: request.cryptoCurrency,
      wallet_address: request.walletAddress,
      payment_channel: request.paymentChannel,
      phone_number: request.phoneNumber,
      customer_email: request.customerEmail,
      customer_name: request.customerName,
      callback_url: `${process.env.API_URL}/api/v1/fiat/webhook`,
      metadata: {
        ...request.metadata,
        user_id: request.userId,
      },
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Onramp failed",
      errorCode: "API_ERROR",
    };
  }
}

/**
 * Initiate an off-ramp transaction (Crypto → Fiat)
 */
export async function initiateOfframp(
  request: OfframpRequest
): Promise<OfframpResponse> {
  logger.info("[Kotani] Initiating offramp", {
    userId: request.userId,
    amount: request.cryptoAmount,
    currency: request.fiatCurrency,
    mode: KOTANI_MODE,
  });

  // Validate limits
  if (request.cryptoAmount < DEFAULT_LIMITS.minOfframp) {
    return {
      success: false,
      error: `Minimum amount is ${DEFAULT_LIMITS.minOfframp} USDC`,
      errorCode: "MIN_AMOUNT",
    };
  }

  if (request.cryptoAmount > DEFAULT_LIMITS.maxOfframp) {
    return {
      success: false,
      error: `Maximum amount is ${DEFAULT_LIMITS.maxOfframp} USDC`,
      errorCode: "MAX_AMOUNT",
    };
  }

  // In sandbox mode, simulate the response
  if (KOTANI_MODE === "sandbox") {
    return simulateOfframpResponse(request);
  }

  // Production API call
  try {
    const response = await kotaniRequest<OfframpResponse>("/offramp/initiate", "POST", {
      amount: request.cryptoAmount,
      crypto_currency: request.cryptoCurrency,
      fiat_currency: request.fiatCurrency,
      wallet_address: request.walletAddress,
      payment_channel: request.paymentChannel,
      phone_number: request.phoneNumber,
      bank_account: request.bankAccount,
      bank_code: request.bankCode,
      account_name: request.accountName,
      customer_email: request.customerEmail,
      callback_url: `${process.env.API_URL}/api/v1/fiat/webhook`,
      metadata: {
        ...request.metadata,
        user_id: request.userId,
      },
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Offramp failed",
      errorCode: "API_ERROR",
    };
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<TransactionStatusResponse | null> {
  logger.info("[Kotani] Getting transaction status", { transactionId });

  if (KOTANI_MODE === "sandbox") {
    return simulateTransactionStatus(transactionId);
  }

  try {
    return await kotaniRequest<TransactionStatusResponse>(
      `/transactions/${transactionId}`
    );
  } catch {
    return null;
  }
}

/**
 * Get current exchange rates
 */
export async function getExchangeRate(
  request: ExchangeRateRequest
): Promise<ExchangeRateResponse | null> {
  logger.info("[Kotani] Getting exchange rate", {
    currency: request.fiatCurrency,
    type: request.type,
  });

  if (KOTANI_MODE === "sandbox") {
    return simulateExchangeRate(request);
  }

  try {
    return await kotaniRequest<ExchangeRateResponse>("/rates", "POST", {
      fiat_currency: request.fiatCurrency,
      crypto_currency: request.cryptoCurrency,
      amount: request.amount,
      type: request.type,
    });
  } catch {
    return null;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!KOTANI_CONFIG.webhookSecret) {
    logger.warn("[Kotani] No webhook secret configured, skipping verification");
    return true; // In sandbox, allow without verification
  }

  // In production, verify HMAC signature
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", KOTANI_CONFIG.webhookSecret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Process webhook from Kotani
 */
export async function processWebhook(
  payload: KotaniWebhookPayload
): Promise<void> {
  logger.info("[Kotani] Processing webhook", {
    event: payload.event,
    transactionId: payload.transactionId,
    status: payload.status,
  });

  // This would typically update database records, trigger notifications, etc.
  // For now, just log the event
  switch (payload.event) {
    case "transaction.completed":
      logger.info("[Kotani] Transaction completed", {
        transactionId: payload.transactionId,
        cryptoAmount: payload.cryptoAmount,
        txHash: payload.txHash,
      });
      // TODO: Update transaction record, credit user wallet if onramp
      break;

    case "transaction.failed":
      logger.error("[Kotani] Transaction failed", {
        transactionId: payload.transactionId,
      });
      // TODO: Update transaction record, notify user
      break;

    case "transaction.pending":
      logger.info("[Kotani] Transaction pending", {
        transactionId: payload.transactionId,
      });
      break;
  }
}

/**
 * Get current Kotani mode
 */
export function getKotaniMode(): KotaniMode {
  return KOTANI_MODE;
}

// ============================================
// Sandbox Simulation Functions
// ============================================

function simulateOnrampResponse(request: OnrampRequest): OnrampResponse {
  const transactionId = `sandbox_onramp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const exchangeRate = getSimulatedExchangeRate(request.fiatCurrency);
  const kotaniFee = request.fiatAmount * 0.02; // 2% fee
  const networkFee = 0.5; // $0.50 network fee
  const estimatedCrypto = (request.fiatAmount - kotaniFee) / exchangeRate;

  return {
    success: true,
    transactionId,
    paymentReference: `PAY-${transactionId.substring(0, 8).toUpperCase()}`,
    paymentUrl: `https://sandbox.kotanipay.io/pay/${transactionId}`,
    paymentInstructions:
      request.paymentChannel === "mobile_money"
        ? `Dial *120*${transactionId.substring(0, 6)}# to complete payment`
        : undefined,
    estimatedCryptoAmount: Math.round(estimatedCrypto * 100) / 100,
    exchangeRate,
    fees: {
      kotaniFee,
      networkFee,
      totalFee: kotaniFee + networkFee,
    },
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
  };
}

function simulateOfframpResponse(request: OfframpRequest): OfframpResponse {
  const transactionId = `sandbox_offramp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const exchangeRate = getSimulatedExchangeRate(request.fiatCurrency);
  const kotaniFee = request.cryptoAmount * 0.02; // 2% fee
  const networkFee = 0.5; // $0.50 network fee
  const estimatedFiat = (request.cryptoAmount - kotaniFee - networkFee) * exchangeRate;

  return {
    success: true,
    transactionId,
    estimatedFiatAmount: Math.round(estimatedFiat * 100) / 100,
    exchangeRate,
    fees: {
      kotaniFee,
      networkFee,
      totalFee: kotaniFee + networkFee,
    },
    processingTime: "1-24 hours",
  };
}

function simulateTransactionStatus(
  transactionId: string
): TransactionStatusResponse {
  // Simulate different statuses based on transaction age
  const isOnramp = transactionId.includes("onramp");

  return {
    transactionId,
    status: "pending", // Could randomize for testing
    type: isOnramp ? "onramp" : "offramp",
    fiatAmount: 1000,
    fiatCurrency: "ZAR",
    cryptoAmount: 50,
    cryptoCurrency: "USDC",
    walletAddress: "0x...",
    exchangeRate: 18.5,
    fees: {
      kotaniFee: 20,
      networkFee: 0.5,
      totalFee: 20.5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function simulateExchangeRate(
  request: ExchangeRateRequest
): ExchangeRateResponse {
  const rate = getSimulatedExchangeRate(request.fiatCurrency);
  const feePercentage = 0.02; // 2%
  const kotaniFee = request.amount * feePercentage;
  const networkFee = 0.5;

  const cryptoAmount =
    request.type === "buy"
      ? (request.amount - kotaniFee) / rate
      : request.amount;
  const fiatAmount =
    request.type === "sell"
      ? (request.amount - kotaniFee - networkFee) * rate
      : request.amount;

  return {
    fiatCurrency: request.fiatCurrency,
    cryptoCurrency: request.cryptoCurrency,
    buyRate: rate,
    sellRate: rate * 0.98, // Slightly lower sell rate
    fiatAmount: Math.round(fiatAmount * 100) / 100,
    cryptoAmount: Math.round(cryptoAmount * 100) / 100,
    fees: {
      kotaniFee: Math.round(kotaniFee * 100) / 100,
      networkFee,
      totalFee: Math.round((kotaniFee + networkFee) * 100) / 100,
      feePercentage,
    },
    validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min validity
  };
}

function getSimulatedExchangeRate(currency: string): number {
  // Approximate exchange rates (1 USDC = X local currency)
  const rates: Record<string, number> = {
    ZAR: 18.5,  // South African Rand
    KES: 155,   // Kenyan Shilling
    GHS: 15.5,  // Ghanaian Cedi
    NGN: 1650,  // Nigerian Naira
    UGX: 3800,  // Ugandan Shilling
    USD: 1,
  };

  return rates[currency] || 1;
}
