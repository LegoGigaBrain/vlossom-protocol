/**
 * EmptyState Component (V7.4)
 *
 * Display when no content is available.
 * Port of web empty-state.tsx with React Native styling.
 *
 * V7.0.0 (UX-2): Mobile empty state component with 14 presets
 * V7.4: Added settle animation for gentle arrival into view
 *
 * Motion: Uses "settle" animation for gentle arrival into view.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Animated } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../styles/tokens';
import { useSettleMotion } from '../../hooks/useMotion';
import {
  CalendarIllustration,
  SearchIllustration,
  WalletIllustration,
  ScissorsIllustration,
  InboxIllustration,
  ReviewsIllustration,
  MessageIllustration,
  PropertyIllustration,
  CompletedIllustration,
} from './illustrations';

// Illustration type
export type IllustrationType =
  | 'calendar'
  | 'search'
  | 'wallet'
  | 'scissors'
  | 'inbox'
  | 'reviews'
  | 'message'
  | 'property'
  | 'completed'
  | 'custom';

// Size variant
export type EmptyStateSize = 'sm' | 'md' | 'lg';

// Action props
export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

// Preset names type (defined inline to avoid circular reference)
export type EmptyStatePresetName =
  | 'noStylists'
  | 'noServices'
  | 'noAvailability'
  | 'noBookings'
  | 'noHistory'
  | 'noTransactions'
  | 'noNotifications'
  | 'noReviews'
  | 'noMessages'
  | 'noSearchResults'
  | 'noFavorites'
  | 'networkError'
  | 'noProperties'
  | 'bookingCompleted'
  | 'noDefiPools'
  | 'noRewards'
  | 'defi'
  | 'wallet-history'
  | 'error'
  | 'rewards';

// Component props
export interface EmptyStateProps {
  /**
   * Use a preset configuration by name
   */
  preset?: EmptyStatePresetName;
  /**
   * Pre-built illustration type
   */
  illustration?: IllustrationType;
  /**
   * Custom illustration component (when illustration="custom")
   */
  customIllustration?: React.ReactNode;
  /**
   * Main title text (required unless using preset)
   */
  title?: string;
  /**
   * Description text below the title
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: EmptyStateAction;
  /**
   * Secondary action (link style)
   */
  secondaryAction?: EmptyStateAction;
  /**
   * Size variant
   */
  size?: EmptyStateSize;
  /**
   * Additional container styles
   */
  style?: ViewStyle;
  /**
   * Action label for simple preset usage
   */
  actionLabel?: string;
  /**
   * Action handler for simple preset usage
   */
  onAction?: () => void;
}

// Illustration component map
const illustrations: Record<Exclude<IllustrationType, 'custom'>, React.FC<{ size?: number }>> = {
  calendar: CalendarIllustration,
  search: SearchIllustration,
  wallet: WalletIllustration,
  scissors: ScissorsIllustration,
  inbox: InboxIllustration,
  reviews: ReviewsIllustration,
  message: MessageIllustration,
  property: PropertyIllustration,
  completed: CompletedIllustration,
};

// Size configurations
const sizeStyles = {
  sm: {
    containerPadding: spacing.lg,
    illustrationSize: 80,
    titleSize: typography.fontSize.body,
    descriptionSize: typography.fontSize.bodySmall,
    gap: spacing.sm,
  },
  md: {
    containerPadding: spacing.xl,
    illustrationSize: 100,
    titleSize: typography.fontSize.h3,
    descriptionSize: typography.fontSize.bodySmall,
    gap: spacing.md,
  },
  lg: {
    containerPadding: spacing['2xl'],
    illustrationSize: 120,
    titleSize: typography.fontSize.h2,
    descriptionSize: typography.fontSize.body,
    gap: spacing.lg,
  },
};

