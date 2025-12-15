// Reviews & Reputation API Routes
// Reference: docs/vlossom/08-reputation-system-flow.md

import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";
import { ReviewType } from "@prisma/client";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  reviewType: z.enum([
    "CUSTOMER_TO_STYLIST",
    "STYLIST_TO_CUSTOMER",
    "PROPERTY_TO_STYLIST",
    "STYLIST_TO_PROPERTY",
  ]),
  overallRating: z.number().int().min(10).max(50), // 1-5 scale * 10
  professionalismRating: z.number().int().min(10).max(50).optional(),
  communicationRating: z.number().int().min(10).max(50).optional(),
  cleanlinessRating: z.number().int().min(10).max(50).optional(),
  punctualityRating: z.number().int().min(10).max(50).optional(),
  qualityRating: z.number().int().min(10).max(50).optional(),
  comment: z.string().max(500).optional(),
});

// ============================================================================
// REVIEW ENDPOINTS
// ============================================================================

/**
 * POST /api/reviews
 * Create a review after booking completion
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const input = createReviewSchema.parse(req.body);

    // Get booking to validate
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        customerId: true,
        stylistId: true,
        status: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify booking is completed
    if (booking.status !== "COMPLETED") {
      return res.status(400).json({ error: "Can only review completed bookings" });
    }

    // Determine reviewee based on review type
    let revieweeId: string;
    let isAuthorized = false;

    switch (input.reviewType) {
      case "CUSTOMER_TO_STYLIST":
        revieweeId = booking.stylistId;
        isAuthorized = userId === booking.customerId;
        break;
      case "STYLIST_TO_CUSTOMER":
        revieweeId = booking.customerId;
        isAuthorized = userId === booking.stylistId;
        break;
      case "PROPERTY_TO_STYLIST":
        // Property owner reviews stylist - need to check property ownership
        revieweeId = booking.stylistId;
        // TODO: Validate property owner authorization
        isAuthorized = false; // Will be implemented with property booking integration
        break;
      case "STYLIST_TO_PROPERTY":
        // Stylist reviews property - need property ID
        // TODO: Implement property review flow
        revieweeId = ""; // Placeholder
        isAuthorized = userId === booking.stylistId;
        break;
      default:
        return res.status(400).json({ error: "Invalid review type" });
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: "Not authorized to submit this review" });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        bookingId_reviewType: {
          bookingId: input.bookingId,
          reviewType: input.reviewType as ReviewType,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({ error: "Review already submitted for this booking" });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: input.bookingId,
        reviewerId: userId,
        revieweeId,
        reviewType: input.reviewType as ReviewType,
        overallRating: input.overallRating,
        professionalismRating: input.professionalismRating,
        communicationRating: input.communicationRating,
        cleanlinessRating: input.cleanlinessRating,
        punctualityRating: input.punctualityRating,
        qualityRating: input.qualityRating,
        comment: input.comment,
        isVerified: true, // Verified because booking is completed
      },
    });

    // Update reputation score
    await updateReputationFromReview(revieweeId, review);

    res.status(201).json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Failed to create review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Get reviews for a specific user
 */
