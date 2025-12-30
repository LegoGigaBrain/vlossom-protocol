/**
 * useMotion - Motion Hooks (V7.4)
 *
 * Provides animation hooks for Vlossom motion system:
 * - useSettleMotion: Gentle arrival animation (cards, list items)
 * - useUnfoldMotion: Expand/reveal animation (dialogs, panels)
 * - useBreatheMotion: Subtle pulse animation (loading, emphasis)
 * - useStaggerAnimation: Staggered list animations
 * - useFade: Simple fade in/out
 *
 * All hooks respect reduced motion preferences.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Animated, ViewStyle, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

// Motion duration tokens (in ms)
export const MOTION_DURATION = {
  instant: 100,
  micro: 150,
  nav: 200,
  standard: 300,
  growth: 400,
  dramatic: 500,
} as const;

// Motion easing curves
export const MOTION_EASING = {
  unfold: Easing.out(Easing.back(1.1)), // Slight overshoot
  breathe: Easing.inOut(Easing.ease), // Symmetric
  settle: Easing.out(Easing.quad), // Gentle deceleration
  default: Easing.inOut(Easing.ease),
} as const;

// Type definitions for options and returns
export interface UseUnfoldMotionOptions {
  autoPlay?: boolean;
  duration?: number;
  delay?: number;
}

export interface UseUnfoldMotionReturn {
  style: Animated.WithAnimatedObject<ViewStyle>;
  play: () => void;
  reset: () => void;
}

export interface UseBreatheMotionOptions {
  autoPlay?: boolean;
  duration?: number;
}

export interface UseBreatheMotionReturn {
  style: Animated.WithAnimatedObject<ViewStyle>;
  play: () => void;
  reset: () => void;
  stop: () => void;
}

export interface UseSettleMotionOptions {
  autoPlay?: boolean;
  duration?: number;
  delay?: number;
}

export interface UseSettleMotionReturn {
  style: Animated.WithAnimatedObject<ViewStyle>;
  play: () => void;
  reset: () => void;
}

export interface UseStaggerAnimationOptions {
  itemCount: number;
  staggerDelay?: number;
  autoPlay?: boolean;
}

export interface UseStaggerAnimationReturn {
  getStyle: (index: number) => Animated.WithAnimatedObject<ViewStyle>;
  play: () => void;
  reset: () => void;
}

export interface UseFadeOptions {
  autoPlay?: boolean;
  duration?: number;
  delay?: number;
  initialOpacity?: number;
}

/**
 * Returns true if user prefers reduced motion (alias for useReducedMotion)
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion();
}

/**
 * Settle Motion - Gentle arrival into place
 * Used for cards, list items, search results
 *
 * Animation: Slight translate up + fade in
 */
export function useSettleMotion(options: UseSettleMotionOptions = {}): UseSettleMotionReturn {
  const { autoPlay = false, duration = MOTION_DURATION.standard, delay = 0 } = options;
  const reducedMotion = useReducedMotion();

  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 12)).current;

  const play = useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: MOTION_EASING.settle,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: MOTION_EASING.settle,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion, duration, delay, opacity, translateY]);

  const reset = useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
    } else {
      opacity.setValue(0);
      translateY.setValue(12);
    }
  }, [reducedMotion, opacity, translateY]);

  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  return {
    style: {
      opacity,
      transform: [{ translateY }],
    },
    play,
    reset,
  };
}

/**
 * Unfold Motion - Expand/reveal animation
 * Used for dialogs, sheets, expanding panels
 *
 * Animation: Scale up from center + fade in
 */
