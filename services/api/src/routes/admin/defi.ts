/**
 * Admin DeFi API Routes (V4.0)
 * Endpoints for DeFi administration dashboard
 *
 * Routes:
 * GET    /api/v1/admin/defi/stats         - Get DeFi statistics
 * PUT    /api/v1/admin/defi/apy-params    - Update APY parameters
 * PUT    /api/v1/admin/defi/fee-split     - Update fee split configuration
 * POST   /api/v1/admin/defi/pools/:id/pause   - Pause a pool
 * POST   /api/v1/admin/defi/pools/:id/unpause - Unpause a pool
 * POST   /api/v1/admin/defi/emergency/pause-all   - Pause all pools
 * POST   /api/v1/admin/defi/emergency/unpause-all - Unpause all pools
 */

import { Router, Request, Response, NextFunction, IRouter } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth";
import { createError } from "../../middleware/error-handler";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

// ============================================================================
// Middleware
// ============================================================================

/**
 * Middleware to check admin authorization
 */
function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;

  if (!user || !user.roles?.includes("ADMIN")) {
    return next(createError("ADMIN_REQUIRED", "Admin access required"));
  }

  next();
}

// Apply auth and admin check to all routes
router.use(requireAuth);
router.use(requireAdmin);

// ============================================================================
// Stats Routes
// ============================================================================

/**
 * GET /stats
 * Get comprehensive DeFi statistics
 */
