/**
 * Admin Bookings API Routes
 * Provides booking management for admin dashboard
 */

import { Router, type Response, type NextFunction } from "express";
import { authenticate, type AuthenticatedRequest, requireRole } from "../../middleware/auth";
import prisma from "../../lib/prisma";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { createError } from "../../middleware/error-handler";

const router: ReturnType<typeof Router> = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole("ADMIN"));

// Query params validation
const listBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  stylistId: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "scheduledStartTime", "quoteAmountCents"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/admin/bookings
 * List all bookings with pagination and filtering
 */
router.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = listBookingsSchema.parse(req.query);
    const { page, pageSize, status, customerId, stylistId, fromDate, toDate, sortBy, sortOrder } = params;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      // Support comma-separated statuses
      const statuses = status.split(",");
      where.status = { in: statuses };
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (stylistId) {
      where.stylistId = stylistId;
    }

    if (fromDate || toDate) {
      where.scheduledStartTime = {};
      if (fromDate) {
        (where.scheduledStartTime as Record<string, Date>).gte = new Date(fromDate);
      }
      if (toDate) {
        (where.scheduledStartTime as Record<string, Date>).lte = new Date(toDate);
      }
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get paginated bookings
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        stylist: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            priceAmountCents: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Convert BigInt to Number for JSON serialization
    const serialized = bookings.map((b) => ({
      ...b,
      quoteAmountCents: Number(b.quoteAmountCents),
      platformFeeCents: Number(b.platformFeeCents),
      stylistPayoutCents: Number(b.stylistPayoutCents),
      service: b.service ? {
        ...b.service,
        priceAmountCents: Number(b.service.priceAmountCents),
      } : null,
    }));

    res.json({
      bookings: serialized,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to fetch bookings:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/bookings/:id
 * Get detailed booking information
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        stylist: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        service: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Serialize BigInt
    const serialized = {
      ...booking,
      quoteAmountCents: Number(booking.quoteAmountCents),
      platformFeeCents: Number(booking.platformFeeCents),
      stylistPayoutCents: Number(booking.stylistPayoutCents),
      service: booking.service ? {
        ...booking.service,
        priceAmountCents: Number(booking.service.priceAmountCents),
      } : null,
    };

    res.json({ booking: serialized });
  } catch (error) {
    console.error("Failed to fetch booking:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/bookings/stats/overview
 * Get booking statistics
 */
router.get("/stats/overview", async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalBookings,
      bookingsToday,
      bookingsThisMonth,
      bookingsLastMonth,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      revenueThisMonth,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: lastMonth, lt: thisMonth },
        },
      }),
      prisma.booking.count({
        where: { status: { in: [BookingStatus.PENDING_STYLIST_APPROVAL, BookingStatus.PENDING_CUSTOMER_PAYMENT] } },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.CONFIRMED },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.SETTLED },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      prisma.booking.aggregate({
        _sum: { platformFeeCents: true },
        where: {
          status: BookingStatus.SETTLED,
          createdAt: { gte: thisMonth },
        },
      }),
    ]);

    res.json({
      stats: {
        totalBookings,
        bookingsToday,
        bookingsThisMonth,
        bookingsLastMonth,
        monthlyGrowth:
          bookingsLastMonth > 0
            ? (((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100).toFixed(1)
            : 0,
        byStatus: {
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
        },
        revenueThisMonth: Number(revenueThisMonth._sum.platformFeeCents || 0) / 100,
      },
    });
  } catch (error) {
    console.error("Failed to fetch booking stats:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * PATCH /api/v1/admin/bookings/:id/status
 * Admin override for booking status (use with caution)
 */
router.patch("/:id/status", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.userId!;

    // Validate status
    const validStatuses = Object.values(BookingStatus);
    if (!validStatuses.includes(status)) {
      return next(createError("INVALID_STATUS", { providedStatus: status }));
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!booking) {
      return next(createError("BOOKING_NOT_FOUND"));
    }

    // Update booking status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
      });

      // Record status change
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: status,
          changedBy: adminId,
          reason: reason || "Admin override",
        },
      });

      return updatedBooking;
    });

    res.json({
      booking: {
        ...updated,
        quoteAmountCents: Number(updated.quoteAmountCents),
        platformFeeCents: Number(updated.platformFeeCents),
        stylistPayoutCents: Number(updated.stylistPayoutCents),
      },
    });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
