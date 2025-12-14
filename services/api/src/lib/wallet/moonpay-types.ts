/**
 * Shared types for MoonPay integration
 * Used by both mock and real implementations
 */

export type MoonPayMode = "mock" | "production";

export interface CreateSessionParams {
  userId: string;
  walletAddress: string;
  amount: number; // USDC amount
  fiatCurrency: "ZAR" | "USD" | "EUR";
  type: "deposit" | "withdrawal";
}

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface WebhookPayload {
  sessionId: string;
  status: "completed" | "failed";
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  type?: "deposit" | "withdrawal"; // Optional for backward compatibility
}
