// Bookings API Routes
// Reference: docs/specs/booking-flow-v1/feature-spec.md

import { Router, Request, Response } from "express";
import { BookingStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { authorizeBookingAccess, createForbiddenError } from "../middleware/authorize";
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
import { notifyBookingEvent, NotificationType } from "../lib/notifications";
import { recordBookingCompletionEvent, recordCancellationEvent } from "../lib/reputation";
import { z } from "zod";
import type { Address } from "viem";

// Validation schemas for scheduling endpoints
const checkAvailabilitySchema = z.object({
  stylistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  locationType: z.enum(["STYLIST_LOCATION", "CUSTOMER_LOCATION"]),
  customerLat: z.number().optional(),
  customerLng: z.number().optional(),
});

const getAvailableSlotsSchema = z.object({
  stylistId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(15).max(480),
});

const travelTimeSchema = z.object({
  originLat: z.coerce.number(),
  originLng: z.coerce.number(),
  destLat: z.coerce.number(),
  destLng: z.coerce.number(),
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
router.post("/check-availability", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = checkAvailabilitySchema.parse(req.body);

    // Get service to determine duration
    const service = await prisma.stylistService.findUnique({
      where: { id: input.serviceId },
    });

    if (!service) {
      return res.status(404).json({
        error: {
          code: "SERVICE_NOT_FOUND",
          message: "Service not found",
        },
      });
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error checking availability:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to check availability",
      },
    });
  }
});

/**
 * GET /api/bookings/available-slots
 * Get available time slots for a specific date
 */
router.get("/available-slots", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        },
      });
    }

    console.error("Error fetching available slots:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch available slots",
      },
    });
  }
});

/**
 * GET /api/bookings/travel-time
 * Calculate travel time between two locations
 */
router.get("/travel-time", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.errors,
        },
      });
    }

    console.error("Error calculating travel time:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to calculate travel time",
      },
    });
  }
});

// ============================================================================
// BOOKING CRUD ENDPOINTS
// ============================================================================

/**
 * POST /api/bookings
 * Create a new booking request
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const input = createBookingSchema.parse(req.body);
    const userId = req.userId!;

    // Verify the authenticated user is the customer creating the booking
    if (input.customerId !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only create bookings for yourself",
        },
      });
    }

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
      return res.status(404).json({
        error: {
          code: "SERVICE_NOT_FOUND",
          message: "The requested service does not exist",
        },
      });
    }

    if (!service.isActive) {
      return res.status(400).json({
        error: {
          code: "SERVICE_INACTIVE",
          message: "This service is no longer available",
        },
      });
    }

    if (!service.stylist.isAcceptingBookings) {
      return res.status(400).json({
        error: {
          code: "STYLIST_NOT_ACCEPTING",
          message: "This stylist is not currently accepting bookings",
        },
      });
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
      return res.status(409).json({
        error: {
          code: "SCHEDULING_CONFLICT",
          message: "The requested time slot is not available",
          conflicts: availabilityCheck.conflicts,
          suggestedAlternatives: availabilityCheck.suggestedAlternatives.map((d) => d.toISOString()),
        },
      });
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
        customerId: input.customerId,
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
      input.customerId,
      "Booking created"
    );

    // F4.3: Send notification to stylist about new booking request
    notifyBookingEvent(booking.stylistId, NotificationType.BOOKING_CREATED, {
      bookingId: booking.id,
      customerName: booking.customer.displayName,
      serviceName: booking.serviceType,
      scheduledTime: booking.scheduledStartTime.toISOString(),
    }).catch((err) => console.error("Failed to send booking notification:", err));

    return res.status(201).json(booking);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error creating booking:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create booking",
      },
    });
  }
});

/**
 * GET /api/bookings/:id
 * Get booking details with status history
 */
router.get("/:id", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify user is either customer or stylist
    if (!authorizeBookingAccess(userId, booking, "any")) {
      const error = createForbiddenError("view", "any");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    return res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch booking",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/approve
 * Stylist approves booking request
 */
router.post("/:id/approve", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const input = approveBookingSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify stylist ownership
    if (booking.stylistId !== input.stylistId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the assigned stylist can approve this booking",
        },
      });
    }

    // Validate state transition
    try {
      validateTransition(
        booking.status,
        BookingStatus.PENDING_CUSTOMER_PAYMENT
      );
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: error.message,
        },
      });
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
      input.stylistId,
      input.notes || "Stylist approved booking"
    );

    // TODO: Trigger payment flow (lock funds in escrow)

    // F4.3: Send notification to customer about booking approval
    notifyBookingEvent(updatedBooking.customerId, NotificationType.BOOKING_APPROVED, {
      bookingId: id,
      stylistName: updatedBooking.stylist.displayName,
      scheduledTime: updatedBooking.scheduledStartTime.toISOString(),
    }).catch((err) => console.error("Failed to send approval notification:", err));

    return res.json(updatedBooking);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error approving booking:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to approve booking",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/decline
 * Stylist declines booking request
 */
