/**
 * Real-Time Booking Updates API
 * V5.0: Phase 4 - Session tracking and live updates via SSE
 *
 * Features:
 * - Session progress tracking (stylist location, ETA)
 * - Live status updates via Server-Sent Events (SSE)
 * - Session start/progress/complete notifications
 */

import { Router, Response, NextFunction } from "express";
import { BookingStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { authorizeBookingAccess } from "../middleware/authorize";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { notifyBookingEvent } from "../lib/notifications";
import { z } from "zod";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// SESSION PROGRESS TRACKING
// ============================================================================

// Validation schemas
const updateSessionProgressSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  etaMinutes: z.number().int().min(0).max(180).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  currentStep: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

// In-memory store for active session progress
// In production, use Redis for distributed state
const activeSessionProgress = new Map<
  string,
  {
    bookingId: string;
    stylistId: string;
    lat?: number;
    lng?: number;
    etaMinutes?: number;
    progressPercent: number;
    currentStep?: string;
    lastUpdate: Date;
  }
>();

// SSE clients for live updates
const sseClients = new Map<string, Response[]>();

/**
 * Send SSE event to all connected clients for a booking
 */
function broadcastToBookingClients(
  bookingId: string,
  event: string,
  data: Record<string, unknown>
) {
  const clients = sseClients.get(bookingId) || [];
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      logger.error("Error sending SSE to client", { error, bookingId });
    }
  });
}

/**
 * GET /api/bookings/:id/live
 * SSE endpoint for real-time booking updates
 */
