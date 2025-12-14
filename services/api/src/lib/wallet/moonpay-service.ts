/**
 * Main MoonPay service - automatically switches between mock and real
 * Mode controlled by MOONPAY_MODE environment variable
 */

import {
  CreateSessionParams,
  CreateSessionResult,
  WebhookPayload,
  MoonPayMode,
} from "./moonpay-types";
import * as mock from "./moonpay-mock";
import * as real from "./moonpay-real";

const MOONPAY_MODE: MoonPayMode =
  (process.env.MOONPAY_MODE as MoonPayMode) || "mock";

/**
 * Create a deposit session (onramp)
 * Automatically uses mock or real implementation based on MOONPAY_MODE
 */
export async function createDepositSession(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  if (MOONPAY_MODE === "mock") {
    console.log("[MoonPay] Using MOCK mode for deposit");
    return mock.createDepositSessionMock(params);
  } else {
    console.log("[MoonPay] Using PRODUCTION mode for deposit");
    return real.createDepositSessionReal(params);
  }
}

/**
 * Create a withdrawal session (offramp)
 * Automatically uses mock or real implementation based on MOONPAY_MODE
 */
export async function createWithdrawalSession(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  if (MOONPAY_MODE === "mock") {
    console.log("[MoonPay] Using MOCK mode for withdrawal");
    return mock.createWithdrawalSessionMock(params);
  } else {
    console.log("[MoonPay] Using PRODUCTION mode for withdrawal");
    return real.createWithdrawalSessionReal(params);
  }
}

/**
 * Process MoonPay webhook
 * Automatically uses mock or real implementation based on MOONPAY_MODE
 */
export async function processWebhook(payload: WebhookPayload): Promise<void> {
  if (MOONPAY_MODE === "mock") {
    console.log("[MoonPay] Processing MOCK webhook");
    return mock.processWebhookMock(payload);
  } else {
    console.log("[MoonPay] Processing PRODUCTION webhook");
    return real.processWebhookReal(payload);
  }
}

/**
 * Get current MoonPay mode
 * Used by frontend to show "(Mock)" badge in UI
 */
export function getMoonPayMode(): MoonPayMode {
  return MOONPAY_MODE;
}
