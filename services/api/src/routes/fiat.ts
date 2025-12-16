/**
 * Fiat On/Off-Ramp Routes
 * Handles ZAR ↔ USDC conversions via Kotani Pay
 */

import { Router, Request, Response, IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { rateLimiters } from "../middleware/rate-limiter";
import {
  initiateOnramp,
  initiateOfframp,
  getTransactionStatus,
  getExchangeRate,
  verifyWebhookSignature,
  processWebhook,
  getKotaniMode,
  KotaniWebhookPayload,
  PaymentChannel,
  SupportedCurrency,
  SOUTH_AFRICA_BANKS,
  DEFAULT_LIMITS,
} from "../lib/kotani";

const router: IRouter = Router();

// ============================================
// Validation Schemas
// ============================================

const initiateOnrampSchema = z.object({
  fiatAmount: z.number().positive().min(50).max(50000),
  fiatCurrency: z.enum(["ZAR", "KES", "GHS", "NGN", "UGX"]).default("ZAR"),
  paymentChannel: z.enum(["mobile_money", "bank_transfer", "ussd"]).default("bank_transfer"),
  phoneNumber: z.string().optional(),
});

const initiateOfframpSchema = z.object({
  cryptoAmount: z.number().positive().min(5).max(5000),
  fiatCurrency: z.enum(["ZAR", "KES", "GHS", "NGN", "UGX"]).default("ZAR"),
  paymentChannel: z.enum(["mobile_money", "bank_transfer"]).default("bank_transfer"),
  phoneNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  bankCode: z.string().optional(),
  accountName: z.string().optional(),
});

const getRateSchema = z.object({
  fiatCurrency: z.enum(["ZAR", "KES", "GHS", "NGN", "UGX"]).default("ZAR"),
  amount: z.number().positive(),
  type: z.enum(["buy", "sell"]),
});

// ============================================
// Routes
// ============================================

/**
 * GET /api/v1/fiat/config
 * Get fiat ramp configuration (limits, supported currencies, etc.)
 */
router.get("/config", authenticate, async (_req: Request, res: Response) => {
  try {
    res.json({
      mode: getKotaniMode(),
      supportedCurrencies: ["ZAR", "KES", "GHS", "NGN", "UGX"],
      defaultCurrency: "ZAR",
      paymentChannels: ["bank_transfer", "mobile_money", "ussd"],
      limits: DEFAULT_LIMITS,
      banks: SOUTH_AFRICA_BANKS,
      fees: {
        onrampPercent: 2.0,
        offrampPercent: 2.0,
        networkFee: 0.5, // USDC
      },
    });
  } catch (error) {
    logger.error("Error getting fiat config", { error });
    res.status(500).json({ error: "Failed to get configuration" });
  }
});

/**
 * GET /api/v1/fiat/rates
 * Get current exchange rates
 */
router.get("/rates", authenticate, async (req: Request, res: Response) => {
  try {
    const query = getRateSchema.parse({
      fiatCurrency: req.query.currency || "ZAR",
      amount: parseFloat(req.query.amount as string) || 100,
      type: req.query.type || "buy",
    });

    const rate = await getExchangeRate({
      fiatCurrency: query.fiatCurrency as SupportedCurrency,
      cryptoCurrency: "USDC",
      amount: query.amount,
      type: query.type,
    });

    if (!rate) {
      return res.status(503).json({ error: "Unable to fetch exchange rates" });
    }

    res.json({
      ...rate,
      mode: getKotaniMode(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid parameters", details: error.errors });
    }
    logger.error("Error getting exchange rate", { error });
    res.status(500).json({ error: "Failed to get exchange rate" });
  }
});

/**
 * POST /api/v1/fiat/onramp/initiate
 * Start an on-ramp transaction (ZAR → USDC)
 */
router.post(
  "/onramp/initiate",
  authenticate,
  rateLimiters.login,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const body = initiateOnrampSchema.parse(req.body);

      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true, email: true, displayName: true },
      });

      if (!user?.walletAddress) {
        return res.status(400).json({ error: "User wallet not found" });
      }

      logger.info("[Fiat] Initiating onramp", {
        userId,
        amount: body.fiatAmount,
        currency: body.fiatCurrency,
      });

      const result = await initiateOnramp({
        userId,
        walletAddress: user.walletAddress,
        fiatAmount: body.fiatAmount,
        fiatCurrency: body.fiatCurrency as SupportedCurrency,
        cryptoCurrency: "USDC",
        paymentChannel: body.paymentChannel as PaymentChannel,
        phoneNumber: body.phoneNumber,
        customerEmail: user.email || undefined,
        customerName: user.displayName || undefined,
        metadata: {
          source: "vlossom_wallet",
        },
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          errorCode: result.errorCode,
        });
      }

      // Store transaction record (would create in database)
      // await prisma.fiatTransaction.create(...)

      res.json({
        success: true,
        transactionId: result.transactionId,
        paymentReference: result.paymentReference,
        paymentUrl: result.paymentUrl,
        paymentInstructions: result.paymentInstructions,
        estimatedCryptoAmount: result.estimatedCryptoAmount,
        exchangeRate: result.exchangeRate,
        fees: result.fees,
        expiresAt: result.expiresAt,
        mode: getKotaniMode(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      logger.error("Error initiating onramp", { error });
      res.status(500).json({ error: "Failed to initiate deposit" });
    }
  }
);

