/**
 * Notifications API Routes (F4.3)
 * Endpoints for managing user notifications
 *
 * V7.3: Added push token registration endpoints
 */

import { Router, Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  registerPushToken,
  unregisterPushToken,
  getActiveTokenCount,
  isValidExpoPushToken,
} from "../lib/notifications";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
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
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error fetching notifications", { error });
    return next(createError("INTERNAL_ERROR"));
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

// ============================================================================
// Push Token Management (V7.3)
// ============================================================================

// Validation schema for push token registration
const registerPushTokenSchema = z.object({
  token: z.string().min(1, "Push token is required"),
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
  deviceId: z.string().optional(),
});

/**
 * POST /api/notifications/push-token
 * Register or update a push token for the authenticated user
 */
router.post("/push-token", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const input = registerPushTokenSchema.parse(req.body);

    // Validate Expo push token format
    if (!isValidExpoPushToken(input.token)) {
      return next(createError("VALIDATION_ERROR", {
        message: "Invalid Expo push token format. Expected: ExponentPushToken[...] or ExpoPushToken[...]",
      }));
    }

    const result = await registerPushToken(
      userId,
      input.token,
      input.platform,
      input.deviceId
    );

    logger.info("Push token registered", {
      userId,
      platform: input.platform,
      isNew: result.isNew,
    });

    return res.json({
      success: true,
      tokenId: result.id,
      isNew: result.isNew,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    logger.error("Error registering push token", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/notifications/push-token
 * Unregister a push token (e.g., on logout)
 */
router.delete("/push-token", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return next(createError("VALIDATION_ERROR", {
        message: "Push token is required",
      }));
    }

    const success = await unregisterPushToken(token);

    logger.info("Push token unregistered", {
      userId: req.userId,
      success,
    });

    return res.json({ success });
  } catch (error) {
    logger.error("Error unregistering push token", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/notifications/push-token/count
 * Get the number of active push tokens for the authenticated user
 */
router.get("/push-token/count", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const count = await getActiveTokenCount(userId);

    return res.json({ count });
  } catch (error) {
    logger.error("Error fetching push token count", { error });
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch push token count",
      },
    });
  }
});

export default router;
