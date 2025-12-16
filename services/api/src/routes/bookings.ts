// Bookings API Routes
// Reference: docs/specs/booking-flow-v1/feature-spec.md
//
// SECURITY AUDIT (V1.9.0) - H-3: SQL Injection Review
// ====================================================
// STATUS: VERIFIED SAFE
// All database queries in this module use Prisma ORM with parameterized queries.
// No raw SQL is used. User input is validated via Zod schemas before database operations.
// Audit date: 2025-12-15

import { Router, Response, NextFunction } from "express";
import { BookingStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { authorizeBookingAccess } from "../middleware/authorize";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import {
  createBookingSchema,
  approveBookingSchema,
  declineBookingSchema,
  startServiceSchema,
  completeServiceSchema,
  confirmServiceSchema,
  cancelBookingSchema,
} from "../lib/validation";
import { validateTransition } from "../lib/booking-state-machine";
import { calculateBookingPricing } from "../lib/pricing";
import {
  calculateCustomerRefund,
  calculateStylistCancellationRefund,
  canCancelBooking,
} from "../lib/cancellation-policy";
import {
  releaseFundsFromEscrow,
  refundFromEscrow,
  PLATFORM_TREASURY_ADDRESS,
  PLATFORM_FEE_PERCENTAGE,
} from "../lib/escrow-client";
import {
  getPaymentInstructions,
  verifyAndConfirmPayment,
} from "../lib/wallet-booking-bridge";
import {
  checkAvailability,
  getAvailableSlotsForDate,
  getTravelTime,
  type Coordinates,
} from "../lib/scheduling";
import { notifyBookingEvent } from "../lib/notifications";
import { recordBookingCompletionEvent } from "../lib/reputation";
import { z } from "zod";
import type { Address, Hash } from "viem";

// Validation schema for confirm-payment endpoint
const confirmPaymentSchema = z.object({
  escrowTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
  skipOnChainVerification: z.boolean().optional().default(false), // For testing only
});

// Validation schemas for scheduling endpoints
// Geographic coordinates use WGS84 standard: lat [-90, 90], lng [-180, 180]
const checkAvailabilitySchema = z.object({
  stylistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  locationType: z.enum(["STYLIST_BASE", "CUSTOMER_HOME"]),
  customerLat: z.number().min(-90).max(90).optional(),
  customerLng: z.number().min(-180).max(180).optional(),
});

const getAvailableSlotsSchema = z.object({
  stylistId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(15).max(480),
});

const travelTimeSchema = z.object({
  originLat: z.coerce.number().min(-90).max(90),
  originLng: z.coerce.number().min(-180).max(180),
  destLat: z.coerce.number().min(-90).max(90),
  destLng: z.coerce.number().min(-180).max(180),
});

const router: ReturnType<typeof Router> = Router();

/**
 * Helper function to log status changes
 */
async function logStatusChange(
  bookingId: string,
  fromStatus: BookingStatus | null,
  toStatus: BookingStatus,
  changedBy: string,
  reason?: string
) {
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId,
      fromStatus,
      toStatus,
      changedBy,
      reason,
    },
  });
}

// ============================================================================
// F4.1: SCHEDULING / AVAILABILITY ENDPOINTS
// ============================================================================

/**
 * POST /api/bookings/check-availability
 * Check if a specific time slot is available for booking
 */
