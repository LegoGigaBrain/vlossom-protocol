/**
 * Card Component (V7.4)
 *
 * Reusable card container with variants and press handling.
 * Follows Vlossom design system tokens.
 *
 * Motion: Supports "settle" animation for gentle arrival into place.
 */

import { View, Pressable, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../styles/theme';
import { useSettleMotion } from '../../hooks/useMotion';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /**
   * Apply settle animation on mount (default: false)
   * Use for cards that appear dynamically (search results, new items)
   */
  animate?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  onPress,
  disabled = false,
  style,
  contentStyle,
  animate = false,
}: CardProps) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { style: settleStyle } = useSettleMotion({ autoPlay: animate });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background.primary,
          ...shadows.card,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background.primary,
          borderWidth: 1,
          borderColor: colors.border.default,
        };
      case 'filled':
        return {
          backgroundColor: colors.background.secondary,
        };
      default:
        return {};
    }
  };

  const cardStyles = [
    styles.card,
    { borderRadius: borderRadius.lg },
    getVariantStyles(),
    style,
  ];

  const innerContentStyle = [
    styles.content,
    { padding: spacing.md },
    contentStyle,
  ];

  // When animation is enabled, wrap in Animated.View
  if (animate) {
    if (onPress) {
      return (
        <Animated.View style={settleStyle}>
          <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
              ...cardStyles,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <View style={innerContentStyle}>{children}</View>
          </Pressable>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[cardStyles, settleStyle]}>
        <View style={innerContentStyle}>{children}</View>
      </Animated.View>
    );
  }

  // Non-animated cards
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          ...cardStyles,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <View style={innerContentStyle}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={cardStyles}>
      <View style={innerContentStyle}>{children}</View>
    </View>
  );
}

// Card.Header component for consistent headers
export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const { spacing, colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingBottom: spacing.sm,
          marginBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.default,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Card.Footer component for consistent footers
export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const { spacing, colors } = useTheme();

  return (
    <View
      style={[
        styles.footer,
        {
          paddingTop: spacing.sm,
          marginTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Attach sub-components
Card.Header = CardHeader;
Card.Footer = CardFooter;

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {},
  pressed: {
    opacity: 0.9,
  },
  header: {},
  footer: {},
});

export default Card;
