/**
 * Liquidity Routes
 *
 * API endpoints for DeFi liquidity pools.
 * Reference: docs/vlossom/12-liquidity-pool-architecture.md
 *
 * Routes:
 * GET    /pools             - List all pools
 * GET    /pools/:id         - Pool details
 * GET    /pools/:id/stats   - Pool statistics
 * POST   /pools             - Create pool (tier-gated)
 * GET    /deposits          - User's deposits
 * POST   /deposit           - Deposit to pool
 * POST   /withdraw          - Withdraw from pool
 * GET    /yield             - User's yield summary
 * POST   /yield/claim       - Claim yield
 * POST   /yield/claim-all   - Claim all yield
 * GET    /tier              - User's referral tier
 * GET    /stats             - Global DeFi stats
 */

import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { PoolTier } from '@prisma/client';
import {
  listPools,
  getPoolById,
  getGenesisPool,
  createPool,
  getUserDeposits,
  deposit,
  withdraw,
  getYieldSummary,
  claimYield,
  claimAllYield,
  getCachedTierStatus,
  getGlobalStats,
  getPoolStats,
} from '../lib/liquidity';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { rateLimiters } from '../middleware/rate-limiter';

const router: IRouter = Router();

// ============================================================================
// Pool Routes
// ============================================================================

/**
 * GET /pools
 * List all active liquidity pools
 */
router.get('/pools', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tier = req.query.tier as PoolTier | undefined;
    const includeGenesis = req.query.includeGenesis !== 'false';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await listPools({ tier, includeGenesis, page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/genesis
 * Get the genesis pool (VLP)
 */
router.get('/pools/genesis', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = await getGenesisPool();

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Genesis pool not found',
      });
    }

    res.json({
      success: true,
      data: { pool },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:id
 * Get pool details
 */
router.get('/pools/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = await getPoolById(req.params.id);

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found',
      });
    }

    res.json({
      success: true,
      data: { pool },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:id/stats
 * Get pool statistics
 */
router.get('/pools/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getPoolStats(req.params.id);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /pools
 * Create a new community pool (tier-gated)
 */
router.post(
  '/pools',
  requireAuth,
  rateLimiters.login, // Stricter rate limit for mutations
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const { name, tier } = req.body as { name: string; tier: PoolTier };

      if (!name || name.length < 3 || name.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Pool name must be 3-50 characters',
        });
      }

      const validTiers: PoolTier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier. Must be TIER_1, TIER_2, or TIER_3',
        });
      }

      const result = await createPool(userId, { name, tier });

      if (!result.success) {
        return res.status(403).json({
          success: false,
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        data: { pool: result.pool },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Deposit Routes
// ============================================================================

/**
 * GET /deposits
 * Get user's deposits across all pools
 */
router.get(
  '/deposits',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const deposits = await getUserDeposits(userId);

      res.json({
        success: true,
        data: { deposits },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /deposit
 * Deposit USDC into a pool
 */
router.post(
  '/deposit',
  requireAuth,
  rateLimiters.login,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const { poolId, amount } = req.body as { poolId: string; amount: string };

      if (!poolId) {
        return res.status(400).json({
          success: false,
          error: 'poolId is required',
        });
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount',
        });
      }

      // Minimum deposit $1
      if (amountNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'Minimum deposit is $1 USDC',
        });
      }

      const result = await deposit(userId, { poolId, amount });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /withdraw
 * Withdraw USDC from a pool
 */
router.post(
  '/withdraw',
  requireAuth,
  rateLimiters.login,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const { poolId, shares } = req.body as { poolId: string; shares: string };

      if (!poolId || !shares) {
        return res.status(400).json({
          success: false,
          error: 'poolId and shares are required',
        });
      }

      const sharesNum = parseFloat(shares);
      if (isNaN(sharesNum) || sharesNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid shares amount',
        });
      }

      const result = await withdraw(userId, { poolId, shares });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Yield Routes
// ============================================================================

/**
 * GET /yield
 * Get user's yield summary
 */
router.get(
  '/yield',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const summary = await getYieldSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /yield/claim
 * Claim yield from a specific pool
 */
router.post(
  '/yield/claim',
  requireAuth,
  rateLimiters.login,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const { poolId } = req.body as { poolId: string };

      if (!poolId) {
        return res.status(400).json({
          success: false,
          error: 'poolId is required',
        });
      }

      const result = await claimYield(userId, poolId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /yield/claim-all
 * Claim yield from all pools
 */
router.post(
  '/yield/claim-all',
  requireAuth,
  rateLimiters.login,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const results = await claimAllYield(userId);

      const totalClaimed = results.reduce((sum, r) => {
        const amount = parseFloat(r.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      res.json({
        success: true,
        data: {
          claims: results,
          totalClaimed: totalClaimed.toFixed(6),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Tier Routes
// ============================================================================

/**
 * GET /tier
 * Get user's referral tier status
 */
router.get(
  '/tier',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId!;
      const tierInfo = await getCachedTierStatus(userId);

      res.json({
        success: true,
        data: tierInfo,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Stats Routes
// ============================================================================

/**
 * GET /stats
 * Get global DeFi statistics
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getGlobalStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
