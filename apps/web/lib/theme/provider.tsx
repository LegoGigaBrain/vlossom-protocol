'use client';

/**
 * Theme Provider - Brand Theme Context
 *
 * Provides theme tokens and mode switching to all components.
 * Supports light/dark mode with system preference detection.
 *
 * @see docs/vlossom/16-ui-components-and-design-system.md Appendix A.4
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import {
  BrandTokens,
  ThemeMode,
  loadTokens,
  getSystemThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
} from './tokens';

export interface ThemeContextValue {
  /** Current theme tokens */
  tokens: BrandTokens;
  /** Current theme mode */
  mode: ThemeMode;
  /** Set theme mode explicitly */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark mode */
  toggleMode: () => void;
  /** Whether system preference is being used */
  isSystemPreference: boolean;
  /** Reset to system preference */
  resetToSystemPreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface BrandThemeProviderProps {
  children: React.ReactNode;
  /** Default theme mode (overridden by stored preference) */
  defaultMode?: ThemeMode;
  /** Use system preference as default */
  useSystemPreference?: boolean;
}

export function BrandThemeProvider({
  children,
  defaultMode = 'light',
  useSystemPreference = true,
}: BrandThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [tokens, setTokens] = useState<BrandTokens>(loadTokens(defaultMode));
  const [isSystemPreference, setIsSystemPreference] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const stored = getStoredThemePreference();
    if (stored) {
      setModeState(stored);
      setTokens(loadTokens(stored));
      setIsSystemPreference(false);
    } else if (useSystemPreference) {
      const systemPref = getSystemThemePreference();
      setModeState(systemPref);
      setTokens(loadTokens(systemPref));
      setIsSystemPreference(true);
    }
    setMounted(true);
  }, [useSystemPreference]);

  // Listen for system preference changes
  useEffect(() => {
    if (!useSystemPreference || !isSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newMode = e.matches ? 'dark' : 'light';
      setModeState(newMode);
      setTokens(loadTokens(newMode));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [useSystemPreference, isSystemPreference]);

  // Update document class for CSS-based theming
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);
  }, [mode, mounted]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setTokens(loadTokens(newMode));
    setStoredThemePreference(newMode);
    setIsSystemPreference(false);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const resetToSystemPreference = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vlossom-theme');
    }
    const systemPref = getSystemThemePreference();
    setModeState(systemPref);
    setTokens(loadTokens(systemPref));
    setIsSystemPreference(true);
  }, []);

  const value: ThemeContextValue = {
    tokens,
    mode,
    setMode,
    toggleMode,
    isSystemPreference,
    resetToSystemPreference,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
