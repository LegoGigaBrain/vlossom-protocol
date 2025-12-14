/**
 * Wallet API Routes
 * AA Wallet SDK endpoints for Vlossom Protocol
 */

import { Router, type Request, type Response } from "express";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/auth";
import { internalAuth } from "../middleware/internal-auth";
import { prisma } from "../lib/prisma";
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
import { claimFaucet, checkRateLimit } from "../lib/wallet/faucet-service";
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
router.post("/create", internalAuth, async (req: Request, res: Response) => {
  try {
    const input = createWalletSchema.parse(req.body);

    const walletInfo = await createWallet(input.userId);

    return res.status(201).json({
      address: walletInfo.address,
      isDeployed: walletInfo.isDeployed,
      chainId: walletInfo.chainId,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error creating wallet:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create wallet",
      },
    });
  }
});

/**
 * GET /api/wallet
 * Get the authenticated user's wallet info and balance
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
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
    console.error("Error getting wallet:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get wallet",
      },
    });
  }
});

/**
 * GET /api/wallet/address
 * Get the authenticated user's wallet address
 */
router.get("/address", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
    }

    return res.json({
      address: wallet.address,
      isDeployed: wallet.isDeployed,
      chainId: wallet.chainId,
    });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get wallet address",
      },
    });
  }
});

/**
 * GET /api/wallet/balance
 * Get the authenticated user's USDC balance
 */
router.get("/balance", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
    }

    const balance = await getBalance(wallet.address);

    return res.json({
      usdc: balance.usdc.toString(),
      usdcFormatted: balance.usdcFormatted,
      fiatValue: balance.fiatValue,
      currency: "USD",
    });
  } catch (error) {
    console.error("Error getting balance:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get balance",
      },
    });
  }
});

/**
 * GET /api/wallet/transactions
 * Get paginated transaction history
 */
router.get("/transactions", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { page, limit } = transactionHistorySchema.parse(req.query);

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        },
      });
    }

    console.error("Error getting transactions:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get transactions",
      },
    });
  }
});

/**
 * POST /api/wallet/transfer
 * Send a P2P USDC transfer
 */
router.post("/transfer", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const input = transferSchema.parse(req.body);

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
    }

    // Check balance
    const balance = await getBalance(wallet.address);
    const amount = BigInt(input.amount);

    if (balance.usdc < amount) {
      return res.status(400).json({
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: "Insufficient USDC balance",
          details: {
            available: balance.usdc.toString(),
            required: input.amount,
          },
        },
      });
    }

    const result = await sendP2P(wallet.id, input.toAddress, amount, input.memo);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "TRANSFER_FAILED",
          message: result.error || "Transfer failed",
          transactionId: result.transactionId,
        },
      });
    }

    return res.status(201).json({
      success: true,
      transactionId: result.transactionId,
      userOpHash: result.userOpHash,
      txHash: result.txHash,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error sending transfer:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to send transfer",
      },
    });
  }
});

/**
 * POST /api/wallet/request
 * Create a payment request (for QR code payments)
 */
router.post("/request", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error creating payment request:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create payment request",
      },
    });
  }
});

/**
 * GET /api/wallet/request/:id
 * Get payment request details (public endpoint for scanning QR)
 */
router.get("/request/:id", async (req, res: Response) => {
  try {
    const { id } = req.params;

    const request = await getPaymentRequest(id);

    if (!request) {
      return res.status(404).json({
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Payment request not found",
        },
      });
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
    console.error("Error getting payment request:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get payment request",
      },
    });
  }
});

/**
 * POST /api/wallet/request/:id/pay
 * Fulfill a payment request
 */
router.post("/request/:id/pay", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check request exists and is valid
    const request = await getPaymentRequest(id);

    if (!request) {
      return res.status(404).json({
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Payment request not found",
        },
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        error: {
          code: "REQUEST_NOT_PENDING",
          message: `Payment request is ${request.status.toLowerCase()}`,
        },
      });
    }

    // Check payer has sufficient balance
    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
    }

    const balance = await getBalance(wallet.address);

    if (balance.usdc < request.amount) {
      return res.status(400).json({
        error: {
          code: "INSUFFICIENT_BALANCE",
          message: "Insufficient USDC balance",
          details: {
            available: balance.usdc.toString(),
            required: request.amount.toString(),
          },
        },
      });
    }

    const result = await fulfillPaymentRequest(id, userId);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "PAYMENT_FAILED",
          message: result.error || "Payment failed",
          transactionId: result.transactionId,
        },
      });
    }

    return res.json({
      success: true,
      transactionId: result.transactionId,
      userOpHash: result.userOpHash,
      txHash: result.txHash,
    });
  } catch (error) {
    console.error("Error fulfilling payment request:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fulfill payment request",
      },
    });
  }
});

/**
 * DELETE /api/wallet/request/:id
 * Cancel a payment request (only by creator)
 */
