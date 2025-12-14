/**
 * Theme System - Barrel Export
 *
 * Vlossom Design System Theme Provider and Hooks
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { BrandThemeProvider } from '@/lib/theme';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <BrandThemeProvider>
 *       {children}
 *     </BrandThemeProvider>
 *   );
 * }
 *
 * // In components
 * import { useBrandTheme, useColors } from '@/lib/theme';
 *
 * function MyComponent() {
 *   const { tokens, mode, toggleMode } = useBrandTheme();
 *   // or just colors
 *   const colors = useColors();
 *
 *   return <div style={{ color: colors.primary }}>...</div>;
 * }
 * ```
 */

// Provider
export { BrandThemeProvider, ThemeContext } from './provider';
export type { BrandThemeProviderProps, ThemeContextValue } from './provider';

// Hooks
export { useBrandTheme, useTokens, useColors, useThemeMode } from './use-theme';

// Token types and utilities
export type {
  BrandTokens,
  ThemeMode,
  ColorTokens,
  FontTokens,
  FontSizeTokens,
  FontWeightTokens,
  LineHeightTokens,
  RadiusTokens,
  ShadowTokens,
  SpacingTokens,
  MotionTokens,
  BreakpointTokens,
  ZIndexTokens,
} from './tokens';

export {
  loadTokens,
  getSystemThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
  lightTheme,
  darkTheme,
} from './tokens';