router.post("/:id/decline", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const input = declineBookingSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify stylist authorization
    if (!authorizeBookingAccess(userId, booking, "stylist")) {
      const error = createForbiddenError("decline", "stylist");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Verify stylist ownership (backward compatibility check)
    if (booking.stylistId !== input.stylistId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the assigned stylist can decline this booking",
        },
      });
    }

    // Validate state transition
    try {
      validateTransition(booking.status, BookingStatus.DECLINED);
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: error.message,
        },
      });
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
    notifyBookingEvent(updatedBooking.customerId, NotificationType.BOOKING_DECLINED, {
      bookingId: id,
      stylistName: updatedBooking.stylist.displayName,
      reason: input.reason,
    }).catch((err) => console.error("Failed to send decline notification:", err));

    return res.json(updatedBooking);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error declining booking:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to decline booking",
      },
    });
  }
});

/**
 * GET /api/bookings/:id/payment-instructions
 * Get payment instructions for customer
 */
router.get("/:id/payment-instructions", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify customer authorization
    if (!authorizeBookingAccess(userId, booking, "customer")) {
      const error = createForbiddenError("get payment instructions for", "customer");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Check booking status
    if (booking.status !== BookingStatus.PENDING_CUSTOMER_PAYMENT) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS",
          message: `Booking must be in PENDING_CUSTOMER_PAYMENT status, current: ${booking.status}`,
        },
      });
    }

    // Get payment instructions
    const result = await getPaymentInstructions(userId, id);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "PAYMENT_INSTRUCTIONS_ERROR",
          message: result.error || "Failed to get payment instructions",
        },
      });
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
  } catch (error: any) {
    console.error("Error getting payment instructions:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to get payment instructions",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/confirm-payment
 * Verify payment locked in escrow and confirm booking
 */
router.post("/:id/confirm-payment", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
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
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify customer authorization
    if (!authorizeBookingAccess(userId, booking, "customer")) {
      const error = createForbiddenError("confirm payment for", "customer");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Verify and confirm payment
    const result = await verifyAndConfirmPayment(id);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "PAYMENT_VERIFICATION_FAILED",
          message: result.error || "Failed to verify payment",
        },
      });
    }

    // Fetch updated booking
    const updatedBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        stylist: true,
      },
    });

    return res.json({
      booking: updatedBooking,
      message: "Payment confirmed, booking is now CONFIRMED",
    });
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to confirm payment",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/start
 * Mark service as started
 */
router.post("/:id/start", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const input = startServiceSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify stylist authorization
    if (!authorizeBookingAccess(userId, booking, "stylist")) {
      const error = createForbiddenError("start", "stylist");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Verify stylist ownership (backward compatibility check)
    if (booking.stylistId !== input.stylistId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the assigned stylist can start this service",
        },
      });
    }

    // Validate state transition
    try {
      validateTransition(booking.status, BookingStatus.IN_PROGRESS);
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: error.message,
        },
      });
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

    // Log status change
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.IN_PROGRESS,
      input.stylistId,
      "Service started"
    );

    // F4.3: Send notification to customer that service has started
    notifyBookingEvent(updatedBooking.customerId, NotificationType.SERVICE_STARTED, {
      bookingId: id,
      stylistName: updatedBooking.stylist.displayName,
      serviceName: updatedBooking.serviceType,
    }).catch((err) => console.error("Failed to send service started notification:", err));

    return res.json(updatedBooking);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error starting service:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to start service",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/complete
 * Mark service as completed
 */
