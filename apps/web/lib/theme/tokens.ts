/**
 * Theme Tokens - Design System Token Loader
 *
 * Loads and types the Vlossom design tokens from JSON files.
 * Supports light and dark mode theme switching.
 *
 * @see docs/vlossom/16-ui-components-and-design-system.md
 */

import lightTokens from '@/design/tokens/vlossom-light.json';
import darkTokens from '@/design/tokens/vlossom-dark.json';

// Type definitions derived from token structure
export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  accent: string;
  tertiary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  textMuted: string;
  borderSubtle: string;
  divider: string;
  overlay: string;
  focus: string;
}

export interface FontTokens {
  primary: string;
  display: string;
  mono: string;
}

export interface FontSizeTokens {
  xs: number;
  sm: number;
  base: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface FontWeightTokens {
  light: number;
  regular: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface LineHeightTokens {
  tight: number;
  normal: number;
  relaxed: number;
}

export interface RadiusTokens {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  pill: number;
  circle: string;
}

export interface ShadowTokens {
  none: string;
  soft: string;
  card: string;
  elevated: string;
  modal: string;
}

export interface SpacingTokens {
  '0': number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
}

export interface MotionTokens {
  fast: string;
  medium: string;
  slow: string;
  easeStandard: string;
  easeGentle: string;
  easeIn: string;
  easeOut: string;
}

export interface BreakpointTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export interface ZIndexTokens {
  base: number;
  dropdown: number;
  sticky: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
}

export interface BrandTokens {
  name: string;
  version: string;
  description: string;
  color: ColorTokens;
  font: FontTokens;
  fontSize: FontSizeTokens;
  fontWeight: FontWeightTokens;
  lineHeight: LineHeightTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
  spacing: SpacingTokens;
  motion: MotionTokens;
  breakpoint: BreakpointTokens;
  zIndex: ZIndexTokens;
}

export type ThemeMode = 'light' | 'dark';

/**
 * Load theme tokens based on mode
 */
export function loadTokens(mode: ThemeMode = 'light'): BrandTokens {
  return mode === 'dark' ? (darkTokens as BrandTokens) : (lightTokens as BrandTokens);
}

/**
 * Get system preference for dark mode
 */
export function getSystemThemePreference(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get stored theme preference from localStorage
 */
export function getStoredThemePreference(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('vlossom-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

/**
 * Store theme preference in localStorage
 */
export function setStoredThemePreference(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vlossom-theme', mode);
}

// Export token instances for direct access
export const lightTheme = lightTokens as BrandTokens;
export const darkTheme = darkTokens as BrandTokens;