router.get(
  "/:id/live",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Verify booking exists and user has access
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

      if (!authorizeBookingAccess(userId, booking, "any")) {
        return next(createError("FORBIDDEN"));
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

      // Send initial connection event
      res.write(`event: connected\ndata: ${JSON.stringify({
        bookingId: id,
        status: booking.status,
        timestamp: new Date().toISOString(),
      })}\n\n`);

      // Add client to SSE list
      const clients = sseClients.get(id) || [];
      clients.push(res);
      sseClients.set(id, clients);

      // Send current session progress if available
      const progress = activeSessionProgress.get(id);
      if (progress) {
        res.write(`event: progress\ndata: ${JSON.stringify(progress)}\n\n`);
      }

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          res.write(`: heartbeat\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on disconnect
      req.on("close", () => {
        clearInterval(heartbeat);
        const updatedClients = (sseClients.get(id) || []).filter(
          (c) => c !== res
        );
        if (updatedClients.length === 0) {
          sseClients.delete(id);
        } else {
          sseClients.set(id, updatedClients);
        }
        logger.debug("SSE client disconnected", { bookingId: id, userId });
      });

      logger.debug("SSE client connected", { bookingId: id, userId });
    } catch (error) {
      logger.error("Error setting up SSE connection", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * POST /api/bookings/:id/session/progress
 * Update session progress (location, ETA, completion percentage)
 * Stylist-only endpoint
 */
router.post(
  "/:id/session/progress",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const input = updateSessionProgressSchema.parse(req.body);
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

      // Only stylist can update session progress
      if (!authorizeBookingAccess(userId, booking, "stylist")) {
        return next(createError("FORBIDDEN"));
      }

      // Verify booking is in a valid state for progress updates
      const validStatuses: BookingStatus[] = [
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
      ];
      if (!validStatuses.includes(booking.status)) {
        return next(
          createError("INVALID_STATUS", {
            message: `Cannot update progress for booking in ${booking.status} status`,
          })
        );
      }

      // Update session progress
      const progressData = {
        bookingId: id,
        stylistId: userId,
        lat: input.lat,
        lng: input.lng,
        etaMinutes: input.etaMinutes,
        progressPercent: input.progressPercent ?? 0,
        currentStep: input.currentStep,
        lastUpdate: new Date(),
      };

      activeSessionProgress.set(id, progressData);

      // Broadcast to connected clients
      broadcastToBookingClients(id, "progress", {
        ...progressData,
        timestamp: progressData.lastUpdate.toISOString(),
      });

      // Send push notification to customer if ETA or location changed significantly
      if (input.etaMinutes !== undefined || input.lat !== undefined) {
        notifyBookingEvent(booking.customerId, "SESSION_PROGRESS", {
          bookingId: id,
          stylistName: booking.stylist.displayName,
          etaMinutes: input.etaMinutes,
          progressPercent: input.progressPercent,
        }).catch((err) =>
          logger.error("Failed to send progress notification", { error: err })
        );
      }

      return res.json({
        success: true,
        progress: progressData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error updating session progress", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * GET /api/bookings/:id/session/progress
 * Get current session progress
 */
router.get(
  "/:id/session/progress",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

      // Verify access
      if (!authorizeBookingAccess(userId, booking, "any")) {
        return next(createError("FORBIDDEN"));
      }

      // Get progress
      const progress = activeSessionProgress.get(id);

      if (!progress) {
        return res.json({
          bookingId: id,
          status: booking.status,
          hasActiveSession: false,
          progress: null,
        });
      }

      // For customer, don't expose exact location - just ETA and progress
      const isCustomer = booking.customerId === userId;
      const safeProgress = isCustomer
        ? {
            bookingId: progress.bookingId,
            etaMinutes: progress.etaMinutes,
            progressPercent: progress.progressPercent,
            currentStep: progress.currentStep,
            lastUpdate: progress.lastUpdate.toISOString(),
          }
        : {
            ...progress,
            lastUpdate: progress.lastUpdate.toISOString(),
          };

      return res.json({
        bookingId: id,
        status: booking.status,
        hasActiveSession: true,
        progress: safeProgress,
      });
    } catch (error) {
      logger.error("Error fetching session progress", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * POST /api/bookings/:id/session/arrived
 * Mark stylist as arrived at location
 */
router.post(
  "/:id/session/arrived",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
        return next(createError("BOOKING_NOT_FOUND"));
      }

      // Only stylist can mark as arrived
      if (!authorizeBookingAccess(userId, booking, "stylist")) {
        return next(createError("FORBIDDEN"));
      }

      // Verify booking is confirmed
      if (booking.status !== BookingStatus.CONFIRMED) {
        return next(
          createError("INVALID_STATUS", {
            message: `Cannot mark as arrived for booking in ${booking.status} status`,
          })
        );
      }

      // Update progress to show arrived
      const progressData = {
        bookingId: id,
        stylistId: userId,
        etaMinutes: 0,
        progressPercent: 0,
        currentStep: "Arrived",
        lastUpdate: new Date(),
      };

      activeSessionProgress.set(id, progressData);

      // Broadcast arrival event
      broadcastToBookingClients(id, "arrived", {
        bookingId: id,
        stylistName: booking.stylist.displayName,
        timestamp: new Date().toISOString(),
      });

      // Notify customer
      notifyBookingEvent(booking.customerId, "STYLIST_ARRIVED", {
        bookingId: id,
        stylistName: booking.stylist.displayName,
      }).catch((err) =>
        logger.error("Failed to send arrival notification", { error: err })
      );

      return res.json({
        success: true,
        message: "Marked as arrived",
        progress: progressData,
      });
    } catch (error) {
      logger.error("Error marking as arrived", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * POST /api/bookings/:id/session/customer-arrived
 * Mark customer as arrived at location (for mobile service bookings)
 */
router.post(
  "/:id/session/customer-arrived",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
        return next(createError("BOOKING_NOT_FOUND"));
      }

      // Only customer can mark themselves as arrived
      if (!authorizeBookingAccess(userId, booking, "customer")) {
        return next(createError("FORBIDDEN"));
      }

      // Verify booking is confirmed or in progress
      const validStatuses: BookingStatus[] = [
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
      ];
      if (!validStatuses.includes(booking.status)) {
        return next(
          createError("INVALID_STATUS", {
            message: `Cannot mark as arrived for booking in ${booking.status} status`,
          })
        );
      }

      // Broadcast customer arrival event
      broadcastToBookingClients(id, "customer_arrived", {
        bookingId: id,
        customerName: booking.customer.displayName,
        timestamp: new Date().toISOString(),
      });

      // Notify stylist
      notifyBookingEvent(booking.stylistId, "CUSTOMER_ARRIVED", {
        bookingId: id,
        customerName: booking.customer.displayName,
      }).catch((err) =>
        logger.error("Failed to send customer arrival notification", { error: err })
      );

      return res.json({
        success: true,
        message: "Customer arrival notified",
      });
    } catch (error) {
      logger.error("Error marking customer as arrived", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * POST /api/bookings/:id/session/end
 * End the active session (clears progress tracking)
 */
router.post(
  "/:id/session/end",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

      // Only stylist can end session
      if (!authorizeBookingAccess(userId, booking, "stylist")) {
        return next(createError("FORBIDDEN"));
      }

      // Clear session progress
      activeSessionProgress.delete(id);

      // Broadcast session end event
      broadcastToBookingClients(id, "session_ended", {
        bookingId: id,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: "Session ended",
      });
    } catch (error) {
      logger.error("Error ending session", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * GET /api/bookings/active-sessions
 * Get all active sessions for the authenticated user
 * Returns sessions where user is either customer or stylist
 */
router.get(
  "/active-sessions",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // Get all bookings in active states for this user
      const activeStatuses: BookingStatus[] = [
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
      ];

      const bookings = await prisma.booking.findMany({
        where: {
          OR: [{ customerId: userId }, { stylistId: userId }],
          status: { in: activeStatuses },
        },
        include: {
          customer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          stylist: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          service: true,
        },
        orderBy: { scheduledStartTime: "asc" },
      });

      // Enrich with session progress
      const sessionsWithProgress = bookings.map((booking) => {
        const progress = activeSessionProgress.get(booking.id);
        const isCustomer = booking.customerId === userId;

        return {
          booking: {
            id: booking.id,
            status: booking.status,
            serviceType: booking.serviceType,
            scheduledStartTime: booking.scheduledStartTime.toISOString(),
            scheduledEndTime: booking.scheduledEndTime.toISOString(),
            locationType: booking.locationType,
            locationAddress: booking.locationAddress,
          },
          role: isCustomer ? "customer" : "stylist",
          otherParty: isCustomer
            ? {
                id: booking.stylist.id,
                displayName: booking.stylist.displayName,
                avatarUrl: booking.stylist.avatarUrl,
              }
            : {
                id: booking.customer.id,
                displayName: booking.customer.displayName,
                avatarUrl: booking.customer.avatarUrl,
              },
          hasActiveProgress: !!progress,
          progress: progress
            ? isCustomer
              ? {
                  etaMinutes: progress.etaMinutes,
                  progressPercent: progress.progressPercent,
                  currentStep: progress.currentStep,
                  lastUpdate: progress.lastUpdate.toISOString(),
                }
              : {
                  lat: progress.lat,
                  lng: progress.lng,
                  etaMinutes: progress.etaMinutes,
                  progressPercent: progress.progressPercent,
                  currentStep: progress.currentStep,
                  lastUpdate: progress.lastUpdate.toISOString(),
                }
            : null,
        };
      });

      return res.json({
        sessions: sessionsWithProgress,
        count: sessionsWithProgress.length,
      });
    } catch (error) {
      logger.error("Error fetching active sessions", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

export default router;
