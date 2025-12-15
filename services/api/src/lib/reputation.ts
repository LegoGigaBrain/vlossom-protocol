/**
 * Reputation Service
 * Reference: docs/vlossom/08-reputation-system-flow.md
 *
 * Full reputation system implementation:
 * - Records reputation events for completed bookings
 * - Calculates TPS (Time Performance Score)
 * - Updates aggregated reputation scores
 * - Manages verification badges
 */

import { prisma } from "./prisma";
import { logger } from "./logger";
import { ActorRole } from "@prisma/client";

/**
 * Reputation event types
 */
export enum ReputationEventType {
  BOOKING_COMPLETED = "BOOKING_COMPLETED",
  BOOKING_CANCELLED_BY_CUSTOMER = "BOOKING_CANCELLED_BY_CUSTOMER",
  BOOKING_CANCELLED_BY_STYLIST = "BOOKING_CANCELLED_BY_STYLIST",
  CUSTOMER_NO_SHOW = "CUSTOMER_NO_SHOW",
  STYLIST_NO_SHOW = "STYLIST_NO_SHOW",
  ON_TIME_ARRIVAL = "ON_TIME_ARRIVAL",
  LATE_ARRIVAL = "LATE_ARRIVAL",
  EARLY_COMPLETION = "EARLY_COMPLETION",
  ON_TIME_COMPLETION = "ON_TIME_COMPLETION",
  LATE_COMPLETION = "LATE_COMPLETION",
}

/**
 * Actor types in the reputation system
 */
export type ReputationActor = "CUSTOMER" | "STYLIST" | "PROPERTY_OWNER";

interface ReputationEventData {
  bookingId: string;
  eventType: ReputationEventType;
  actorId: string;
  actorType: ReputationActor;
  scoreImpact: number; // Positive or negative impact (-100 to +100)
  metadata?: Record<string, unknown>;
}

/**
 * Score component weights for total reputation calculation
 */
const SCORE_WEIGHTS = {
  TPS: 30,        // Time Performance Score (30%)
  RELIABILITY: 30, // Booking completion rate (30%)
  FEEDBACK: 30,   // Average review rating (30%)
  DISPUTE: 10,    // Dispute history (10%)
} as const;

/**
 * Verification requirements
 */
const VERIFICATION_THRESHOLD = 7000; // 70% total score
const MIN_COMPLETED_BOOKINGS = 5;

/**
 * Calculate Time Performance Score (TPS) for a booking
 * Based on punctuality and duration accuracy
 *
 * @param scheduledStart - Scheduled start time
 * @param actualStart - Actual start time (null if not started)
 * @param scheduledEnd - Scheduled end time
 * @param actualEnd - Actual end time (null if not completed)
 * @returns TPS score (0-100) and breakdown
 */
export function calculateTPS(
  scheduledStart: Date,
  actualStart: Date | null,
  scheduledEnd: Date,
  actualEnd: Date | null
): { score: number; breakdown: Record<string, number> } {
  // Default to perfect score if not enough data
  if (!actualStart || !actualEnd) {
    return { score: 100, breakdown: { startPunctuality: 100, durationAccuracy: 100 } };
  }

  // Calculate start punctuality (50% of TPS)
  // Perfect: within 5 minutes
  // Good: within 15 minutes (-10 points)
  // Fair: within 30 minutes (-25 points)
  // Poor: over 30 minutes (-50 points)
  const startDelayMinutes = Math.floor(
    (actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60)
  );

  let startPunctuality = 100;
  if (startDelayMinutes > 30) {
    startPunctuality = 50;
  } else if (startDelayMinutes > 15) {
    startPunctuality = 75;
  } else if (startDelayMinutes > 5) {
    startPunctuality = 90;
  } else if (startDelayMinutes < -5) {
    // Started early (could indicate rushing previous client)
    startPunctuality = 95;
  }

  // Calculate duration accuracy (50% of TPS)
  // Perfect: within 10% of estimated
  // Good: within 20% (-10 points)
  // Fair: within 30% (-20 points)
  // Poor: over 30% variance (-40 points)
  const scheduledDuration = scheduledEnd.getTime() - scheduledStart.getTime();
  const actualDuration = actualEnd.getTime() - actualStart.getTime();
  const durationVariance = Math.abs(actualDuration - scheduledDuration) / scheduledDuration;

  let durationAccuracy = 100;
  if (durationVariance > 0.3) {
    durationAccuracy = 60;
  } else if (durationVariance > 0.2) {
    durationAccuracy = 80;
  } else if (durationVariance > 0.1) {
    durationAccuracy = 90;
  }

  // Weighted average
  const score = Math.round(startPunctuality * 0.5 + durationAccuracy * 0.5);

  return {
    score,
    breakdown: {
      startPunctuality,
      durationAccuracy,
      startDelayMinutes,
      durationVariancePercent: Math.round(durationVariance * 100),
    },
  };
}

