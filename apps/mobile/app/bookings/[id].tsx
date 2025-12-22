/**
 * Booking Detail Screen (V7.0.0)
 *
 * Detailed view of a single booking with:
 * - Status badge (color-coded)
 * - Stylist card (tap to view profile)
 * - Service details (name, duration, description)
 * - Date/time/location information
 * - Price breakdown
 * - Action buttons by status
 */

import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomCalendarIcon,
  VlossomLocationIcon,
  VlossomWalletIcon,
} from '../../src/components/icons/VlossomIcons';
import {
  useBookingsStore,
  selectCurrentBooking,
  useDemoModeStore,
  selectIsDemoMode,
} from '../../src/stores';
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  getCancellationPolicy,
  type Booking,
} from '../../src/api/bookings';
import { formatPrice } from '../../src/api/stylists';
import { MOCK_BOOKINGS } from '../../src/data/mock-data';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Demo mode
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Store state
  const booking = useBookingsStore(selectCurrentBooking);
  const { currentBookingLoading, currentBookingError, fetchBooking, cancelBooking, cancelLoading } = useBookingsStore();

  // Fetch booking on mount
  useEffect(() => {
    if (id) {
      if (isDemoMode) {
        // In demo mode, set mock booking directly
        const mockBooking = MOCK_BOOKINGS.find((b) => b.id === id);
        if (mockBooking) {
          useBookingsStore.setState({ currentBooking: mockBooking });
        }
      } else {
        fetchBooking(id);
      }
    }
  }, [id, isDemoMode, fetchBooking]);

  const handleBack = () => {
    router.back();
  };

  const handleViewStylist = () => {
    if (booking) {
      router.push(`/stylists/${booking.stylist.id}`);
    }
  };

  const handleMessage = () => {
    if (booking) {
      router.push(`/messages/${booking.stylist.id}`);
    }
  };

  const handleCancel = () => {
    if (!booking) return;

    const policy = getCancellationPolicy(booking.scheduledStartTime);

    Alert.alert(
      'Cancel Booking?',
      `${policy.message}\n\nAre you sure you want to cancel this appointment?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelBooking(booking.id, 'Customer requested');
            if (success) {
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
            }
          },
        },
      ]
    );
  };

  const handleBookAgain = () => {
    if (booking) {
      router.push(`/stylists/${booking.stylist.id}/book`);
    }
  };

  const handleLeaveReview = () => {
    if (booking) {
      // TODO: Implement review flow
      Alert.alert('Coming Soon', 'Review functionality will be available soon.');
    }
  };

  // Loading state
  if (currentBookingLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>
          Loading booking...
        </Text>
      </View>
    );
  }

  // Error state
  if (currentBookingError || !booking) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}>
        <Text style={[textStyles.h3, { color: colors.text.primary }]}>
          {currentBookingError || 'Booking not found'}
        </Text>
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, borderRadius: borderRadius.md },
          ]}
        >
          <Text style={[textStyles.body, { color: colors.white }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = getBookingStatusColor(booking.status);
  const statusLabel = getBookingStatusLabel(booking.status);
  const scheduledDate = new Date(booking.scheduledStartTime);
  const canCancel = ['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.status) && scheduledDate > new Date();
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';

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
        <Pressable onPress={handleBack} style={styles.backButtonHeader}>
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.text.primary }]}>Booking Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={[styles.statusSection, { paddingHorizontal: spacing.lg }]}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor + '20',
                borderRadius: borderRadius.pill,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text style={[textStyles.body, { color: statusColor, fontWeight: '600' }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Stylist Card */}
        <Pressable
          onPress={handleViewStylist}
          style={[
            styles.stylistCard,
            {
              backgroundColor: colors.background.primary,
              marginHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <View
            style={[
              styles.stylistAvatar,
              { backgroundColor: colors.surface.light, borderRadius: borderRadius.pill },
            ]}
          >
            <Text style={[textStyles.h3, { color: colors.text.tertiary }]}>
              {booking.stylist.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.stylistInfo}>
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              {booking.stylist.displayName}
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>
              Tap to view profile
            </Text>
          </View>
          <VlossomBackIcon
            size={20}
            color={colors.text.tertiary}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </Pressable>

        {/* Service Details */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.primary,
              marginHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Service
          </Text>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            {booking.service.name}
          </Text>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary, marginTop: spacing.xs }]}>
            Duration: {booking.service.estimatedDurationMin} minutes
          </Text>
        </View>

        {/* Date & Time */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.primary,
              marginHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
            When
          </Text>
          <View style={styles.infoRow}>
            <VlossomCalendarIcon size={20} color={colors.text.tertiary} />
            <Text style={[textStyles.body, { color: colors.text.primary, marginLeft: spacing.sm }]}>
              {scheduledDate.toLocaleDateString('en-ZA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
            <View style={{ width: 20 }} />
            <Text style={[textStyles.body, { color: colors.text.primary, marginLeft: spacing.sm }]}>
              {scheduledDate.toLocaleTimeString('en-ZA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.primary,
              marginHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Where
          </Text>
          <View style={styles.infoRow}>
            <VlossomLocationIcon size={20} color={colors.text.tertiary} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[textStyles.body, { color: colors.text.primary }]}>
                {booking.locationType === 'CUSTOMER_HOME' ? 'Your Location' : "Stylist's Location"}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.text.tertiary, marginTop: spacing.xs }]}>
                {booking.locationAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.primary,
                marginHorizontal: spacing.lg,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Notes
            </Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              {booking.notes}
            </Text>
          </View>
        )}

        {/* Price Breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.primary,
              marginHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Price
          </Text>
          <View style={styles.priceRow}>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>Service</Text>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>
              {formatPrice(booking.service.priceAmountCents)}
            </Text>
          </View>
          <View style={[styles.priceRow, { marginTop: spacing.sm }]}>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>Platform Fee</Text>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>
              {formatPrice(booking.platformFeeCents)}
            </Text>
          </View>
          <View
            style={[
              styles.priceRow,
              styles.priceTotal,
              { marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border.default },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              Total
            </Text>
            <Text style={[textStyles.h4, { color: colors.primary }]}>
              {formatPrice(booking.totalAmountCents)}
            </Text>
          </View>
        </View>

        {/* Escrow Info */}
        {booking.escrowTxHash && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.tertiary + '10',
                marginHorizontal: spacing.lg,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.infoRow}>
              <VlossomWalletIcon size={20} color={colors.tertiary} />
              <Text style={[textStyles.bodySmall, { color: colors.tertiary, marginLeft: spacing.sm }]}>
                Payment secured in escrow
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionButtonsContainer,
          {
            paddingBottom: insets.bottom + spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.default,
            ...shadows.card,
          },
        ]}
      >
        {/* Pending or Confirmed: Cancel + Message */}
        {canCancel && (
          <>
            <Pressable
              onPress={handleCancel}
              disabled={cancelLoading}
              style={[
                styles.actionButton,
                {
                  borderColor: colors.status.error,
                  borderWidth: 2,
                  borderRadius: borderRadius.lg,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.status.error, fontWeight: '600' }]}>
                {cancelLoading ? 'Cancelling...' : 'Cancel'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleMessage}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.lg,
                  marginLeft: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                Message
              </Text>
            </Pressable>
          </>
        )}

        {/* Completed: Leave Review + Book Again */}
        {isCompleted && (
          <>
            <Pressable
              onPress={handleLeaveReview}
              style={[
                styles.actionButton,
                {
                  borderColor: colors.primary,
                  borderWidth: 2,
                  borderRadius: borderRadius.lg,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]}>
                Leave Review
              </Text>
            </Pressable>
            <Pressable
              onPress={handleBookAgain}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.lg,
                  marginLeft: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                Book Again
              </Text>
            </Pressable>
          </>
        )}

        {/* Cancelled: Book Again */}
        {isCancelled && (
          <Pressable
            onPress={handleBookAgain}
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
                flex: 1,
              },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
              Book Again
            </Text>
          </Pressable>
        )}
      </View>
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
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {},
  stylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  stylistAvatar: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTotal: {
    borderTopWidth: 1,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
