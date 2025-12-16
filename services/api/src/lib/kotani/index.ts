/**
 * Kotani Pay Integration Module
 * Provides fiat on/off-ramp functionality for South African (ZAR) users
 *
 * Kotani Pay: https://kotanipay.com
 * - FSP licensed in South Africa (#53594)
 * - Supports: Mobile Money, Bank Transfer, USSD
 * - Sandbox: sandbox-api.kotanipay.io
 */

export * from "./types";
export {
  initiateOnramp,
  initiateOfframp,
  getTransactionStatus,
  getExchangeRate,
  verifyWebhookSignature,
  processWebhook,
  getKotaniMode,
} from "./kotani-client";
