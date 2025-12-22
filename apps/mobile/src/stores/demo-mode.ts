/**
 * Demo Mode Store (V7.0.0)
 *
 * Zustand store for managing demo mode state.
 * When enabled, stores return mock data instead of calling real APIs.
 * Persisted to AsyncStorage so setting survives app restart.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

interface DemoModeState {
  // Demo mode flag
  isDemoMode: boolean;

  // Initialization state (for async hydration)
  isHydrated: boolean;

  // Actions
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

// ============================================================================
// Store with Persistence
// ============================================================================

export const useDemoModeStore = create<DemoModeState>()(
  persist(
    (set, get) => ({
      isDemoMode: false,
      isHydrated: false,

      /**
       * Toggle demo mode on/off
       */
      toggleDemoMode: () => {
        set((state) => ({ isDemoMode: !state.isDemoMode }));
      },

      /**
       * Explicitly set demo mode
       */
      setDemoMode: (enabled: boolean) => {
        set({ isDemoMode: enabled });
      },

      /**
       * Mark store as hydrated (for async rehydration)
       */
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'vlossom-demo-mode',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isDemoMode: state.isDemoMode }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated when storage is restored
        state?.setHydrated(true);
      },
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select demo mode status
 */
export const selectIsDemoMode = (state: DemoModeState) => state.isDemoMode;

/**
 * Select hydration status (for showing loading states)
 */
export const selectIsHydrated = (state: DemoModeState) => state.isHydrated;

// ============================================================================
// Hook for checking demo mode in other stores
// ============================================================================

/**
 * Get demo mode status synchronously (for use in other stores)
 * Note: This is a snapshot and won't auto-update. Use selectors for reactive updates.
 */
export function getIsDemoMode(): boolean {
  return useDemoModeStore.getState().isDemoMode;
}
