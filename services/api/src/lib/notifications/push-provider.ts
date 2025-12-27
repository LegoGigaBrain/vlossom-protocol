/**
 * Push Provider (V7.3)
 * Expo Push Notifications integration for mobile push notifications
 *
 * Uses Expo's push notification service which handles both FCM (Android)
 * and APNs (iOS) under the hood. No separate Firebase/APNs setup required.
 *
 * Reference: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import logger from "../logger";
import prisma from "../prisma";
import type { NotificationMetadata } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface PushContent {
  userId: string;
  title: string;
  body: string;
  data?: NotificationMetadata;
  sound?: "default" | null;
  badge?: number;
  categoryId?: string; // For actionable notifications
}

export interface ExpoPushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  categoryId?: string;
  priority?: "default" | "normal" | "high";
  ttl?: number; // Time to live in seconds
  channelId?: string; // Android notification channel
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string; // Receipt ID for tracking
  message?: string;
  details?: {
    error?: "DeviceNotRegistered" | "InvalidCredentials" | "MessageTooBig" | "MessageRateExceeded";
  };
}

export interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  tickets: ExpoPushTicket[];
  invalidTokens: string[]; // Tokens that should be deactivated
}

// ============================================================================
// Configuration
// ============================================================================

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

// Expo access token (optional but recommended for production)
const config = {
  accessToken: process.env.EXPO_ACCESS_TOKEN || "",
  enabled: true, // Push is always "enabled" - tokens determine if user receives pushes
};

// ============================================================================
// Push Sending
// ============================================================================

/**
 * Send push notification to a user
 * Fetches all active push tokens for the user and sends to each
 */
export async function sendPush(content: PushContent): Promise<PushResult> {
  // Get user's active push tokens
  const tokens = await prisma.pushToken.findMany({
    where: {
      userId: content.userId,
      isActive: true,
    },
    select: {
      id: true,
      token: true,
    },
  });

  if (tokens.length === 0) {
    logger.info("No push tokens for user", { userId: content.userId });
    return {
      successCount: 0,
      failureCount: 0,
      tickets: [],
      invalidTokens: [],
    };
  }

  // Build push messages for each token
  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title: content.title,
    body: content.body,
    data: content.data,
    sound: content.sound ?? "default",
    badge: content.badge,
    categoryId: content.categoryId,
    priority: "high",
    ttl: 86400, // 24 hours
    channelId: "default", // Android channel
  }));

  // Send in batches (Expo recommends max 100 per request)
  const results = await sendPushBatch(messages);

  // Process results and identify invalid tokens
  const invalidTokens: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach((ticket, index) => {
    if (ticket.status === "ok") {
      successCount++;
    } else {
      failureCount++;
      // Check for device not registered error
      if (ticket.details?.error === "DeviceNotRegistered") {
        invalidTokens.push(tokens[index].token);
      }
    }
  });

  // Deactivate invalid tokens
  if (invalidTokens.length > 0) {
    await deactivateTokens(invalidTokens);
  }

  // Update last used timestamp for successful sends
  if (successCount > 0) {
    const successfulTokens = tokens
      .filter((_, i) => results[i]?.status === "ok")
      .map((t) => t.token);

    await prisma.pushToken.updateMany({
      where: { token: { in: successfulTokens } },
      data: { lastUsedAt: new Date() },
    });
  }

  logger.info("Push notification sent", {
    userId: content.userId,
    tokenCount: tokens.length,
    successCount,
    failureCount,
    invalidTokenCount: invalidTokens.length,
  });

  return {
    successCount,
    failureCount,
    tickets: results,
    invalidTokens,
  };
}

/**
 * Send batch of push messages to Expo
 */
async function sendPushBatch(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add access token if available
  if (config.accessToken) {
    headers["Authorization"] = `Bearer ${config.accessToken}`;
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Expo Push API error", {
        status: response.status,
        error: errorText,
      });
      // Return error tickets for all messages
      return messages.map(() => ({
        status: "error" as const,
        message: `HTTP ${response.status}`,
      }));
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    logger.error("Failed to send push notifications", {
      error: error instanceof Error ? error.message : String(error),
      messageCount: messages.length,
    });
    // Return error tickets for all messages
    return messages.map(() => ({
      status: "error" as const,
      message: error instanceof Error ? error.message : String(error),
    }));
  }
}

/**
 * Get push receipts (for checking delivery status)
 * Call this with ticket IDs received from sendPush
 */
export async function getPushReceipts(
  ticketIds: string[]
): Promise<Record<string, ExpoPushReceipt>> {
  if (ticketIds.length === 0) return {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (config.accessToken) {
    headers["Authorization"] = `Bearer ${config.accessToken}`;
  }

  try {
    const response = await fetch(EXPO_RECEIPTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ ids: ticketIds }),
    });

    if (!response.ok) {
      logger.error("Failed to get push receipts", {
        status: response.status,
      });
      return {};
    }

    const data = await response.json();
    return data.data || {};
  } catch (error) {
    logger.error("Failed to get push receipts", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Deactivate invalid tokens
 */
async function deactivateTokens(tokens: string[]): Promise<void> {
  await prisma.pushToken.updateMany({
    where: { token: { in: tokens } },
    data: { isActive: false },
  });

  logger.info("Deactivated invalid push tokens", { count: tokens.length });
}

/**
 * Register or update a push token for a user
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: "IOS" | "ANDROID" | "WEB",
  deviceId?: string
): Promise<{ id: string; isNew: boolean }> {
  // Validate Expo push token format
  if (!isValidExpoPushToken(token)) {
    throw new Error("Invalid Expo push token format");
  }

  // Check if token already exists
  const existing = await prisma.pushToken.findUnique({
    where: { token },
  });

  if (existing) {
    // Update existing token (might be reassigning to new user after logout/login)
    if (existing.userId !== userId || !existing.isActive) {
      await prisma.pushToken.update({
        where: { token },
        data: {
          userId,
          isActive: true,
          platform,
          deviceId,
        },
      });
    }
    return { id: existing.id, isNew: false };
  }

  // Create new token
  const newToken = await prisma.pushToken.create({
    data: {
      userId,
      token,
      platform,
      deviceId,
      isActive: true,
    },
  });

  logger.info("Registered new push token", {
    userId,
    platform,
    hasDeviceId: !!deviceId,
  });

  return { id: newToken.id, isNew: true };
}

/**
 * Unregister a push token (on logout)
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    await prisma.pushToken.update({
      where: { token },
      data: { isActive: false },
    });
    return true;
  } catch {
    // Token doesn't exist or already inactive
    return false;
  }
}

/**
 * Get active token count for a user
 */
export async function getActiveTokenCount(userId: string): Promise<number> {
  return prisma.pushToken.count({
    where: { userId, isActive: true },
  });
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate Expo push token format
 * Expo tokens look like: ExponentPushToken[xxxxx] or ExpoPushToken[xxxxx]
 */
export function isValidExpoPushToken(token: string): boolean {
  return /^Expo(?:nent)?PushToken\[[^\]]+\]$/.test(token);
}

/**
 * Check if push sending is enabled
 * Always returns true - actual availability depends on user having registered tokens
 */
export function isPushEnabled(): boolean {
  return config.enabled;
}