/**
 * POST /api/v1/fiat/offramp/initiate
 * Start an off-ramp transaction (USDC → ZAR)
 */
router.post(
  "/offramp/initiate",
  authenticate,
  rateLimiters.login,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const body = initiateOfframpSchema.parse(req.body);

      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true, email: true },
      });

      if (!user?.walletAddress) {
        return res.status(400).json({ error: "User wallet not found" });
      }

      // Validate payout details
      if (body.paymentChannel === "bank_transfer") {
        if (!body.bankAccount || !body.bankCode || !body.accountName) {
          return res.status(400).json({
            error: "Bank account details required for bank transfer",
          });
        }
      } else if (body.paymentChannel === "mobile_money") {
        if (!body.phoneNumber) {
          return res.status(400).json({
            error: "Phone number required for mobile money",
          });
        }
      }

      logger.info("[Fiat] Initiating offramp", {
        userId,
        amount: body.cryptoAmount,
        currency: body.fiatCurrency,
      });

      const result = await initiateOfframp({
        userId,
        walletAddress: user.walletAddress,
        cryptoAmount: body.cryptoAmount,
        cryptoCurrency: "USDC",
        fiatCurrency: body.fiatCurrency as SupportedCurrency,
        paymentChannel: body.paymentChannel as PaymentChannel,
        phoneNumber: body.phoneNumber,
        bankAccount: body.bankAccount,
        bankCode: body.bankCode,
        accountName: body.accountName,
        customerEmail: user.email || undefined,
        metadata: {
          source: "vlossom_wallet",
        },
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          errorCode: result.errorCode,
        });
      }

      res.json({
        success: true,
        transactionId: result.transactionId,
        estimatedFiatAmount: result.estimatedFiatAmount,
        exchangeRate: result.exchangeRate,
        fees: result.fees,
        processingTime: result.processingTime,
        mode: getKotaniMode(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      logger.error("Error initiating offramp", { error });
      res.status(500).json({ error: "Failed to initiate withdrawal" });
    }
  }
);

/**
 * GET /api/v1/fiat/transactions/:id
 * Get status of a fiat transaction
 */
router.get(
  "/transactions/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const status = await getTransactionStatus(id);

      if (!status) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json({
        ...status,
        mode: getKotaniMode(),
      });
    } catch (error) {
      logger.error("Error getting transaction status", { error });
      res.status(500).json({ error: "Failed to get transaction status" });
    }
  }
);

/**
 * GET /api/v1/fiat/transactions
 * Get user's fiat transaction history
 */
router.get(
  "/transactions",
  authenticate,
  async (_req: Request, res: Response) => {
    try {
      // In production, fetch from database using:
      // req.userId, req.query.type, req.query.status, req.query.limit
      // const transactions = await prisma.fiatTransaction.findMany(...)

      // For now, return empty array (sandbox mode)
      res.json({
        transactions: [],
        total: 0,
        mode: getKotaniMode(),
      });
    } catch (error) {
      logger.error("Error getting transactions", { error });
      res.status(500).json({ error: "Failed to get transactions" });
    }
  }
);

/**
 * POST /api/v1/fiat/webhook
 * Webhook endpoint for Kotani Pay callbacks
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-kotani-signature"] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature || "")) {
      logger.warn("[Fiat] Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const webhookPayload = req.body as KotaniWebhookPayload;

    logger.info("[Fiat] Received webhook", {
      event: webhookPayload.event,
      transactionId: webhookPayload.transactionId,
    });

    // Process the webhook
    await processWebhook(webhookPayload);

    res.json({ received: true });
  } catch (error) {
    logger.error("Error processing webhook", { error });
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * GET /api/v1/fiat/banks
 * Get list of supported banks for a country
 */
router.get("/banks", authenticate, async (req: Request, res: Response) => {
  try {
    const { country = "ZA" } = req.query;

    // Currently only South Africa supported
    if (country === "ZA") {
      return res.json({ banks: SOUTH_AFRICA_BANKS });
    }

    res.json({ banks: [] });
  } catch (error) {
    logger.error("Error getting banks", { error });
    res.status(500).json({ error: "Failed to get banks" });
  }
});

export default router;