router.get("/stats", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get pool counts and TVL
    const poolStats = await prisma.liquidityPool.aggregate({
      _sum: {
        totalDeposits: true,
      },
      _avg: {
        currentAPY: true,
      },
      _count: {
        id: true,
      },
    });

    // Get unique depositors
    const depositorCount = await prisma.liquidityDeposit.groupBy({
      by: ["userId"],
      _count: {
        userId: true,
      },
    });

    // Get total yield paid
    const yieldStats = await prisma.yieldClaim.aggregate({
      _sum: {
        amount: true,
      },
    });

    // Get active pools
    const activePools = await prisma.liquidityPool.count({
      where: { status: "ACTIVE" },
    });

    // Get pools by tier
    const poolsByTier = await prisma.liquidityPool.groupBy({
      by: ["tier"],
      _count: {
        id: true,
      },
      _sum: {
        totalDeposits: true,
      },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalTVL: poolStats._sum.totalDeposits?.toString() || "0",
          totalPools: poolStats._count.id,
          activePools,
          totalDepositors: depositorCount.length,
          totalYieldPaid: yieldStats._sum.amount?.toString() || "0",
          avgAPY: poolStats._avg.currentAPY?.toString() || "0",
          poolsByTier: poolsByTier.map((tier) => ({
            tier: tier.tier,
            count: tier._count.id,
            tvl: tier._sum.totalDeposits?.toString() || "0",
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Configuration Routes
// ============================================================================

const apyParamsSchema = z.object({
  baseRate: z.number().min(0).max(10000),
  slope1: z.number().min(0).max(50000),
  slope2: z.number().min(0).max(100000),
  optimalUtilization: z.number().min(0).max(10000),
});

/**
 * PUT /apy-params
 * Update APY calculation parameters
 * Note: This updates the database config; smart contract params require on-chain tx
 */
router.put("/apy-params", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = apyParamsSchema.parse(req.body);

    // Store in database config (or system settings table)
    // In production, this would also trigger a smart contract update
    await prisma.systemConfig.upsert({
      where: { key: "defi_apy_params" },
      update: {
        value: JSON.stringify(params),
        updatedAt: new Date(),
      },
      create: {
        key: "defi_apy_params",
        value: JSON.stringify(params),
      },
    });

    logger.info("APY parameters updated", {
      userId: (req as AuthenticatedRequest).userId,
      params,
    });

    res.json({
      success: true,
      message: "APY parameters updated",
      data: { params },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", error.message));
    }
    next(error);
  }
});

const feeSplitSchema = z.object({
  treasuryPercent: z.number().min(0).max(100),
  lpYieldPercent: z.number().min(0).max(100),
  bufferPercent: z.number().min(0).max(100),
}).refine(
  (data) => data.treasuryPercent + data.lpYieldPercent + data.bufferPercent === 100,
  { message: "Fee split must total 100%" }
);

/**
 * PUT /fee-split
 * Update fee distribution configuration
 */
router.put("/fee-split", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const split = feeSplitSchema.parse(req.body);

    await prisma.systemConfig.upsert({
      where: { key: "defi_fee_split" },
      update: {
        value: JSON.stringify(split),
        updatedAt: new Date(),
      },
      create: {
        key: "defi_fee_split",
        value: JSON.stringify(split),
      },
    });

    logger.info("Fee split updated", {
      userId: (req as AuthenticatedRequest).userId,
      split,
    });

    res.json({
      success: true,
      message: "Fee split updated",
      data: { split },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", error.message));
    }
    next(error);
  }
});

// ============================================================================
// Pool Management Routes
// ============================================================================

/**
 * POST /pools/:id/pause
 * Pause a specific pool
 */
router.post("/pools/:id/pause", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pool = await prisma.liquidityPool.findUnique({
      where: { id },
    });

    if (!pool) {
      return next(createError("NOT_FOUND", "Pool not found"));
    }

    await prisma.liquidityPool.update({
      where: { id },
      data: {
        status: "PAUSED",
        updatedAt: new Date(),
      },
    });

    logger.warn("Pool paused by admin", {
      userId: (req as AuthenticatedRequest).userId,
      poolId: id,
      poolName: pool.name,
    });

    res.json({
      success: true,
      message: "Pool paused",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /pools/:id/unpause
 * Unpause a specific pool
 */
router.post("/pools/:id/unpause", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pool = await prisma.liquidityPool.findUnique({
      where: { id },
    });

    if (!pool) {
      return next(createError("NOT_FOUND", "Pool not found"));
    }

    await prisma.liquidityPool.update({
      where: { id },
      data: {
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });

    logger.info("Pool unpaused by admin", {
      userId: (req as AuthenticatedRequest).userId,
      poolId: id,
      poolName: pool.name,
    });

    res.json({
      success: true,
      message: "Pool unpaused",
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Emergency Routes
// ============================================================================

/**
 * POST /emergency/pause-all
 * Emergency pause all pools
 */
router.post("/emergency/pause-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.liquidityPool.updateMany({
      where: {
        status: "ACTIVE",
      },
      data: {
        status: "PAUSED",
        updatedAt: new Date(),
      },
    });

    logger.error("EMERGENCY: All pools paused", {
      userId: (req as AuthenticatedRequest).userId,
      poolsAffected: result.count,
    });

    // In production, also pause on-chain contracts
    // await pauseAllContractsOnChain();

    res.json({
      success: true,
      message: `Emergency pause: ${result.count} pools paused`,
      data: {
        poolsPaused: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /emergency/unpause-all
 * Emergency unpause all pools
 */
router.post("/emergency/unpause-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.liquidityPool.updateMany({
      where: {
        status: "PAUSED",
      },
      data: {
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });

    logger.warn("All pools unpaused", {
      userId: (req as AuthenticatedRequest).userId,
      poolsAffected: result.count,
    });

    res.json({
      success: true,
      message: `${result.count} pools unpaused`,
      data: {
        poolsUnpaused: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /config
 * Get current DeFi configuration
 */
router.get("/config", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const apyParams = await prisma.systemConfig.findUnique({
      where: { key: "defi_apy_params" },
    });

    const feeSplit = await prisma.systemConfig.findUnique({
      where: { key: "defi_fee_split" },
    });

    res.json({
      success: true,
      data: {
        apyParams: apyParams ? JSON.parse(apyParams.value) : {
          baseRate: 400,
          slope1: 1000,
          slope2: 10000,
          optimalUtilization: 8000,
        },
        feeSplit: feeSplit ? JSON.parse(feeSplit.value) : {
          treasuryPercent: 50,
          lpYieldPercent: 40,
          bufferPercent: 10,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
