/**
 * AnimatedSplash
 *
 * Full-screen animated splash component with the Vlossom icon.
 * Shows after the native Expo splash screen hides, adds motion before app loads.
 *
 * Animation sequence (1s total):
 * - 0-300ms: Fade in + scale (0.8 → 1.0) with unfold easing
 * - 300-600ms: Subtle breathe pulse (1.0 → 1.02 → 1.0)
 * - 600-1000ms: Hold, then fade out to app
 */

import React, { useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { VlossomSplashIcon } from './VlossomSplashIcon';
import { useAnimatedSplash } from '../../hooks/useAnimatedSplash';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { colors } from '../../styles/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Icon size relative to screen (40% of smaller dimension)
const ICON_SIZE = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.4;

interface AnimatedSplashProps {
  /** Callback when splash animation completes and should hide */
  onComplete?: () => void;
  /** Minimum display time in ms (default: 1000) */
  minDuration?: number;
}

export function AnimatedSplash({
  onComplete,
  minDuration = 1000,
}: AnimatedSplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const reducedMotion = useReducedMotion();

  const { containerStyle, iconStyle } = useAnimatedSplash({
    reducedMotion,
    minDuration,
    onComplete: () => {
      setIsVisible(false);
      onComplete?.();
    },
  });

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, containerStyle as object]}>
        <Animated.View style={iconStyle as object}>
          <VlossomSplashIcon
            size={ICON_SIZE}
            color={colors.brand.cream}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brand.purple,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedSplash;