/**
 * Convert reputation actor type to Prisma ActorRole
 */
function actorTypeToPrisma(actorType: ReputationActor): ActorRole {
  switch (actorType) {
    case "CUSTOMER":
      return ActorRole.CUSTOMER;
    case "STYLIST":
      return ActorRole.STYLIST;
    case "PROPERTY_OWNER":
      return ActorRole.PROPERTY_OWNER;
    default:
      return ActorRole.CUSTOMER;
  }
}

/**
 * Store a reputation event in the database
 */
async function storeReputationEvent(event: ReputationEventData): Promise<void> {
  await prisma.reputationEvent.create({
    data: {
      actorId: event.actorId,
      actorType: actorTypeToPrisma(event.actorType),
      bookingId: event.bookingId,
      eventType: event.eventType,
      scoreImpact: event.scoreImpact,
      metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : {},
    },
  });
}

/**
 * Get or create a reputation score record for a user
 */
async function getOrCreateReputationScore(
  userId: string,
  actorType: ReputationActor
): Promise<{
  id: string;
  userId: string;
  actorType: ActorRole;
  totalScore: number;
  tpsScore: number;
  reliabilityScore: number;
  feedbackScore: number;
  disputeScore: number;
  completedBookings: number;
  cancelledBookings: number;
  totalReviews: number;
  averageRating: number | null;
  isVerified: boolean;
  verifiedAt: Date | null;
}> {
  let score = await prisma.reputationScore.findUnique({
    where: { userId },
  });

  if (!score) {
    score = await prisma.reputationScore.create({
      data: {
        userId,
        actorType: actorTypeToPrisma(actorType),
      },
    });
  }

  return score;
}

/**
 * Recalculate TPS score from recent events
 * Uses a rolling average of the last 50 bookings
 */