export function EmptyState({
  preset,
  illustration,
  customIllustration,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  style,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // Apply preset if specified
  const presetConfig = preset ? emptyStatePresets[preset] : null;
  const resolvedIllustration = illustration ?? presetConfig?.illustration ?? 'search';
  const resolvedTitle = title ?? presetConfig?.title ?? '';
  const resolvedDescription = description ?? presetConfig?.description;

  // Build action from actionLabel/onAction if provided
  const resolvedAction = action ?? (actionLabel && onAction ? { label: actionLabel, onPress: onAction } : undefined);

  const sizeConfig = sizeStyles[size];
  const IllustrationComponent = resolvedIllustration !== 'custom' ? illustrations[resolvedIllustration] : null;
  const { style: settleStyle } = useSettleMotion({ autoPlay: true });

  // Accessibility: combine title and description for screen readers
  const accessibilityLabel = resolvedDescription ? `${resolvedTitle}. ${resolvedDescription}` : resolvedTitle;

  return (
    <Animated.View
      style={[styles.container, { padding: sizeConfig.containerPadding }, settleStyle, style]}
      accessible
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Illustration - decorative, hidden from screen readers */}
      <View
        style={[styles.illustrationContainer, { marginBottom: sizeConfig.gap }]}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        {resolvedIllustration === 'custom' && customIllustration
          ? customIllustration
          : IllustrationComponent && (
              <IllustrationComponent size={sizeConfig.illustrationSize} />
            )}
      </View>

      {/* Title */}
      <Text
        style={[
          styles.title,
          {
            fontSize: sizeConfig.titleSize,
            marginBottom: resolvedDescription ? spacing.xs : resolvedAction ? sizeConfig.gap : 0,
          },
        ]}
        accessibilityRole="header"
      >
        {resolvedTitle}
      </Text>

      {/* Description */}
      {resolvedDescription && (
        <Text
          style={[
            styles.description,
            {
              fontSize: sizeConfig.descriptionSize,
              marginBottom: resolvedAction || secondaryAction ? sizeConfig.gap : 0,
            },
          ]}
          accessibilityRole="text"
        >
          {resolvedDescription}
        </Text>
      )}

      {/* Actions */}
      {(resolvedAction || secondaryAction) && (
        <View style={styles.actionsContainer} accessibilityRole="none">
          {resolvedAction && (
            <Pressable
              onPress={resolvedAction.onPress}
              style={({ pressed }) => [
                styles.primaryButton,
                resolvedAction.variant === 'outline' && styles.outlineButton,
                resolvedAction.variant === 'secondary' && styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={resolvedAction.label}
              accessibilityHint={`Tap to ${resolvedAction.label.toLowerCase()}`}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  resolvedAction.variant === 'outline' && styles.outlineButtonText,
                  resolvedAction.variant === 'secondary' && styles.secondaryButtonText,
                ]}
              >
                {resolvedAction.label}
              </Text>
            </Pressable>
          )}
          {secondaryAction && (
            <Pressable
              onPress={secondaryAction.onPress}
              style={styles.secondaryActionButton}
              accessibilityRole="button"
              accessibilityLabel={secondaryAction.label}
            >
              <Text style={styles.secondaryActionText}>{secondaryAction.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Preset empty states for common use cases
 * Matches web presets for consistency
 */
export interface EmptyStatePreset {
  illustration: IllustrationType;
  title: string;
  description: string;
}

export const emptyStatePresets: Record<string, EmptyStatePreset> = {
  /** No stylists found in search area */
  noStylists: {
    illustration: 'search',
    title: 'No stylists nearby',
    description: 'Try expanding your search area or adjusting your filters to find more stylists.',
  },
  /** No services available */
  noServices: {
    illustration: 'scissors',
    title: 'No services available',
    description: "This stylist hasn't added any services yet. Check back later!",
  },
  /** No availability slots */
  noAvailability: {
    illustration: 'calendar',
    title: 'No availability',
    description: 'No open slots for the selected dates. Try a different time or date.',
  },
  /** No upcoming bookings */
  noBookings: {
    illustration: 'calendar',
    title: 'No upcoming appointments',
    description: "You don't have any scheduled appointments. Book your next session!",
  },
  /** No past bookings */
  noHistory: {
    illustration: 'calendar',
    title: 'No booking history',
    description: 'Your completed appointments will appear here.',
  },
  /** Empty wallet - no transactions */
  noTransactions: {
    illustration: 'wallet',
    title: 'No transactions yet',
    description: 'Your transaction history will appear here once you make a booking.',
  },
  /** No notifications */
  noNotifications: {
    illustration: 'inbox',
    title: 'All caught up!',
    description: "You'll see booking updates, messages, and alerts here.",
  },
  /** No reviews */
  noReviews: {
    illustration: 'reviews',
    title: 'No reviews yet',
    description: 'Reviews from your clients will appear here.',
  },
  /** No messages */
  noMessages: {
    illustration: 'message',
    title: 'No messages',
    description: 'Start a conversation with a stylist or client.',
  },
  /** Search with no results */
  noSearchResults: {
    illustration: 'search',
    title: 'No results found',
    description: 'Try different keywords or adjust your filters.',
  },
  /** Favorites empty */
  noFavorites: {
    illustration: 'scissors',
    title: 'No favorites yet',
    description: 'Save your favorite stylists to quickly book with them again.',
  },
  /** Network error */
  networkError: {
    illustration: 'inbox',
    title: 'Connection issue',
    description: "We couldn't load this content. Check your connection and try again.",
  },
  /** No properties */
  noProperties: {
    illustration: 'property',
    title: 'No properties yet',
    description: 'Add your first property to start renting chair space.',
  },
  /** Booking completed */
  bookingCompleted: {
    illustration: 'completed',
    title: 'Booking confirmed!',
    description: "You're all set. We'll send you a reminder before your appointment.",
  },
  /** No DeFi pools */
  noDefiPools: {
    illustration: 'wallet',
    title: 'No staking pools',
    description: 'Staking pools will appear here when available.',
  },
  /** No rewards */
  noRewards: {
    illustration: 'wallet',
    title: 'No rewards yet',
    description: 'Earn rewards by booking stylists and completing appointments.',
  },
  /** DeFi alias (same as noDefiPools) */
  defi: {
    illustration: 'wallet',
    title: 'No staking pools',
    description: 'Staking pools will appear here when available.',
  },
  /** Wallet history alias (same as noTransactions) */
  'wallet-history': {
    illustration: 'wallet',
    title: 'No transactions yet',
    description: 'Your transaction history will appear here once you make a booking.',
  },
  /** Error state */
  error: {
    illustration: 'inbox',
    title: 'Something went wrong',
    description: 'We encountered an error. Please try again later.',
  },
  /** Rewards alias (same as noRewards) */
  rewards: {
    illustration: 'wallet',
    title: 'No rewards yet',
    description: 'Earn rewards by booking stylists and completing appointments.',
  },
};

/**
 * Helper to get preset props
 */
export function getEmptyStateProps(preset: keyof typeof emptyStatePresets): EmptyStatePreset {
  return emptyStatePresets[preset];
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    fontFamily: typography.fontFamily.sans,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  actionsContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.brand.rose,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    minWidth: 160,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.rose,
  },
  outlineButtonText: {
    color: colors.brand.rose,
  },
  secondaryButton: {
    backgroundColor: colors.background.tertiary,
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  secondaryActionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryActionText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.brand.rose,
    textDecorationLine: 'underline',
  },
});
