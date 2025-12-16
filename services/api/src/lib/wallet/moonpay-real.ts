/**
 * REAL MoonPay implementation using official SDK
 * Activated when MOONPAY_MODE=production
 *
 * TODO: Install @moonpay/moonpay-node when SDK access is granted
 * Install command: pnpm add @moonpay/moonpay-node
 */

// NOTE: prisma import is commented out - will be used when MoonPay SDK is installed
// import { prisma } from "../../lib/prisma";
import {
  CreateSessionParams,
  CreateSessionResult,
} from "./moonpay-types";

// TODO: Uncomment when MoonPay SDK is installed
// import MoonPaySDK from "@moonpay/moonpay-node";

// const moonpay = new MoonPaySDK({
//   apiKey: process.env.MOONPAY_API_KEY!,
//   secretKey: process.env.MOONPAY_SECRET_KEY!,
//   environment: process.env.MOONPAY_ENV || "sandbox",
// });

/**
 * Create a real deposit session with MoonPay SDK
 * TODO: Implement when SDK is available
 */
export async function createDepositSessionReal(
  _params: CreateSessionParams
): Promise<CreateSessionResult> {
  // TODO: When MoonPay SDK is installed, use _params to create real session
  return {
    success: false,
    error: "MoonPay SDK not yet installed. Set MOONPAY_MODE=mock to use mock mode.",
  };
}

/**
 * Create a real withdrawal session with MoonPay SDK
 * TODO: Implement when SDK is available
 */
export async function createWithdrawalSessionReal(
  _params: CreateSessionParams
): Promise<CreateSessionResult> {
  // TODO: When MoonPay SDK is installed, use _params to create real session
  return {
    success: false,
    error: "MoonPay SDK not yet installed. Set MOONPAY_MODE=mock to use mock mode.",
  };
}

/**
 * Process real MoonPay webhook with signature verification
 * TODO: Implement when SDK is available
 */
export async function processWebhookReal(_payload: unknown): Promise<void> {
  // TODO: When MoonPay SDK is installed, verify signature and process _payload
  throw new Error("MoonPay webhook processing not yet implemented. Set MOONPAY_MODE=mock.");
}