export function useUnfoldMotion(options: UseUnfoldMotionOptions = {}): UseUnfoldMotionReturn {
  const { autoPlay = false, duration = MOTION_DURATION.growth, delay = 0 } = options;
  const reducedMotion = useReducedMotion();

  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.95)).current;

  const play = useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: MOTION_EASING.unfold,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion, duration, delay, opacity, scale]);

  const reset = useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      scale.setValue(1);
    } else {
      opacity.setValue(0);
      scale.setValue(0.95);
    }
  }, [reducedMotion, opacity, scale]);

  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  return {
    style: {
      opacity,
      transform: [{ scale }],
    },
    play,
    reset,
  };
}

/**
 * Breathe Motion - Subtle pulse animation
 * Used for loading states, emphasis, breathing indicators
 *
 * Animation: Gentle scale oscillation
 */
export function useBreatheMotion(options: UseBreatheMotionOptions = {}): UseBreatheMotionReturn {
  const { autoPlay = false, duration = MOTION_DURATION.dramatic } = options;
  const reducedMotion = useReducedMotion();

  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    scale.setValue(1);
  }, [scale]);

  const play = useCallback(() => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration,
          easing: MOTION_EASING.breathe,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration,
          easing: MOTION_EASING.breathe,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();
  }, [reducedMotion, duration, scale]);

  const reset = useCallback(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (autoPlay) {
      play();
    }
    return () => {
      stop();
    };
  }, [autoPlay, play, stop]);

  return {
    style: {
      transform: [{ scale }],
    },
    play,
    reset,
    stop,
  };
}

/**
 * Stagger Animation - Animate list items with staggered delay
 * Used for lists, grids, search results
 */
export function useStaggerAnimation(options: UseStaggerAnimationOptions): UseStaggerAnimationReturn {
  const { itemCount, staggerDelay = 50, autoPlay = false } = options;
  const reducedMotion = useReducedMotion();

  const animations = useRef<Animated.Value[]>(
    Array.from({ length: itemCount }, () => new Animated.Value(reducedMotion ? 1 : 0))
  ).current;

  const play = useCallback(() => {
    if (reducedMotion) {
      animations.forEach((anim) => anim.setValue(1));
      return;
    }

    const staggeredAnimations = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: MOTION_DURATION.standard,
        delay: index * staggerDelay,
        easing: MOTION_EASING.settle,
        useNativeDriver: true,
      })
    );

    Animated.parallel(staggeredAnimations).start();
  }, [reducedMotion, animations, staggerDelay]);

  const reset = useCallback(() => {
    animations.forEach((anim) => {
      anim.setValue(reducedMotion ? 1 : 0);
    });
  }, [reducedMotion, animations]);

  const getStyle = useCallback(
    (index: number): Animated.WithAnimatedObject<ViewStyle> => {
      const anim = animations[index] || new Animated.Value(1);
      return {
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: reducedMotion ? [0, 0] : [12, 0],
            }),
          },
        ],
      };
    },
    [animations, reducedMotion]
  );

  useEffect(() => {
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play]);

  return {
    getStyle,
    play,
    reset,
  };
}

/**
 * Simple fade animation
 * Used for basic show/hide transitions
 */
export function useFade(options: UseFadeOptions = {}): {
  style: Animated.WithAnimatedObject<ViewStyle>;
  fadeIn: () => void;
  fadeOut: () => void;
  reset: () => void;
} {
  const { autoPlay = false, duration = MOTION_DURATION.standard, delay = 0, initialOpacity = 0 } = options;
  const reducedMotion = useReducedMotion();

  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : initialOpacity)).current;

  const fadeIn = useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }

    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: MOTION_EASING.default,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, duration, delay, opacity]);

  const fadeOut = useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(0);
      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration,
      easing: MOTION_EASING.default,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, duration, opacity]);

  const reset = useCallback(() => {
    opacity.setValue(reducedMotion ? 1 : initialOpacity);
  }, [reducedMotion, initialOpacity, opacity]);

  useEffect(() => {
    if (autoPlay) {
      fadeIn();
    }
  }, [autoPlay, fadeIn]);

  return {
    style: { opacity },
    fadeIn,
    fadeOut,
    reset,
  };
}