router.post("/check-availability", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = checkAvailabilitySchema.parse(req.body);

    // Get service to determine duration
    const service = await prisma.stylistService.findUnique({
      where: { id: input.serviceId },
    });

    if (!service) {
      return next(createError("SERVICE_NOT_FOUND"));
    }

    // Build customer coordinates if provided
    const customerCoords: Coordinates | undefined =
      input.customerLat && input.customerLng
        ? { lat: input.customerLat, lng: input.customerLng }
        : undefined;

    // Check availability
    const result = await checkAvailability({
      stylistId: input.stylistId,
      serviceId: input.serviceId,
      startTime: new Date(input.startTime),
      durationMinutes: service.estimatedDurationMin,
      locationType: input.locationType,
      customerCoords,
    });

    return res.json({
      available: result.available,
      conflicts: result.conflicts,
      suggestedAlternatives: result.suggestedAlternatives.map((d) => d.toISOString()),
      travelBufferMinutes: result.travelBufferMinutes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error checking availability", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/bookings/available-slots
 * Get available time slots for a specific date
 */
router.get("/available-slots", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = getAvailableSlotsSchema.parse(req.query);

    // Parse date
    const date = new Date(input.date);
    date.setHours(0, 0, 0, 0);

    // Get available slots
    const slots = await getAvailableSlotsForDate(
      input.stylistId,
      date,
      input.durationMinutes
    );

    return res.json({
      date: input.date,
      stylistId: input.stylistId,
      durationMinutes: input.durationMinutes,
      slots: slots.map((s) => ({
        startTime: s.toISOString(),
        endTime: new Date(s.getTime() + input.durationMinutes * 60 * 1000).toISOString(),
      })),
      totalAvailable: slots.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error fetching available slots", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/bookings/travel-time
 * Calculate travel time between two locations
 */
router.get("/travel-time", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = travelTimeSchema.parse(req.query);

    const origin: Coordinates = { lat: input.originLat, lng: input.originLng };
    const destination: Coordinates = { lat: input.destLat, lng: input.destLng };

    const result = await getTravelTime(origin, destination);

    return res.json({
      travelTimeMinutes: result.travelTimeMinutes,
      distanceKm: result.distanceKm,
      cached: result.cached,
      source: result.source,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error calculating travel time", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// BOOKING CRUD ENDPOINTS
// ============================================================================

/**
 * POST /api/bookings
 * Create a new booking request
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createBookingSchema.parse(req.body);
    // M-6: SECURITY - customerId derived from JWT, not from request body
    // This prevents users from creating bookings on behalf of other users
    const customerId = req.userId!;

    // Validate service exists and get pricing
    const service = await prisma.stylistService.findUnique({
      where: { id: input.serviceId },
      include: {
        stylist: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!service) {
      return next(createError("SERVICE_NOT_FOUND"));
    }

    if (!service.isActive) {
      return next(createError("SERVICE_INACTIVE"));
    }

    if (!service.stylist.isAcceptingBookings) {
      return next(createError("STYLIST_NOT_ACCEPTING"));
    }

    // F4.1: Check for scheduling conflicts before creating booking
    const customerCoords: Coordinates | undefined =
      input.locationLat && input.locationLng
        ? { lat: input.locationLat, lng: input.locationLng }
        : undefined;

    const availabilityCheck = await checkAvailability({
      stylistId: input.stylistId,
      serviceId: input.serviceId,
      startTime: input.scheduledStartTime,
      durationMinutes: service.estimatedDurationMin,
      locationType: input.locationType,
      customerCoords,
    });

    if (!availabilityCheck.available) {
      return next(createError("SCHEDULING_CONFLICT", {
        conflicts: availabilityCheck.conflicts,
        suggestedAlternatives: availabilityCheck.suggestedAlternatives.map((d) => d.toISOString()),
      }));
    }

    // Calculate pricing
    const pricing = calculateBookingPricing(service.priceAmountCents);

    // Calculate end time based on service duration
    const scheduledEndTime = new Date(
      input.scheduledStartTime.getTime() + service.estimatedDurationMin * 60 * 1000
    );

    // Create booking with PENDING_STYLIST_APPROVAL status
    const booking = await prisma.booking.create({
      data: {
        customerId, // M-6: From JWT, not request body
        stylistId: input.stylistId,
        serviceId: input.serviceId,
        serviceType: service.name,
        serviceCategory: service.category,
        estimatedDurationMin: service.estimatedDurationMin,
        scheduledStartTime: input.scheduledStartTime,
        scheduledEndTime,
        locationType: input.locationType,
        locationAddress: input.locationAddress,
        locationLat: input.locationLat,
        locationLng: input.locationLng,
        quoteAmountCents: pricing.quoteAmountCents,
        platformFeeCents: pricing.platformFeeCents,
        stylistPayoutCents: pricing.stylistPayoutCents,
        propertyPayoutCents: pricing.propertyPayoutCents,
        status: BookingStatus.PENDING_STYLIST_APPROVAL,
      },
      include: {
        customer: true,
        stylist: true,
        service: true,
      },
    });

    // Log initial status
    await logStatusChange(
      booking.id,
      null,
      BookingStatus.PENDING_STYLIST_APPROVAL,
      customerId, // M-6: From JWT
      "Booking created"
    );

    // F4.3: Send notification to stylist about new booking request
    notifyBookingEvent(booking.stylistId, "BOOKING_CREATED", {
      bookingId: booking.id,
      customerName: booking.customer.displayName,
      serviceName: booking.serviceType,
      scheduledTime: booking.scheduledStartTime.toISOString(),
    }).catch((err) => logger.error("Failed to send booking notification", { error: err }));

    return res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error creating booking", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/bookings/:id
 * Get booking details with status history
 */
router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        stylist: true,
        service: true,
        statusHistory: {
          orderBy: { changedAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify user is either customer or stylist
    if (!authorizeBookingAccess(userId, booking, "any")) {
      return next(createError("FORBIDDEN"));
    }

    return res.json(booking);
  } catch (error) {
    logger.error("Error fetching booking", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/approve
 * Stylist approves booking request
 */
router.post("/:id/approve", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = approveBookingSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // SECURITY: Verify authenticated user is the assigned stylist
    // Use req.userId from JWT, not input.stylistId from request body
    if (booking.stylistId !== userId) {
      return next(createError("FORBIDDEN"));
    }

    // Validate state transition
    try {
      validateTransition(
        booking.status,
        BookingStatus.PENDING_CUSTOMER_PAYMENT
      );
    } catch (transitionError) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: transitionError instanceof Error ? transitionError.message : "Invalid transition"
      }));
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.PENDING_CUSTOMER_PAYMENT,
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    // Log status change
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.PENDING_CUSTOMER_PAYMENT,
      userId,
      input.notes || "Stylist approved booking"
    );

    // TODO: Trigger payment flow (lock funds in escrow)

    // F4.3: Send notification to customer about booking approval
    notifyBookingEvent(updatedBooking.customerId, "BOOKING_APPROVED", {
      bookingId: id,
      stylistName: updatedBooking.stylist.displayName,
      scheduledTime: updatedBooking.scheduledStartTime.toISOString(),
    }).catch((err) => logger.error("Failed to send approval notification", { error: err }));

    return res.json(updatedBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error approving booking", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/decline
 * Stylist declines booking request
 */
router.post("/:id/decline", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = declineBookingSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify stylist authorization
    if (!authorizeBookingAccess(userId, booking, "stylist")) {
      return next(createError("FORBIDDEN"));
    }

    // Verify stylist ownership (backward compatibility check)
    if (booking.stylistId !== input.stylistId) {
      return next(createError("FORBIDDEN"));
    }

    // Validate state transition
    try {
      validateTransition(booking.status, BookingStatus.DECLINED);
    } catch (transitionError) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: transitionError instanceof Error ? transitionError.message : "Invalid transition"
      }));
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.DECLINED,
        cancelledAt: new Date(),
        cancelledBy: input.stylistId,
        cancellationReason: input.reason,
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    // Log status change
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.DECLINED,
      input.stylistId,
      input.reason
    );

    // F4.3: Send notification to customer about booking decline
    notifyBookingEvent(updatedBooking.customerId, "BOOKING_DECLINED", {
      bookingId: id,
      stylistName: updatedBooking.stylist.displayName,
      reason: input.reason,
    }).catch((err) => logger.error("Failed to send decline notification", { error: err }));

    return res.json(updatedBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error declining booking", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/bookings/:id/payment-instructions
 * Get payment instructions for customer
 */
router.get("/:id/payment-instructions", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify customer authorization
    if (!authorizeBookingAccess(userId, booking, "customer")) {
      return next(createError("FORBIDDEN"));
    }

    // Check booking status
    if (booking.status !== BookingStatus.PENDING_CUSTOMER_PAYMENT) {
      return next(createError("INVALID_STATUS", {
        message: `Booking must be in PENDING_CUSTOMER_PAYMENT status, current: ${booking.status}`
      }));
    }

    // Get payment instructions
    const result = await getPaymentInstructions(userId, id);

    if (!result.success) {
      return next(createError("PAYMENT_INSTRUCTIONS_ERROR", { message: result.error }));
    }

    return res.json({
      bookingId: id,
      amount: result.instructions!.amount.toString(),
      escrowAddress: result.instructions!.escrowAddress,
      usdcAddress: result.instructions!.usdcAddress,
      customerAddress: result.instructions!.customerAddress,
      needsApproval: result.instructions!.needsApproval,
      currentAllowance: result.instructions!.currentAllowance.toString(),
      hasBalance: result.instructions!.hasBalance,
      currentBalance: result.instructions!.currentBalance.toString(),
      instructions: result.instructions!.needsApproval
        ? "First approve USDC spend, then call lockFunds on escrow contract"
        : "Call lockFunds on escrow contract to complete payment",
    });
  } catch (error) {
    logger.error("Error getting payment instructions", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/confirm-payment
 * Verify payment locked in escrow and confirm booking
 *
 * Request body:
 * - escrowTxHash: Transaction hash of the lockFunds call on escrow contract
 * - skipOnChainVerification: (optional, testing only) Skip on-chain verification
 */
router.post("/:id/confirm-payment", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = confirmPaymentSchema.parse(req.body);
    const userId = req.userId!;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        stylist: true,
      },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify customer authorization
    if (!authorizeBookingAccess(userId, booking, "customer")) {
      return next(createError("FORBIDDEN"));
    }

    // Only allow skipping verification in non-production environments
    const skipVerification = input.skipOnChainVerification &&
      process.env.NODE_ENV !== "production";

    // Verify and confirm payment with transaction hash
    const result = await verifyAndConfirmPayment(
      id,
      input.escrowTxHash as Hash,
      skipVerification
    );

    if (!result.success) {
      return next(createError("PAYMENT_VERIFICATION_FAILED", { message: result.error }));
    }

    // Fetch updated booking
    const updatedBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        stylist: true,
      },
    });

    // F4.3: Notify stylist that booking is confirmed and paid
    notifyBookingEvent(updatedBooking!.stylistId, "PAYMENT_CONFIRMED", {
      bookingId: id,
      customerName: updatedBooking!.customer.displayName,
      serviceName: updatedBooking!.serviceType,
      amount: updatedBooking!.quoteAmountCents,
      txHash: input.escrowTxHash,
    }).catch((err) => logger.error("Failed to send payment confirmed notification", { error: err }));

    return res.json({
      booking: updatedBooking,
      message: "Payment confirmed, booking is now CONFIRMED",
      escrow: result.escrowRecord ? {
        customer: result.escrowRecord.customer,
        amount: result.escrowRecord.amount.toString(),
        status: result.escrowRecord.status,
      } : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error confirming payment", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/start
 * Mark service as started
 */
router.post("/:id/start", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = startServiceSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify stylist authorization
    if (!authorizeBookingAccess(userId, booking, "stylist")) {
      return next(createError("FORBIDDEN"));
    }

    // Verify stylist ownership (backward compatibility check)
    if (booking.stylistId !== input.stylistId) {
      return next(createError("FORBIDDEN"));
    }

    // Validate state transition
    try {
      validateTransition(booking.status, BookingStatus.IN_PROGRESS);
    } catch (transitionError) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: transitionError instanceof Error ? transitionError.message : "Invalid transition"
      }));
    }

    const actualStartTime = input.actualStartTime || new Date();

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.IN_PROGRESS,
        actualStartTime,
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    // Log status change (use authenticated userId, not input.stylistId)
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.IN_PROGRESS,
      userId,
      "Service started"
    );

    // F4.3: Send notification to customer that service has started
    notifyBookingEvent(updatedBooking.customerId, "SERVICE_STARTED", {
      bookingId: id,
      stylistName: updatedBooking.stylist.displayName,
      serviceName: updatedBooking.serviceType,
    }).catch((err) => logger.error("Failed to send service started notification", { error: err }));

    return res.json(updatedBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error starting service", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/complete
 * Mark service as completed
 */
router.post("/:id/complete", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = completeServiceSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify stylist authorization
    if (!authorizeBookingAccess(userId, booking, "stylist")) {
      return next(createError("FORBIDDEN"));
    }

    // Verify stylist ownership (backward compatibility check)
    if (booking.stylistId !== input.stylistId) {
      return next(createError("FORBIDDEN"));
    }

    // Validate state transition (IN_PROGRESS -> COMPLETED)
    try {
      validateTransition(booking.status, BookingStatus.COMPLETED);
    } catch (transitionError) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: transitionError instanceof Error ? transitionError.message : "Invalid transition"
      }));
    }

    const actualEndTime = input.actualEndTime || new Date();

    // Calculate actual duration
    const actualDurationMin = booking.actualStartTime
      ? Math.round(
          (actualEndTime.getTime() - booking.actualStartTime.getTime()) /
            (1000 * 60)
        )
      : null;

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.COMPLETED,
        actualEndTime,
        actualDurationMin,
      },
    });

    // Log status change (use authenticated userId, not input.stylistId)
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.COMPLETED,
      userId,
      input.notes || "Service completed"
    );

    // Immediately transition to AWAITING_CUSTOMER_CONFIRMATION
    const finalBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    await logStatusChange(
      id,
      BookingStatus.COMPLETED,
      BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
      input.stylistId,
      "Awaiting customer confirmation"
    );

    // F4.3: Send notification to customer that service is completed and needs confirmation
    notifyBookingEvent(finalBooking.customerId, "SERVICE_COMPLETED", {
      bookingId: id,
      stylistName: finalBooking.stylist.displayName,
      serviceName: finalBooking.serviceType,
      actualDurationMin: actualDurationMin || undefined,
    }).catch((err) => logger.error("Failed to send service completed notification", { error: err }));

    // Auto-confirm is handled by @vlossom/scheduler service polling
    // for AWAITING_CUSTOMER_CONFIRMATION bookings older than 24h

    return res.json(finalBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error completing service", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/confirm
 * Customer confirms service completion and triggers settlement
 */
router.post("/:id/confirm", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = confirmServiceSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        stylist: true,
      },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify customer authorization
    if (!authorizeBookingAccess(userId, booking, "customer")) {
      return next(createError("FORBIDDEN"));
    }

    // Verify customer ownership (backward compatibility check)
    if (booking.customerId !== input.customerId) {
      return next(createError("FORBIDDEN"));
    }

    // Validate state transition
    try {
      validateTransition(
        booking.status,
        BookingStatus.SETTLED
      );
    } catch (transitionError) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: transitionError instanceof Error ? transitionError.message : "Invalid transition"
      }));
    }

    // Update booking to SETTLED
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.SETTLED,
        finalAmountCents: booking.quoteAmountCents,
      },
    });

    // Log status change
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.SETTLED,
      input.customerId,
      "Customer confirmed completion"
    );

    // Trigger escrow settlement - release funds to stylist and treasury
    try {
      // Get stylist wallet address
      if (!booking.stylist.walletAddress) {
        logger.error("Stylist wallet address not found", { stylistId: booking.stylistId });
        throw new Error("Stylist wallet not configured");
      }

      const result = await releaseFundsFromEscrow({
        bookingId: id,
        stylistAddress: booking.stylist.walletAddress as Address,
        totalAmount: BigInt(booking.quoteAmountCents),
        platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
        treasuryAddress: PLATFORM_TREASURY_ADDRESS,
      });

      if (!result.success) {
        logger.error("Failed to release escrow funds", { error: result.error });

        // M-1: Record escrow failure for manual review
        await prisma.escrowFailure.create({
          data: {
            bookingId: id,
            operation: "RELEASE",
            errorMessage: result.error || "Unknown error",
            txHash: result.txHash,
            amount: BigInt(booking.quoteAmountCents),
            metadata: {
              stylistAddress: booking.stylist.walletAddress,
              treasuryAddress: PLATFORM_TREASURY_ADDRESS,
              platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
            },
          },
        });

        // Log the error but don't fail the booking confirmation
        // Support team can manually release funds if needed
      } else {
        logger.info("Escrow funds released successfully", { txHash: result.txHash });
      }
    } catch (escrowError) {
      logger.error("Error releasing escrow funds", { error: escrowError });

      // M-1: Record escrow failure for manual review
      try {
        await prisma.escrowFailure.create({
          data: {
            bookingId: id,
            operation: "RELEASE",
            errorMessage: escrowError instanceof Error ? escrowError.message : String(escrowError),
            amount: BigInt(booking.quoteAmountCents),
            metadata: {
              errorStack: escrowError instanceof Error ? escrowError.stack : undefined,
            },
          },
        });
      } catch (dbError) {
        logger.error("Failed to record escrow failure", { error: dbError });
      }

      // Continue - don't block booking confirmation on escrow failure
    }

    // Record reputation events for this booking completion
    recordBookingCompletionEvent({
      bookingId: id,
      customerId: booking.customerId,
      stylistId: booking.stylistId,
      scheduledStart: booking.scheduledStartTime,
      actualStart: booking.actualStartTime,
      scheduledEnd: booking.scheduledEndTime,
      actualEnd: booking.actualEndTime,
      wasAutoConfirmed: false,
    }).catch((err) => logger.error("Failed to record reputation event", { error: err }));

    return res.json(updatedBooking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error confirming booking", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel booking with appropriate refund logic
 */
router.post("/:id/cancel", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input = cancelBookingSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        stylist: true,
      },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Verify authorization - either customer or stylist can cancel
    if (!authorizeBookingAccess(userId, booking, "any")) {
      return next(createError("FORBIDDEN"));
    }

    // Check if user is customer or stylist
    const isStylist = booking.stylistId === userId;

    // Backward compatibility check
    if (booking.customerId !== input.userId && booking.stylistId !== input.userId) {
      return next(createError("FORBIDDEN"));
    }

    // Check if cancellation is allowed
    if (!canCancelBooking(booking.status)) {
      return next(createError("CANNOT_CANCEL", {
        message: `Booking cannot be cancelled in ${booking.status} status`
      }));
    }

    // Calculate refund based on who is cancelling
    let refundAmountCents: bigint;
    let cancellationDetails: string;

    if (isStylist) {
      // Stylist cancellation = full refund
      refundAmountCents = calculateStylistCancellationRefund(
        booking.quoteAmountCents
      );
      cancellationDetails = "Stylist cancelled - full refund";
    } else {
      // Customer cancellation = timing-based refund
      const refund = calculateCustomerRefund(
        booking.quoteAmountCents,
        booking.scheduledStartTime
      );
      refundAmountCents = refund.refundAmountCents;
      cancellationDetails = `Customer cancelled ${refund.hoursUntilStart.toFixed(1)}h before - ${refund.refundPercentage}% refund`;
    }

    // Validate state transition
    try {
      validateTransition(booking.status, BookingStatus.CANCELLED);
    } catch (transitionError) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: transitionError instanceof Error ? transitionError.message : "Invalid transition"
      }));
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: input.userId,
        cancellationReason: input.reason,
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    // Log status change
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.CANCELLED,
      input.userId,
      `${input.reason} - ${cancellationDetails}`
    );

    // Process refund via escrow contract
    try {
      // Get customer wallet address for refund
      if (!booking.customer.walletAddress) {
        logger.error("Customer wallet address not found", { customerId: booking.customerId });
        throw new Error("Customer wallet not configured");
      }

      // Only process refund if there's money to refund
      if (refundAmountCents > 0n) {
        const result = await refundFromEscrow({
          bookingId: id,
          recipientAddress: booking.customer.walletAddress as Address,
        });

        if (!result.success) {
          logger.error("Failed to refund from escrow", { error: result.error });

          // M-1: Record escrow failure for manual review
          await prisma.escrowFailure.create({
            data: {
              bookingId: id,
              operation: "REFUND",
              errorMessage: result.error || "Unknown error",
              txHash: result.txHash,
              amount: refundAmountCents,
              metadata: {
                customerAddress: booking.customer.walletAddress,
                originalAmount: booking.quoteAmountCents.toString(),
              },
            },
          });

          // Log the error but don't fail the cancellation
          // Support team can manually process refund if needed
        } else {
          logger.info("Refund processed successfully", { txHash: result.txHash });
        }
      } else {
        logger.info("No refund amount - cancellation within no-refund window");
      }
    } catch (refundError) {
      logger.error("Error processing refund", { error: refundError });

      // M-1: Record escrow failure for manual review
      try {
        await prisma.escrowFailure.create({
          data: {
            bookingId: id,
            operation: "REFUND",
            errorMessage: refundError instanceof Error ? refundError.message : String(refundError),
            amount: refundAmountCents,
            metadata: {
              errorStack: refundError instanceof Error ? refundError.stack : undefined,
            },
          },
        });
      } catch (dbError) {
        logger.error("Failed to record escrow failure", { error: dbError });
      }

      // Continue - don't block cancellation on escrow failure
    }

    // F4.3: Send notifications to both parties about cancellation
    const cancelledByCustomer = booking.customerId === input.userId;

    // Notify the customer
    notifyBookingEvent(updatedBooking.customerId, "BOOKING_CANCELLED", {
      bookingId: id,
      cancelledBy: cancelledByCustomer ? "you" : updatedBooking.stylist.displayName,
      reason: input.reason,
      refundAmount: Number(refundAmountCents),
    }).catch((err) => logger.error("Failed to send cancellation notification to customer", { error: err }));

    // Notify the stylist
    notifyBookingEvent(updatedBooking.stylistId, "BOOKING_CANCELLED", {
      bookingId: id,
      cancelledBy: cancelledByCustomer ? updatedBooking.customer.displayName : "you",
      reason: input.reason,
      customerName: updatedBooking.customer.displayName,
    }).catch((err) => logger.error("Failed to send cancellation notification to stylist", { error: err }));

    return res.json({
      booking: updatedBooking,
      refund: {
        amountCents: refundAmountCents.toString(),
        details: cancellationDetails,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error cancelling booking", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
