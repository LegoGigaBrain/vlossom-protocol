/**
 * Rewards API Routes
 * Reference: docs/vlossom/09-rewards-and-incentives-engine.md
 */

import { Router, Request, Response } from "express";
import { logger } from "../lib/logger";
import { authenticate } from "../middleware/auth";
import {
  getUserRewards,
  getUserXPSummary,
  getXPHistory,
  getXPLeaderboard,
  getUserBadges,
  getAllBadgesWithStatus,
  getUserStreak,
  getStreakLeaderboard,
  BADGE_DEFINITIONS,
  TIER_BENEFITS,
  TIER_THRESHOLDS,
} from "../lib/rewards";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /api/v1/rewards/me
 * Get current user's complete rewards data
 */
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const rewards = await getUserRewards(userId);

    res.json(rewards);
  } catch (error) {
    logger.error("Error getting user rewards", { error });
    res.status(500).json({ error: "Failed to get rewards" });
  }
});

/**
 * GET /api/v1/rewards/xp
 * Get current user's XP summary
 */
router.get("/xp", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const xpSummary = await getUserXPSummary(userId);

    res.json(xpSummary);
  } catch (error) {
    logger.error("Error getting XP summary", { error });
    res.status(500).json({ error: "Failed to get XP summary" });
  }
});

/**
 * GET /api/v1/rewards/xp/history
 * Get XP earning history
 */
router.get("/xp/history", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const history = await getXPHistory(userId, limit);

    res.json({ history });
  } catch (error) {
    logger.error("Error getting XP history", { error });
    res.status(500).json({ error: "Failed to get XP history" });
  }
});

/**
 * GET /api/v1/rewards/badges
 * Get user's badges with earn status
 */
router.get("/badges", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const badges = await getAllBadgesWithStatus(userId);

    res.json({
      badges,
      totalEarned: badges.filter((b) => b.earned).length,
      totalAvailable: badges.length,
    });
  } catch (error) {
    logger.error("Error getting badges", { error });
    res.status(500).json({ error: "Failed to get badges" });
  }
});

/**
 * GET /api/v1/rewards/badges/all
 * Get all available badge definitions
 */
router.get("/badges/all", async (_req: Request, res: Response) => {
  res.json({ badges: BADGE_DEFINITIONS });
});

/**
 * GET /api/v1/rewards/streak
 * Get user's streak data
 */
router.get("/streak", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const streak = await getUserStreak(userId);

    res.json(streak);
  } catch (error) {
    logger.error("Error getting streak", { error });
    res.status(500).json({ error: "Failed to get streak" });
  }
});

/**
 * GET /api/v1/rewards/tiers
 * Get all tier information
 */
router.get("/tiers", async (_req: Request, res: Response) => {
  const tiers = Object.entries(TIER_THRESHOLDS).map(([tier, minXP]) => ({
    tier,
    minXP,
    benefits: TIER_BENEFITS[tier as keyof typeof TIER_BENEFITS],
  }));

  res.json({ tiers });
});

/**
 * GET /api/v1/rewards/leaderboard
 * Get XP leaderboard
 */
router.get("/leaderboard", authenticate, async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "xp";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let leaderboard;

    if (type === "streak") {
      leaderboard = await getStreakLeaderboard(limit);
    } else {
      leaderboard = await getXPLeaderboard(limit);
    }

    // Enrich with user display names (limited info for privacy)
    const userIds = leaderboard.map((entry) => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      displayName: userMap.get(entry.userId)?.displayName || "Anonymous",
      avatarUrl: userMap.get(entry.userId)?.avatarUrl || null,
      ...(type === "streak"
        ? {
            currentStreak: entry.currentStreak,
            longestStreak: entry.longestStreak,
          }
        : {
            totalXP: entry.totalXP,
            tier: entry.tier,
          }),
    }));

    res.json({
      type,
      leaderboard: enrichedLeaderboard,
    });
  } catch (error) {
    logger.error("Error getting leaderboard", { error });
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

/**
 * GET /api/v1/rewards/:userId
 * Get public rewards for a specific user (limited info)
 */
router.get("/:userId", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get limited public info
    const [xpSummary, badges] = await Promise.all([
      getUserXPSummary(userId),
      getUserBadges(userId),
    ]);

    res.json({
      userId,
      tier: xpSummary.tier,
      badges: badges.map((b) => ({
        type: b.type,
        name: b.name,
        earnedAt: b.earnedAt,
      })),
      totalBadges: badges.length,
    });
  } catch (error) {
    logger.error("Error getting user rewards", { error });
    res.status(500).json({ error: "Failed to get user rewards" });
  }
});

/**
 * GET /api/v1/rewards/referral/code
 * Get or create user's referral code
 */
router.get("/referral/code", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get or create referral code
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId },
    });

    if (!referralCode) {
      // Generate unique code
      const code = generateReferralCode();

      referralCode = await prisma.referralCode.create({
        data: {
          userId,
          code,
        },
      });
    }

    // Get referral stats
    const referralCount = await prisma.referral.count({
      where: { referrerId: userId },
    });

    const activeReferrals = await prisma.referral.count({
      where: { referrerId: userId, refereeIsActive: true },
    });

    res.json({
      code: referralCode.code,
      customCode: referralCode.customCode,
      usageCount: referralCode.usageCount,
      referralCount,
      activeReferrals,
    });
  } catch (error) {
    logger.error("Error getting referral code", { error });
    res.status(500).json({ error: "Failed to get referral code" });
  }
});

/**
 * GET /api/v1/rewards/referral/stats
 * Get detailed referral statistics
 */
router.get("/referral/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Get XP data for percentile calculation
    const userXP = await prisma.userXP.findUnique({
      where: { userId },
    });

    // Calculate percentile (simplified)
    const totalUsers = await prisma.userXP.count({
      where: { referralScore: { gt: 0 } },
    });

    const usersWithLowerScore = await prisma.userXP.count({
      where: {
        referralScore: { lt: userXP?.referralScore || 0 },
      },
    });

    const percentile =
      totalUsers > 0
        ? Math.round((usersWithLowerScore / totalUsers) * 100)
        : 0;

    res.json({
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter((r) => r.refereeIsActive).length,
      totalXPEarned: referrals.reduce((sum, r) => sum + r.referrerXPAwarded, 0),
      referralScore: userXP?.referralScore || 0,
      percentile,
      referrals: referrals.map((r) => ({
        createdAt: r.createdAt,
        isActive: r.refereeIsActive,
        xpAwarded: r.referrerXPAwarded,
      })),
    });
  } catch (error) {
    logger.error("Error getting referral stats", { error });
    res.status(500).json({ error: "Failed to get referral stats" });
  }
});

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoiding ambiguous chars
  let code = "VL"; // Vlossom prefix

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

export default router;
