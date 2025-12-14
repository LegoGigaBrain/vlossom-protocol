/**
 * Notifications API Routes (F4.3)
 * Endpoints for managing user notifications
 */

import { Router, Response } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../lib/notifications";
import { z } from "zod";

const router: ReturnType<typeof Router> = Router();

// Validation schemas
const getNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
});

/**
 * GET /api/notifications
 * Get notifications for authenticated user (paginated)
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const input = getNotificationsSchema.parse(req.query);

    const result = await getUserNotifications(userId, {
      page: input.page,
      limit: input.limit,
      unreadOnly: input.unreadOnly,
    });

    return res.json({
      notifications: result.notifications,
      pagination: {
        page: input.page,
        limit: input.limit,
        total: result.total,
        hasMore: result.hasMore,
      },
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

    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch notifications",
      },
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get("/unread-count", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const count = await getUnreadCount(userId);

    return res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch unread count",
      },
    });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
router.post("/:id/read", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const success = await markAsRead(id, userId);

    if (!success) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Notification not found or already read",
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to mark notification as read",
      },
    });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post("/read-all", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const count = await markAllAsRead(userId);

    return res.json({
      success: true,
      markedRead: count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to mark notifications as read",
      },
    });
  }
});

export default router;
