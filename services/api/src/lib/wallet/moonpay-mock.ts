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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create deposit session",
    };
  }
}

/**
 * Create a mock withdrawal session
 * Validates balance before creating session
 */
export async function createWithdrawalSessionMock(
  params: CreateSessionParams
): Promise<CreateSessionResult> {
  const sessionId = `mock_withdrawal_${randomUUID()}`;

  try {
    // Get wallet to check balance
    const wallet = await prisma.wallet.findFirst({
      where: { userId: params.userId },
    });

    if (!wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    const balance = BigInt(wallet.balance);
    const withdrawAmount = BigInt(Math.floor(params.amount * 1_000_000));

    if (balance < withdrawAmount) {
      return {
        success: false,
        error: "Insufficient balance",
      };
    }

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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create withdrawal session",
    };
  }
}

/**
 * Process MoonPay webhook (mock version)
 * Handles both deposits (mint USDC) and withdrawals (burn USDC)
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
    if (transaction.type === "deposit") {
      // Mint USDC to user's wallet (testnet only)
      const { mintUSDC } = await import("./faucet-service");
      await mintUSDC(
        transaction.wallet.address,
        BigInt(Math.floor(payload.cryptoAmount * 1_000_000))
      );
    } else if (transaction.type === "withdrawal") {
      // Burn USDC from user's wallet (mock - just deduct from balance)
      // In real mode, this would transfer USDC to MoonPay's wallet
      const burnAmount = BigInt(Math.floor(payload.cryptoAmount * 1_000_000));
      await prisma.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: {
            decrement: burnAmount.toString(),
          },
        },
      });
    }

    // Update transaction status
    await prisma.moonPayTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        webhookData: payload as any,
      },
    });

    // Create wallet transaction record
    await prisma.walletTransaction.create({
      data: {
        walletId: transaction.walletId,
        type: transaction.type === "deposit" ? "DEPOSIT" : "WITHDRAWAL",
        amount: BigInt(Math.floor(payload.cryptoAmount * 1_000_000)).toString(),
        status: "CONFIRMED",
        createdAt: new Date(),
      },
    });
  } else if (payload.status === "failed") {
    // Mark transaction as failed
    await prisma.moonPayTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "failed",
        webhookData: payload as any,
      },
    });
  }
}
