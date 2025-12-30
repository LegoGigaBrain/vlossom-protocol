/**
 * Session Tracker Component (V7.3.0)
 *
 * Real-time session progress tracking for bookings.
 * Features:
 * - Progress bar with percentage
 * - ETA display
 * - Connection status indicator ("Live" badge)
 * - Step-based progress visualization
 * - Stylist location on map (when available)
 *
 * Accessibility:
 * - VoiceOver/TalkBack support
 * - Live region announcements for updates
 * - Semantic role descriptions
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../styles/theme';
import { spacing, borderRadius, typography, shadows } from '../../styles/tokens';
import {
  VlossomCheckIcon,
  VlossomClockIcon,
  VlossomLocationIcon,
  VlossomRefreshIcon,
} from '../icons/VlossomIcons';
import {
  useSessionStore,
  selectSessionProgress,
  selectSessionState,
  selectIsConnected,
  selectIsPolling,
  selectConnectionError,
  type SessionState,
} from '../../stores/session';

// ============================================================================
// Types
// ============================================================================

interface SessionTrackerProps {
  /** Booking ID to track */
  bookingId: string;
  /** Callback when session state changes */
  onStateChange?: (state: SessionState) => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom style */
  style?: object;
}

type StepState = 'started' | 'in_progress' | 'complete';

// ============================================================================
// Component
// ============================================================================

