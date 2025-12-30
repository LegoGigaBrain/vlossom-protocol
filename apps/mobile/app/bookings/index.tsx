/**
 * Booking History Screen (V7.0.0)
 *
 * List of all user bookings with:
 * - Tab filters: Upcoming | Past | All
 * - Booking cards with status, stylist, date, price
 * - Pull-to-refresh
 * - Empty state with CTA
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomCalendarIcon,
} from '../../src/components/icons/VlossomIcons';
import {
  useBookingsStore,
  selectBookings,
  selectBookingsLoading,
  useDemoModeStore,
  selectIsDemoMode,
} from '../../src/stores';
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  type Booking,
} from '../../src/api/bookings';
import { formatPrice } from '../../src/api/stylists';
import { MOCK_BOOKINGS, getUpcomingMockBookings, getPastMockBookings } from '../../src/data/mock-data';
import { EmptyState, getEmptyStateProps } from '../../src/components/ui/EmptyState';

type TabFilter = 'upcoming' | 'past' | 'all';

export default function BookingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Demo mode
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Store state
  const bookings = useBookingsStore(selectBookings);
  const bookingsLoading = useBookingsStore(selectBookingsLoading);
  const { fetchBookings } = useBookingsStore();

  // Local state
  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch on mount
  useEffect(() => {
    if (!isDemoMode) {
      fetchBookings(true);
    }
  }, [isDemoMode, fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!isDemoMode) {
      await fetchBookings(true);
    }
    setRefreshing(false);
  }, [isDemoMode, fetchBookings]);

  const handleBack = () => {
    router.back();
  };

  const handleBookingPress = (booking: Booking) => {
    router.push(`/bookings/${booking.id}`);
  };

  const handleFindStylist = () => {
    router.push('/(tabs)');
  };

  // Get filtered bookings based on active tab
  const getFilteredBookings = (): Booking[] => {
    const data = isDemoMode ? MOCK_BOOKINGS : bookings;
    const now = new Date();

    switch (activeTab) {
      case 'upcoming':
        return data.filter(
          (b) =>
            ['CONFIRMED', 'PENDING_PAYMENT', 'IN_PROGRESS'].includes(b.status) &&
            new Date(b.scheduledStartTime) >= now
        ).sort((a, b) =>
          new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
        );
      case 'past':
        return data.filter(
          (b) =>
            b.status === 'COMPLETED' ||
            b.status === 'CANCELLED' ||
            new Date(b.scheduledStartTime) < now
        ).sort((a, b) =>
          new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()
        );
      case 'all':
      default:
        return data.sort((a, b) =>
          new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()
        );
    }
  };

  const filteredBookings = getFilteredBookings();

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const statusColor = getBookingStatusColor(item.status);
    const statusLabel = getBookingStatusLabel(item.status);
    const scheduledDate = new Date(item.scheduledStartTime);

    return (
      <Pressable
        onPress={() => handleBookingPress(item)}
        style={[
          styles.bookingCard,
          {
            backgroundColor: colors.background.primary,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            borderRadius: borderRadius.lg,
            ...shadows.card,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.stylistInfo}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.surface.light, borderRadius: borderRadius.pill },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.text.tertiary }]}>
                {item.stylist.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.stylistText}>
              <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
                {item.stylist.displayName}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>
                {item.service.name}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor + '20',
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: statusColor, fontWeight: '600' }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.border.default }]} />

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <VlossomCalendarIcon size={16} color={colors.text.tertiary} />
            <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginLeft: spacing.xs }]}>
              {scheduledDate.toLocaleDateString('en-ZA', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              at{' '}
              {scheduledDate.toLocaleTimeString('en-ZA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]}>
            {formatPrice(item.totalAmountCents)}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => {
    if (bookingsLoading && !isDemoMode) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const emptyMessage = {
      upcoming: 'No upcoming appointments',
      past: 'No past appointments',
      all: 'No bookings yet',
    }[activeTab];

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          {...getEmptyStateProps('noBookings')}
          title={emptyMessage}
          description="Find a stylist and book your first appointment"
          action={{
            label: 'Find a Stylist',
            onPress: handleFindStylist,
          }}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.text.primary }]}>My Bookings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {
            paddingHorizontal: spacing.lg,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        {(['upcoming', 'past', 'all'] as TabFilter[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && {
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                textStyles.body,
                {
                  color: activeTab === tab ? colors.primary : colors.text.tertiary,
                  fontWeight: activeTab === tab ? '600' : '400',
                  textTransform: 'capitalize',
                },
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  bookingCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stylistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistText: {
    marginLeft: 12,
    flex: 1,
  },
  statusBadge: {},
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
