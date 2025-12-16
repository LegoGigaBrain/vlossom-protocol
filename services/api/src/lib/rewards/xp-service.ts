/**
 * XP Service - Handles experience points awarding and tracking
 * Reference: docs/vlossom/09-rewards-and-incentives-engine.md
 */

import { prisma } from "../prisma";
import { logger } from "../logger";
import {
  XPEventType,
  XPCategory,
  UserTier,
  XP_AWARDS,
  TIER_THRESHOLDS,
  TIER_BENEFITS,
} from "./types";
import { checkAndAwardBadges } from "./badge-service";

/**
 * Award XP to a user for an event
 */
export async function awardXP(params: {
  userId: string;
  eventType: XPEventType;
  category: XPCategory;
  bookingId?: string;
  referralId?: string;
  customXP?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ xpAwarded: number; newTotal: number; tierUpgrade?: UserTier }> {
  const { userId, eventType, category, bookingId, referralId, customXP, metadata } = params;

  // Calculate XP to award
  const baseXP = XP_AWARDS[eventType] || 0;
  const xpAwarded = customXP ?? baseXP;

  if (xpAwarded === 0) {
    return { xpAwarded: 0, newTotal: 0 };
  }

  logger.info("[XP] Awarding XP", {
    userId,
    eventType,
    xpAwarded,
    category,
  });

  try {
    // Get or create UserXP record
    let userXP = await prisma.userXP.findUnique({
      where: { userId },
    });

    const previousTier = userXP?.tier || "BRONZE";
    const previousTotal = userXP?.totalXP || 0;

    // Update XP
    userXP = await prisma.userXP.upsert({
      where: { userId },
      create: {
        userId,
        totalXP: xpAwarded,
        customerPoints: category === "booking" ? xpAwarded : 0,
        tier: "BRONZE",
      },
      update: {
        totalXP: { increment: xpAwarded },
        // Update role-specific points based on category
        ...(category === "booking" && { customerPoints: { increment: xpAwarded } }),
        ...(category === "review" && { customerPoints: { increment: xpAwarded } }),
        ...(category === "referral" && { referralScore: { increment: xpAwarded / 10 } }),
      },
    });

    // Log XP event
    await prisma.xPEvent.create({
      data: {
        userId,
        eventType,
        xpAwarded,
        category,
        bookingId,
        referralId,
        metadata: metadata || {},
      },
    });

    // Check for tier upgrade
    const newTier = calculateTier(userXP.totalXP);
    let tierUpgrade: UserTier | undefined;

    if (newTier !== previousTier) {
      tierUpgrade = newTier;

      // Update tier in database
      await prisma.userXP.update({
        where: { userId },
        data: { tier: newTier },
      });

      logger.info("[XP] Tier upgrade!", {
        userId,
        previousTier,
        newTier,
        totalXP: userXP.totalXP,
      });

      // Award additional XP for tier upgrade (recursive, but won't infinite loop)
      await awardXP({
        userId,
        eventType: "TIER_UPGRADED",
        category: "special",
        metadata: { previousTier, newTier },
      });
    }

    // Check for badge unlocks
    await checkAndAwardBadges(userId, eventType, {
      bookingId,
      newTotal: userXP.totalXP,
    });

    return {
      xpAwarded,
      newTotal: userXP.totalXP,
      tierUpgrade,
    };
  } catch (error) {
    logger.error("[XP] Failed to award XP", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
      eventType,
    });
    throw error;
  }
}

/**
 * Calculate tier from total XP
 */
export function calculateTier(totalXP: number): UserTier {
  if (totalXP >= TIER_THRESHOLDS.DIAMOND) return "DIAMOND";
  if (totalXP >= TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalXP >= TIER_THRESHOLDS.GOLD) return "GOLD";
  if (totalXP >= TIER_THRESHOLDS.SILVER) return "SILVER";
  return "BRONZE";
}

/**
 * Calculate progress to next tier (0-100)
 */
export function calculateTierProgress(totalXP: number, currentTier: UserTier): number {
  const tiers: UserTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex === tiers.length - 1) {
    return 100; // Already at max tier
  }

  const nextTier = tiers[currentIndex + 1];
  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[nextTier];

  const progress = ((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Get user's XP summary
 */
export async function getUserXPSummary(userId: string) {
  const userXP = await prisma.userXP.findUnique({
    where: { userId },
  });

  if (!userXP) {
    return {
      totalXP: 0,
      stylistPoints: 0,
      customerPoints: 0,
      ownerPoints: 0,
      tier: "BRONZE" as UserTier,
      tierProgress: 0,
      benefits: TIER_BENEFITS.BRONZE,
    };
  }

  const tier = userXP.tier as UserTier;

  return {
    totalXP: userXP.totalXP,
    stylistPoints: userXP.stylistPoints,
    customerPoints: userXP.customerPoints,
    ownerPoints: userXP.ownerPoints,
    tier,
    tierProgress: calculateTierProgress(userXP.totalXP, tier),
    benefits: TIER_BENEFITS[tier],
  };
}

/**
 * Get XP history for a user
 */
export async function getXPHistory(userId: string, limit = 20) {
  return prisma.xPEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get XP leaderboard
 */
export async function getXPLeaderboard(limit = 100) {
  return prisma.userXP.findMany({
    orderBy: { totalXP: "desc" },
    take: limit,
    select: {
      userId: true,
      totalXP: true,
      tier: true,
    },
  });
}