router.get("/user/:userId", async (req, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, limit = "10", offset = "0" } = req.query;

    const where: Record<string, unknown> = {
      revieweeId: userId,
      isPublic: true,
    };

    if (type) {
      where.reviewType = type;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          // Can't include reviewer directly without relation
        },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.review.count({ where }),
    ]);

    // Fetch reviewer info separately
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewerId))];
    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const reviewerMap = new Map(reviewers.map((r) => [r.id, r]));

    const enriched = reviews.map((r) => ({
      ...r,
      reviewer: reviewerMap.get(r.reviewerId) || null,
    }));

    // Calculate average rating
    const avgResult = await prisma.review.aggregate({
      where: { revieweeId: userId, isPublic: true },
      _avg: { overallRating: true },
      _count: true,
    });

    res.json({
      reviews: enriched,
      total,
      averageRating: avgResult._avg.overallRating
        ? (avgResult._avg.overallRating / 10).toFixed(1)
        : null,
      totalReviews: avgResult._count,
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * GET /api/reviews/booking/:bookingId
 * Get reviews for a specific booking
 */
router.get("/booking/:bookingId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { bookingId } = req.params;

    // Verify user is part of the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, stylistId: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== userId && booking.stylistId !== userId) {
      return res.status(403).json({ error: "Not authorized to view these reviews" });
    }

    const reviews = await prisma.review.findMany({
      where: { bookingId },
    });

    res.json({ reviews });
  } catch (error) {
    console.error("Failed to fetch booking reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * GET /api/reviews/pending
 * Get pending reviews for the current user
 */
router.get("/pending", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    // Find completed bookings where user hasn't submitted a review
    const bookingsAsCustomer = await prisma.booking.findMany({
      where: {
        customerId: userId,
        status: "COMPLETED",
      },
      include: {
        stylist: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        services: {
          select: { name: true },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    const bookingsAsStylist = await prisma.booking.findMany({
      where: {
        stylistId: userId,
        status: "COMPLETED",
      },
      include: {
        customer: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        services: {
          select: { name: true },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    // Check which bookings have reviews
    const customerBookingIds = bookingsAsCustomer.map((b) => b.id);
    const stylistBookingIds = bookingsAsStylist.map((b) => b.id);

    const existingReviews = await prisma.review.findMany({
      where: {
        OR: [
          {
            bookingId: { in: customerBookingIds },
            reviewType: "CUSTOMER_TO_STYLIST",
            reviewerId: userId,
          },
          {
            bookingId: { in: stylistBookingIds },
            reviewType: "STYLIST_TO_CUSTOMER",
            reviewerId: userId,
          },
        ],
      },
      select: { bookingId: true, reviewType: true },
    });

    const reviewedCustomerBookings = new Set(
      existingReviews
        .filter((r) => r.reviewType === "CUSTOMER_TO_STYLIST")
        .map((r) => r.bookingId)
    );
    const reviewedStylistBookings = new Set(
      existingReviews
        .filter((r) => r.reviewType === "STYLIST_TO_CUSTOMER")
        .map((r) => r.bookingId)
    );

    const pendingAsCustomer = bookingsAsCustomer
      .filter((b) => !reviewedCustomerBookings.has(b.id))
      .map((b) => ({
        bookingId: b.id,
        reviewType: "CUSTOMER_TO_STYLIST",
        reviewee: b.stylist,
        serviceName: b.services[0]?.name || "Service",
        completedAt: b.completedAt,
      }));

    const pendingAsStylist = bookingsAsStylist
      .filter((b) => !reviewedStylistBookings.has(b.id))
      .map((b) => ({
        bookingId: b.id,
        reviewType: "STYLIST_TO_CUSTOMER",
        reviewee: b.customer,
        serviceName: b.services[0]?.name || "Service",
        completedAt: b.completedAt,
      }));

    res.json({
      pendingReviews: [...pendingAsCustomer, ...pendingAsStylist],
    });
  } catch (error) {
    console.error("Failed to fetch pending reviews:", error);
    res.status(500).json({ error: "Failed to fetch pending reviews" });
  }
});

// ============================================================================
// REPUTATION ENDPOINTS
// ============================================================================

/**
 * GET /api/reviews/reputation/:userId
 * Get reputation score for a user
 */
router.get("/reputation/:userId", async (req, res: Response) => {
  try {
    const { userId } = req.params;

    let reputation = await prisma.reputationScore.findUnique({
      where: { userId },
    });

    // If no reputation exists, return default
    if (!reputation) {
      reputation = {
        id: "",
        userId,
        actorType: "STYLIST",
        totalScore: 5000,
        tpsScore: 5000,
        reliabilityScore: 5000,
        feedbackScore: 5000,
        disputeScore: 10000,
        completedBookings: 0,
        cancelledBookings: 0,
        totalReviews: 0,
        averageRating: null,
        isVerified: false,
        verifiedAt: null,
        lastCalculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Calculate percentage scores
    const scores = {
      total: (reputation.totalScore / 100).toFixed(1),
      tps: (reputation.tpsScore / 100).toFixed(1),
      reliability: (reputation.reliabilityScore / 100).toFixed(1),
      feedback: (reputation.feedbackScore / 100).toFixed(1),
      dispute: (reputation.disputeScore / 100).toFixed(1),
    };

    res.json({
      reputation: {
        ...reputation,
        scores,
      },
    });
  } catch (error) {
    console.error("Failed to fetch reputation:", error);
    res.status(500).json({ error: "Failed to fetch reputation" });
  }
});

/**
 * GET /api/reviews/reputation/:userId/events
 * Get reputation events for a user
 */
router.get("/reputation/:userId/events", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.sub;
    const { userId } = req.params;
    const { limit = "20", offset = "0" } = req.query;

    // Only allow users to see their own events or admins
    if (requesterId !== userId) {
      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { roles: true },
      });
      const roles = user?.roles as string[] | null;
      if (!roles?.includes("ADMIN")) {
        return res.status(403).json({ error: "Not authorized to view reputation events" });
      }
    }

    const [events, total] = await Promise.all([
      prisma.reputationEvent.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.reputationEvent.count({ where: { actorId: userId } }),
    ]);

    res.json({ events, total });
  } catch (error) {
    console.error("Failed to fetch reputation events:", error);
    res.status(500).json({ error: "Failed to fetch reputation events" });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update reputation score after a review is submitted
 */
async function updateReputationFromReview(
  revieweeId: string,
  review: { overallRating: number; reviewType: ReviewType }
): Promise<void> {
  try {
    // Get or create reputation score
    let reputation = await prisma.reputationScore.findUnique({
      where: { userId: revieweeId },
    });

    if (!reputation) {
      // Determine actor type based on review type
      let actorType: "STYLIST" | "CUSTOMER" | "PROPERTY_OWNER" = "STYLIST";
      if (review.reviewType === "STYLIST_TO_CUSTOMER") {
        actorType = "CUSTOMER";
      } else if (review.reviewType === "STYLIST_TO_PROPERTY") {
        actorType = "PROPERTY_OWNER";
      }

      reputation = await prisma.reputationScore.create({
        data: {
          userId: revieweeId,
          actorType,
        },
      });
    }

    // Calculate new feedback score
    const allReviews = await prisma.review.findMany({
      where: { revieweeId },
      select: { overallRating: true },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;

    // Convert 10-50 scale to 0-10000 scale (50 = 10000)
    const newFeedbackScore = Math.round((avgRating / 50) * 10000);

    // Recalculate total score
    const newTotalScore = Math.round(
      (reputation.tpsScore * 30 +
        reputation.reliabilityScore * 30 +
        newFeedbackScore * 30 +
        reputation.disputeScore * 10) /
        100
    );

    // Check verification threshold (70%)
    const meetsThreshold =
      newTotalScore >= 7000 && reputation.completedBookings >= 5;

    await prisma.reputationScore.update({
      where: { userId: revieweeId },
      data: {
        feedbackScore: newFeedbackScore,
        totalScore: newTotalScore,
        totalReviews: allReviews.length,
        averageRating: avgRating / 10, // Store as 1-5 scale
        isVerified: meetsThreshold,
        verifiedAt: meetsThreshold && !reputation.isVerified ? new Date() : reputation.verifiedAt,
        lastCalculatedAt: new Date(),
      },
    });

    // Record reputation event
    await prisma.reputationEvent.create({
      data: {
        actorId: revieweeId,
        actorType: reputation.actorType,
        eventType: "CUSTOMER_REVIEW",
        scoreImpact: Math.round((review.overallRating - 30) / 2), // Neutral at 30 (3 stars)
        metadata: {
          reviewRating: review.overallRating,
          newFeedbackScore,
          newTotalScore,
        },
      },
    });
  } catch (error) {
    console.error("Failed to update reputation from review:", error);
    // Don't throw - reputation updates are non-critical
  }
}

export default router;
