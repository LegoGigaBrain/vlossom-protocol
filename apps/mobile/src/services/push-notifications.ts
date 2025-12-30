/**
 * Push Notifications Service (V7.3)
 *
 * Handles push notification registration, permissions, and
 * background/foreground notification handling using Expo Notifications.
 *
 * Features:
 * - Request notification permissions
 * - Register device token with API
 * - Handle foreground notifications
 * - Handle notification responses (taps)
 * - Deep link support via notification data
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { apiRequest, getAuthToken } from '../api/client';
import { getIsDemoMode } from '../stores/demo-mode';

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_DECLINED'
  | 'PAYMENT_CONFIRMED'
  | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER'
  | 'SESSION_PROGRESS'
  | 'MESSAGE_RECEIVED'
  | 'SPECIAL_EVENT_REQUEST_RECEIVED'
  | 'SPECIAL_EVENT_QUOTE_RECEIVED'
  | 'SPECIAL_EVENT_QUOTE_ACCEPTED'
  | 'SPECIAL_EVENT_CONFIRMED'
  | 'SPECIAL_EVENT_REMINDER'
  | 'SPECIAL_EVENT_CANCELLED';

export interface NotificationData {
  notificationType?: NotificationType;
  bookingId?: string;
  conversationId?: string;
  eventId?: string;
  deepLink?: string;
  [key: string]: unknown;
}

export interface PushRegistrationResult {
  success: boolean;
  tokenId?: string;
  isNew?: boolean;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

// Configure notification handling behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

// Track current push token for cleanup
let currentPushToken: string | null = null;

// ============================================================================
// Permission & Registration
// ============================================================================

/**
 * Request notification permissions
 * Returns true if permission granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Check if on physical device (push doesn't work on simulator)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already determined
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Verify permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }

    // Get project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('EAS project ID not found in app config');
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Register push token with the API
 */
export async function registerPushToken(): Promise<PushRegistrationResult> {
  // Skip in demo mode
  if (getIsDemoMode()) {
    console.log('Push token registration skipped in demo mode');
    return { success: true, isNew: false };
  }

  // Check if authenticated
  const authToken = await getAuthToken();
  if (!authToken) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get push token
  const pushToken = await getExpoPushToken();
  if (!pushToken) {
    return { success: false, error: 'Failed to get push token' };
  }

  // Store for later cleanup
  currentPushToken = pushToken;

  try {
    // Determine platform
    const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

    // Register with API
    const response = await apiRequest<{
      success: boolean;
      tokenId: string;
      isNew: boolean;
    }>('/api/v1/notifications/push-token', {
      method: 'POST',
      body: {
        token: pushToken,
        platform,
        deviceId: Constants.deviceId || undefined,
      },
    });

    console.log('Push token registered:', { isNew: response.isNew });
    return {
      success: true,
      tokenId: response.tokenId,
      isNew: response.isNew,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to register push token:', message);
    return { success: false, error: message };
  }
}

/**
 * Unregister push token from API (on logout)
 */
export async function unregisterPushToken(): Promise<boolean> {
  if (!currentPushToken) {
    return true;
  }

  // Skip in demo mode
  if (getIsDemoMode()) {
    currentPushToken = null;
    return true;
  }

  try {
    await apiRequest('/api/v1/notifications/push-token', {
      method: 'DELETE',
      body: { token: currentPushToken },
    });
    currentPushToken = null;
    return true;
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    return false;
  }
}

// ============================================================================
// Notification Handling
// ============================================================================

/**
 * Handle notification tap (when user taps on notification)
 * Navigates to appropriate screen based on notification type
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data as NotificationData;
  const type = data.notificationType;

  // Handle deep link if provided
  if (data.deepLink) {
    router.push(data.deepLink as never);
    return;
  }

  // Navigate based on notification type
  switch (type) {
    case 'BOOKING_CREATED':
    case 'BOOKING_APPROVED':
    case 'BOOKING_DECLINED':
    case 'PAYMENT_CONFIRMED':
    case 'SERVICE_STARTED':
    case 'SERVICE_COMPLETED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_REMINDER':
      if (data.bookingId) {
        router.push(`/bookings/${data.bookingId}` as never);
      } else {
        router.push('/(tabs)/bookings' as never);
      }
      break;

    case 'SESSION_PROGRESS':
      if (data.bookingId) {
        router.push(`/bookings/active/${data.bookingId}` as never);
      }
      break;

    case 'MESSAGE_RECEIVED':
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}` as never);
      } else {
        router.push('/messages' as never);
      }
      break;

    case 'SPECIAL_EVENT_REQUEST_RECEIVED':
    case 'SPECIAL_EVENT_QUOTE_RECEIVED':
    case 'SPECIAL_EVENT_QUOTE_ACCEPTED':
    case 'SPECIAL_EVENT_CONFIRMED':
    case 'SPECIAL_EVENT_REMINDER':
    case 'SPECIAL_EVENT_CANCELLED':
      if (data.eventId) {
        router.push(`/special-events/${data.eventId}` as never);
      } else {
        router.push('/special-events' as never);
      }
      break;

    default:
      // Default: go to notifications tab
      router.push('/(tabs)/notifications' as never);
  }
}

// ============================================================================
// Notification Listeners
// ============================================================================

type NotificationSubscription = Notifications.Subscription;

let foregroundSubscription: NotificationSubscription | null = null;
let responseSubscription: NotificationSubscription | null = null;

/**
 * Initialize notification listeners
 * Call this when app starts
 */
export function initializeNotificationListeners(): void {
  // Foreground notification received
  foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received in foreground:', notification);
      // You can handle foreground notifications here
      // e.g., show an in-app toast, update badge count, etc.
    }
  );

  // User tapped on notification
  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );
}

/**
 * Remove notification listeners
 * Call this when app is unmounting
 */
export function removeNotificationListeners(): void {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }
  if (responseSubscription) {
    responseSubscription.remove();
    responseSubscription = null;
  }
}

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Set app badge number
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// ============================================================================
// Android Channel Setup
// ============================================================================

/**
 * Set up Android notification channels
 * Call this on app start (Android only)
 */
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  // Default channel for general notifications
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#311E6B', // Brand purple
    sound: 'default',
  });

  // Booking updates channel
  await Notifications.setNotificationChannelAsync('bookings', {
    name: 'Booking Updates',
    description: 'Notifications about your bookings',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#311E6B',
    sound: 'default',
  });

  // Messages channel
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    description: 'Direct message notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100, 100, 100],
    lightColor: '#311E6B',
    sound: 'default',
  });

  // Session updates channel
  await Notifications.setNotificationChannelAsync('sessions', {
    name: 'Session Updates',
    description: 'Real-time session progress updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 100],
    lightColor: '#311E6B',
    sound: null, // Silent for progress updates
  });
}

// ============================================================================
// Full Initialization
// ============================================================================

/**
 * Full push notification initialization
 * Call this on app start after user is authenticated
 */
export async function initializePushNotifications(): Promise<PushRegistrationResult> {
  // Set up Android channels
  await setupAndroidChannels();

  // Initialize listeners
  initializeNotificationListeners();

  // Register token
  return registerPushToken();
}

/**
 * Clean up push notifications (on logout)
 */
export async function cleanupPushNotifications(): Promise<void> {
  removeNotificationListeners();
  await unregisterPushToken();
  await clearBadge();
}
