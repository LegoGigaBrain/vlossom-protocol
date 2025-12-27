/**
 * Services Index (V7.3)
 *
 * Exports all mobile services
 */

export {
  // Permission & Registration
  requestNotificationPermissions,
  getExpoPushToken,
  registerPushToken,
  unregisterPushToken,

  // Notification Handling
  handleNotificationResponse,
  initializeNotificationListeners,
  removeNotificationListeners,

  // Badge Management
  setBadgeCount,
  clearBadge,
  getBadgeCount,

  // Android Channels
  setupAndroidChannels,

  // Full Initialization
  initializePushNotifications,
  cleanupPushNotifications,

  // Types
  type NotificationType,
  type NotificationData,
  type PushRegistrationResult,
} from './push-notifications';
