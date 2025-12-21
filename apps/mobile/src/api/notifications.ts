/**
 * Notifications API Client (V6.8.0)
 *
 * Handles all notification-related API calls:
 * - Fetch notifications (paginated)
 * - Unread count
 * - Mark as read
 */

import { apiRequest } from './client';

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
  | 'STYLIST_ARRIVED'
  | 'CUSTOMER_ARRIVED'
  | 'MESSAGE_RECEIVED';

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
  etaMinutes?: number;
  progressPercent?: number;
  conversationId?: string;
  senderName?: string;
  messagePreview?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: NotificationMetadata;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkReadResponse {
  success: boolean;
}

export interface MarkAllReadResponse {
  success: boolean;
  markedRead: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get notifications for authenticated user (paginated)
 */
export async function getNotifications(
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<NotificationsResponse> {
  const { page = 1, limit = 20, unreadOnly = false } = options;

  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', limit.toString());
  if (unreadOnly) {
    queryParams.set('unreadOnly', 'true');
  }

  return apiRequest<NotificationsResponse>(`/notifications?${queryParams.toString()}`);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>('/notifications/unread-count');
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<MarkReadResponse> {
  return apiRequest<MarkReadResponse>(`/notifications/${notificationId}/read`, {
    method: 'POST',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<MarkAllReadResponse> {
  return apiRequest<MarkAllReadResponse>('/notifications/read-all', {
    method: 'POST',
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get icon name for notification type
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'BOOKING_CREATED':
    case 'BOOKING_APPROVED':
    case 'BOOKING_REMINDER':
      return 'calendar';
    case 'BOOKING_DECLINED':
    case 'BOOKING_CANCELLED':
      return 'close';
    case 'PAYMENT_CONFIRMED':
      return 'wallet';
    case 'SERVICE_STARTED':
    case 'SERVICE_COMPLETED':
    case 'SESSION_PROGRESS':
      return 'growing';
    case 'STYLIST_ARRIVED':
    case 'CUSTOMER_ARRIVED':
      return 'location';
    case 'MESSAGE_RECEIVED':
      return 'notifications';
    default:
      return 'notifications';
  }
}

/**
 * Get notification category for grouping
 */
export function getNotificationCategory(type: NotificationType): 'booking' | 'payment' | 'message' | 'other' {
  switch (type) {
    case 'BOOKING_CREATED':
    case 'BOOKING_APPROVED':
    case 'BOOKING_DECLINED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_REMINDER':
    case 'SERVICE_STARTED':
    case 'SERVICE_COMPLETED':
    case 'SESSION_PROGRESS':
    case 'STYLIST_ARRIVED':
    case 'CUSTOMER_ARRIVED':
      return 'booking';
    case 'PAYMENT_CONFIRMED':
      return 'payment';
    case 'MESSAGE_RECEIVED':
      return 'message';
    default:
      return 'other';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  }
}
