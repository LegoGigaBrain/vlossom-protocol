/**
 * MOCK MoonPay implementation for testing without SDK
 * Simulates MoonPay behavior using testnet USDC minting/burning
 */

import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import {
  CreateSessionParams,
  CreateSessionResult,
  WebhookPayload,
} from "./moonpay-types";

/**
 * Create a mock deposit session
 * Returns a mock redirect URL and session ID
 */
export async function createDepositSessionMock(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  const sessionId = `mock_deposit_${randomUUID()}`;

  try {
    // Get wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId: params.userId },
    });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Create MoonPayTransaction record
    await prisma.moonPayTransaction.create({
      data: {
        sessionId,
        walletId: wallet.id,
        type: "deposit",
        status: "pending",
        fiatAmount: params.amount * 18.5, // Mock ZAR conversion (1 USDC = 18.5 ZAR)
        fiatCurrency: params.fiatCurrency,
        cryptoAmount: params.amount,
        cryptoCurrency: "USDC",
        redirectUrl: `http://localhost:3000/wallet?mock_session=${sessionId}`,
      },
    });

    // Return mock redirect URL (frontend will simulate)
    return {
      success: true,
      sessionId,
      redirectUrl: `http://localhost:3000/wallet?mock_session=${sessionId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create deposit session",
    };
  }
}

/**
 * Create a mock withdrawal session
 * Note: Balance validation should be done on-chain before calling this
 */
export async function createWithdrawalSessionMock(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  const sessionId = `mock_withdrawal_${randomUUID()}`;

  try {
    // Get wallet (balance is on-chain, not in DB)
    const wallet = await prisma.wallet.findFirst({
      where: { userId: params.userId },
    });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Note: In mock mode, we skip balance validation - in production this would
    // check on-chain USDC balance via the wallet address

    // Create MoonPayTransaction record
    await prisma.moonPayTransaction.create({
      data: {
        sessionId,
        walletId: wallet.id,
        type: "withdrawal",
        status: "pending",
        fiatAmount: params.amount * 18.5, // Mock ZAR conversion
        fiatCurrency: params.fiatCurrency,
        cryptoAmount: params.amount,
        cryptoCurrency: "USDC",
        redirectUrl: `http://localhost:3000/wallet?mock_session=${sessionId}`,
      },
    });

    return {
      success: true,
      sessionId,
      redirectUrl: `http://localhost:3000/wallet?mock_session=${sessionId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create withdrawal session",
    };
  }
}

/**
 * Process MoonPay webhook (mock version)
 * Handles both deposits (mint USDC) and withdrawals (burn USDC)
 *
 * Note: In mock mode, actual token minting/burning is simulated.
 * In production, MoonPay handles the actual transfers.
 */
export async function processWebhookMock(
  payload: WebhookPayload
): Promise<void> {
  const transaction = await prisma.moonPayTransaction.findUnique({
    where: { sessionId: payload.sessionId },
    include: { wallet: true },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (payload.status === "completed") {
    // In mock mode, we just record the transaction without actual on-chain operations
    // Real deposits/withdrawals would involve MoonPay handling the crypto transfer
    // For testnet testing, users can use the faucet to get USDC

    // Update transaction status
    await prisma.moonPayTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        webhookData: payload as object,
      },
    });

    // Create wallet transaction record for audit trail
    await prisma.walletTransaction.create({
      data: {
        walletId: transaction.walletId,
        type: transaction.type === "deposit" ? "DEPOSIT" : "WITHDRAWAL",
        amount: BigInt(Math.floor(payload.cryptoAmount * 1_000_000)),
        status: "CONFIRMED",
      },
    });
  } else if (payload.status === "failed") {
    // Mark transaction as failed
    await prisma.moonPayTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "failed",
        webhookData: payload as object,
      },
    });
  }
}
