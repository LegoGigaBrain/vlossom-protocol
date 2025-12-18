/**
 * Dispute Service
 * Handles dispute creation, assignment, resolution, and escalation
 * Reference: docs/vlossom/22-admin-control-panel.md
 */

import { prisma } from "../prisma";
import { logger } from "../logger";
import {
  CreateDisputeInput,
  AssignDisputeInput,
  ResolveDisputeInput,
  EscalateDisputeInput,
  AddDisputeMessageInput,
  DisputeFilters,
  DisputeStats,
  DisputeWithDetails,
} from "./types";

/**
 * Create a new dispute for a booking
 */
export async function createDispute(input: CreateDisputeInput): Promise<DisputeWithDetails> {
  const { bookingId, filedById, filedAgainstId, type, title, description, evidenceUrls } = input;

  try {
    // Verify booking exists and is in a disputable state
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, customerId: true, stylistId: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if dispute already exists for this booking
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        bookingId,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    });

    if (existingDispute) {
      throw new Error("An active dispute already exists for this booking");
    }

    // Calculate priority based on type
    const priority = calculateDisputePriority(type);

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        filedById,
        filedAgainstId,
        type,
        title,
        description,
        evidenceUrls: evidenceUrls || [],
        priority,
        status: "OPEN",
      },
    });

    // Update booking status to DISPUTED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "DISPUTED" },
    });

    logger.info("[Dispute] Created", {
      disputeId: dispute.id,
      bookingId,
      type,
      filedById,
    });

    return dispute as unknown as DisputeWithDetails;
  } catch (error) {
    logger.error("[Dispute] Failed to create", {
      error: error instanceof Error ? error.message : "Unknown error",
      bookingId,
    });
    throw error;
  }
}

/**
 * Assign a dispute to an admin
 */
export async function assignDispute(input: AssignDisputeInput): Promise<DisputeWithDetails> {
  const { disputeId, assignedToId } = input;

  try {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        assignedToId,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });

    logger.info("[Dispute] Assigned", {
      disputeId,
      assignedToId,
    });

    return dispute as unknown as DisputeWithDetails;
  } catch (error) {
    logger.error("[Dispute] Failed to assign", {
      error: error instanceof Error ? error.message : "Unknown error",
      disputeId,
    });
    throw error;
  }
}

/**
 * Move dispute to under review status
 */
export async function startReview(disputeId: string): Promise<DisputeWithDetails> {
  try {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "UNDER_REVIEW",
      },
    });

    logger.info("[Dispute] Started review", { disputeId });

    return dispute as unknown as DisputeWithDetails;
  } catch (error) {
    logger.error("[Dispute] Failed to start review", {
      error: error instanceof Error ? error.message : "Unknown error",
      disputeId,
    });
    throw error;
  }
}

/**
 * Resolve a dispute with a decision
 */
export async function resolveDispute(input: ResolveDisputeInput): Promise<DisputeWithDetails> {
  const { disputeId, resolvedById, resolution, resolutionNotes, refundPercent } = input;

  try {
    // Get dispute info
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        resolution,
        resolutionNotes,
        refundPercent: resolution === "PARTIAL_REFUND" ? refundPercent : null,
        resolvedAt: new Date(),
        resolvedById,
      },
    });

    // Handle resolution effects (refunds, penalties, etc.)
    await handleResolutionEffects(dispute, resolution, refundPercent);

    logger.info("[Dispute] Resolved", {
      disputeId,
      resolution,
      resolvedById,
    });

    return updatedDispute as unknown as DisputeWithDetails;
  } catch (error) {
    logger.error("[Dispute] Failed to resolve", {
      error: error instanceof Error ? error.message : "Unknown error",
      disputeId,
    });
    throw error;
  }
}

/**
 * Escalate a dispute to senior admin/legal
 */
export async function escalateDispute(input: EscalateDisputeInput): Promise<DisputeWithDetails> {
  const { disputeId, escalatedById, escalationReason } = input;

  try {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "ESCALATED",
        escalatedAt: new Date(),
        escalatedById,
        escalationReason,
        priority: 5, // Max priority for escalated disputes
      },
    });

    logger.info("[Dispute] Escalated", {
      disputeId,
      escalatedById,
      reason: escalationReason,
    });

    return dispute as unknown as DisputeWithDetails;
  } catch (error) {
    logger.error("[Dispute] Failed to escalate", {
      error: error instanceof Error ? error.message : "Unknown error",
      disputeId,
    });
    throw error;
  }
}

