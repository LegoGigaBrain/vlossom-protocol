// @vlossom/scheduler - Background Job Scheduler Service
// Reference: docs/vlossom/18-stylist-schedule-simulation.md

import { PrismaClient, BookingStatus } from "@prisma/client";

/**
 * Vlossom Scheduler Service
 *
 * Handles background jobs for the Vlossom platform:
 * - Auto-confirm bookings after 24h timeout
 * - Booking reminder notifications
 * - Expired payment request cleanup
 * - Daily stats aggregation
 */

const prisma = new PrismaClient();

// Configuration
const AUTO_CONFIRM_TIMEOUT_HOURS = 24;
const REMINDER_HOURS_BEFORE = 24;
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const REPUTATION_RECALC_INTERVAL_MS = 6 * 60 * 60 * 1000; // Recalculate reputation every 6 hours

// Track last reputation recalculation
let lastReputationRecalc = 0;

/**
 * Auto-confirm bookings that have been in AWAITING_CUSTOMER_CONFIRMATION
 * for more than 24 hours without customer action.
 *
 * Business Rule: If customer doesn't confirm/dispute within 24h,
 * the booking is auto-confirmed and funds are released to stylist.
 */
async function processAutoConfirmJobs(): Promise<void> {
  const cutoffTime = new Date(Date.now() - AUTO_CONFIRM_TIMEOUT_HOURS * 60 * 60 * 1000);

  try {
    // Find all bookings awaiting confirmation that are past the cutoff
    const bookingsToAutoConfirm = await prisma.booking.findMany({
      where: {
        status: BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
        actualEndTime: {
          lte: cutoffTime,
        },
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    if (bookingsToAutoConfirm.length === 0) {
      return;
    }

    console.log(`[Scheduler] Found ${bookingsToAutoConfirm.length} bookings to auto-confirm`);

    for (const booking of bookingsToAutoConfirm) {
      try {
        // Update booking status to SETTLED
        await prisma.$transaction(async (tx) => {
          // Update booking status
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.SETTLED,
            },
          });

          // Create status history entry
          await tx.bookingStatusHistory.create({
            data: {
              bookingId: booking.id,
              fromStatus: BookingStatus.AWAITING_CUSTOMER_CONFIRMATION,
              toStatus: BookingStatus.SETTLED,
              changedBy: "SYSTEM",
              reason: "Auto-confirmed after 24h timeout",
            },
          });
        });

        console.log(`[Scheduler] Auto-confirmed booking ${booking.id}`);

        // Trigger escrow release via API call
        await triggerEscrowRelease(booking.id);

      } catch (error) {
        console.error(`[Scheduler] Failed to auto-confirm booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error processing auto-confirm jobs:", error);
  }
}

/**
 * Send reminder notifications for upcoming bookings
 */
async function processBookingReminders(): Promise<void> {
  const reminderTime = new Date(Date.now() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000);
  const now = new Date();

  try {
    // Find confirmed bookings starting in the next 24 hours
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        scheduledStartTime: {
          gte: now,
          lte: reminderTime,
        },
      },
      include: {
        customer: true,
        stylist: true,
      },
    });

    for (const booking of upcomingBookings) {
      // Check if reminder was already sent (via notification table)
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: booking.customerId,
          type: "BOOKING_REMINDER",
          metadata: {
            path: ["bookingId"],
            equals: booking.id,
          },
        },
      });

      if (!existingReminder) {
        // Create reminder notification
        await prisma.notification.create({
          data: {
            userId: booking.customerId,
            type: "BOOKING_REMINDER",
            channel: "IN_APP",
            title: "Upcoming Appointment",
            body: `Your appointment with ${booking.stylist.displayName} is tomorrow!`,
            metadata: {
              bookingId: booking.id,
              scheduledTime: booking.scheduledStartTime.toISOString(),
            },
          },
        });

        console.log(`[Scheduler] Sent reminder for booking ${booking.id}`);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error processing booking reminders:", error);
  }
}

/**
 * Clean up expired payment requests
 */
async function cleanupExpiredPaymentRequests(): Promise<void> {
  try {
    const result = await prisma.paymentRequest.updateMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    if (result.count > 0) {
      console.log(`[Scheduler] Expired ${result.count} payment requests`);
    }
  } catch (error) {
    console.error("[Scheduler] Error cleaning up payment requests:", error);
  }
}

/**
 * Trigger reputation recalculation via internal API call
 * Runs every 6 hours to ensure scores are up-to-date
 */
async function triggerReputationRecalculation(): Promise<void> {
  const now = Date.now();

  // Skip if we recalculated recently
  if (now - lastReputationRecalc < REPUTATION_RECALC_INTERVAL_MS) {
    return;
  }

  const apiUrl = process.env.API_URL || "http://localhost:3002";
  const internalSecret = process.env.INTERNAL_AUTH_SECRET;

  if (!internalSecret) {
    console.error("[Scheduler] INTERNAL_AUTH_SECRET not configured");
    return;
  }

  try {
    console.log("[Scheduler] Triggering reputation recalculation...");

    const response = await fetch(`${apiUrl}/api/internal/reputation/recalculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Auth": internalSecret,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Scheduler] Failed to recalculate reputation:", error);
    } else {
      const result = await response.json();
      console.log(`[Scheduler] Reputation recalculation complete: ${result.processed} processed, ${result.errors} errors`);
      lastReputationRecalc = now;
    }
  } catch (error) {
    console.error("[Scheduler] Error calling reputation recalculation API:", error);
  }
}

/**
 * Trigger escrow release via internal API call
 */
async function triggerEscrowRelease(bookingId: string): Promise<void> {
  const apiUrl = process.env.API_URL || "http://localhost:3002";
  const internalSecret = process.env.INTERNAL_AUTH_SECRET;

  if (!internalSecret) {
    console.error("[Scheduler] INTERNAL_AUTH_SECRET not configured");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/internal/bookings/${bookingId}/release-escrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Auth": internalSecret,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Scheduler] Failed to release escrow for ${bookingId}:`, error);
    } else {
      console.log(`[Scheduler] Escrow released for booking ${bookingId}`);
    }
  } catch (error) {
    console.error(`[Scheduler] Error calling escrow release API:`, error);
  }
}

/**
 * Main scheduler loop
 */
async function runScheduler(): Promise<void> {
  console.log("[Scheduler] Vlossom Scheduler starting...");
  console.log(`[Scheduler] Auto-confirm timeout: ${AUTO_CONFIRM_TIMEOUT_HOURS}h`);
  console.log(`[Scheduler] Check interval: ${CHECK_INTERVAL_MS / 1000}s`);

  // Run initial check
  await runAllJobs();

  // Set up periodic checks
  setInterval(async () => {
    await runAllJobs();
  }, CHECK_INTERVAL_MS);
}

/**
 * Run all scheduled jobs
 */
async function runAllJobs(): Promise<void> {
  try {
    await processAutoConfirmJobs();
    await processBookingReminders();
    await cleanupExpiredPaymentRequests();
    await triggerReputationRecalculation();
  } catch (error) {
    console.error("[Scheduler] Error running jobs:", error);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[Scheduler] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Scheduler] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start scheduler
runScheduler().catch(console.error);
