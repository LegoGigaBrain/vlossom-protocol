/**
 * Notification Service (F4.3)
 * Core orchestration for multi-channel notifications
 */

import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import logger from "../logger";
import { sendEmail } from "./email-provider";
import { sendSMS } from "./sms-provider";
import { getInAppContent, getEmailContent, getSMSContent } from "./templates";
import type {
  NotificationType,
  NotificationChannel,
  NotificationMetadata,
  SendNotificationInput,
  NotificationResult,
} from "./types";

/** Notification response item for API responses */
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Prisma.JsonValue;
  read: boolean;
  createdAt: string;
}

/**
 * Send notifications to a user via multiple channels
 * Creates in-app notification record and sends via email/SMS if enabled
 */
export async function sendNotification(
  input: SendNotificationInput
): Promise<NotificationResult> {
  const { userId, type, channels, metadata = {} } = input;
  const notificationIds: string[] = [];
  const errors: { channel: NotificationChannel; error: string }[] = [];

  // Get user for email/phone
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      phone: true,
      displayName: true,
    },
  });

  if (!user) {
    logger.warn("User not found for notification", { userId, type });
    return {
      success: false,
      notificationIds: [],
      errors: [{ channel: "IN_APP", error: "User not found" }],
    };
  }

  // Get content from templates
  const { title, body } = getInAppContent(type, metadata);

  // Process each channel
  for (const channel of channels) {
    try {
      let externalId: string | null = null;
      let sendError: string | null = null;

      if (channel === "EMAIL" && user.email) {
        const emailContent = getEmailContent(type, metadata, user.email);
        externalId = await sendEmail(emailContent);
        if (!externalId) {
          sendError = "Failed to send email";
        }
      } else if (channel === "SMS" && user.phone) {
        const smsContent = getSMSContent(type, metadata, user.phone);
        externalId = await sendSMS(smsContent);
        if (!externalId) {
          sendError = "Failed to send SMS";
        }
      } else if (channel === "IN_APP") {
        // In-app notifications are always created
        externalId = null;
      } else if (channel === "EMAIL" && !user.email) {
        sendError = "User has no email address";
      } else if (channel === "SMS" && !user.phone) {
        sendError = "User has no phone number";
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          channel,
          status: sendError ? "FAILED" : channel === "IN_APP" ? "SENT" : "SENT",
          title,
          body,
          metadata: metadata as Prisma.InputJsonValue,
          sentAt: sendError ? null : new Date(),
          externalId,
          error: sendError,
        },
      });

      notificationIds.push(notification.id);

      if (sendError) {
        errors.push({ channel, error: sendError });
      }

      logger.info("Notification processed", {
        notificationId: notification.id,
        userId,
        type,
        channel,
        status: sendError ? "FAILED" : "SENT",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to process notification", {
        userId,
        type,
        channel,
        error: errorMessage,
      });
      errors.push({ channel, error: errorMessage });
    }
  }

  return {
    success: errors.length === 0,
    notificationIds,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Send notification for booking events
 * Determines appropriate channels based on event type
 */
export async function notifyBookingEvent(
  userId: string,
  type: NotificationType,
  metadata: NotificationMetadata
): Promise<NotificationResult> {
  // Determine channels based on notification type
  const channels: NotificationChannel[] = ["IN_APP"];

  // Add email for all booking events
  channels.push("EMAIL");

  // Add SMS for critical events
  const criticalEvents: NotificationType[] = [
    "BOOKING_APPROVED",
    "SERVICE_STARTED",
    "BOOKING_CANCELLED",
    "BOOKING_REMINDER",
  ];

  if (criticalEvents.includes(type)) {
    channels.push("SMS");
  }

  return sendNotification({
    userId,
    type,
    channels,
    metadata,
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      channel: "IN_APP",
      readAt: null,
    },
  });
}

/**
 * Get notifications for a user (paginated)
 */
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<{
  notifications: NotificationItem[];
  total: number;
  hasMore: boolean;
}> {
  const { page = 1, limit = 20, unreadOnly = false } = options;

  const where: Prisma.NotificationWhereInput = {
    userId,
    channel: "IN_APP", // Only return in-app notifications to user
    ...(unreadOnly && { readAt: null }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      metadata: n.metadata,
      read: !!n.readAt,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    hasMore: page * limit < total,
  };
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: "READ",
      },
    });
    return true;
  } catch (error) {
    logger.error("Failed to mark notification as read", {
      notificationId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      channel: "IN_APP",
      readAt: null,
    },
    data: {
      readAt: new Date(),
      status: "READ",
    },
  });
  return result.count;
}
