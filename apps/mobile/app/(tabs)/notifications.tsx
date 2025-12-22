/**
 * Notifications Tab - Global Inbox (V6.8.0)
 *
 * Purpose: All system events, bookings, messages, alerts
 * Features: Filter tabs, real-time updates, mark as read
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomNotificationsIcon,
  VlossomSettingsIcon,
  VlossomCalendarIcon,
  VlossomWalletIcon,
  VlossomLocationIcon,
  VlossomGrowingIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useNotificationsStore, selectNotifications, selectUnreadCount } from '../../src/stores';
import { useDemoModeStore, selectIsDemoMode } from '../../src/stores/demo-mode';
import {
  formatRelativeTime,
  getNotificationCategory,
  type Notification,
  type NotificationType,
} from '../../src/api/notifications';

// Filter options
type FilterTab = 'all' | 'bookings' | 'payments' | 'messages';

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bookings', value: 'bookings' },
  { label: 'Payments', value: 'payments' },
  { label: 'Messages', value: 'messages' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();

  // Store state
  const notifications = useNotificationsStore(selectNotifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const {
    notificationsLoading,
    notificationsError,
    hasMore,
    fetchNotifications,
    loadMoreNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();

  // Local state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo mode - refetch when toggled
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Fetch on mount and when demo mode changes
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, isDemoMode]);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === 'all') return true;
    const category = getNotificationCategory(notification.type);
    if (activeFilter === 'bookings') return category === 'booking';
    if (activeFilter === 'payments') return category === 'payment';
    if (activeFilter === 'messages') return category === 'message';
    return true;
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchNotifications(true), fetchUnreadCount()]);
    setIsRefreshing(false);
  }, [fetchNotifications, fetchUnreadCount]);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on type
    const { metadata } = notification;
    if (notification.type === 'MESSAGE_RECEIVED' && metadata.conversationId) {
      router.push(`/messages/${metadata.conversationId}`);
    } else if (metadata.bookingId) {
      router.push(`/bookings/${metadata.bookingId}`);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerLeft}>
          <Text style={[textStyles.h2, { color: colors.text.primary }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.primary, marginLeft: spacing.sm },
              ]}
            >
              <Text style={[textStyles.caption, { color: colors.white }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={{ marginRight: spacing.md }}>
              <Text style={[textStyles.bodySmall, { color: colors.primary }]}>Mark all read</Text>
            </Pressable>
          )}
          <Pressable>
            <VlossomSettingsIcon size={24} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterTabs, { paddingHorizontal: spacing.lg, borderBottomColor: colors.border.default }]}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setActiveFilter(tab.value)}
              style={[
                styles.filterTab,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? colors.primary : 'transparent',
                  paddingBottom: spacing.sm,
                  marginRight: spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.bodySmall,
                  {
                    color: isActive ? colors.primary : colors.text.secondary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Notifications list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          if (isCloseToBottom && hasMore && !notificationsLoading) {
            loadMoreNotifications();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Error State */}
        {notificationsError && (
          <View
            style={[
              styles.errorState,
              { backgroundColor: colors.surface.light, borderRadius: borderRadius.lg },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.status.error }]}>
              {notificationsError}
            </Text>
            <Pressable
              onPress={handleRefresh}
              style={[
                styles.retryButton,
                { backgroundColor: colors.primary, borderRadius: borderRadius.md },
              ]}
            >
              <Text style={[textStyles.bodySmall, { color: colors.white }]}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Loading State */}
        {notificationsLoading && notifications.length === 0 && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Empty State */}
        {!notificationsLoading && filteredNotifications.length === 0 && !notificationsError && (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.surface.light,
                  borderRadius: borderRadius.circle,
                },
              ]}
            >
              <VlossomNotificationsIcon size={32} color={colors.primary} />
            </View>
            <Text style={[textStyles.body, { color: colors.text.primary, marginTop: spacing.lg, fontWeight: '600' }]}>
              All caught up
            </Text>
            <Text
              style={[
                textStyles.body,
                { color: colors.text.tertiary, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              You'll see booking confirmations, updates, and important alerts here
            </Text>
          </View>
        )}

        {/* Notification Items */}
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
            onPress={() => handleNotificationPress(notification)}
          />
        ))}

        {/* Load More Indicator */}
        {notificationsLoading && notifications.length > 0 && (
          <View style={styles.loadMoreIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Notification Item Component
interface NotificationItemProps {
  notification: Notification;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
  onPress: () => void;
}

function NotificationItem({
  notification,
  colors,
  spacing,
  borderRadius,
  shadows,
  onPress,
}: NotificationItemProps) {
  const IconComponent = getIconForType(notification.type);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.notificationItem,
        {
          backgroundColor: notification.read ? colors.background.primary : colors.surface.light,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.sm,
          ...shadows.card,
        },
      ]}
    >
      {/* Icon */}
      <View
        style={[
          styles.notificationIcon,
          {
            backgroundColor: getIconBackground(notification.type, colors),
            borderRadius: borderRadius.pill,
          },
        ]}
      >
        <IconComponent size={20} color={getIconColor(notification.type, colors)} />
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              textStyles.body,
              {
                color: colors.text.primary,
                fontWeight: notification.read ? '400' : '600',
                flex: 1,
              },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.muted }]}>
            {formatRelativeTime(notification.createdAt)}
          </Text>
        </View>
        <Text
          style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: 2 }]}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
      </View>

      {/* Unread Indicator */}
      {!notification.read && (
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: colors.primary },
          ]}
        />
      )}
    </Pressable>
  );
}

// Helper to get icon component for notification type
function getIconForType(type: NotificationType) {
  switch (type) {
    case 'BOOKING_CREATED':
    case 'BOOKING_APPROVED':
    case 'BOOKING_REMINDER':
      return VlossomCalendarIcon;
    case 'BOOKING_DECLINED':
    case 'BOOKING_CANCELLED':
      return VlossomCloseIcon;
    case 'PAYMENT_CONFIRMED':
      return VlossomWalletIcon;
    case 'SERVICE_STARTED':
    case 'SERVICE_COMPLETED':
    case 'SESSION_PROGRESS':
      return VlossomGrowingIcon;
    case 'STYLIST_ARRIVED':
    case 'CUSTOMER_ARRIVED':
      return VlossomLocationIcon;
    case 'MESSAGE_RECEIVED':
      return VlossomNotificationsIcon;
    default:
      return VlossomNotificationsIcon;
  }
}

// Helper to get icon background color
function getIconBackground(type: NotificationType, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (type) {
    case 'BOOKING_APPROVED':
    case 'SERVICE_COMPLETED':
      return colors.tertiary + '20';
    case 'BOOKING_DECLINED':
    case 'BOOKING_CANCELLED':
      return colors.status.error + '20';
    case 'PAYMENT_CONFIRMED':
      return colors.primary + '20';
    default:
      return colors.surface.light;
  }
}

// Helper to get icon color
function getIconColor(type: NotificationType, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (type) {
    case 'BOOKING_APPROVED':
    case 'SERVICE_COMPLETED':
      return colors.tertiary;
    case 'BOOKING_DECLINED':
    case 'BOOKING_CANCELLED':
      return colors.status.error;
    case 'PAYMENT_CONFIRMED':
      return colors.primary;
    default:
      return colors.text.secondary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {},
  list: {
    flex: 1,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorState: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
