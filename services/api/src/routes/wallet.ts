/**
 * Wallet API Routes
 * AA Wallet SDK endpoints for Vlossom Protocol
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/auth";
import { internalAuth } from "../middleware/internal-auth";
import { prisma } from "../lib/prisma";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { z } from "zod";
import {
  createWalletSchema,
  transferSchema,
  createPaymentRequestSchema,
  transactionHistorySchema,
} from "../lib/validation";
import {
  createWallet,
  getWallet,
  getBalance,
  getTransactions,
  sendP2P,
  createPaymentRequest,
  getPaymentRequest,
  fulfillPaymentRequest,
  cancelPaymentRequest,
  getPendingPaymentRequests,
  fromUsdcUnits,
} from "../lib/wallet";
import { claimFaucet } from "../lib/wallet/faucet-service";
import {
  createDepositSession,
  createWithdrawalSession,
  processWebhook,
  getMoonPayMode,
} from "../lib/wallet/moonpay-service";

const router: ReturnType<typeof Router> = Router();

/**
 * POST /api/wallet/create
 * Create a new wallet for a user (internal endpoint - called on signup)
 */
router.post("/create", internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createWalletSchema.parse(req.body);
    const walletInfo = await createWallet(input.userId);

    return res.status(201).json({
      address: walletInfo.address,
      isDeployed: walletInfo.isDeployed,
      chainId: walletInfo.chainId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error creating wallet", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet
 * Get the authenticated user's wallet info and balance
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    const balance = await getBalance(wallet.address);

    return res.json({
      id: wallet.id,
      address: wallet.address,
      chainId: wallet.chainId,
      isDeployed: wallet.isDeployed,
      balance: {
        usdc: balance.usdc.toString(),
        usdcFormatted: balance.usdcFormatted,
        fiatValue: balance.fiatValue,
      },
    });
  } catch (error) {
    logger.error("Error getting wallet", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet/address
 * Get the authenticated user's wallet address
 */
router.get("/address", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    return res.json({
      address: wallet.address,
      isDeployed: wallet.isDeployed,
      chainId: wallet.chainId,
    });
  } catch (error) {
    logger.error("Error getting wallet address", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet/balance
 * Get the authenticated user's USDC balance
 */
router.get("/balance", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    const balance = await getBalance(wallet.address);

    return res.json({
      usdc: balance.usdc.toString(),
      usdcFormatted: balance.usdcFormatted,
      fiatValue: balance.fiatValue,
      currency: "USD",
    });
  } catch (error) {
    logger.error("Error getting balance", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet/transactions
 * Get paginated transaction history
 */
router.get("/transactions", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { page, limit } = transactionHistorySchema.parse(req.query);

    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    const result = await getTransactions(wallet.id, page, limit);

    return res.json({
      transactions: result.transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        amountFormatted: fromUsdcUnits(tx.amount),
        token: tx.token,
        counterparty: tx.counterparty,
        txHash: tx.txHash,
        status: tx.status,
        memo: tx.memo,
        createdAt: tx.createdAt.toISOString(),
        confirmedAt: tx.confirmedAt?.toISOString() ?? null,
      })),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error getting transactions", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/transfer
 * Send a P2P USDC transfer
 */
router.post("/transfer", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = transferSchema.parse(req.body);

    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    // Check balance
    const balance = await getBalance(wallet.address);
    const amount = BigInt(input.amount);

    if (balance.usdc < amount) {
      return next(createError("INSUFFICIENT_BALANCE", {
        available: balance.usdc.toString(),
        required: input.amount,
      }));
    }

    const result = await sendP2P(wallet.id, input.toAddress, amount, input.memo);

    if (!result.success) {
      return next(createError("PAYMENT_FAILED", {
        message: result.error,
        transactionId: result.transactionId,
      }));
    }

    return res.status(201).json({
      success: true,
      transactionId: result.transactionId,
      userOpHash: result.userOpHash,
      txHash: result.txHash,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error sending transfer", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/request
 * Create a payment request (for QR code payments)
 */
router.post("/request", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = createPaymentRequestSchema.parse(req.body);

    const requestData = await createPaymentRequest(
      userId,
      BigInt(input.amount),
      input.memo,
      input.expiresInMinutes
    );

    return res.status(201).json({
      requestId: requestData.requestId,
      recipientAddress: requestData.recipientAddress,
      amount: requestData.amount.toString(),
      amountFormatted: requestData.amountFormatted,
      memo: requestData.memo,
      expiresAt: requestData.expiresAt.toISOString(),
      qrData: requestData.qrData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error creating payment request", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet/request/:id
 * Get payment request details (public endpoint for scanning QR)
 */
router.get("/request/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getPaymentRequest(id);

    if (!request) {
      return next(createError("NOT_FOUND", { message: "Payment request not found" }));
    }

    return res.json({
      id: request.id,
      status: request.status,
      amount: request.amount.toString(),
      amountFormatted: fromUsdcUnits(request.amount),
      memo: request.memo,
      expiresAt: request.expiresAt.toISOString(),
      createdAt: request.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Error getting payment request", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/request/:id/pay
 * Fulfill a payment request
 */
router.post("/request/:id/pay", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check request exists and is valid
    const request = await getPaymentRequest(id);

    if (!request) {
      return next(createError("NOT_FOUND", { message: "Payment request not found" }));
    }

    if (request.status !== "PENDING") {
      return next(createError("INVALID_STATUS", {
        message: `Payment request is ${request.status.toLowerCase()}`
      }));
    }

    // Check payer has sufficient balance
    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    const balance = await getBalance(wallet.address);

    if (balance.usdc < request.amount) {
      return next(createError("INSUFFICIENT_BALANCE", {
        available: balance.usdc.toString(),
        required: request.amount.toString(),
      }));
    }

    const result = await fulfillPaymentRequest(id, userId);

    if (!result.success) {
      return next(createError("PAYMENT_FAILED", {
        message: result.error,
        transactionId: result.transactionId,
      }));
    }

    return res.json({
      success: true,
      transactionId: result.transactionId,
      userOpHash: result.userOpHash,
      txHash: result.txHash,
    });
  } catch (error) {
    logger.error("Error fulfilling payment request", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/wallet/request/:id
 * Cancel a payment request (only by creator)
 */
router.delete("/request/:id", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await cancelPaymentRequest(id, userId);

    return res.json({
      success: true,
      message: "Payment request cancelled",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Payment request not found") {
      return next(createError("NOT_FOUND", { message: errorMessage }));
    }
    if (errorMessage.includes("Only the recipient")) {
      return next(createError("FORBIDDEN"));
    }
    if (errorMessage.includes("already")) {
      return next(createError("CANNOT_CANCEL", { message: errorMessage }));
    }

    logger.error("Error cancelling payment request", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet/requests
 * Get pending payment requests for the authenticated user
 */
router.get("/requests", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const requests = await getPendingPaymentRequests(userId);

    return res.json({
      requests: requests.map((r) => ({
        id: r.id,
        amount: r.amount.toString(),
        amountFormatted: fromUsdcUnits(r.amount),
        memo: r.memo,
        status: r.status,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Error getting payment requests", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/faucet
 * Claim testnet USDC from faucet (testnet only, rate-limited to 1 claim per 24 hours)
 */
router.post("/faucet", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const result = await claimFaucet(userId);

    if (!result.success) {
      return next(createError("FAUCET_RATE_LIMITED", {
        message: result.error,
        nextClaimAt: result.nextClaimAt?.toISOString(),
      }));
    }

    return res.status(201).json({
      success: true,
      txHash: result.txHash,
      amount: result.amount,
      amountFormatted: fromUsdcUnits(BigInt(result.amount!)),
      message: "Successfully claimed 1000 USDC from faucet",
    });
  } catch (error) {
    logger.error("Error claiming faucet", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/moonpay/deposit
 * Create a MoonPay deposit session (onramp)
 */
router.post("/moonpay/deposit", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { amount, fiatCurrency } = req.body;

    if (!amount || amount <= 0) {
      return next(createError("VALIDATION_ERROR", { message: "Amount must be greater than 0" }));
    }

    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    const result = await createDepositSession({
      userId,
      walletAddress: wallet.address,
      amount,
      fiatCurrency: fiatCurrency || "ZAR",
      type: "deposit",
    });

    if (!result.success) {
      return next(createError("SERVICE_UNAVAILABLE", { message: result.error }));
    }

    return res.json({
      sessionId: result.sessionId,
      redirectUrl: result.redirectUrl,
      mode: getMoonPayMode(),
    });
  } catch (error) {
    logger.error("MoonPay deposit error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/moonpay/withdraw
 * Create a MoonPay withdrawal session (offramp)
 */
router.post("/moonpay/withdraw", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { amount, fiatCurrency } = req.body;

    if (!amount || amount <= 0) {
      return next(createError("VALIDATION_ERROR", { message: "Amount must be greater than 0" }));
    }

    const wallet = await getWallet(userId);

    if (!wallet) {
      return next(createError("WALLET_NOT_FOUND"));
    }

    const result = await createWithdrawalSession({
      userId,
      walletAddress: wallet.address,
      amount,
      fiatCurrency: fiatCurrency || "ZAR",
      type: "withdrawal",
    });

    if (!result.success) {
      return next(createError("SERVICE_UNAVAILABLE", { message: result.error }));
    }

    return res.json({
      sessionId: result.sessionId,
      redirectUrl: result.redirectUrl,
      mode: getMoonPayMode(),
    });
  } catch (error) {
    logger.error("MoonPay withdrawal error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/wallet/moonpay/webhook
 * Handle MoonPay webhook notifications (signature verification in production mode)
 */
router.post("/moonpay/webhook", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production mode, verify MoonPay signature here
    await processWebhook(req.body);
    return res.json({ success: true });
  } catch (error) {
    logger.error("MoonPay webhook error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/wallet/moonpay/status/:sessionId
 * Check MoonPay transaction status
 */
router.get("/moonpay/status/:sessionId", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const transaction = await prisma.moonPayTransaction.findUnique({
      where: { sessionId },
    });

    if (!transaction) {
      return next(createError("NOT_FOUND", { message: "Transaction not found" }));
    }

    return res.json({
      sessionId: transaction.sessionId,
      type: transaction.type,
      status: transaction.status,
      fiatAmount: transaction.fiatAmount.toString(),
      fiatCurrency: transaction.fiatCurrency,
      cryptoAmount: transaction.cryptoAmount.toString(),
      completedAt: transaction.completedAt?.toISOString() ?? null,
    });
  } catch (error) {
    logger.error("MoonPay status error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
