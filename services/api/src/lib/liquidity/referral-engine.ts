/**
 * Referral Engine
 *
 * Calculates referral percentiles and determines DeFi tier eligibility.
 * Reference: docs/vlossom/11-defi-and-liquidity-architecture.md
 */

import { PrismaClient, PoolTier } from '@prisma/client';
import { getTierFromPercentile, TIER_CONFIGS, TierInfo } from './types';

const prisma = new PrismaClient();

/**
 * Calculate a user's referral percentile (0-100)
 * 0 = top referrer, 100 = no referrals
 */
export async function getReferrerPercentile(userId: string): Promise<number> {
  // Get user's referral stats
  const userXP = await prisma.userXP.findUnique({
    where: { userId },
    select: { referralScore: true },
  });

  if (!userXP || userXP.referralScore === 0) {
    return 100; // No referrals = bottom
  }

  // Count users with higher referral scores
  const usersAbove = await prisma.userXP.count({
    where: {
      referralScore: { gt: userXP.referralScore },
    },
  });

  // Count total users with any referrals
  const totalReferrers = await prisma.userXP.count({
    where: {
      referralScore: { gt: 0 },
    },
  });

  if (totalReferrers === 0) {
    return 0; // Only referrer = top
  }

  // Calculate percentile (lower = better)
  const percentile = (usersAbove / totalReferrers) * 100;
  return Math.round(percentile * 100) / 100;
}

/**
 * Get user's DeFi tier based on their referral percentile
 */
export function getTierFromReferralPercentile(percentile: number): PoolTier | null {
  return getTierFromPercentile(percentile);
}

/**
 * Check if user can create a pool of a specific tier
 */
export async function canCreatePool(
  userId: string,
  requestedTier?: PoolTier
): Promise<{ canCreate: boolean; reason?: string; tier: PoolTier | null }> {
  const percentile = await getReferrerPercentile(userId);
  const tier = getTierFromPercentile(percentile);

  if (!tier) {
    return {
      canCreate: false,
      reason: `Your referral percentile (${percentile.toFixed(1)}%) is below the required threshold. Top 30% of referrers can create pools.`,
      tier: null,
    };
  }

  // If a specific tier is requested, check if user qualifies
  if (requestedTier && requestedTier !== 'GENESIS') {
    const tierOrder = ['TIER_1', 'TIER_2', 'TIER_3'] as const;
    const userTierIndex = tier === 'GENESIS' ? -1 : tierOrder.indexOf(tier as typeof tierOrder[number]);
    const requestedTierIndex = tierOrder.indexOf(requestedTier as typeof tierOrder[number]);

    if (requestedTierIndex < userTierIndex) {
      return {
        canCreate: false,
        reason: `You are eligible for ${tier} pools, but not ${requestedTier}. Improve your referral ranking to unlock higher tiers.`,
        tier,
      };
    }
  }

  return { canCreate: true, tier };
}

/**
 * Get comprehensive tier info for a user
 */
export async function getUserTierInfo(userId: string): Promise<TierInfo> {
  const percentile = await getReferrerPercentile(userId);
  const tier = getTierFromPercentile(percentile);

  // Get tier-specific config
  let poolCapLimit: string | null = null;
  let creatorFeeRate = 0;
  let poolCreationFee = '0';

  if (tier) {
    const config = TIER_CONFIGS[tier];
    poolCapLimit = config.cap;
    creatorFeeRate = config.creatorFeeBps;
    poolCreationFee = config.creationFee;
  }

  return {
    userId,
    referralPercentile: percentile,
    tier,
    canCreatePool: tier !== null,
    poolCapLimit,
    creatorFeeRate,
    poolCreationFee,
  };
}

/**
 * Update cached tier status for a user
 * Called after referral activity changes
 */
export async function updateUserTierStatus(userId: string): Promise<void> {
  const percentile = await getReferrerPercentile(userId);
  const tier = getTierFromPercentile(percentile);

  await prisma.defiTierStatus.upsert({
    where: { userId },
    create: {
      userId,
      referralPercentile: percentile,
      tier,
      canCreatePool: tier !== null,
      lastCalculatedAt: new Date(),
    },
    update: {
      referralPercentile: percentile,
      tier,
      canCreatePool: tier !== null,
      lastCalculatedAt: new Date(),
    },
  });
}

/**
 * Get cached tier status (faster than recalculating)
 * Falls back to live calculation if not cached
 */
export async function getCachedTierStatus(userId: string): Promise<TierInfo> {
  const cached = await prisma.defiTierStatus.findUnique({
    where: { userId },
  });

  // Use cache if fresh (less than 1 hour old)
  if (cached) {
    const cacheAge = Date.now() - cached.lastCalculatedAt.getTime();
    const ONE_HOUR = 60 * 60 * 1000;

    if (cacheAge < ONE_HOUR) {
      let poolCapLimit: string | null = null;
      let creatorFeeRate = 0;
      let poolCreationFee = '0';

      if (cached.tier) {
        const config = TIER_CONFIGS[cached.tier];
        poolCapLimit = config.cap;
        creatorFeeRate = config.creatorFeeBps;
        poolCreationFee = config.creationFee;
      }

      return {
        userId,
        referralPercentile: cached.referralPercentile,
        tier: cached.tier,
        canCreatePool: cached.canCreatePool,
        poolCapLimit,
        creatorFeeRate,
        poolCreationFee,
      };
    }
  }

  // Recalculate and cache
  await updateUserTierStatus(userId);
  return getUserTierInfo(userId);
}

/**
 * Batch update tier status for all users with referrals
 * Should be run periodically (e.g., daily cron job)
 */
export async function batchUpdateTierStatus(): Promise<number> {
  const usersWithReferrals = await prisma.userXP.findMany({
    where: { referralScore: { gt: 0 } },
    select: { userId: true },
  });

  let updated = 0;
  for (const user of usersWithReferrals) {
    await updateUserTierStatus(user.userId);
    updated++;
  }

  return updated;
}
