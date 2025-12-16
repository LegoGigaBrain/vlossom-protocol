/**
 * Rewards Module
 * Unified exports for rewards, XP, badges, and streaks
 * Reference: docs/vlossom/09-rewards-and-incentives-engine.md
 */

// Types
export * from "./types";

// XP Service
export {
  awardXP,
  calculateTier,
  calculateTierProgress,
  getUserXPSummary,
  getXPHistory,
  getXPLeaderboard,
} from "./xp-service";

// Badge Service
export {
  checkAndAwardBadges,
  awardBadge,
  getUserBadges,
  getAllBadgesWithStatus,
  awardSpecialBadge,
} from "./badge-service";

// Streak Service
export {
  updateStreak,
  getUserStreak,
  getStreakLeaderboard,
  resetExpiredStreaks,
} from "./streak-service";

// Combined rewards getter
import { getUserXPSummary } from "./xp-service";
import { getUserBadges } from "./badge-service";
import { getUserStreak } from "./streak-service";
import { TIER_BENEFITS, UserRewards, UserTier } from "./types";
import { prisma } from "../prisma";

/**
 * Get complete rewards data for a user
 */
export async function getUserRewards(userId: string): Promise<UserRewards> {
  const [xpSummary, badges, streak, referralData] = await Promise.all([
    getUserXPSummary(userId),
    getUserBadges(userId),
    getUserStreak(userId),
    getReferralData(userId),
  ]);

  return {
    userId,
    xp: {
      total: xpSummary.totalXP,
      stylistPoints: xpSummary.stylistPoints,
      customerPoints: xpSummary.customerPoints,
      ownerPoints: xpSummary.ownerPoints,
    },
    tier: xpSummary.tier,
    tierProgress: xpSummary.tierProgress,
    streak: {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      type: streak.streakType,
    },
    badges: badges.map((b) => ({
      type: b.type as import("./types").BadgeType,
      earnedAt: b.earnedAt,
    })),
    referral: referralData,
    benefits: TIER_BENEFITS[xpSummary.tier as UserTier],
  };
}

/**
 * Get referral data for a user
 */
async function getReferralData(userId: string): Promise<{
  score: number;
  count: number;
  code: string | null;
}> {
  const [userXP, referralCode, referralCount] = await Promise.all([
    prisma.userXP.findUnique({
      where: { userId },
      select: { referralScore: true, referralCount: true },
    }),
    prisma.referralCode.findUnique({
      where: { userId },
      select: { code: true },
    }),
    prisma.referral.count({
      where: { referrerId: userId },
    }),
  ]);

  return {
    score: userXP?.referralScore || 0,
    count: referralCount,
    code: referralCode?.code || null,
  };
}
