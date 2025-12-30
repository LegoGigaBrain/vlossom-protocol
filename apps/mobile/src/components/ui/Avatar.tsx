/**
 * Avatar Component (V7.5.2)
 *
 * Profile image display with fallback to initials.
 * Follows Vlossom design system.
 */

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { colors, typography, borderRadius } from '../../styles/tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  /**
   * Image source (local or remote)
   */
  source?: ImageSourcePropType | string | null;
  /**
   * Name for fallback initials
   */
  name?: string;
  /**
   * Size variant
   */
  size?: AvatarSize;
  /**
   * Custom background color for initials
   */
  fallbackColor?: string;
  /**
   * Show online indicator
   */
  showOnline?: boolean;
  /**
   * Is user online
   */
  isOnline?: boolean;
  /**
   * Additional container styles
   */
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { container: number; font: number; online: number }> = {
  xs: { container: 24, font: 10, online: 6 },
  sm: { container: 32, font: 12, online: 8 },
  md: { container: 40, font: 14, online: 10 },
  lg: { container: 48, font: 16, online: 12 },
  xl: { container: 64, font: 20, online: 14 },
  '2xl': { container: 96, font: 28, online: 18 },
};

// Generate consistent color from name
function getColorFromName(name: string): string {
  const colorOptions = [
    colors.primary,
    colors.tertiary,
    colors.status.success,
    colors.status.info,
    colors.brand.clay,
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorOptions[Math.abs(hash) % colorOptions.length];
}

// Get initials from name
function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  source,
  name = '',
  size = 'md',
  fallbackColor,
  showOnline = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = sizeMap[size];

  const hasValidSource = source && !imageError;
  const bgColor = fallbackColor || getColorFromName(name);
  const initials = getInitials(name);

  // Handle both string URLs and ImageSourcePropType
  const imageSource: ImageSourcePropType | null = (() => {
    if (!source) return null;
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  })();

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: sizeConfig.container / 2,
          backgroundColor: hasValidSource ? colors.background.secondary : bgColor,
        },
        style,
      ]}
    >
      {hasValidSource && imageSource ? (
        <Image
          source={imageSource}
          style={[
            styles.image,
            {
              width: sizeConfig.container,
              height: sizeConfig.container,
              borderRadius: sizeConfig.container / 2,
            },
          ]}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: sizeConfig.font,
            },
          ]}
        >
          {initials}
        </Text>
      )}

      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: sizeConfig.online,
              height: sizeConfig.online,
              borderRadius: sizeConfig.online / 2,
              backgroundColor: isOnline ? colors.status.success : colors.text.muted,
              borderWidth: sizeConfig.online / 4,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: colors.white,
  },
});

export default Avatar;
