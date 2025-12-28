/**
 * Vlossom Hooks Exports (V7.5.0 Mobile)
 */

// Biometric Authentication
export { useBiometricAuth, getBiometricTypeName } from './useBiometricAuth';
export type { BiometricAuthState, UseBiometricAuthReturn } from './useBiometricAuth';

// Motion System Hooks
export {
  usePrefersReducedMotion,
  useUnfoldMotion,
  useBreatheMotion,
  useSettleMotion,
  useStaggerAnimation,
  useFade,
  MOTION_DURATION,
  MOTION_EASING,
} from './useMotion';
export type {
  UseUnfoldMotionOptions,
  UseUnfoldMotionReturn,
  UseBreatheMotionOptions,
  UseBreatheMotionReturn,
  UseSettleMotionOptions,
  UseSettleMotionReturn,
  UseStaggerAnimationOptions,
  UseStaggerAnimationReturn,
  UseFadeOptions,
} from './useMotion';

// Splash Screen Hooks
export { useReducedMotion } from './useReducedMotion';
export { useAnimatedSplash } from './useAnimatedSplash';
