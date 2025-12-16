/**
 * Badge Service - Handles badge unlocking and tracking
 * Reference: docs/vlossom/09-rewards-and-incentives-engine.md
 */

import { prisma } from "../prisma";
import { logger } from "../logger";
import { BadgeType, XPEventType, BADGE_DEFINITIONS } from "./types";

/**
 * Check and award badges based on user actions
 */
export async function checkAndAwardBadges(
  userId: string,
  triggerEvent: XPEventType,
  context: {
    bookingId?: string;
    newTotal?: number;
  } = {}
): Promise<BadgeType[]> {
  const awardedBadges: BadgeType[] = [];

  try {
    // Get existing badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeType: true },
    });
    const existingBadgeTypes = new Set(existingBadges.map((b) => b.badgeType));

    // Get user stats for badge checks
    const userStats = await getUserStatsForBadges(userId);

    // Check each badge condition
    const badgesToAward: BadgeType[] = [];

    // Booking milestone badges
    if (
      !existingBadgeTypes.has("FIRST_BOOKING") &&
      userStats.completedBookings >= 1
    ) {
      badgesToAward.push("FIRST_BOOKING");
    }

    if (
      !existingBadgeTypes.has("TEN_BOOKINGS") &&
      userStats.completedBookings >= 10
    ) {
      badgesToAward.push("TEN_BOOKINGS");
    }

    if (
      !existingBadgeTypes.has("FIFTY_BOOKINGS") &&
      userStats.completedBookings >= 50
    ) {
      badgesToAward.push("FIFTY_BOOKINGS");
    }

    if (
      !existingBadgeTypes.has("HUNDRED_BOOKINGS") &&
      userStats.completedBookings >= 100
    ) {
      badgesToAward.push("HUNDRED_BOOKINGS");
    }

    // Five star streak badge
    if (
      !existingBadgeTypes.has("FIVE_STAR_STREAK") &&
      userStats.consecutiveFiveStars >= 5
    ) {
      badgesToAward.push("FIVE_STAR_STREAK");
    }

    // Community builder badge
    if (
      !existingBadgeTypes.has("COMMUNITY_BUILDER") &&
      userStats.referralCount >= 10
    ) {
      badgesToAward.push("COMMUNITY_BUILDER");
    }

    // Award the badges
    for (const badgeType of badgesToAward) {
      await awardBadge(userId, badgeType);
      awardedBadges.push(badgeType);
    }

    return awardedBadges;
  } catch (error) {
    logger.error("[Badge] Failed to check/award badges", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
      triggerEvent,
    });
    return [];
  }
}

/**
 * Award a specific badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  metadata: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    // Check if already earned
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeType: { userId, badgeType },
      },
    });

    if (existing) {
      return false; // Already has badge
    }

    // Award badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeType,
        metadata,
      },
    });

    // Get badge definition for XP reward
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeType);

    logger.info("[Badge] Awarded badge", {
      userId,
      badgeType,
      xpReward: badgeDef?.xpReward || 0,
    });

    // Note: XP for badge earned is handled in xp-service to avoid circular dependency

    return true;
  } catch (error) {
    logger.error("[Badge] Failed to award badge", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
      badgeType,
    });
    return false;
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string) {
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });

  return badges.map((badge) => {
    const definition = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeType);
    return {
      type: badge.badgeType,
      name: definition?.name || badge.badgeType,
      description: definition?.description || "",
      earnedAt: badge.earnedAt.toISOString(),
      metadata: badge.metadata,
    };
  });
}

/**
 * Get all available badges with earned status
 */
export async function getAllBadgesWithStatus(userId: string) {
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
  });
  const earnedSet = new Map(
    earnedBadges.map((b) => [b.badgeType, b.earnedAt])
  );

  return BADGE_DEFINITIONS.map((badge) => ({
    type: badge.id,
    name: badge.name,
    description: badge.description,
    requirement: badge.requirement,
    xpReward: badge.xpReward,
    earned: earnedSet.has(badge.id),
    earnedAt: earnedSet.get(badge.id)?.toISOString() || null,
  }));
}

/**
 * Get user stats needed for badge checks
 */
async function getUserStatsForBadges(userId: string) {
  // Get completed bookings count
  const completedBookings = await prisma.booking.count({
    where: {
      OR: [{ customerId: userId }, { stylistId: userId }],
      status: { in: ["COMPLETED", "SETTLED"] },
    },
  });

  // Get referral count
  const referralCount = await prisma.referral.count({
    where: { referrerId: userId },
  });

  // Get consecutive 5-star reviews (simplified - would need more complex logic in production)
  const recentReviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { overallRating: true },
  });

  let consecutiveFiveStars = 0;
  for (const review of recentReviews) {
    if (review.overallRating >= 45) {
      // 4.5+ out of 5 (scaled 10-50)
      consecutiveFiveStars++;
    } else {
      break;
    }
  }

  // Get TPS performance (simplified)
  const reputation = await prisma.reputationScore.findUnique({
    where: { userId },
  });

  return {
    completedBookings,
    referralCount,
    consecutiveFiveStars,
    tpsScore: reputation?.tpsScore || 5000,
    isVerified: reputation?.isVerified || false,
  };
}

/**
 * Award special badges (admin or system triggered)
 */
export async function awardSpecialBadge(
  userId: string,
  badgeType: BadgeType,
  reason: string
): Promise<boolean> {
  return awardBadge(userId, badgeType, { reason, awardedBy: "system" });
}