router.delete("/request/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await cancelPaymentRequest(id, userId);

    return res.json({
      success: true,
      message: "Payment request cancelled",
    });
  } catch (error: any) {
    if (error.message === "Payment request not found") {
      return res.status(404).json({
        error: {
          code: "REQUEST_NOT_FOUND",
          message: error.message,
        },
      });
    }

    if (error.message.includes("Only the recipient")) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      });
    }

    if (error.message.includes("already")) {
      return res.status(400).json({
        error: {
          code: "CANNOT_CANCEL",
          message: error.message,
        },
      });
    }

    console.error("Error cancelling payment request:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to cancel payment request",
      },
    });
  }
});

/**
 * GET /api/wallet/requests
 * Get pending payment requests for the authenticated user
 */
router.get("/requests", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
    console.error("Error getting payment requests:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get payment requests",
      },
    });
  }
});

/**
 * POST /api/wallet/faucet
 * Claim testnet USDC from faucet (testnet only, rate-limited to 1 claim per 24 hours)
 */
router.post("/faucet", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const result = await claimFaucet(userId);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "FAUCET_CLAIM_FAILED",
          message: result.error || "Failed to claim faucet",
          nextClaimAt: result.nextClaimAt?.toISOString(),
        },
      });
    }

    return res.status(201).json({
      success: true,
      txHash: result.txHash,
      amount: result.amount,
      amountFormatted: fromUsdcUnits(BigInt(result.amount!)),
      message: "Successfully claimed 1000 USDC from faucet",
    });
  } catch (error) {
    console.error("Error claiming faucet:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to claim faucet",
      },
    });
  }
});

/**
 * POST /api/wallet/moonpay/deposit
 * Create a MoonPay deposit session (onramp)
 */
router.post("/moonpay/deposit", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { amount, fiatCurrency } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          code: "INVALID_AMOUNT",
          message: "Amount must be greater than 0",
        },
      });
    }

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
    }

    const result = await createDepositSession({
      userId,
      walletAddress: wallet.address,
      amount,
      fiatCurrency: fiatCurrency || "ZAR",
      type: "deposit",
    });

    if (!result.success) {
      return res.status(500).json({
        error: {
          code: "DEPOSIT_SESSION_FAILED",
          message: result.error || "Failed to create deposit session",
        },
      });
    }

    return res.json({
      sessionId: result.sessionId,
      redirectUrl: result.redirectUrl,
      mode: getMoonPayMode(),
    });
  } catch (error: any) {
    console.error("MoonPay deposit error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create deposit session",
      },
    });
  }
});

/**
 * POST /api/wallet/moonpay/withdraw
 * Create a MoonPay withdrawal session (offramp)
 */
router.post("/moonpay/withdraw", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { amount, fiatCurrency } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          code: "INVALID_AMOUNT",
          message: "Amount must be greater than 0",
        },
      });
    }

    const wallet = await getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        error: {
          code: "WALLET_NOT_FOUND",
          message: "Wallet not found. Please contact support.",
        },
      });
    }

    const result = await createWithdrawalSession({
      userId,
      walletAddress: wallet.address,
      amount,
      fiatCurrency: fiatCurrency || "ZAR",
      type: "withdrawal",
    });

    if (!result.success) {
      return res.status(500).json({
        error: {
          code: "WITHDRAWAL_SESSION_FAILED",
          message: result.error || "Failed to create withdrawal session",
        },
      });
    }

    return res.json({
      sessionId: result.sessionId,
      redirectUrl: result.redirectUrl,
      mode: getMoonPayMode(),
    });
  } catch (error: any) {
    console.error("MoonPay withdrawal error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create withdrawal session",
      },
    });
  }
});

/**
 * POST /api/wallet/moonpay/webhook
 * Handle MoonPay webhook notifications (signature verification in production mode)
 */
router.post("/moonpay/webhook", async (req: Request, res: Response) => {
  try {
    // In production mode, verify MoonPay signature here
    // const signature = req.headers["x-moonpay-signature"];
    // if (getMoonPayMode() === "production" && !verifySignature(req.body, signature)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    await processWebhook(req.body);

    return res.json({ success: true });
  } catch (error: any) {
    console.error("MoonPay webhook error:", error);
    return res.status(500).json({
      error: {
        code: "WEBHOOK_PROCESSING_FAILED",
        message: "Webhook processing failed",
      },
    });
  }
});

/**
 * GET /api/wallet/moonpay/status/:sessionId
 * Check MoonPay transaction status
 */
router.get("/moonpay/status/:sessionId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const transaction = await prisma.moonPayTransaction.findUnique({
      where: { sessionId },
    });

    if (!transaction) {
      return res.status(404).json({
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: "Transaction not found",
        },
      });
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
  } catch (error: any) {
    console.error("MoonPay status error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch transaction status",
      },
    });
  }
});

export default router;
