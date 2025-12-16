/**
 * Admin Paymaster API Routes (F5.1)
 * Endpoints for paymaster monitoring dashboard
 */

import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { PaymasterMonitor, BalanceAlertService, AlertConfig } from "../../lib/paymaster";
import { createError } from "../../middleware/error-handler";

const router: ReturnType<typeof Router> = Router();

// Initialize services (these should be injected in production)
let paymasterMonitor: PaymasterMonitor | null = null;
let alertService: BalanceAlertService | null = null;

/**
 * Initialize paymaster services
 */
export function initPaymasterRoutes(
  prisma: PrismaClient,
  paymasterAddress: string,
  options?: {
    slackWebhookUrl?: string;
  }
): ReturnType<typeof Router> {
  paymasterMonitor = new PaymasterMonitor(prisma, paymasterAddress);
  alertService = new BalanceAlertService(prisma, {
    slackWebhookUrl: options?.slackWebhookUrl,
  });

  // Initialize default alerts
  alertService.initializeDefaultAlerts().catch(console.error);

  return router;
}

/**
 * Middleware to check admin authorization
 */
function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  // In production, verify JWT and check admin role
  const user = (req as Request & { user?: { roles: string[] } }).user;

  if (!user || !user.roles.includes("ADMIN")) {
    return next(createError("ADMIN_REQUIRED"));
  }

  next();
}

/**
 * GET /api/admin/paymaster/stats
 * Get comprehensive paymaster statistics
 */
router.get("/stats", requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!paymasterMonitor) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    const stats = await paymasterMonitor.getStats();

    // Convert BigInt to string for JSON serialization
    res.json({
      currentBalance: {
        wei: stats.currentBalanceWei.toString(),
        eth: stats.currentBalanceEth,
      },
      transactions: {
        total: stats.totalTransactions,
        successful: stats.successfulTransactions,
        failed: stats.failedTransactions,
        successRate: stats.successRate,
      },
      gas: {
        totalSponsored: stats.totalGasSponsored.toString(),
        totalCostWei: stats.totalCostWei.toString(),
        totalCostEth: stats.totalCostEth,
        averagePerTx: stats.averageCostPerTx.toString(),
      },
      last24h: {
        transactions: stats.transactionsLast24h,
        costWei: stats.costLast24hWei.toString(),
        costEth: stats.costLast24hEth,
      },
      users: {
        total: stats.uniqueUsers,
        last24h: stats.uniqueUsersLast24h,
      },
    });
  } catch (error) {
    console.error("Error fetching paymaster stats:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/admin/paymaster/transactions
 * Get paginated transaction history
 */
router.get("/transactions", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!paymasterMonitor) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    const querySchema = z.object({
      page: z.coerce.number().positive().optional(),
      pageSize: z.coerce.number().positive().max(100).optional(),
      status: z.enum(["PENDING", "SUCCESS", "FAILED"]).optional(),
      sender: z.string().optional(),
    });

    const query = querySchema.parse(req.query);

    const result = await paymasterMonitor.getTransactions(query);

    // Convert BigInt to string for JSON serialization
    res.json({
      items: result.items.map((tx) => ({
        id: tx.id,
        userOpHash: tx.userOpHash,
        sender: tx.sender,
        gasUsed: tx.gasUsed.toString(),
        gasPrice: tx.gasPrice.toString(),
        totalCost: tx.totalCost.toString(),
        txHash: tx.txHash,
        status: tx.status,
        error: tx.error,
        createdAt: tx.createdAt.toISOString(),
        confirmedAt: tx.confirmedAt?.toISOString() ?? null,
      })),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Error fetching transactions:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/admin/paymaster/gas-usage
 * Get gas usage history for charts
 */
router.get("/gas-usage", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!paymasterMonitor) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    const querySchema = z.object({
      days: z.coerce.number().positive().max(90).optional(),
    });

    const { days = 30 } = querySchema.parse(req.query);

    const history = await paymasterMonitor.getGasUsageHistory(days);

    // Convert BigInt to string for JSON serialization
    res.json({
      data: history.map((point) => ({
        date: point.date,
        totalTransactions: point.totalTransactions,
        totalGasUsed: point.totalGasUsed.toString(),
        totalCostWei: point.totalCostWei.toString(),
        successRate: point.successRate,
        uniqueUsers: point.uniqueUsers,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Error fetching gas usage:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/admin/paymaster/alerts
 * Get alert configurations
 */
router.get("/alerts", requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!alertService) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    const configs = await alertService.getAlertConfigs();
    res.json({ alerts: configs });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/admin/paymaster/alerts/config
 * Update alert configuration
 */
router.post("/alerts/config", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!alertService) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    const bodySchema = z.object({
      type: z.enum(["LOW_BALANCE", "HIGH_USAGE", "ERROR_RATE"]),
      threshold: z.number().positive(),
      isActive: z.boolean(),
      notifySlack: z.boolean(),
      notifyEmail: z.boolean(),
      emailRecipients: z.string().optional(),
    });

    const config = bodySchema.parse(req.body) as AlertConfig;

    await alertService.updateAlertConfig(config);
    res.json({ success: true, config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Error updating alert config:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/admin/paymaster/alerts/check
 * Manually trigger alert check
 */
router.post("/alerts/check", requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!paymasterMonitor || !alertService) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    const triggers = await paymasterMonitor.checkAlerts();

    if (triggers.length > 0) {
      await alertService.sendAlerts(triggers);
    }

    res.json({
      checked: true,
      triggeredAlerts: triggers.length,
      alerts: triggers,
    });
  } catch (error) {
    console.error("Error checking alerts:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/admin/paymaster/stats/refresh
 * Refresh daily stats (normally called by cron)
 */
router.post("/stats/refresh", requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!paymasterMonitor) {
      return next(createError("SERVICE_NOT_INITIALIZED"));
    }

    await paymasterMonitor.updateDailyStats();
    res.json({ success: true, message: "Daily stats refreshed" });
  } catch (error) {
    console.error("Error refreshing stats:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
