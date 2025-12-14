/**
 * Notifications Module Index
 * Exports all notification-related services
 */

export {
  sendNotification,
  notifyBookingEvent,
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "./notification-service";

export {
  sendEmail,
  isEmailEnabled,
} from "./email-provider";

export {
  sendSMS,
  isSMSEnabled,
  estimateSMSCost,
} from "./sms-provider";

export {
  getInAppContent,
  getEmailContent,
  getSMSContent,
} from "./templates";

export type {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationMetadata,
  SendNotificationInput,
  NotificationResult,
  EmailContent,
  SMSContent,
  InAppContent,
} from "./types";
