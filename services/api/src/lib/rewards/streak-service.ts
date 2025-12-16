/**
 * Streak Service - Tracks consecutive activity streaks
 * Reference: docs/vlossom/09-rewards-and-incentives-engine.md
 */

import { prisma } from "../prisma";
import { logger } from "../logger";
import { awardXP } from "./xp-service";

/**
 * Calculate streak bonus XP based on streak length
 */
function getStreakBonusXP(streakLength: number): number {
  if (streakLength >= 30) return 25;
  if (streakLength >= 14) return 15;
  if (streakLength >= 7) return 10;
  if (streakLength >= 3) return 5;
  return 0;
}

/**
 * Update user's streak after completing an activity
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakBroken: boolean;
  xpAwarded: number;
}> {
  try {
    // Get current streak data
    let userXP = await prisma.userXP.findUnique({
      where: { userId },
    });

    if (!userXP) {
      // Create initial XP record
      userXP = await prisma.userXP.create({
        data: {
          userId,
          totalXP: 0,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityAt: new Date(),
        },
      });

      return {
        currentStreak: 1,
        longestStreak: 1,
        streakBroken: false,
        xpAwarded: 0,
      };
    }

    const now = new Date();
    const lastActivity = userXP.lastActivityAt;

    // Check if streak continues, breaks, or is new
    let newStreak = 1;
    let streakBroken = false;

    if (lastActivity) {
      const hoursSinceLastActivity =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastActivity < 48) {
        // Within 48 hours - streak continues
        newStreak = userXP.currentStreak + 1;
      } else {
        // More than 48 hours - streak broken
        streakBroken = userXP.currentStreak > 1;
        newStreak = 1;
      }
    }

    // Calculate new longest streak
    const newLongest = Math.max(newStreak, userXP.longestStreak);

    // Update streak
    await prisma.userXP.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityAt: now,
      },
    });

    // Award streak bonus XP
    let xpAwarded = 0;
    const streakBonus = getStreakBonusXP(newStreak);

    if (streakBonus > 0 && newStreak % 7 === 0) {
      // Award weekly streak bonuses
      const result = await awardXP({
        userId,
        eventType: "BOOKING_STREAK",
        category: "streak",
        customXP: streakBonus,
        metadata: { streakLength: newStreak },
      });
      xpAwarded = result.xpAwarded;
    }

    logger.info("[Streak] Updated", {
      userId,
      currentStreak: newStreak,
      longestStreak: newLongest,
      streakBroken,
      xpAwarded,
    });

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      streakBroken,
      xpAwarded,
    };
  } catch (error) {
    logger.error("[Streak] Failed to update", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId,
    });
    throw error;
  }
}

/**
 * Get user's streak data
 */
export async function getUserStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakType: string;
  lastActivityAt: Date | null;
  isActive: boolean;
}> {
  const userXP = await prisma.userXP.findUnique({
    where: { userId },
  });

  if (!userXP) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakType: "bookings",
      lastActivityAt: null,
      isActive: false,
    };
  }

  // Check if streak is still active (within 48 hours)
  const now = new Date();
  const lastActivity = userXP.lastActivityAt;
  let isActive = false;

  if (lastActivity) {
    const hoursSinceLastActivity =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    isActive = hoursSinceLastActivity < 48;
  }

  return {
    currentStreak: isActive ? userXP.currentStreak : 0,
    longestStreak: userXP.longestStreak,
    streakType: userXP.streakType,
    lastActivityAt: userXP.lastActivityAt,
    isActive,
  };
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(limit = 50) {
  return prisma.userXP.findMany({
    where: {
      currentStreak: { gt: 0 },
    },
    orderBy: { currentStreak: "desc" },
    take: limit,
    select: {
      userId: true,
      currentStreak: true,
      longestStreak: true,
    },
  });
}

/**
 * Check and reset expired streaks (cron job)
 */
export async function resetExpiredStreaks(): Promise<number> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

  const result = await prisma.userXP.updateMany({
    where: {
      currentStreak: { gt: 0 },
      lastActivityAt: { lt: cutoff },
    },
    data: {
      currentStreak: 0,
    },
  });

  if (result.count > 0) {
    logger.info("[Streak] Reset expired streaks", { count: result.count });
  }

  return result.count;
}
