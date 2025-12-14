'use client';

/**
 * useTheme Hook - Access Theme Tokens in Components
 *
 * Provides access to the current theme tokens and mode switching functions.
 *
 * @example
 * ```tsx
 * const { tokens, mode, toggleMode } = useBrandTheme();
 *
 * return (
 *   <div style={{ backgroundColor: tokens.color.surface }}>
 *     <button onClick={toggleMode}>
 *       {mode === 'light' ? 'Switch to Dark' : 'Switch to Light'}
 *     </button>
 *   </div>
 * );
 * ```
 *
 * @see docs/vlossom/16-ui-components-and-design-system.md Appendix A.4
 */

import { useContext } from 'react';
import { ThemeContext, ThemeContextValue } from './provider';

/**
 * Hook to access theme tokens and mode controls
 * @throws Error if used outside of BrandThemeProvider
 */
export function useBrandTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useBrandTheme must be used within a BrandThemeProvider. ' +
      'Wrap your app with <BrandThemeProvider> in layout.tsx'
    );
  }

  return context;
}

/**
 * Hook to access only the tokens (for components that don't need mode controls)
 */
export function useTokens() {
  const { tokens } = useBrandTheme();
  return tokens;
}

/**
 * Hook to access only the color tokens
 */
export function useColors() {
  const { tokens } = useBrandTheme();
  return tokens.color;
}

/**
 * Hook to access only the theme mode
 */
export function useThemeMode() {
  const { mode, setMode, toggleMode, isSystemPreference, resetToSystemPreference } = useBrandTheme();
  return { mode, setMode, toggleMode, isSystemPreference, resetToSystemPreference };
}