router.post("/:id/complete", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const input = completeServiceSchema.parse(req.body);
    const userId = req.userId!;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify stylist authorization
    if (!authorizeBookingAccess(userId, booking, "stylist")) {
      const error = createForbiddenError("complete", "stylist");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Verify stylist ownership (backward compatibility check)
    if (booking.stylistId !== input.stylistId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the assigned stylist can complete this service",
        },
      });
    }

    // Validate state transition (IN_PROGRESS -> COMPLETED)
    try {
      validateTransition(booking.status, BookingStatus.COMPLETED);
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: error.message,
        },
      });
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

    // Log status change
    await logStatusChange(
      id,
      booking.status,
      BookingStatus.COMPLETED,
      input.stylistId,
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
    notifyBookingEvent(finalBooking.customerId, NotificationType.SERVICE_COMPLETED, {
      bookingId: id,
      stylistName: finalBooking.stylist.displayName,
      serviceName: finalBooking.serviceType,
      actualDurationMin: actualDurationMin || undefined,
    }).catch((err) => console.error("Failed to send service completed notification:", err));

    // Auto-confirm is handled by @vlossom/scheduler service polling
    // for AWAITING_CUSTOMER_CONFIRMATION bookings older than 24h

    return res.json(finalBooking);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error completing service:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to complete service",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/confirm
 * Customer confirms service completion and triggers settlement
 */
router.post("/:id/confirm", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify customer authorization
    if (!authorizeBookingAccess(userId, booking, "customer")) {
      const error = createForbiddenError("confirm", "customer");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Verify customer ownership (backward compatibility check)
    if (booking.customerId !== input.customerId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the customer can confirm this booking",
        },
      });
    }

    // Validate state transition
    try {
      validateTransition(
        booking.status,
        BookingStatus.SETTLED
      );
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: error.message,
        },
      });
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
        console.error("Stylist wallet address not found:", booking.stylistId);
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
        console.error("Failed to release escrow funds:", result.error);
        // Log the error but don't fail the booking confirmation
        // Support team can manually release funds if needed
      } else {
        console.log("✓ Escrow funds released successfully:", result.txHash);
      }
    } catch (error) {
      console.error("Error releasing escrow funds:", error);
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
    }).catch((err) => console.error("Failed to record reputation event:", err));

    return res.json(updatedBooking);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error confirming booking:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to confirm booking",
      },
    });
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel booking with appropriate refund logic
 */
router.post("/:id/cancel", authenticate, async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(404).json({
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "Booking not found",
        },
      });
    }

    // Verify authorization - either customer or stylist can cancel
    if (!authorizeBookingAccess(userId, booking, "any")) {
      const error = createForbiddenError("cancel", "any");
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Check if user is customer or stylist
    const isCustomer = booking.customerId === userId;
    const isStylist = booking.stylistId === userId;

    // Backward compatibility check
    if (booking.customerId !== input.userId && booking.stylistId !== input.userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to cancel this booking",
        },
      });
    }

    // Check if cancellation is allowed
    if (!canCancelBooking(booking.status)) {
      return res.status(400).json({
        error: {
          code: "CANNOT_CANCEL",
          message: `Booking cannot be cancelled in ${booking.status} status`,
        },
      });
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
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: error.message,
        },
      });
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
        console.error("Customer wallet address not found:", booking.customerId);
        throw new Error("Customer wallet not configured");
      }

      // Only process refund if there's money to refund
      if (refundAmountCents > 0n) {
        const result = await refundFromEscrow({
          bookingId: id,
          recipientAddress: booking.customer.walletAddress as Address,
        });

        if (!result.success) {
          console.error("Failed to refund from escrow:", result.error);
          // Log the error but don't fail the cancellation
          // Support team can manually process refund if needed
        } else {
          console.log("✓ Refund processed successfully:", result.txHash);
        }
      } else {
        console.log("No refund amount - cancellation within no-refund window");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      // Continue - don't block cancellation on escrow failure
    }

    // F4.3: Send notifications to both parties about cancellation
    const cancelledByCustomer = booking.customerId === input.userId;

    // Notify the customer
    notifyBookingEvent(updatedBooking.customerId, NotificationType.BOOKING_CANCELLED, {
      bookingId: id,
      cancelledBy: cancelledByCustomer ? "you" : updatedBooking.stylist.displayName,
      reason: input.reason,
      refundAmount: refundAmountCents.toString(),
    }).catch((err) => console.error("Failed to send cancellation notification to customer:", err));

    // Notify the stylist
    notifyBookingEvent(updatedBooking.stylistId, NotificationType.BOOKING_CANCELLED, {
      bookingId: id,
      cancelledBy: cancelledByCustomer ? updatedBooking.customer.displayName : "you",
      reason: input.reason,
      customerName: updatedBooking.customer.displayName,
    }).catch((err) => console.error("Failed to send cancellation notification to stylist:", err));

    return res.json({
      booking: updatedBooking,
      refund: {
        amountCents: refundAmountCents.toString(),
        details: cancellationDetails,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors,
        },
      });
    }

    console.error("Error cancelling booking:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to cancel booking",
      },
    });
  }
});

export default router;
