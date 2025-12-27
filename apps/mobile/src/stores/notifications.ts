/**
 * Notifications Store (V7.0.0)
 *
 * Zustand store for managing notification state.
 * Handles fetching, pagination, and read status.
 * Supports demo mode with mock data.
 */

import { create } from 'zustand';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  type Notification,
} from '../api/notifications';
import { MOCK_NOTIFICATIONS, getUnreadMockNotificationCount } from '../data/mock-data';
import { getIsDemoMode } from './demo-mode';

// ============================================================================
// Types
// ============================================================================

interface NotificationsState {
  // Notifications list
  notifications: Notification[];
  notificationsLoading: boolean;
  notificationsError: string | null;

  // Pagination
  page: number;
  hasMore: boolean;
  total: number;

  // Unread count (for badge)
  unreadCount: number;
  unreadCountLoading: boolean;

  // Actions
  fetchNotifications: (refresh?: boolean) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  notifications: [] as Notification[],
  notificationsLoading: false,
  notificationsError: null as string | null,

  page: 1,
  hasMore: false,
  total: 0,

  unreadCount: 0,
  unreadCountLoading: false,
};

// ============================================================================
// Store
// ============================================================================

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  ...initialState,

  /**
   * Fetch notifications (first page or refresh)
   * In demo mode, returns mock notifications
   */
  fetchNotifications: async (refresh = false) => {
    const { notificationsLoading } = get();
    if (notificationsLoading && !refresh) return;

    set({ notificationsLoading: true, notificationsError: null });

    // Demo mode: return mock notifications
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      set({
        notifications: MOCK_NOTIFICATIONS,
        notificationsLoading: false,
        page: 1,
        hasMore: false,
        total: MOCK_NOTIFICATIONS.length,
      });
      return;
    }

    try {
      const response = await getNotifications({ page: 1, limit: 20 });

      set({
        notifications: response.notifications,
        notificationsLoading: false,
        page: 1,
        hasMore: response.pagination.hasMore,
        total: response.pagination.total,
      });
    } catch (error) {
      set({
        notificationsLoading: false,
        notificationsError: error instanceof Error ? error.message : 'Failed to fetch notifications',
      });
    }
  },

  /**
   * Load more notifications (pagination)
   */
  loadMoreNotifications: async () => {
    const { page, hasMore, notificationsLoading, notifications } = get();
    if (!hasMore || notificationsLoading) return;

    set({ notificationsLoading: true });

    try {
      const response = await getNotifications({ page: page + 1, limit: 20 });

      set({
        notifications: [...notifications, ...response.notifications],
        notificationsLoading: false,
        page: page + 1,
        hasMore: response.pagination.hasMore,
      });
    } catch (error) {
      set({
        notificationsLoading: false,
        notificationsError: error instanceof Error ? error.message : 'Failed to load more',
      });
    }
  },

  /**
   * Fetch unread count (for badge)
   * In demo mode, returns mock unread count
   */
  fetchUnreadCount: async () => {
    set({ unreadCountLoading: true });

    // Demo mode: return mock unread count
    if (getIsDemoMode()) {
      set({
        unreadCount: getUnreadMockNotificationCount(),
        unreadCountLoading: false,
      });
      return;
    }

    try {
      const response = await getUnreadCount();
      set({
        unreadCount: response.count,
        unreadCountLoading: false,
      });
    } catch (error) {
      set({ unreadCountLoading: false });
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string) => {
    const { notifications, unreadCount } = get();

    // Optimistic update
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      set({
        notifications: notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    }

    try {
      await apiMarkAsRead(notificationId);
    } catch (error) {
      // Revert on error
      if (notification && !notification.read) {
        set({
          notifications: notifications.map((n) =>
            n.id === notificationId ? { ...n, read: false } : n
          ),
          unreadCount: unreadCount + 1,
        });
      }
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const { notifications } = get();

    // Optimistic update
    set({
      notifications: notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });

    try {
      await apiMarkAllAsRead();
    } catch (error) {
      // Refetch on error
      get().fetchNotifications(true);
      get().fetchUnreadCount();
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectNotifications = (state: NotificationsState) => state.notifications;
export const selectUnreadCount = (state: NotificationsState) => state.unreadCount;
export const selectUnreadNotifications = (state: NotificationsState) =>
  state.notifications.filter((n) => !n.read);
