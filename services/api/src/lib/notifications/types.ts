/**
 * Notification Types (F4.3)
 * Type definitions for the notification system
 */

export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_APPROVED"
  | "BOOKING_DECLINED"
  | "PAYMENT_CONFIRMED"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REMINDER";

export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP";

export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

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
