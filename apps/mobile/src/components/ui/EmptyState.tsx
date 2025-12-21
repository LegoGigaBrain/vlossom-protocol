/**
 * EmptyState Component (V7.0.0)
 *
 * Display when no content is available.
 * Port of web empty-state.tsx with React Native styling.
 *
 * V7.0.0 (UX-2): Mobile empty state component with 14 presets
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../styles/tokens';
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

// Component props
export interface EmptyStateProps {
  /**
   * Pre-built illustration type
   */
  illustration?: IllustrationType;
  /**
   * Custom illustration component (when illustration="custom")
   */
  customIllustration?: React.ReactNode;
  /**
   * Main title text
   */
  title: string;
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
  illustration = 'search',
  customIllustration,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  style,
}: EmptyStateProps) {
  const sizeConfig = sizeStyles[size];
  const IllustrationComponent = illustration !== 'custom' ? illustrations[illustration] : null;

  return (
    <View style={[styles.container, { padding: sizeConfig.containerPadding }, style]}>
      {/* Illustration */}
      <View style={[styles.illustrationContainer, { marginBottom: sizeConfig.gap }]}>
        {illustration === 'custom' && customIllustration
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
            marginBottom: description ? spacing.xs : action ? sizeConfig.gap : 0,
          },
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={[
            styles.description,
            {
              fontSize: sizeConfig.descriptionSize,
              marginBottom: action || secondaryAction ? sizeConfig.gap : 0,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <View style={styles.actionsContainer}>
          {action && (
            <Pressable
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.primaryButton,
                action.variant === 'outline' && styles.outlineButton,
                action.variant === 'secondary' && styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  action.variant === 'outline' && styles.outlineButtonText,
                  action.variant === 'secondary' && styles.secondaryButtonText,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          )}
          {secondaryAction && (
            <Pressable onPress={secondaryAction.onPress} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionText}>{secondaryAction.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
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
