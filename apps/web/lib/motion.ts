/**
 * Vlossom Motion System (V6.0)
 *
 * TypeScript utilities for programmatic animation control.
 *
 * Motion Philosophy: "Earned, not constant"
 * - Motion only on state change
 * - No idle/looping animations (except loading states)
 * - Every animation has meaning
 *
 * Motion Verbs:
 * - unfold: Organic reveal, like a petal opening
 * - breathe: Subtle scale pulse, life indicator
 * - settle: Gentle ease into place, coming to rest
 */

// =============================================================================
// Duration Constants (in milliseconds)
// =============================================================================

export const MOTION_DURATION = {
  instant: 100,
  micro: 150,
  nav: 200,
  standard: 300,
  growth: 400,
  dramatic: 500,
} as const;

export type MotionDuration = keyof typeof MOTION_DURATION;

// =============================================================================
// Easing Functions (cubic-bezier values)
// =============================================================================

export const MOTION_EASING = {
  /** Overshoot for opening animations - like a petal unfurling */
  unfold: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Symmetric for pulse - natural breathing rhythm */
  breathe: 'cubic-bezier(0.4, 0, 0.6, 1)',
  /** Gentle deceleration - coming to rest */
  settle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  /** Material-like default */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Fast in, slow settle */
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Accelerate out */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

export type MotionEasing = keyof typeof MOTION_EASING;

// =============================================================================
// Animation Class Names
// =============================================================================

export const MOTION_CLASSES = {
  // Unfold variants
  unfold: 'animate-unfold',
  unfoldSubtle: 'animate-unfold-subtle',
  unfoldVertical: 'animate-unfold-vertical',

  // Breathe variants (use sparingly)
  breathe: 'animate-breathe',
  breatheOnce: 'animate-breathe-once',
  breatheGlow: 'animate-breathe-glow',

  // Settle variants
  settle: 'animate-settle',
  settleFade: 'animate-settle-fade',
  settleSlide: 'animate-settle-slide',

  // Growth stages
  growth1: 'animate-growth-1',
  growth2: 'animate-growth-2',
  growth3: 'animate-growth-3',
  growth4: 'animate-growth-4',

  // Utility animations
  petalOpen: 'animate-petal-open',
  fadeOut: 'animate-fade-out',
  checkmark: 'animate-checkmark',
  stagger: 'animate-stagger',

  // Transitions
  transitionInstant: 'transition-instant',
  transitionMicro: 'transition-micro',
  transitionNav: 'transition-nav',
  transitionStandard: 'transition-standard',
  transitionGrowth: 'transition-growth',

  // State-based
  navIndicatorActive: 'nav-indicator-active',
  tabEnter: 'tab-enter',
  tabExit: 'tab-exit',
  cardLift: 'card-lift',
  btnBotanical: 'btn-botanical',
  iconStateChange: 'icon-state-change',
} as const;

export type MotionClass = keyof typeof MOTION_CLASSES;

// =============================================================================
// Motion Verb Helpers
// =============================================================================

/**
 * Get animation classes for "unfold" motion verb
 * Use for: revealing content, opening modals, expanding sections
 */
export function motionUnfold(variant: 'default' | 'subtle' | 'vertical' = 'default'): string {
  switch (variant) {
    case 'subtle':
      return MOTION_CLASSES.unfoldSubtle;
    case 'vertical':
      return MOTION_CLASSES.unfoldVertical;
    default:
      return MOTION_CLASSES.unfold;
  }
}

/**
 * Get animation classes for "breathe" motion verb
 * Use SPARINGLY for: active/alive states, current selection
 * WARNING: Should rarely loop - prefer breatheOnce
 */
export function motionBreathe(variant: 'default' | 'once' | 'glow' = 'once'): string {
  switch (variant) {
    case 'default':
      return MOTION_CLASSES.breathe;
    case 'glow':
      return MOTION_CLASSES.breatheGlow;
    default:
      return MOTION_CLASSES.breatheOnce;
  }
}

/**
 * Get animation classes for "settle" motion verb
 * Use for: content arriving, completion states, navigation destinations
 */
export function motionSettle(variant: 'default' | 'fade' | 'slide' = 'default'): string {
  switch (variant) {
    case 'fade':
      return MOTION_CLASSES.settleFade;
    case 'slide':
      return MOTION_CLASSES.settleSlide;
    default:
      return MOTION_CLASSES.settle;
  }
}

/**
 * Get growth stage animation class
 * Use for: hair health progress, growth meters, achievement reveals
 */
export function motionGrowth(stage: 1 | 2 | 3 | 4): string {
  switch (stage) {
    case 1:
      return MOTION_CLASSES.growth1;
    case 2:
      return MOTION_CLASSES.growth2;
    case 3:
      return MOTION_CLASSES.growth3;
    case 4:
      return MOTION_CLASSES.growth4;
  }
}

// =============================================================================
// Inline Style Helpers
// =============================================================================

export interface TransitionStyle {
  transition: string;
}

/**
 * Generate inline transition style with Vlossom motion tokens
 */
export function createTransition(
  properties: string | string[],
  duration: MotionDuration = 'standard',
  easing: MotionEasing = 'settle'
): TransitionStyle {
  const props = Array.isArray(properties) ? properties : [properties];
  const durationMs = MOTION_DURATION[duration];
  const easingValue = MOTION_EASING[easing];

  return {
    transition: props.map((p) => `${p} ${durationMs}ms ${easingValue}`).join(', '),
  };
}

/**
 * Generate stagger delay style for list items
 * @param index Zero-based index of the item
 * @param baseDelay Base delay in ms (default 50)
 */
export function staggerDelay(index: number, baseDelay = 50): { animationDelay: string } {
  return {
    animationDelay: `${index * baseDelay}ms`,
  };
}

// =============================================================================
// Animation Event Helpers
// =============================================================================

/**
 * Wait for animation to complete on an element
 */
export function waitForAnimation(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };
    element.addEventListener('animationend', handleAnimationEnd);
  });
}