export function SessionTracker({
  bookingId,
  onStateChange,
  compact = false,
  style,
}: SessionTrackerProps) {
  const { colors, isDark } = useTheme();

  // Store state
  const sessionProgress = useSessionStore(selectSessionProgress);
  const sessionState = useSessionStore(selectSessionState);
  const isConnected = useSessionStore(selectIsConnected);
  const isPolling = useSessionStore(selectIsPolling);
  const connectionError = useSessionStore(selectConnectionError);
  const connect = useSessionStore((state) => state.connect);
  const disconnect = useSessionStore((state) => state.disconnect);
  const fetchSessionProgress = useSessionStore((state) => state.fetchSessionProgress);

  // Animation values
  const progressWidth = useSharedValue(0);
  const livePulse = useSharedValue(1);

  // Connect on mount
  useEffect(() => {
    connect(bookingId);
    return () => disconnect();
  }, [bookingId, connect, disconnect]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(sessionState);
  }, [sessionState, onStateChange]);

  // Animate progress bar
  useEffect(() => {
    const percent = sessionProgress?.progressPercent ?? 0;
    progressWidth.value = withTiming(percent, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [sessionProgress?.progressPercent, progressWidth]);

  // Pulse animation for live indicator
  useEffect(() => {
    if (isConnected) {
      livePulse.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [isConnected, livePulse]);

  // Animated styles
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const livePulseStyle = useAnimatedStyle(() => ({
    opacity: livePulse.value,
  }));

  // Retry connection
  const handleRetry = useCallback(() => {
    connect(bookingId);
    fetchSessionProgress(bookingId);
    AccessibilityInfo.announceForAccessibility('Reconnecting to live updates');
  }, [bookingId, connect, fetchSessionProgress]);

  // Derived values
  const eta = sessionProgress?.etaMinutes;
  const progressPercent = sessionProgress?.progressPercent ?? 0;

  // Accessibility announcement on state change
  useEffect(() => {
    let message = '';
    switch (sessionState) {
      case 'started':
        message = 'Session has started. Your stylist has arrived.';
        break;
      case 'in_progress':
        message = `Session in progress. ${progressPercent}% complete.`;
        if (eta && eta > 0) {
          message += ` About ${eta} minutes remaining.`;
        }
        break;
      case 'complete':
        message = 'Session complete.';
        break;
    }
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [sessionState, progressPercent, eta]);

  // Compact version
  if (compact) {
    return (
      <View
        style={[styles.compactContainer, style]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progressPercent,
          text: getStateLabel(sessionState),
        }}
        accessibilityLiveRegion="polite"
      >
        <SessionStateIcon state={sessionState} colors={colors} size="sm" />
        <Text style={[styles.compactLabel, { color: colors.text.primary }]}>
          {getStateLabel(sessionState)}
        </Text>
        {sessionState === 'in_progress' && progressPercent > 0 && (
          <Text style={[styles.compactPercent, { color: colors.text.secondary }]}>
            ({progressPercent}%)
          </Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.primary,
          borderColor: colors.border.default,
        },
        shadows.soft,
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Session progress"
    >
      {/* Connection Status Banner */}
      {!isConnected && !isPolling && (
        <View
          style={[
            styles.connectionBanner,
            { backgroundColor: isDark ? '#451a03' : '#fffbeb' },
          ]}
        >
          <View style={styles.connectionBannerContent}>
            <VlossomClockIcon
              size={16}
              color={isDark ? '#fbbf24' : '#d97706'}
            />
            <Text
              style={[
                styles.connectionText,
                { color: isDark ? '#fbbf24' : '#d97706' },
              ]}
            >
              Live updates unavailable
            </Text>
          </View>
          <Pressable
            onPress={handleRetry}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry connection"
          >
            <VlossomRefreshIcon
              size={14}
              color={isDark ? '#fbbf24' : '#d97706'}
            />
            <Text
              style={[
                styles.retryText,
                { color: isDark ? '#fbbf24' : '#d97706' },
              ]}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      {/* Reconnecting State */}
      {!isConnected && isPolling && connectionError && (
        <View
          style={[
            styles.connectionBanner,
            { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={isDark ? '#60a5fa' : '#3b82f6'}
          />
          <Text
            style={[
              styles.connectionText,
              { color: isDark ? '#60a5fa' : '#3b82f6', marginLeft: spacing.sm },
            ]}
          >
            Reconnecting...
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Session Progress
        </Text>
        {isConnected && (
          <View style={styles.liveIndicator}>
            <Animated.View
              style={[
                styles.liveDot,
                { backgroundColor: colors.status.success },
                livePulseStyle,
              ]}
            />
            <Text
              style={[styles.liveText, { color: colors.status.success }]}
              accessibilityLabel="Live updates active"
            >
              Live
            </Text>
          </View>
        )}
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {/* Progress Line Background */}
        <View
          style={[
            styles.progressLineBackground,
            { backgroundColor: colors.border.default },
          ]}
        />
        {/* Progress Line Fill */}
        <View
          style={[
            styles.progressLineFill,
            { backgroundColor: colors.primary },
            { height: `${getProgressLineHeight(sessionState)}%` },
          ]}
        />

        {/* Steps */}
        <SessionStep
          state={sessionState}
          stepState="started"
          label="Session Started"
          description="Your stylist has arrived and begun"
          colors={colors}
        />
        <SessionStep
          state={sessionState}
          stepState="in_progress"
          label="In Progress"
          description={
            progressPercent > 0
              ? `${progressPercent}% complete${eta ? ` • ~${eta} min remaining` : ''}`
              : 'Service is being performed'
          }
          colors={colors}
          showProgress={sessionState === 'in_progress'}
          progressPercent={progressPercent}
          progressBarStyle={progressBarStyle}
        />
        <SessionStep
          state={sessionState}
          stepState="complete"
          label="Complete"
          description="Session has ended successfully"
          colors={colors}
        />
      </View>

      {/* ETA Card */}
      {sessionState === 'in_progress' && eta && eta > 0 && (
        <View
          style={[
            styles.etaCard,
            { backgroundColor: `${colors.primary}15` },
          ]}
          accessibilityLabel={`Estimated completion in ${eta} minutes`}
        >
          <VlossomClockIcon size={16} color={colors.primary} />
          <Text style={[styles.etaText, { color: colors.primary }]}>
            Estimated completion in {eta} minutes
          </Text>
        </View>
      )}

      {/* Location Indicator */}
      {sessionProgress?.lat && sessionProgress?.lng && sessionState !== 'complete' && (
        <View
          style={[
            styles.locationCard,
            { backgroundColor: colors.background.secondary },
          ]}
          accessibilityLabel="Stylist location available"
        >
          <VlossomLocationIcon size={16} color={colors.text.secondary} />
          <Text style={[styles.locationText, { color: colors.text.secondary }]}>
            Stylist location available
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface SessionStepProps {
  state: SessionState;
  stepState: StepState;
  label: string;
  description: string;
  colors: ReturnType<typeof useTheme>['colors'];
  showProgress?: boolean;
  progressPercent?: number;
  progressBarStyle?: object;
}

function SessionStep({
  state,
  stepState,
  label,
  description,
  colors,
  showProgress,
  progressPercent = 0,
  progressBarStyle,
}: SessionStepProps) {
  const isCompleted = getStepIndex(state) > getStepIndex(stepState);
  const isActive = state === stepState;
  const isPending = getStepIndex(state) < getStepIndex(stepState);

  return (
    <View
      style={styles.step}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${description}`}
      accessibilityState={{ selected: isActive, disabled: isPending }}
    >
      {/* Icon */}
      <View
        style={[
          styles.stepIcon,
          isCompleted && { backgroundColor: colors.primary },
          isActive && { backgroundColor: `${colors.primary}30` },
          isPending && { backgroundColor: colors.background.secondary },
        ]}
      >
        {isCompleted ? (
          <VlossomCheckIcon size={16} color="#FFFFFF" />
        ) : isActive ? (
          stepState === 'in_progress' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <VlossomCheckIcon size={16} color={colors.primary} />
          )
        ) : (
          <View
            style={[
              styles.stepDot,
              { backgroundColor: colors.text.tertiary },
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepLabel,
            isCompleted && { color: colors.text.primary },
            isActive && { color: colors.primary },
            isPending && { color: colors.text.tertiary },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
          {description}
        </Text>

        {/* Progress bar for in_progress step */}
        {showProgress && progressPercent > 0 && (
          <View
            style={[
              styles.stepProgressTrack,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Animated.View
              style={[
                styles.stepProgressFill,
                { backgroundColor: colors.primary },
                progressBarStyle,
              ]}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

interface SessionStateIconProps {
  state: SessionState;
  colors: ReturnType<typeof useTheme>['colors'];
  size?: 'sm' | 'md';
}

function SessionStateIcon({ state, colors, size = 'md' }: SessionStateIconProps) {
  const iconSize = size === 'sm' ? 14 : 18;

  switch (state) {
    case 'not_started':
      return (
        <View
          style={[
            styles.stateIconCircle,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <View
            style={[
              styles.stateIconDot,
              { backgroundColor: colors.text.tertiary },
            ]}
          />
        </View>
      );
    case 'started':
      return (
        <View
          style={[
            styles.stateIconCircle,
            { backgroundColor: `${colors.primary}30` },
          ]}
        >
          <VlossomCheckIcon size={iconSize} color={colors.primary} />
        </View>
      );
    case 'in_progress':
      return (
        <View
          style={[
            styles.stateIconCircle,
            { backgroundColor: `${colors.primary}30` },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    case 'complete':
      return (
        <View
          style={[
            styles.stateIconCircle,
            { backgroundColor: `${colors.status.success}30` },
          ]}
        >
          <VlossomCheckIcon size={iconSize} color={colors.status.success} />
        </View>
      );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStateLabel(state: SessionState): string {
  switch (state) {
    case 'not_started':
      return 'Waiting to start';
    case 'started':
      return 'Session started';
    case 'in_progress':
      return 'In progress';
    case 'complete':
      return 'Complete';
  }
}

function getStepIndex(state: SessionState | StepState): number {
  switch (state) {
    case 'not_started':
      return 0;
    case 'started':
      return 1;
    case 'in_progress':
      return 2;
    case 'complete':
      return 3;
  }
}

function getProgressLineHeight(state: SessionState): number {
  switch (state) {
    case 'not_started':
      return 0;
    case 'started':
      return 33;
    case 'in_progress':
      return 66;
    case 'complete':
      return 100;
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },

  // Compact version
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  compactPercent: {
    fontSize: typography.fontSize.sm,
  },

  // Connection banner
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  connectionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  connectionText: {
    fontSize: typography.fontSize.sm,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },

  // Steps container
  stepsContainer: {
    position: 'relative',
    paddingLeft: spacing.lg + 8, // For progress line
  },
  progressLineBackground: {
    position: 'absolute',
    left: 15,
    top: 24,
    width: 2,
    height: 'calc(100% - 48px)' as any, // Will be overridden
    bottom: 24,
  },
  progressLineFill: {
    position: 'absolute',
    left: 15,
    top: 24,
    width: 2,
  },

  // Step
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.lg,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  stepLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.bodySmall,
  },
  stepProgressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ETA Card
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  etaText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Location Card
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
  },

  // State icon (compact)
  stateIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export type { SessionTrackerProps };
