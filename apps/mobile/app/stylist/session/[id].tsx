/**
 * Stylist Session Control Panel (V7.3.0)
 *
 * Control panel for stylists to manage active sessions.
 * Features:
 * - "I've Arrived" check-in button
 * - Progress slider (25%, 50%, 75%, 100%)
 * - Add session notes
 * - "Complete Session" button
 * - Location auto-broadcasting (optional)
 *
 * V7.3.0: Initial implementation
 */

import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useTheme, textStyles } from '../../../src/styles/theme';
import { spacing, borderRadius, shadows, typography } from '../../../src/styles/tokens';
import {
  VlossomBackIcon,
  VlossomLocationIcon,
  VlossomCalendarIcon,
  VlossomProfileIcon,
  VlossomCheckIcon,
} from '../../../src/components/icons/VlossomIcons';
import {
  useSessionStore,
  selectSessionProgress,
  selectSessionState,
  useDemoModeStore,
  selectIsDemoMode,
  useBookingsStore,
  selectCurrentBooking,
} from '../../../src/stores';
import { MOCK_BOOKINGS } from '../../../src/data/mock-data';

// Progress step options
const PROGRESS_STEPS = [
  { value: 0, label: 'Not Started' },
  { value: 25, label: 'Preparation' },
  { value: 50, label: 'In Progress' },
  { value: 75, label: 'Finishing' },
  { value: 100, label: 'Complete' },
];