async function recalculateTpsScore(userId: string): Promise<number> {
  const recentTpsEvents = await prisma.reputationEvent.findMany({
    where: {
      actorId: userId,
      eventType: {
        in: [
          ReputationEventType.BOOKING_COMPLETED,
          ReputationEventType.ON_TIME_ARRIVAL,
          ReputationEventType.LATE_ARRIVAL,
          ReputationEventType.ON_TIME_COMPLETION,
          ReputationEventType.LATE_COMPLETION,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (recentTpsEvents.length === 0) {
    return 5000; // Default 50%
  }

  // Extract TPS scores from booking completion events
  const tpsScores: number[] = [];
  for (const event of recentTpsEvents) {
    if (event.eventType === ReputationEventType.BOOKING_COMPLETED) {
      const metadata = event.metadata as Record<string, unknown>;
      if (typeof metadata.tpsScore === "number") {
        tpsScores.push(metadata.tpsScore);
      }
    }
  }

  if (tpsScores.length === 0) {
    return 5000; // Default 50%
  }

  // Average TPS (0-100 scale) converted to 0-10000
  const avgTps = tpsScores.reduce((sum, s) => sum + s, 0) / tpsScores.length;
  return Math.round(avgTps * 100);
}

/**
 * Recalculate reliability score from booking history
 * Reliability = completed / (completed + cancelled) * 100
 */
async function recalculateReliabilityScore(
  completedBookings: number,
  cancelledBookings: number
): Promise<number> {
  const totalBookings = completedBookings + cancelledBookings;
  if (totalBookings === 0) {
    return 5000; // Default 50%
  }

  const reliability = completedBookings / totalBookings;
  return Math.round(reliability * 10000);
}

/**
 * Calculate the weighted total score
 */
function calculateTotalScore(
  tpsScore: number,
  reliabilityScore: number,
  feedbackScore: number,
  disputeScore: number
): number {
  return Math.round(
    (tpsScore * SCORE_WEIGHTS.TPS +
      reliabilityScore * SCORE_WEIGHTS.RELIABILITY +
      feedbackScore * SCORE_WEIGHTS.FEEDBACK +
      disputeScore * SCORE_WEIGHTS.DISPUTE) /
      100
  );
}

/**
 * Update reputation score after events
 */
async function updateReputationScore(
  userId: string,
  actorType: ReputationActor,
  options: {
    incrementCompleted?: boolean;
    incrementCancelled?: boolean;
  } = {}
): Promise<void> {
  const score = await getOrCreateReputationScore(userId, actorType);

  const completedBookings = score.completedBookings + (options.incrementCompleted ? 1 : 0);
  const cancelledBookings = score.cancelledBookings + (options.incrementCancelled ? 1 : 0);

  // Recalculate scores
  const tpsScore = await recalculateTpsScore(userId);
  const reliabilityScore = await recalculateReliabilityScore(completedBookings, cancelledBookings);

  // Keep existing feedback and dispute scores (updated separately by reviews/disputes)
  const totalScore = calculateTotalScore(
    tpsScore,
    reliabilityScore,
    score.feedbackScore,
    score.disputeScore
  );

  // Check verification threshold
  const meetsThreshold =
    totalScore >= VERIFICATION_THRESHOLD && completedBookings >= MIN_COMPLETED_BOOKINGS;

  await prisma.reputationScore.update({
    where: { userId },
    data: {
      tpsScore,
      reliabilityScore,
      totalScore,
      completedBookings,
      cancelledBookings,
      isVerified: meetsThreshold,
      verifiedAt: meetsThreshold && !score.isVerified ? new Date() : score.verifiedAt,
      lastCalculatedAt: new Date(),
    },
  });

  logger.info("Reputation score updated", {
    userId,
    tpsScore,
    reliabilityScore,
    totalScore,
    completedBookings,
    cancelledBookings,
    isVerified: meetsThreshold,
  });
}

/**
 * Record a reputation event for a booking completion
 * This will be indexed and aggregated into reputation scores
 */
export async function recordBookingCompletionEvent(params: {
  bookingId: string;
  customerId: string;
  stylistId: string;
  scheduledStart: Date;
  actualStart: Date | null;
  scheduledEnd: Date;
  actualEnd: Date | null;
  wasAutoConfirmed?: boolean;
}): Promise<void> {
  const {
    bookingId,
    customerId,
    stylistId,
    scheduledStart,
    actualStart,
    scheduledEnd,
    actualEnd,
    wasAutoConfirmed = false,
  } = params;

  try {
    // Calculate TPS for this booking
    const tps = calculateTPS(scheduledStart, actualStart, scheduledEnd, actualEnd);

    logger.info("Recording reputation event for booking completion", {
      bookingId,
      tpsScore: tps.score,
      breakdown: tps.breakdown,
    });

    // Collect all events to store
    const events: ReputationEventData[] = [];

    // Stylist punctuality event
    if (tps.breakdown.startDelayMinutes <= 5) {
      events.push({
        bookingId,
        eventType: ReputationEventType.ON_TIME_ARRIVAL,
        actorId: stylistId,
        actorType: "STYLIST",
        scoreImpact: 5,
        metadata: { delayMinutes: tps.breakdown.startDelayMinutes },
      });
    } else if (tps.breakdown.startDelayMinutes > 15) {
      events.push({
        bookingId,
        eventType: ReputationEventType.LATE_ARRIVAL,
        actorId: stylistId,
        actorType: "STYLIST",
        scoreImpact: -10,
        metadata: { delayMinutes: tps.breakdown.startDelayMinutes },
      });
    }

    // Duration accuracy event
    if (tps.breakdown.durationVariancePercent <= 10) {
      events.push({
        bookingId,
        eventType: ReputationEventType.ON_TIME_COMPLETION,
        actorId: stylistId,
        actorType: "STYLIST",
        scoreImpact: 5,
        metadata: { variancePercent: tps.breakdown.durationVariancePercent },
      });
    } else if (tps.breakdown.durationVariancePercent > 30) {
      events.push({
        bookingId,
        eventType: ReputationEventType.LATE_COMPLETION,
        actorId: stylistId,
        actorType: "STYLIST",
        scoreImpact: -5,
        metadata: { variancePercent: tps.breakdown.durationVariancePercent },
      });
    }

    // Booking completed event for stylist
    events.push({
      bookingId,
      eventType: ReputationEventType.BOOKING_COMPLETED,
      actorId: stylistId,
      actorType: "STYLIST",
      scoreImpact: 10,
      metadata: { tpsScore: tps.score, wasAutoConfirmed },
    });

    // Booking completed event for customer
    events.push({
      bookingId,
      eventType: ReputationEventType.BOOKING_COMPLETED,
      actorId: customerId,
      actorType: "CUSTOMER",
      scoreImpact: 5,
      metadata: { wasAutoConfirmed },
    });

    // Store all events in a transaction
    await prisma.$transaction(async (tx) => {
      for (const event of events) {
        await tx.reputationEvent.create({
          data: {
            actorId: event.actorId,
            actorType: actorTypeToPrisma(event.actorType),
            bookingId: event.bookingId,
            eventType: event.eventType,
            scoreImpact: event.scoreImpact,
            metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : {},
          },
        });
      }
    });

    // Update reputation scores for both parties
    await updateReputationScore(stylistId, "STYLIST", { incrementCompleted: true });
    await updateReputationScore(customerId, "CUSTOMER", { incrementCompleted: true });

    logger.info("Reputation events recorded successfully", {
      bookingId,
      eventCount: events.length,
      tpsScore: tps.score,
    });
  } catch (error) {
    logger.error("Failed to record reputation events", {
      bookingId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Don't throw - reputation events are non-critical
  }
}

/**
 * Record a cancellation event
 */
export async function recordCancellationEvent(params: {
  bookingId: string;
  cancelledById: string;
  cancelledByType: ReputationActor;
  reason?: string;
  isLastMinute: boolean;
}): Promise<void> {
  const { bookingId, cancelledById, cancelledByType, reason, isLastMinute } = params;

  try {
    const eventType =
      cancelledByType === "CUSTOMER"
        ? ReputationEventType.BOOKING_CANCELLED_BY_CUSTOMER
        : ReputationEventType.BOOKING_CANCELLED_BY_STYLIST;

    // Last-minute cancellations have higher penalty
    const scoreImpact = isLastMinute ? -15 : -5;

    logger.info("Recording cancellation reputation event", {
      bookingId,
      cancelledById,
      cancelledByType,
      eventType,
      scoreImpact,
      isLastMinute,
      reason,
    });

    // Store the cancellation event
    await storeReputationEvent({
      bookingId,
      eventType,
      actorId: cancelledById,
      actorType: cancelledByType,
      scoreImpact,
      metadata: { reason, isLastMinute },
    });

    // Update reputation score
    await updateReputationScore(cancelledById, cancelledByType, { incrementCancelled: true });

    logger.info("Cancellation reputation event recorded", {
      bookingId,
      cancelledById,
    });
  } catch (error) {
    logger.error("Failed to record cancellation event", {
      bookingId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Record a no-show event
 */
export async function recordNoShowEvent(params: {
  bookingId: string;
  noShowUserId: string;
  noShowUserType: ReputationActor;
}): Promise<void> {
  const { bookingId, noShowUserId, noShowUserType } = params;

  try {
    const eventType =
      noShowUserType === "CUSTOMER"
        ? ReputationEventType.CUSTOMER_NO_SHOW
        : ReputationEventType.STYLIST_NO_SHOW;

    // No-shows have significant penalty
    const scoreImpact = -25;

    await storeReputationEvent({
      bookingId,
      eventType,
      actorId: noShowUserId,
      actorType: noShowUserType,
      scoreImpact,
      metadata: {},
    });

    // Update reputation score with cancellation (no-show counts as cancellation)
    await updateReputationScore(noShowUserId, noShowUserType, { incrementCancelled: true });

    logger.info("No-show reputation event recorded", {
      bookingId,
      noShowUserId,
      noShowUserType,
    });
  } catch (error) {
    logger.error("Failed to record no-show event", {
      bookingId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get a user's reputation score summary
 */
export async function getReputationSummary(userId: string): Promise<{
  totalScore: number;
  tpsScore: number;
  reliabilityScore: number;
  feedbackScore: number;
  disputeScore: number;
  completedBookings: number;
  cancelledBookings: number;
  isVerified: boolean;
  percentages: {
    total: string;
    tps: string;
    reliability: string;
    feedback: string;
    dispute: string;
  };
} | null> {
  const score = await prisma.reputationScore.findUnique({
    where: { userId },
  });

  if (!score) {
    return null;
  }

  return {
    totalScore: score.totalScore,
    tpsScore: score.tpsScore,
    reliabilityScore: score.reliabilityScore,
    feedbackScore: score.feedbackScore,
    disputeScore: score.disputeScore,
    completedBookings: score.completedBookings,
    cancelledBookings: score.cancelledBookings,
    isVerified: score.isVerified,
    percentages: {
      total: (score.totalScore / 100).toFixed(1),
      tps: (score.tpsScore / 100).toFixed(1),
      reliability: (score.reliabilityScore / 100).toFixed(1),
      feedback: (score.feedbackScore / 100).toFixed(1),
      dispute: (score.disputeScore / 100).toFixed(1),
    },
  };
}

/**
 * Batch recalculate all reputation scores
 * Used by scheduler for periodic maintenance
 */
export async function recalculateAllScores(): Promise<{
  processed: number;
  errors: number;
}> {
  let processed = 0;
  let errors = 0;

  try {
    const allScores = await prisma.reputationScore.findMany({
      select: { userId: true, actorType: true },
    });

    for (const score of allScores) {
      try {
        const actorType = score.actorType === ActorRole.CUSTOMER ? "CUSTOMER" :
                          score.actorType === ActorRole.STYLIST ? "STYLIST" : "PROPERTY_OWNER";
        await updateReputationScore(score.userId, actorType as ReputationActor);
        processed++;
      } catch (error) {
        errors++;
        logger.error("Failed to recalculate score for user", {
          userId: score.userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logger.info("Batch reputation recalculation complete", {
      processed,
      errors,
    });
  } catch (error) {
    logger.error("Failed to batch recalculate reputation scores", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return { processed, errors };
}
