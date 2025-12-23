/**
 * Booking Detail Screen (V7.2.0)
 *
 * Detailed view of a single booking with:
 * - Status badge (color-coded)
 * - Stylist card (tap to view profile)
 * - Service details (name, duration, description)
 * - Date/time/location information
 * - Price breakdown
 * - Action buttons by status
 * - Review modal for completed bookings
 * - Auto-prompt for review on completed bookings (V7.1.1)
 *
 * V7.2.0: Full accessibility support with semantic roles
 */

import { useEffect, useState, useRef } from 'react';
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
  getBookingReview,
  type Booking,
} from '../../src/api/bookings';
import { formatPrice } from '../../src/api/stylists';
import { MOCK_BOOKINGS } from '../../src/data/mock-data';
import { ReviewModal } from '../../src/components/ui';

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

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  // Track if we've already prompted for review this session
  const hasPromptedForReview = useRef(false);

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

  // Check if review exists for completed bookings
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!booking || booking.status !== 'COMPLETED' || hasReviewed) return;

      if (isDemoMode) {
        // In demo mode, simulate no existing review for demonstration
        setHasReviewed(false);
        return;
      }

      setCheckingReview(true);
      try {
        const existingReview = await getBookingReview(booking.id);
        setHasReviewed(existingReview !== null);
      } catch {
        // If check fails, assume no review exists
        setHasReviewed(false);
      } finally {
        setCheckingReview(false);
      }
    };

    checkExistingReview();
  }, [booking?.id, booking?.status, isDemoMode, hasReviewed]);

  // Auto-prompt for review on completed bookings (once per session)
  useEffect(() => {
    if (
      booking?.status === 'COMPLETED' &&
      !hasReviewed &&
      !checkingReview &&
      !hasPromptedForReview.current &&
      !currentBookingLoading
    ) {
      // Small delay to let the screen render first
      const timer = setTimeout(() => {
        hasPromptedForReview.current = true;
        setShowReviewModal(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [booking?.status, hasReviewed, checkingReview, currentBookingLoading]);

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
      setShowReviewModal(true);
    }
  };

  const handleReviewSuccess = () => {
    setHasReviewed(true);
  };

  // Loading state
  if (currentBookingLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Loading booking details"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={colors.primary} accessibilityElementsHidden />
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]} aria-hidden>
          Loading booking...
        </Text>
      </View>
    );
  }

  // Error state
  if (currentBookingError || !booking) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={currentBookingError || 'Booking not found'}
        accessibilityLiveRegion="assertive"
      >
        <Text style={[textStyles.h3, { color: colors.text.primary }]} aria-hidden>
          {currentBookingError || 'Booking not found'}
        </Text>
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, borderRadius: borderRadius.md },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
          accessibilityHint="Returns to previous screen"
        >
          <Text style={[textStyles.body, { color: colors.white }]} aria-hidden>Go Back</Text>
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
        <Pressable
          onPress={handleBack}
          style={styles.backButtonHeader}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to previous screen"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.h3, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          Booking Details
        </Text>
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
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Booking status: ${statusLabel}`}
          >
            <Text style={[textStyles.body, { color: statusColor, fontWeight: '600' }]} aria-hidden>
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
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Stylist: ${booking.stylist.displayName}`}
          accessibilityHint="Opens stylist profile"
        >
          <View
            style={[
              styles.stylistAvatar,
              { backgroundColor: colors.surface.light, borderRadius: borderRadius.pill },
            ]}
            aria-hidden
          >
            <Text style={[textStyles.h3, { color: colors.text.tertiary }]}>
              {booking.stylist.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.stylistInfo} aria-hidden>
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
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Service: ${booking.service.name}, Duration: ${booking.service.estimatedDurationMin} minutes`}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]} aria-hidden>
            Service
          </Text>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]} aria-hidden>
            {booking.service.name}
          </Text>
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary, marginTop: spacing.xs }]} aria-hidden>
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
          accessible
          accessibilityRole="text"
          accessibilityLabel={`When: ${scheduledDate.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${scheduledDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]} aria-hidden>
            When
          </Text>
          <View style={styles.infoRow} aria-hidden>
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
          <View style={[styles.infoRow, { marginTop: spacing.sm }]} aria-hidden>
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
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Where: ${booking.locationType === 'CUSTOMER_HOME' ? 'Your Location' : "Stylist's Location"}, ${booking.locationAddress}`}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]} aria-hidden>
            Where
          </Text>
          <View style={styles.infoRow} aria-hidden>
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
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Notes: ${booking.notes}`}
          >
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]} aria-hidden>
              Notes
            </Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]} aria-hidden>
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
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Price breakdown: Service ${formatPrice(booking.service.priceAmountCents)}, Platform fee ${formatPrice(booking.platformFeeCents)}, Total ${formatPrice(booking.totalAmountCents)}`}
        >
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]} aria-hidden>
            Price
          </Text>
          <View style={styles.priceRow} aria-hidden>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>Service</Text>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>
              {formatPrice(booking.service.priceAmountCents)}
            </Text>
          </View>
          <View style={[styles.priceRow, { marginTop: spacing.sm }]} aria-hidden>
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
            aria-hidden
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
            accessible
            accessibilityRole="text"
            accessibilityLabel="Payment secured in escrow"
          >
            <View style={styles.infoRow} aria-hidden>
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
              accessibilityRole="button"
              accessibilityLabel={cancelLoading ? 'Cancelling booking' : 'Cancel booking'}
              accessibilityState={{ disabled: cancelLoading }}
              accessibilityHint="Opens confirmation dialog to cancel this booking"
            >
              <Text style={[textStyles.body, { color: colors.status.error, fontWeight: '600' }]} aria-hidden>
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
              accessibilityRole="button"
              accessibilityLabel="Message stylist"
              accessibilityHint="Opens conversation with your stylist"
            >
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]} aria-hidden>
                Message
              </Text>
            </Pressable>
          </>
        )}

        {/* Completed: Leave Review + Book Again */}
        {isCompleted && (
          <>
            {checkingReview ? (
              <View
                style={[
                  styles.actionButton,
                  {
                    borderColor: colors.border.default,
                    borderWidth: 2,
                    borderRadius: borderRadius.lg,
                    marginRight: spacing.sm,
                  },
                ]}
                accessible
                accessibilityRole="text"
                accessibilityLabel="Checking review status"
              >
                <ActivityIndicator size="small" color={colors.text.tertiary} accessibilityElementsHidden />
              </View>
            ) : !hasReviewed ? (
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
                accessibilityRole="button"
                accessibilityLabel="Leave Review"
                accessibilityHint="Opens review form for this booking"
              >
                <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]} aria-hidden>
                  Leave Review
                </Text>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.status.success + '20',
                    borderRadius: borderRadius.lg,
                    marginRight: spacing.sm,
                  },
                ]}
                accessible
                accessibilityRole="text"
                accessibilityLabel="Already reviewed"
              >
                <Text style={[textStyles.body, { color: colors.status.success, fontWeight: '600' }]} aria-hidden>
                  Reviewed
                </Text>
              </View>
            )}
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
              accessibilityRole="button"
              accessibilityLabel="Book Again"
              accessibilityHint="Opens booking form for this stylist"
            >
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]} aria-hidden>
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
            accessibilityRole="button"
            accessibilityLabel="Book Again"
            accessibilityHint="Opens booking form for this stylist"
          >
            <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]} aria-hidden>
              Book Again
            </Text>
          </Pressable>
        )}
      </View>

      {/* Review Modal */}
      {booking && (
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          bookingId={booking.id}
          stylistName={booking.stylist.displayName}
          serviceName={booking.service.name}
          onSuccess={handleReviewSuccess}
        />
      )}
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
