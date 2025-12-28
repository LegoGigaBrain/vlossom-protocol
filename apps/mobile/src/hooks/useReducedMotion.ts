/**
 * useReducedMotion
 *
 * Hook to check if the user prefers reduced motion.
 * Used to skip animations for accessibility.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns true if the user has enabled "Reduce Motion" in device settings.
 * Animations should be minimized or skipped when this is true.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial setting
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReducedMotion(enabled);
    });

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReducedMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

export default useReducedMotion;
