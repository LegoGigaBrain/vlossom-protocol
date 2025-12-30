/**
 * Vlossom Theme Provider (V6.0 Mobile)
 *
 * Provides theme context and hooks for React Native components
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import { theme, colors, typography, spacing, borderRadius, shadows } from './tokens';

// =============================================================================
// Theme Types
// =============================================================================

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
}

// =============================================================================
// Theme Context
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// Theme Provider
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultColorScheme?: ColorScheme;
}

export function ThemeProvider({ children, defaultColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    defaultColorScheme || systemColorScheme || 'light'
  );

  // Follow system preference if not overridden
  useEffect(() => {
    if (!defaultColorScheme && systemColorScheme) {
      setColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, defaultColorScheme]);

  const toggleColorScheme = () => {
    setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Build color palette based on scheme
  // Use the base colors type and override with dark theme values when needed
  const themeColors = colorScheme === 'dark' ? {
    ...colors,
    background: colors.dark.background,
    surface: colors.dark.surface,
    text: colors.dark.text,
    border: colors.dark.border,
  } as unknown as typeof colors : colors;

  const value: ThemeContextValue = {
    colorScheme,
    isDark: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    colors: themeColors,
    typography,
    spacing,
    borderRadius,
    shadows,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// useTheme Hook
// =============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// =============================================================================
// useThemedStyles Hook
// =============================================================================

type StyleCreator<T> = (theme: ThemeContextValue) => T;

export function useThemedStyles<T>(styleCreator: StyleCreator<T>): T {
  const theme = useTheme();
  return styleCreator(theme);
}

// =============================================================================
// Common Style Utilities
// =============================================================================

export const createStyles = StyleSheet.create;

// Typography presets
export const textStyles = StyleSheet.create({
  display: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: typography.fontWeight.bold,
  },
  h1: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h1,
    lineHeight: typography.lineHeight.h1,
    fontWeight: typography.fontWeight.bold,
  },
  h2: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h2,
    lineHeight: typography.lineHeight.h2,
    fontWeight: typography.fontWeight.semibold,
  },
  h3: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.h3,
    lineHeight: typography.lineHeight.h3,
    fontWeight: typography.fontWeight.semibold,
  },
  h4: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: typography.fontWeight.semibold,
  },
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
    fontWeight: typography.fontWeight.regular,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    lineHeight: typography.lineHeight.bodySmall,
    fontWeight: typography.fontWeight.regular,
  },
  caption: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.fontWeight.regular,
  },
  button: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.button,
    lineHeight: typography.lineHeight.bodySmall,
    fontWeight: typography.fontWeight.medium,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.label,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.fontWeight.medium,
  },
  mono: {
    fontFamily: typography.fontFamily.mono,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: typography.fontWeight.regular,
  },
});

// Export theme for direct access
export { theme };
