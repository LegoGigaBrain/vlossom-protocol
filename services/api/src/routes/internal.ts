/**
 * Internal API routes for service-to-service communication
 * Used by scheduler, indexer, and other internal services
 */

import { Router, type Response, type NextFunction } from "express";
import { internalAuth, type InternalRequest } from "../middleware/internal-auth";
import { prisma } from "../lib/prisma";
import { BookingStatus } from "@prisma/client";
import { releaseFundsFromEscrow, PLATFORM_TREASURY_ADDRESS, PLATFORM_FEE_PERCENTAGE } from "../lib/escrow-client";
import { notifyBookingEvent } from "../lib/notifications";
import { recalculateAllScores } from "../lib/reputation";
import { createError } from "../middleware/error-handler";

const router: ReturnType<typeof Router> = Router();

// All internal routes require internal authentication
router.use(internalAuth);

/**
 * POST /api/internal/bookings/:id/release-escrow
 * Called by scheduler service to release escrow for auto-confirmed bookings
 */
router.post("/bookings/:id/release-escrow", async (req: InternalRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

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

    // Only release escrow for settled bookings
    if (booking.status !== BookingStatus.SETTLED) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: `Cannot release escrow for booking in status: ${booking.status}`,
        currentStatus: booking.status,
      }));
    }

    // Skip if no escrow ID
    if (!booking.escrowId) {
      return res.json({ success: true, message: "No escrow to release" });
    }

    // Release escrow funds
    if (!booking.stylist.walletAddress) {
      return next(createError("ESCROW_RELEASE_FAILED", { details: "Stylist wallet not configured" }));
    }

    const result = await releaseFundsFromEscrow({
      bookingId: id,
      stylistAddress: booking.stylist.walletAddress as `0x${string}`,
      totalAmount: BigInt(booking.quoteAmountCents),
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
      treasuryAddress: PLATFORM_TREASURY_ADDRESS,
    });

    if (!result.success) {
      console.error(`[Internal] Failed to release escrow for booking ${id}:`, result.error);
      return next(createError("ESCROW_RELEASE_FAILED", { details: result.error }));
    }

    console.log(`[Internal] Escrow released for booking ${id}, txHash: ${result.txHash}`);

    // Notify stylist that funds have been released
    notifyBookingEvent(booking.stylistId, "SERVICE_COMPLETED", {
      bookingId: id,
      customerName: booking.customer.displayName,
      serviceName: booking.serviceType,
      amount: Number(booking.stylistPayoutCents) / 100,
    }).catch((err) => console.error("Failed to send escrow release notification:", err));

    return res.json({
      success: true,
      txHash: result.txHash,
    });
  } catch (error) {
    console.error("[Internal] Error releasing escrow:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/internal/bookings/:id/auto-confirm
 * Called by scheduler service to auto-confirm a booking after 24h timeout
 */
router.post("/bookings/:id/auto-confirm", async (req: InternalRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

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

    // Only auto-confirm bookings awaiting customer confirmation
    if (booking.status !== BookingStatus.AWAITING_CUSTOMER_CONFIRMATION) {
      return next(createError("INVALID_STATUS_TRANSITION", {
        message: `Cannot auto-confirm booking in status: ${booking.status}`,
        currentStatus: booking.status,
      }));
    }

    // Update booking status in a transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.SETTLED,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
          toStatus: BookingStatus.SETTLED,
          changedBy: "SYSTEM",
          reason: "Auto-confirmed after 24h customer inaction",
        },
      });

      return updated;
    });

    console.log(`[Internal] Auto-confirmed booking ${id}`);

    // Notify customer about auto-confirmation
    notifyBookingEvent(booking.customerId, "SERVICE_COMPLETED", {
      bookingId: id,
      stylistName: booking.stylist.displayName,
      serviceName: booking.serviceType,
      autoConfirmed: true,
    }).catch((err) => console.error("Failed to send auto-confirm notification:", err));

    return res.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("[Internal] Error auto-confirming booking:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/internal/reputation/recalculate
 * Recalculate all reputation scores (maintenance job)
 */
router.post("/reputation/recalculate", async (_req: InternalRequest, res: Response, next: NextFunction) => {
  try {
    console.log("[Internal] Starting batch reputation recalculation");

    const result = await recalculateAllScores();

    console.log(`[Internal] Reputation recalculation complete: ${result.processed} processed, ${result.errors} errors`);

    return res.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error) {
    console.error("[Internal] Error recalculating reputation scores:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/internal/health
 * Health check for internal services
 */
router.get("/health", (_req: InternalRequest, res: Response) => {
  res.json({ status: "ok", service: "@vlossom/api-internal" });
});

export default router;
