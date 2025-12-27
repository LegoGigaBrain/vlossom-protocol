/**
 * Notifications Module Index
 * Exports all notification-related services
 *
 * V7.3: Added push notification exports
 */

export {
  sendNotification,
  notifyBookingEvent,
  notifySpecialEventEvent,
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
  sendPush,
  registerPushToken,
  unregisterPushToken,
  getActiveTokenCount,
  isPushEnabled,
  isValidExpoPushToken,
  getPushReceipts,
} from "./push-provider";

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

export type {
  PushContent,
  PushResult,
  ExpoPushTicket,
  ExpoPushReceipt,
} from "./push-provider";