export default function StylistSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Demo mode
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Session store
  const sessionProgress = useSessionStore(selectSessionProgress);
  const sessionState = useSessionStore(selectSessionState);
  const connect = useSessionStore((state) => state.connect);
  const disconnect = useSessionStore((state) => state.disconnect);
  const markArrived = useSessionStore((state) => state.markArrived);
  const updateProgress = useSessionStore((state) => state.updateProgress);
  const endSession = useSessionStore((state) => state.endSession);

  // Booking store
  const booking = useBookingsStore(selectCurrentBooking);
  const { fetchBooking, currentBookingLoading } = useBookingsStore();

  // Local state
  const [hasMarkedArrived, setHasMarkedArrived] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);

  // Location tracking interval ref
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [id, isDemoMode, fetchBooking, connect, disconnect]);

  // Sync progress from store
  useEffect(() => {
    if (sessionProgress?.progressPercent !== undefined) {
      setCurrentProgress(sessionProgress.progressPercent);
    }
    if (sessionState === 'started' || sessionState === 'in_progress') {
      setHasMarkedArrived(true);
    }
  }, [sessionProgress?.progressPercent, sessionState]);

  // Location tracking
  useEffect(() => {
    const startLocationTracking = async () => {
      if (!locationEnabled || !id) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location sharing requires permission. Your customer won\'t see your real-time location.',
          [{ text: 'OK' }]
        );
        setLocationEnabled(false);
        return;
      }

      // Send location update every 30 seconds
      const sendLocationUpdate = async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          await updateProgress(id, {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });

          setLastLocationUpdate(new Date());
        } catch (error) {
          console.error('Error getting location:', error);
        }
      };

      // Initial update
      sendLocationUpdate();

      // Set up interval
      locationIntervalRef.current = setInterval(sendLocationUpdate, 30000);
    };

    startLocationTracking();

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [locationEnabled, id, updateProgress]);

  const handleBack = () => {
    router.back();
  };

  const handleMarkArrived = async () => {
    if (!id || hasMarkedArrived) return;

    setIsUpdating(true);
    const success = await markArrived(id);
    setIsUpdating(false);

    if (success) {
      setHasMarkedArrived(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Checked In', 'Your customer has been notified that you have arrived.');
    } else {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    }
  };

  const handleProgressChange = async (value: number) => {
    if (!id) return;

    setCurrentProgress(value);
    setIsUpdating(true);

    const success = await updateProgress(id, {
      progressPercent: value,
      currentStep: PROGRESS_STEPS.find((s) => s.value === value)?.label,
    });

    setIsUpdating(false);

    if (success) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddNote = async () => {
    if (!id || !notes.trim()) return;

    setIsUpdating(true);
    const success = await updateProgress(id, {
      currentStep: notes.trim(),
    });
    setIsUpdating(false);

    if (success) {
      setNotes('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCompleteSession = async () => {
    if (!id) return;

    Alert.alert(
      'Complete Session?',
      'Are you sure you want to complete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            setIsEnding(true);
            const success = await endSession(id);
            setIsEnding(false);

            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Session Complete', 'Great work! The session has been marked as complete.', [
                { text: 'Done', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', 'Failed to complete session. Please try again.');
            }
          },
        },
      ]
    );
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

  const scheduledDate = new Date(booking.scheduledStartTime);
  const isSessionComplete = sessionState === 'complete' || currentProgress === 100;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.text.primary }]} accessibilityRole="header">
          Session Control
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Customer Info */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.primary,
              marginHorizontal: spacing.lg,
              marginTop: spacing.lg,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <View style={styles.customerRow}>
            <View
              style={[
                styles.customerAvatar,
                { backgroundColor: colors.surface.light, borderRadius: borderRadius.pill },
              ]}
            >
              <VlossomProfileIcon size={24} color={colors.text.tertiary} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
                Customer
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
                {booking.service.name}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: spacing.md }]}>
            <VlossomCalendarIcon size={16} color={colors.text.secondary} />
            <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginLeft: spacing.sm }]}>
              {scheduledDate.toLocaleTimeString('en-ZA', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {booking.service.estimatedDurationMin} min
            </Text>
          </View>

          <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
            <VlossomLocationIcon size={16} color={colors.text.secondary} />
            <Text
              style={[textStyles.bodySmall, { color: colors.text.secondary, marginLeft: spacing.sm, flex: 1 }]}
              numberOfLines={1}
            >
              {booking.locationAddress}
            </Text>
          </View>
        </View>

        {/* Arrival Check-In */}
        {!hasMarkedArrived && (
          <Pressable
            onPress={handleMarkArrived}
            disabled={isUpdating}
            style={[
              styles.arrivedButton,
              {
                backgroundColor: colors.tertiary,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="I've arrived"
            accessibilityHint="Notifies your customer that you have arrived"
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <VlossomLocationIcon size={20} color={colors.white} />
                <Text style={[textStyles.body, { color: colors.white, fontWeight: '600', marginLeft: spacing.sm }]}>
                  I've Arrived
                </Text>
              </>
            )}
          </Pressable>
        )}

        {hasMarkedArrived && !isSessionComplete && (
          <View
            style={[
              styles.arrivedConfirmation,
              {
                backgroundColor: colors.status.successLight,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <VlossomCheckIcon size={16} color={colors.status.success} />
            <Text style={[textStyles.bodySmall, { color: colors.status.success, marginLeft: spacing.sm }]}>
              You've checked in
            </Text>
          </View>
        )}

        {/* Progress Control */}
        {hasMarkedArrived && !isSessionComplete && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.primary,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Session Progress
            </Text>

            <View style={styles.progressSteps}>
              {PROGRESS_STEPS.map((step) => (
                <Pressable
                  key={step.value}
                  onPress={() => handleProgressChange(step.value)}
                  disabled={isUpdating}
                  style={[
                    styles.progressStep,
                    {
                      backgroundColor:
                        currentProgress >= step.value ? colors.primary : colors.background.secondary,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.label}, ${step.value}%`}
                  accessibilityState={{ selected: currentProgress === step.value }}
                >
                  <Text
                    style={[
                      styles.progressValue,
                      {
                        color: currentProgress >= step.value ? colors.white : colors.text.secondary,
                      },
                    ]}
                  >
                    {step.value}%
                  </Text>
                  <Text
                    style={[
                      styles.progressLabel,
                      {
                        color: currentProgress >= step.value ? colors.white : colors.text.tertiary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isUpdating && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: spacing.md }}
              />
            )}
          </View>
        )}

        {/* Session Notes */}
        {hasMarkedArrived && !isSessionComplete && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.primary,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Add Update
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="E.g., Starting styling phase..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
              accessibilityLabel="Session update note"
            />

            <Pressable
              onPress={handleAddNote}
              disabled={!notes.trim() || isUpdating}
              style={[
                styles.addNoteButton,
                {
                  backgroundColor: notes.trim() ? colors.primary : colors.background.secondary,
                  borderRadius: borderRadius.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send update"
              accessibilityState={{ disabled: !notes.trim() || isUpdating }}
            >
              <Text
                style={[
                  textStyles.body,
                  {
                    color: notes.trim() ? colors.white : colors.text.tertiary,
                    fontWeight: '600',
                  },
                ]}
              >
                Send Update
              </Text>
            </Pressable>
          </View>
        )}

        {/* Location Sharing Toggle */}
        {hasMarkedArrived && !isSessionComplete && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.background.primary,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Pressable
              onPress={() => setLocationEnabled(!locationEnabled)}
              style={styles.toggleRow}
              accessibilityRole="switch"
              accessibilityState={{ checked: locationEnabled }}
              accessibilityLabel="Share live location"
            >
              <View style={styles.toggleInfo}>
                <VlossomLocationIcon size={20} color={colors.text.primary} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '500' }]}>
                    Share Live Location
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                    Let your customer see your location
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggle,
                  {
                    backgroundColor: locationEnabled ? colors.status.success : colors.border.default,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    {
                      backgroundColor: colors.white,
                      transform: [{ translateX: locationEnabled ? 20 : 2 }],
                    },
                  ]}
                />
              </View>
            </Pressable>

            {locationEnabled && lastLocationUpdate && (
              <Text
                style={[
                  textStyles.caption,
                  { color: colors.text.tertiary, marginTop: spacing.sm, marginLeft: 36 },
                ]}
              >
                Last updated: {lastLocationUpdate.toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}

        {/* Session Complete Card */}
        {isSessionComplete && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.status.successLight,
                marginHorizontal: spacing.lg,
                marginTop: spacing.lg,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.completeHeader}>
              <VlossomCheckIcon size={24} color={colors.status.success} />
              <Text
                style={[
                  textStyles.h3,
                  { color: colors.status.success, marginLeft: spacing.sm },
                ]}
              >
                Session Complete
              </Text>
            </View>
            <Text style={[textStyles.body, { color: colors.status.success, marginTop: spacing.sm }]}>
              Great work! This session has been marked as complete.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Complete Session Button */}
      {hasMarkedArrived && !isSessionComplete && (
        <View
          style={[
            styles.bottomAction,
            {
              paddingBottom: insets.bottom + spacing.md,
              paddingHorizontal: spacing.lg,
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.default,
            },
          ]}
        >
          <Pressable
            onPress={handleCompleteSession}
            disabled={isEnding}
            style={[
              styles.completeButton,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Complete session"
            accessibilityHint="Marks this session as complete"
          >
            {isEnding ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <VlossomCheckIcon size={20} color={colors.white} />
                <Text
                  style={[
                    textStyles.body,
                    { color: colors.white, fontWeight: '600', marginLeft: spacing.sm },
                  ]}
                >
                  Complete Session
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
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

  // Header
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

  // Card
  card: {
    padding: 16,
  },

  // Customer Info
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Arrived Button
  arrivedButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  arrivedConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // Progress Steps
  progressSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  progressStep: {
    flex: 1,
    minWidth: '18%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    textAlign: 'center',
  },

  // Notes
  notesInput: {
    minHeight: 80,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.body,
  },
  addNoteButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  // Complete
  completeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Bottom Action
  bottomAction: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  completeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
});
