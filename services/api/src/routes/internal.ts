/**
 * Internal API routes for service-to-service communication
 * Used by scheduler, indexer, and other internal services
 */

import { Router, type Response } from "express";
import { internalAuth, type InternalRequest } from "../middleware/internal-auth";
import { prisma } from "../lib/prisma";
import { BookingStatus } from "@prisma/client";
import { releaseEscrow } from "../lib/escrow-client";
import { notifyBookingEvent, NotificationType } from "../lib/notifications";
import { recalculateAllScores } from "../lib/reputation";

const router = Router();

// All internal routes require internal authentication
router.use(internalAuth);

/**
 * POST /api/internal/bookings/:id/release-escrow
 * Called by scheduler service to release escrow for auto-confirmed bookings
 */
router.post("/bookings/:id/release-escrow", async (req: InternalRequest, res: Response) => {
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
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only release escrow for settled bookings
    if (booking.status !== BookingStatus.SETTLED) {
      return res.status(400).json({
        error: `Cannot release escrow for booking in status: ${booking.status}`,
      });
    }

    // Skip if no escrow ID
    if (!booking.escrowId) {
      return res.json({ success: true, message: "No escrow to release" });
    }

    // Release escrow funds
    const result = await releaseEscrow(booking.escrowId, booking.stylistId);

    if (!result.success) {
      console.error(`[Internal] Failed to release escrow for booking ${id}:`, result.error);
      return res.status(500).json({ error: result.error });
    }

    console.log(`[Internal] Escrow released for booking ${id}, txHash: ${result.txHash}`);

    // Notify stylist that funds have been released
    notifyBookingEvent(booking.stylistId, NotificationType.BOOKING_COMPLETED, {
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
    return res.status(500).json({ error: "Failed to release escrow" });
  }
});

/**
 * POST /api/internal/bookings/:id/auto-confirm
 * Called by scheduler service to auto-confirm a booking after 24h timeout
 */
router.post("/bookings/:id/auto-confirm", async (req: InternalRequest, res: Response) => {
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
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only auto-confirm bookings awaiting customer confirmation
    if (booking.status !== BookingStatus.AWAITING_CUSTOMER_CONFIRMATION) {
      return res.status(400).json({
        error: `Cannot auto-confirm booking in status: ${booking.status}`,
      });
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
    notifyBookingEvent(booking.customerId, NotificationType.BOOKING_COMPLETED, {
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
    return res.status(500).json({ error: "Failed to auto-confirm booking" });
  }
});

/**
 * POST /api/internal/reputation/recalculate
 * Recalculate all reputation scores (maintenance job)
 */
router.post("/reputation/recalculate", async (_req: InternalRequest, res: Response) => {
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
    return res.status(500).json({ error: "Failed to recalculate reputation scores" });
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