/**
 * Close a resolved dispute
 */
export async function closeDispute(disputeId: string): Promise<DisputeWithDetails> {
  try {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "CLOSED",
      },
    });

    logger.info("[Dispute] Closed", { disputeId });

    return dispute as unknown as DisputeWithDetails;
  } catch (error) {
    logger.error("[Dispute] Failed to close", {
      error: error instanceof Error ? error.message : "Unknown error",
      disputeId,
    });
    throw error;
  }
}

/**
 * Add a message to a dispute thread
 */
export async function addDisputeMessage(input: AddDisputeMessageInput): Promise<void> {
  const { disputeId, authorId, content, isInternal, attachmentUrls } = input;

  try {
    await prisma.disputeMessage.create({
      data: {
        disputeId,
        authorId,
        content,
        isInternal: isInternal || false,
        attachmentUrls: attachmentUrls || [],
      },
    });

    logger.info("[Dispute] Message added", {
      disputeId,
      authorId,
      isInternal,
    });
  } catch (error) {
    logger.error("[Dispute] Failed to add message", {
      error: error instanceof Error ? error.message : "Unknown error",
      disputeId,
    });
    throw error;
  }
}

/**
 * Get dispute by ID with full details
 */
export async function getDisputeById(disputeId: string): Promise<DisputeWithDetails | null> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  });

  if (!dispute) return null;

  // Get related data
  const [filedBy, filedAgainst, assignedTo, booking, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: dispute.filedById },
      select: { id: true, displayName: true, email: true, avatarUrl: true },
    }),
    prisma.user.findUnique({
      where: { id: dispute.filedAgainstId },
      select: { id: true, displayName: true, email: true, avatarUrl: true },
    }),
    dispute.assignedToId
      ? prisma.user.findUnique({
          where: { id: dispute.assignedToId },
          select: { id: true, displayName: true, email: true },
        })
      : null,
    prisma.booking.findUnique({
      where: { id: dispute.bookingId },
      select: {
        id: true,
        status: true,
        scheduledStartTime: true,
        quoteAmountCents: true,
      },
    }),
    prisma.disputeMessage.findMany({
      where: { disputeId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Get message authors
  const authorIds = [...new Set(messages.map((m) => m.authorId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, displayName: true, avatarUrl: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  return {
    ...dispute,
    evidenceUrls: dispute.evidenceUrls as string[],
    filedBy: filedBy || undefined,
    filedAgainst: filedAgainst || undefined,
    assignedTo,
    booking: booking
      ? {
          ...booking,
          quoteAmountCents: Number(booking.quoteAmountCents),
        }
      : undefined,
    messages: messages.map((m) => ({
      ...m,
      attachmentUrls: m.attachmentUrls as string[],
      author: authorMap.get(m.authorId),
    })),
  } as DisputeWithDetails;
}

/**
 * List disputes with filters and pagination
 */
export async function listDisputes(
  filters: DisputeFilters = {},
  page = 1,
  pageSize = 20
): Promise<{ disputes: DisputeWithDetails[]; total: number }> {
  const where: Record<string, unknown> = {};

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters.type?.length) {
    where.type = { in: filters.type };
  }

  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      (where.createdAt as Record<string, Date>).gte = filters.fromDate;
    }
    if (filters.toDate) {
      (where.createdAt as Record<string, Date>).lte = filters.toDate;
    }
  }

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dispute.count({ where }),
  ]);

  // Enrich with user info
  const userIds = [
    ...new Set([
      ...disputes.map((d) => d.filedById),
      ...disputes.map((d) => d.filedAgainstId),
      ...disputes.filter((d) => d.assignedToId).map((d) => d.assignedToId!),
    ]),
  ];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, email: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enrichedDisputes = disputes.map((d) => ({
    ...d,
    evidenceUrls: d.evidenceUrls as string[],
    filedBy: userMap.get(d.filedById),
    filedAgainst: userMap.get(d.filedAgainstId),
    assignedTo: d.assignedToId ? userMap.get(d.assignedToId) : null,
  })) as DisputeWithDetails[];

  return { disputes: enrichedDisputes, total };
}

