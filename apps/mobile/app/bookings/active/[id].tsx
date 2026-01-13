/**
 * Active Session Screen (V7.3.0)
 *
 * Real-time session tracking view for customers.
 * Features:
 * - Full-screen map with stylist location (when available)
 * - Progress steps visualization
 * - ETA display
 * - Contact stylist button
 * - Session notes/updates feed
 *
 * V7.3.0: Initial implementation
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../../src/components/MapView';
import { useTheme, textStyles } from '../../../src/styles/theme';
import { spacing, borderRadius, shadows } from '../../../src/styles/tokens';
import {
  VlossomBackIcon,
  VlossomLocationIcon,
  VlossomCalendarIcon,
  VlossomProfileIcon,
} from '../../../src/components/icons/VlossomIcons';
import { SessionTracker } from '../../../src/components/booking';
import {
  useSessionStore,
  selectSessionProgress,
  selectSessionState,
  selectIsConnected,
  useDemoModeStore,
  selectIsDemoMode,
  useBookingsStore,
  selectCurrentBooking,
  type SessionState,
} from '../../../src/stores';
import { MOCK_BOOKINGS } from '../../../src/data/mock-data';

export default function ActiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Demo mode
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Session store
  const sessionProgress = useSessionStore(selectSessionProgress);
  const sessionState = useSessionStore(selectSessionState);
  const isConnected = useSessionStore(selectIsConnected);
  const connect = useSessionStore((state) => state.connect);
  const disconnect = useSessionStore((state) => state.disconnect);
  const markCustomerArrived = useSessionStore((state) => state.markCustomerArrived);

  // Booking store
  const booking = useBookingsStore(selectCurrentBooking);
  const { fetchBooking, currentBookingLoading } = useBookingsStore();

  // Local state
  const [hasMarkedArrived, setHasMarkedArrived] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: -26.2041, // Johannesburg default
    longitude: 28.0473,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Fetch booking and connect to session on mount
  useEffect(() => {
    if (id) {
      if (isDemoMode) {
        const mockBooking = MOCK_BOOKINGS.find((b) => b.id === id);
        if (mockBooking) {
          useBookingsStore.setState({ currentBooking: mockBooking });
        }
      } else {
        fetchBooking(id);
      }
      connect(id);
    }

    return () => {
      disconnect();
    };
  }, [id, isDemoMode, fetchBooking, connect, disconnect]);

  // Update map region when stylist location changes
  useEffect(() => {
    if (sessionProgress?.lat && sessionProgress?.lng) {
      setMapRegion({
        latitude: sessionProgress.lat,
        longitude: sessionProgress.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else if (booking?.locationLat && booking?.locationLng) {
      setMapRegion({
        latitude: booking.locationLat,
        longitude: booking.locationLng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [sessionProgress?.lat, sessionProgress?.lng, booking?.locationLat, booking?.locationLng]);

  const handleBack = () => {
    router.back();
  };

  const handleContactStylist = () => {
    if (booking) {
      router.push(`/messages/${booking.stylist.id}`);
    }
  };

  const handleMarkArrived = async () => {
    if (!id || hasMarkedArrived) return;

    const success = await markCustomerArrived(id);
    if (success) {
      setHasMarkedArrived(true);
      Alert.alert('Notified', 'Your stylist has been notified that you have arrived.');
    }
  };

  const handleSessionStateChange = (state: SessionState) => {
    if (state === 'complete') {
      Alert.alert(
        'Session Complete',
        'Your session has been completed. Thank you for using Vlossom!',
        [
          { text: 'View Details', onPress: () => router.push(`/bookings/${id}`) },
          { text: 'Done', style: 'default' },
        ]
      );
    }
  };

  // Loading state
  if (currentBookingLoading && !booking) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}
        accessibilityRole="alert"
        accessibilityLabel="Loading session"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>
          Loading session...
        </Text>
      </View>
    );
  }

  // No booking state
  if (!booking) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}
        accessibilityRole="alert"
        accessibilityLabel="Session not found"
      >
        <Text style={[textStyles.h3, { color: colors.text.primary }]}>Session not found</Text>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <Text style={[textStyles.body, { color: colors.white }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const hasStylistLocation = sessionProgress?.lat && sessionProgress?.lng;
  const scheduledDate = new Date(booking.scheduledStartTime);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Booking Location Marker */}
          {booking.locationLat && booking.locationLng && (
            <Marker
              coordinate={{
                latitude: booking.locationLat,
                longitude: booking.locationLng,
              }}
              title="Appointment Location"
              description={booking.locationAddress}
              pinColor={colors.primary}
            />
          )}

          {/* Stylist Location Marker */}
          {hasStylistLocation && (
            <Marker
              coordinate={{
                latitude: sessionProgress.lat!,
                longitude: sessionProgress.lng!,
              }}
              title={booking.stylist.displayName}
              description={
                sessionProgress.etaMinutes
                  ? `ETA: ${sessionProgress.etaMinutes} min`
                  : 'En route'
              }
              pinColor={colors.tertiary}
            />
          )}
        </MapView>

        {/* Back Button Overlay */}
        <Pressable
          onPress={handleBack}
          style={[
            styles.mapBackButton,
            {
              top: insets.top + spacing.sm,
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.pill,
              ...shadows.soft,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>

        {/* Connection Status Badge */}
        <View
          style={[
            styles.connectionBadge,
            {
              top: insets.top + spacing.sm,
              backgroundColor: isConnected ? colors.status.success : colors.status.warning,
              borderRadius: borderRadius.pill,
            },
          ]}
          accessibilityLabel={isConnected ? 'Live updates active' : 'Using polling updates'}
        >
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: colors.white },
            ]}
          />
          <Text style={[styles.connectionText, { color: colors.white }]}>
            {isConnected ? 'Live' : 'Polling'}
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.background.primary,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            ...shadows.elevated,
          },
        ]}
      >
        <ScrollView
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border.default }]} />
          </View>

          {/* Stylist Info */}
          <View style={styles.stylistSection}>
            <View
              style={[
                styles.stylistAvatar,
                { backgroundColor: colors.surface.light, borderRadius: borderRadius.pill },
              ]}
            >
              <VlossomProfileIcon size={24} color={colors.text.tertiary} />
            </View>
            <View style={styles.stylistInfo}>
              <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
                {booking.stylist.displayName}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
                {booking.service.name}
              </Text>
            </View>
            <Pressable
              onPress={handleContactStylist}
              style={[
                styles.messageButton,
                { backgroundColor: colors.primary, borderRadius: borderRadius.md },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Message stylist"
            >
              <Text style={[textStyles.bodySmall, { color: colors.white, fontWeight: '600' }]}>
                Message
              </Text>
            </Pressable>
          </View>

          {/* Session Tracker */}
          <SessionTracker
            bookingId={id!}
            onStateChange={handleSessionStateChange}
            style={{ marginBottom: spacing.lg }}
          />

          {/* Appointment Details */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Text
              style={[textStyles.caption, { color: colors.text.tertiary, marginBottom: spacing.sm }]}
            >
              APPOINTMENT DETAILS
            </Text>
            <View style={styles.detailRow}>
              <VlossomCalendarIcon size={16} color={colors.text.secondary} />
              <Text style={[textStyles.bodySmall, { color: colors.text.primary, marginLeft: spacing.sm }]}>
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
            <View style={[styles.detailRow, { marginTop: spacing.sm }]}>
              <VlossomLocationIcon size={16} color={colors.text.secondary} />
              <Text
                style={[textStyles.bodySmall, { color: colors.text.primary, marginLeft: spacing.sm, flex: 1 }]}
                numberOfLines={2}
              >
                {booking.locationAddress}
              </Text>
            </View>
          </View>

          {/* Customer Arrived Button (for location-based bookings) */}
          {booking.locationType === 'STYLIST_BASE' && !hasMarkedArrived && sessionState !== 'complete' && (
            <Pressable
              onPress={handleMarkArrived}
              style={[
                styles.arrivedButton,
                {
                  backgroundColor: colors.tertiary,
                  borderRadius: borderRadius.lg,
                  marginTop: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="I've arrived"
              accessibilityHint="Notifies your stylist that you have arrived at their location"
            >
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                I've Arrived
              </Text>
            </Pressable>
          )}

          {hasMarkedArrived && (
            <View
              style={[
                styles.arrivedConfirmation,
                {
                  backgroundColor: colors.status.successLight,
                  borderRadius: borderRadius.lg,
                  marginTop: spacing.md,
                },
              ]}
              accessibilityLabel="Stylist notified of your arrival"
            >
              <Text style={[textStyles.bodySmall, { color: colors.status.success }]}>
                Your stylist knows you've arrived
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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

  // Map
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapBackButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionBadge: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom Sheet
  bottomSheet: {
    maxHeight: '55%',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  // Stylist Section
  stylistSection: {
    flexDirection: 'row',
    alignItems: 'center',
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
  messageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Details Card
  detailsCard: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Arrived Button
  arrivedButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  arrivedConfirmation: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});
