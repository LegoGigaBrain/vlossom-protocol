/**
 * Notification Types (F4.3)
 * Type definitions for the notification system
 *
 * Types use Prisma's enums for consistency.
 */

import type { $Enums } from "@prisma/client";

// Export Prisma notification enums as types
export type NotificationType = $Enums.NotificationType;
export type NotificationChannel = $Enums.NotificationChannel;
export type NotificationStatus = $Enums.NotificationStatus;

export interface NotificationMetadata {
  bookingId?: string;
  serviceType?: string;
  scheduledTime?: string;
  stylistName?: string;
  customerName?: string;
  amount?: number;
  refundAmount?: number;
  cancellationReason?: string;
  deepLink?: string;
  // V5.0 Phase 4: Real-time session tracking
  etaMinutes?: number;
  progressPercent?: number;
  // V6.7.0: Direct Messaging
  conversationId?: string;
  senderName?: string;
  messagePreview?: string;
  // V7.2: Special Events
  eventId?: string;
  eventTitle?: string;
  eventDate?: string;
  eventCategory?: string;
  quoteAmount?: number;
  quoteStylistName?: string;
  quoteValidUntil?: string;
  [key: string]: unknown;
}

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  metadata?: NotificationMetadata;
}

export interface NotificationResult {
  success: boolean;
  notificationIds: string[];
  errors?: { channel: NotificationChannel; error: string }[];
}

export interface EmailContent {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SMSContent {
  to: string;
  message: string;
}

export interface InAppContent {
  userId: string;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
}