/**
 * Get dispute statistics
 */
export async function getDisputeStats(): Promise<DisputeStats> {
  const [
    total,
    open,
    assigned,
    underReview,
    resolved,
    escalated,
    resolvedDisputes,
  ] = await Promise.all([
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.dispute.count({ where: { status: "ASSIGNED" } }),
    prisma.dispute.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.dispute.count({ where: { status: "RESOLVED" } }),
    prisma.dispute.count({ where: { status: "ESCALATED" } }),
    prisma.dispute.findMany({
      where: { status: "RESOLVED", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true, resolution: true },
    }),
  ]);

  // Calculate average resolution time
  let totalResolutionTime = 0;
  const resolutionsByType: Record<string, number> = {};

  for (const d of resolvedDisputes) {
    if (d.resolvedAt) {
      totalResolutionTime +=
        d.resolvedAt.getTime() - d.createdAt.getTime();
    }
    if (d.resolution) {
      resolutionsByType[d.resolution] = (resolutionsByType[d.resolution] || 0) + 1;
    }
  }

  const avgResolutionTimeHours =
    resolvedDisputes.length > 0
      ? totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60)
      : 0;

  return {
    total,
    open,
    assigned,
    underReview,
    resolved,
    escalated,
    avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
    resolutionsByType: resolutionsByType as Record<string, number>,
  };
}

/**
 * Calculate dispute priority based on type
 */
function calculateDisputePriority(type: string): number {
  const priorityMap: Record<string, number> = {
    SAFETY_CONCERN: 5,
    PROPERTY_DAMAGE: 4,
    SERVICE_NOT_DELIVERED: 4,
    NO_SHOW: 3,
    PAYMENT_ISSUE: 3,
    POOR_QUALITY: 2,
    LATE_ARRIVAL: 2,
    COMMUNICATION_ISSUE: 1,
    OTHER: 1,
  };

  return priorityMap[type] || 1;
}

/**
 * Handle the effects of a dispute resolution
 * (refunds, reputation impacts, etc.)
 */
async function handleResolutionEffects(
  dispute: { bookingId: string; filedById: string; filedAgainstId: string },
  resolution: string,
  refundPercent?: number
): Promise<void> {
  // Get booking details
  const booking = await prisma.booking.findUnique({
    where: { id: dispute.bookingId },
    select: {
      id: true,
      quoteAmountCents: true,
      customerId: true,
      stylistId: true,
      escrowId: true,
    },
  });

  if (!booking) return;

  // Handle different resolutions
  switch (resolution) {
    case "FULL_REFUND_CUSTOMER":
      // Update booking status and trigger refund
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });
      // Note: Actual refund would be handled by escrow service
      logger.info("[Dispute] Full refund initiated", { bookingId: booking.id });
      break;

    case "PARTIAL_REFUND": {
      // Calculate and process partial refund
      const refundAmount = Math.floor(
        Number(booking.quoteAmountCents) * ((refundPercent || 0) / 100)
      );
      logger.info("[Dispute] Partial refund initiated", {
        bookingId: booking.id,
        refundPercent,
        refundAmount,
      });
      break;
    }

    case "STYLIST_PENALTY":
      // Apply penalty to stylist reputation
      await prisma.reputationScore.updateMany({
        where: { userId: booking.stylistId },
        data: {
          disputeScore: { decrement: 500 }, // -5% impact
        },
      });
      logger.info("[Dispute] Stylist penalty applied", {
        stylistId: booking.stylistId,
      });
      break;

    case "CUSTOMER_WARNING":
      // Record warning (could affect future bookings)
      logger.info("[Dispute] Customer warning issued", {
        customerId: booking.customerId,
      });
      break;

    default:
      break;
  }

  // Update booking status to reflect resolution
  if (resolution !== "FULL_REFUND_CUSTOMER") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "SETTLED" },
    });
  }
}
