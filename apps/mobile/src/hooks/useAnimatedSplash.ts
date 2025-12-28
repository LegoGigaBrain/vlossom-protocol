/**
 * useAnimatedSplash
 *
 * Hook to orchestrate the animated splash screen sequence.
 * Animation: fade in + scale (0-300ms) -> breathe pulse (300-600ms) -> hold + fade out (600-1000ms)
 */

import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { motion } from '../styles/tokens';

interface UseAnimatedSplashOptions {
  /** Skip animations (for reduced motion) */
  reducedMotion?: boolean;
  /** Callback when splash animation completes */
  onComplete?: () => void;
  /** Minimum display time in ms (default: 1000) */
  minDuration?: number;
}

interface UseAnimatedSplashResult {
  /** Animated style for the container */
  containerStyle: ReturnType<typeof useAnimatedStyle>;
  /** Animated style for the icon */
  iconStyle: ReturnType<typeof useAnimatedStyle>;
  /** Whether the splash is visible */
  isVisible: boolean;
  /** Start the exit animation */
  startExit: () => void;
}

// Convert cubic bezier to Reanimated easing
const unfoldEasing = Easing.bezier(
  motion.easing.unfold.x1,
  motion.easing.unfold.y1,
  motion.easing.unfold.x2,
  motion.easing.unfold.y2
);

const breatheEasing = Easing.bezier(
  motion.easing.breathe.x1,
  motion.easing.breathe.y1,
  motion.easing.breathe.x2,
  motion.easing.breathe.y2
);

const settleEasing = Easing.bezier(
  motion.easing.settle.x1,
  motion.easing.settle.y1,
  motion.easing.settle.x2,
  motion.easing.settle.y2
);

export function useAnimatedSplash(
  options: UseAnimatedSplashOptions = {}
): UseAnimatedSplashResult {
  const { reducedMotion = false, onComplete, minDuration = 1000 } = options;

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(reducedMotion ? 1 : 0.8);
  const isVisible = useSharedValue(true);

  // Start entrance animation on mount
  useEffect(() => {
    if (reducedMotion) {
      // Reduced motion: simple fade
      opacity.value = withTiming(1, {
        duration: motion.duration.standard,
        easing: settleEasing,
      });
    } else {
      // Full animation sequence
      // Phase 1: Fade in + scale up (0-300ms)
      opacity.value = withTiming(1, {
        duration: motion.duration.standard,
        easing: unfoldEasing,
      });

      scale.value = withSequence(
        // Unfold: 0.8 -> 1.0
        withTiming(1, {
          duration: motion.duration.standard,
          easing: unfoldEasing,
        }),
        // Breathe: 1.0 -> 1.02 -> 1.0
        withTiming(1.02, {
          duration: motion.duration.nav,
          easing: breatheEasing,
        }),
        withTiming(1, {
          duration: motion.duration.nav,
          easing: breatheEasing,
        })
      );
    }
  }, [reducedMotion, opacity, scale]);

  // Start exit animation
  const startExit = useCallback(() => {
    const exitDuration = reducedMotion
      ? motion.duration.standard
      : motion.duration.growth;

    opacity.value = withTiming(
      0,
      {
        duration: exitDuration,
        easing: settleEasing,
      },
      (finished) => {
        if (finished) {
          isVisible.value = false;
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      }
    );

    if (!reducedMotion) {
      scale.value = withTiming(1.05, {
        duration: exitDuration,
        easing: settleEasing,
      });
    }
  }, [reducedMotion, opacity, scale, isVisible, onComplete]);

  // Auto-start exit after minimum duration
  useEffect(() => {
    const timer = setTimeout(() => {
      startExit();
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, startExit]);

  // Container animated style (for opacity)
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Icon animated style (for scale)
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    containerStyle,
    iconStyle,
    isVisible: true, // Will be read from component state
    startExit,
  };
}

export default useAnimatedSplash;