/**
 * Wait for transition to complete on an element
 */
export function waitForTransition(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handleTransitionEnd = () => {
      element.removeEventListener('transitionend', handleTransitionEnd);
      resolve();
    };
    element.addEventListener('transitionend', handleTransitionEnd);
  });
}

// =============================================================================
// Reduced Motion Check
// =============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate duration based on user preferences
 * Returns 0 if user prefers reduced motion
 */
export function getAccessibleDuration(duration: MotionDuration): number {
  if (prefersReducedMotion()) return 0;
  return MOTION_DURATION[duration];
}

// =============================================================================
// React Hooks (Optional - for component integration)
// =============================================================================

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to check for reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

/**
 * Hook to apply animation class temporarily
 * Removes class after animation completes
 */
export function useAnimationClass(
  ref: React.RefObject<HTMLElement>,
  animationClass: string,
  trigger: boolean
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !trigger) return;

    element.classList.add(animationClass);

    const handleAnimationEnd = () => {
      element.classList.remove(animationClass);
    };

    element.addEventListener('animationend', handleAnimationEnd);
    return () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      element.classList.remove(animationClass);
    };
  }, [ref, animationClass, trigger]);
}

/**
 * Hook for staggered list animation
 * Returns a function to get animation props for each item
 */
export function useStaggerAnimation(itemCount: number, baseDelay = 50) {
  const prefersReduced = usePrefersReducedMotion();

  const getItemProps = useCallback(
    (index: number) => {
      if (prefersReduced) {
        return {};
      }
      return {
        className: MOTION_CLASSES.settle,
        style: staggerDelay(index, baseDelay),
      };
    },
    [baseDelay, prefersReduced]
  );

  return { getItemProps };
}

// =============================================================================
// Framer Motion Variants (for advanced use cases)
// =============================================================================

/**
 * Framer Motion variants following Vlossom motion philosophy
 * Use with framer-motion library if installed
 */
export const framerVariants = {
  unfold: {
    initial: { opacity: 0, scale: 0.8, rotate: -5 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
  settle: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  fadeOut: {
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
} as const;
