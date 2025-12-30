/**
 * Badge Component (V7.5.2)
 *
 * Compact UI element for displaying status, labels, or counts.
 * Follows Vlossom design system with botanical color tokens.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/tokens';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Badge content - text or number
   */
  children?: React.ReactNode;
  /**
   * Alternative to children - text label
   */
  label?: string;
  /**
   * Visual variant
   */
  variant?: BadgeVariant;
  /**
   * Size variant
   */
  size?: BadgeSize;
  /**
   * Render as outline style (no fill)
   */
  outline?: boolean;
  /**
   * Additional container styles
   */
  style?: ViewStyle;
  /**
   * Additional text styles
   */
  textStyle?: TextStyle;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: colors.background.secondary,
    text: colors.text.secondary,
    border: colors.border.default,
  },
  primary: {
    bg: colors.primary + '20',
    text: colors.primary,
    border: colors.primary,
  },
  secondary: {
    bg: colors.secondary,
    text: colors.text.primary,
    border: colors.secondary,
  },
  success: {
    bg: colors.status.successLight,
    text: colors.status.success,
    border: colors.status.success,
  },
  warning: {
    bg: colors.status.warningLight,
    text: colors.status.warning,
    border: colors.status.warning,
  },
  error: {
    bg: colors.status.errorLight,
    text: colors.status.error,
    border: colors.status.error,
  },
  info: {
    bg: colors.status.infoLight,
    text: colors.primary,
    border: colors.status.info,
  },
};

const sizeStyles: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: {
    paddingH: spacing.xs,
    paddingV: 2,
    fontSize: typography.fontSize.xs,
  },
  md: {
    paddingH: spacing.sm,
    paddingV: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  lg: {
    paddingH: spacing.md,
    paddingV: spacing.sm,
    fontSize: typography.fontSize.body,
  },
};

export function Badge({
  children,
  label,
  variant = 'default',
  size = 'md',
  outline = false,
  style,
  textStyle,
  accessibilityLabel,
}: BadgeProps) {
  const colorScheme = variantColors[variant];
  const sizeScheme = sizeStyles[size];

  // Use label prop if provided, otherwise use children
  const content = label ?? children;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: outline ? 'transparent' : colorScheme.bg,
          borderColor: colorScheme.border,
          borderWidth: outline ? 1 : 0,
          paddingHorizontal: sizeScheme.paddingH,
          paddingVertical: sizeScheme.paddingV,
        },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? (typeof content === 'string' ? content : undefined)}
    >
      <Text
        style={[
          styles.text,
          {
            color: colorScheme.text,
            fontSize: sizeScheme.fontSize,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
  },
});

export default Badge;
