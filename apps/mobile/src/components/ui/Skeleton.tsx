/**
 * Skeleton Component (V7.0.0)
 *
 * Animated placeholder for loading states.
 * Provides shimmer animation matching web skeleton patterns.
 *
 * V7.0.0 (UX-4): Mobile skeleton components
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Easing } from 'react-native';
import { colors, borderRadius, spacing } from '../../styles/tokens';

interface SkeletonProps {
  /**
   * Width of the skeleton (number or string like '100%')
   */
  width?: number | string;
  /**
   * Height of the skeleton
   */
  height?: number;
  /**
   * Border radius variant
   */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | 'circle';
  /**
   * Additional styles
   */
  style?: ViewStyle;
  /**
   * Disable animation
   */
  noAnimation?: boolean;
  /**
   * Shape variant - auto determines based on dimensions
   */
  variant?: 'auto' | 'text' | 'circular' | 'rectangular' | 'card';
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'md',
  style,
  noAnimation = false,
  variant = 'auto',
}: SkeletonProps) {
  // Determine radius based on variant if not explicitly set
  const effectiveRadius = (() => {
    if (radius !== 'md') return radius; // User explicitly set radius
    switch (variant) {
      case 'circular':
        return 'circle';
      case 'text':
        return 'sm';
      case 'rectangular':
        return 'none';
      case 'card':
        return 'lg';
      default:
        return radius;
    }
  })();
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (noAnimation) return;

    const animation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [noAnimation, shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const radiusValue = effectiveRadius === 'none' ? 0 : borderRadius[effectiveRadius] || borderRadius.md;

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as number | `${number}%`,
          height,
          borderRadius: radiusValue,
        },
        style,
      ]}
    >
      {!noAnimation && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      )}
    </View>
  );
}

/**
 * Skeleton Text - For text lines
 */
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: number | string;
  style?: ViewStyle;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  spacing: lineSpacing = spacing.sm,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          radius="sm"
          style={index < lines - 1 ? { marginBottom: lineSpacing } : undefined}
        />
      ))}
    </View>
  );
}

/**
 * Skeleton Avatar - Circular avatar placeholder
 */
interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonAvatar({ size = 48, style }: SkeletonAvatarProps) {
  return <Skeleton width={size} height={size} radius="circle" style={style} />;
}

/**
 * Skeleton Card - Card placeholder with optional image, title, and text
 */
interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: number;
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({
  hasImage = true,
  imageHeight = 160,
  lines = 2,
  style,
}: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      {hasImage && (
        <Skeleton
          height={imageHeight}
          radius="lg"
          style={{ marginBottom: spacing.md }}
        />
      )}
      <Skeleton
        height={20}
        width="70%"
        radius="sm"
        style={{ marginBottom: spacing.sm }}
      />
      <SkeletonText lines={lines} lineHeight={14} />
    </View>
  );
}

/**
 * Skeleton List Item - For list items with avatar
 */
interface SkeletonListItemProps {
  hasAvatar?: boolean;
  avatarSize?: number;
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonListItem({
  hasAvatar = true,
  avatarSize = 48,
  lines = 2,
  style,
}: SkeletonListItemProps) {
  return (
    <View style={[styles.listItem, style]}>
      {hasAvatar && (
        <SkeletonAvatar size={avatarSize} style={{ marginRight: spacing.md }} />
      )}
      <View style={styles.listItemContent}>
        <Skeleton
          height={16}
          width="60%"
          radius="sm"
          style={{ marginBottom: spacing.xs }}
        />
        {lines > 1 && (
          <Skeleton
            height={14}
            width="90%"
            radius="sm"
            style={lines > 2 ? { marginBottom: spacing.xs } : undefined}
          />
        )}
        {lines > 2 && <Skeleton height={14} width="40%" radius="sm" />}
      </View>
    </View>
  );
}

/**
 * Skeleton Button - Button placeholder
 */
interface SkeletonButtonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonButton({
  width = 120,
  height = 44,
  style,
}: SkeletonButtonProps) {
  return <Skeleton width={width} height={height} radius="lg" style={style} />;
}

/**
 * Stylist Card Skeleton - Specific to stylist discovery
 */
export function StylistCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.stylistCard, style]}>
      <View style={styles.stylistCardHeader}>
        <SkeletonAvatar size={56} />
        <View style={styles.stylistCardInfo}>
          <Skeleton height={18} width="70%" radius="sm" style={{ marginBottom: spacing.xs }} />
          <Skeleton height={14} width="50%" radius="sm" style={{ marginBottom: spacing.xs }} />
          <Skeleton height={12} width="40%" radius="sm" />
        </View>
      </View>
      <View style={styles.stylistCardServices}>
        <Skeleton height={28} width={80} radius="pill" style={{ marginRight: spacing.sm }} />
        <Skeleton height={28} width={100} radius="pill" style={{ marginRight: spacing.sm }} />
        <Skeleton height={28} width={70} radius="pill" />
      </View>
    </View>
  );
}

/**
 * Booking Card Skeleton - For booking list items
 */
export function BookingCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.bookingCard, style]}>
      <View style={styles.bookingCardHeader}>
        <SkeletonAvatar size={48} />
        <View style={styles.bookingCardInfo}>
          <Skeleton height={16} width="60%" radius="sm" style={{ marginBottom: spacing.xs }} />
          <Skeleton height={14} width="80%" radius="sm" />
        </View>
        <Skeleton height={24} width={60} radius="sm" />
      </View>
      <View style={styles.bookingCardDetails}>
        <Skeleton height={14} width="45%" radius="sm" />
        <Skeleton height={14} width="30%" radius="sm" />
      </View>
    </View>
  );
}

/**
 * Transaction Skeleton - For wallet transactions
 */
export function TransactionSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.transaction, style]}>
      <Skeleton width={40} height={40} radius="circle" />
      <View style={styles.transactionInfo}>
        <Skeleton height={14} width="50%" radius="sm" style={{ marginBottom: spacing.xs }} />
        <Skeleton height={12} width="30%" radius="sm" />
      </View>
      <View style={styles.transactionAmount}>
        <Skeleton height={16} width={60} radius="sm" style={{ marginBottom: spacing.xs }} />
        <Skeleton height={12} width={40} radius="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
    backgroundColor: colors.white,
    opacity: 0.3,
  },
  textContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  stylistCard: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stylistCardHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stylistCardInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  stylistCardServices: {
    flexDirection: 'row',
  },
  bookingCard: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingCardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bookingCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
});
