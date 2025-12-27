/**
 * Session Store (V7.3.0)
 *
 * Zustand store for managing real-time session tracking.
 * Handles SSE connections, polling fallback, and session progress.
 *
 * Features:
 * - SSE connection management with automatic reconnection
 * - Polling fallback when SSE unavailable
 * - Session progress tracking (ETA, progress %, location)
 * - Optimistic updates for stylist actions
 *
 * Note: Uses polling as primary method since React Native doesn't have
 * native EventSource support. SSE can be added via react-native-sse
 * package if real-time updates become critical.
 */

import { create } from 'zustand';
import { apiRequest, getApiUrl, getAuthToken } from '../api/client';
import { getIsDemoMode } from './demo-mode';

// ============================================================================
// Types
// ============================================================================

export type SessionState = 'not_started' | 'started' | 'in_progress' | 'complete';

export interface SessionProgress {
  bookingId: string;
  etaMinutes?: number;
  progressPercent: number;
  currentStep?: string;
  lat?: number;
  lng?: number;
  lastUpdate: string;
}

export interface ActiveSession {
  booking: {
    id: string;
    status: string;
    serviceType: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    locationType: string;
    locationAddress: string;
  };
  role: 'customer' | 'stylist';
  otherParty: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  hasActiveProgress: boolean;
  progress: SessionProgress | null;
}

interface SessionStore {
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  connectionError: string | null;

  // Session data
  activeBookingId: string | null;
  sessionProgress: SessionProgress | null;
  sessionState: SessionState;
  activeSessions: ActiveSession[];

  // Polling state
  pollingInterval: ReturnType<typeof setInterval> | null;
  isPolling: boolean;

  // Loading states
  isLoadingProgress: boolean;
  isLoadingSessions: boolean;

  // Demo mode interval
  demoInterval: ReturnType<typeof setInterval> | null;

  // Actions - Connection
  connect: (bookingId: string) => void;
  disconnect: () => void;
  startPolling: (bookingId: string) => void;
  stopPolling: () => void;

  // Actions - Data
  fetchSessionProgress: (bookingId: string) => Promise<void>;
  fetchActiveSessions: () => Promise<void>;

  // Actions - Stylist controls
  markArrived: (bookingId: string) => Promise<boolean>;
  updateProgress: (bookingId: string, progress: Partial<SessionProgress>) => Promise<boolean>;
  endSession: (bookingId: string) => Promise<boolean>;

  // Actions - Customer actions
  markCustomerArrived: (bookingId: string) => Promise<boolean>;

  // Internal actions
  reset: () => void;
}

// ============================================================================
// Mock Data for Demo Mode
// ============================================================================

const MOCK_PROGRESS: SessionProgress = {
  bookingId: 'mock-booking-1',
  etaMinutes: 15,
  progressPercent: 35,
  currentStep: 'Washing',
  lastUpdate: new Date().toISOString(),
};

const MOCK_ACTIVE_SESSION: ActiveSession = {
  booking: {
    id: 'mock-booking-1',
    status: 'IN_PROGRESS',
    serviceType: 'Braiding',
    scheduledStartTime: new Date().toISOString(),
    scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    locationType: 'CUSTOMER_HOME',
    locationAddress: '123 Main Street, Johannesburg',
  },
  role: 'customer',
  otherParty: {
    id: 'mock-stylist-1',
    displayName: 'Thando M.',
    avatarUrl: null,
  },
  hasActiveProgress: true,
  progress: MOCK_PROGRESS,
};

// ============================================================================
// Constants
// ============================================================================

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000;
const POLLING_INTERVAL = 10000; // 10 seconds

// ============================================================================
// Store
// ============================================================================

const initialState = {
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  connectionError: null,
  activeBookingId: null,
  sessionProgress: null,
  sessionState: 'not_started' as SessionState,
  activeSessions: [],
  pollingInterval: null,
  isPolling: false,
  isLoadingProgress: false,
  isLoadingSessions: false,
  demoInterval: null,
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initialState,

  /**
   * Connect to session tracking for a booking
   * Uses polling since React Native doesn't have native EventSource
   */
  connect: (bookingId: string) => {
    const state = get();

    // Already connected to this booking
    if (state.activeBookingId === bookingId && (state.isConnected || state.isPolling)) {
      return;
    }

    // Disconnect from previous connection
    get().disconnect();

    // Demo mode - simulate connection with mock updates
    if (getIsDemoMode()) {
      set({
        isConnected: true,
        isReconnecting: false,
        connectionError: null,
        activeBookingId: bookingId,
        sessionProgress: { ...MOCK_PROGRESS, bookingId },
        sessionState: 'in_progress',
      });

      // Simulate progress updates every 15 seconds
      const demoInterval = setInterval(() => {
        const currentState = get();
        if (!currentState.isConnected || currentState.activeBookingId !== bookingId) {
          clearInterval(demoInterval);
          return;
        }

        const currentProgress = currentState.sessionProgress?.progressPercent ?? 35;
        if (currentProgress < 100) {
          set({
            sessionProgress: {
              ...currentState.sessionProgress!,
              progressPercent: Math.min(currentProgress + 5, 100),
              etaMinutes: Math.max((currentState.sessionProgress?.etaMinutes ?? 15) - 2, 0),
              lastUpdate: new Date().toISOString(),
            },
            sessionState: currentProgress + 5 >= 100 ? 'complete' : 'in_progress',
          });
        }
      }, 15000);

      set({ demoInterval });
      return;
    }

    // Production mode - use polling
    set({
      activeBookingId: bookingId,
      isConnected: true,
    });

    get().startPolling(bookingId);
  },

  /**
   * Disconnect from session tracking
   */
  disconnect: () => {
    const state = get();

    // Clear demo interval
    if (state.demoInterval) {
      clearInterval(state.demoInterval);
    }

    // Stop polling
    get().stopPolling();

    set({
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      connectionError: null,
      demoInterval: null,
    });
  },

  /**
   * Start polling fallback
   */
  startPolling: (bookingId: string) => {
    const state = get();

    // Already polling
    if (state.pollingInterval) {
      return;
    }

    // Initial fetch
    get().fetchSessionProgress(bookingId);

    const interval = setInterval(() => {
      get().fetchSessionProgress(bookingId);
    }, POLLING_INTERVAL);

    set({
      pollingInterval: interval,
      isPolling: true,
      activeBookingId: bookingId,
    });
  },

  /**
   * Stop polling
   */
  stopPolling: () => {
    const state = get();

    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
    }

    set({
      pollingInterval: null,
      isPolling: false,
    });
  },

  /**
   * Fetch session progress via REST API (polling fallback)
   */
  fetchSessionProgress: async (bookingId: string) => {
    if (getIsDemoMode()) {
      set({
        sessionProgress: { ...MOCK_PROGRESS, bookingId },
        sessionState: 'in_progress',
      });
      return;
    }

    set({ isLoadingProgress: true });

    try {
      const response = await apiRequest<{
        bookingId: string;
        status: string;
        hasActiveSession: boolean;
        progress: SessionProgress | null;
      }>(`/api/v1/bookings/${bookingId}/session/progress`);

      if (response.hasActiveSession && response.progress) {
        const progress = response.progress;
        let sessionState: SessionState = 'not_started';

        if (progress.progressPercent === 100) {
          sessionState = 'complete';
        } else if (progress.progressPercent > 0) {
          sessionState = 'in_progress';
        } else if (progress.currentStep) {
          sessionState = 'started';
        }

        set({
          sessionProgress: progress,
          sessionState,
          isLoadingProgress: false,
        });
      } else {
        set({
          sessionProgress: null,
          sessionState: 'not_started',
          isLoadingProgress: false,
        });
      }
    } catch (error) {
      set({ isLoadingProgress: false });
    }
  },

  /**
   * Fetch all active sessions for the user
   */
  fetchActiveSessions: async () => {
    if (getIsDemoMode()) {
      set({
        activeSessions: [MOCK_ACTIVE_SESSION],
        isLoadingSessions: false,
      });
      return;
    }

    set({ isLoadingSessions: true });

    try {
      const response = await apiRequest<{
        sessions: ActiveSession[];
        count: number;
      }>('/api/v1/bookings/active-sessions');

      set({
        activeSessions: response.sessions,
        isLoadingSessions: false,
      });
    } catch (error) {
      set({
        activeSessions: [],
        isLoadingSessions: false,
      });
    }
  },

  /**
   * Stylist: Mark as arrived
   */
  markArrived: async (bookingId: string) => {
    if (getIsDemoMode()) {
      set({
        sessionProgress: {
          bookingId,
          etaMinutes: 0,
          progressPercent: 0,
          currentStep: 'Arrived',
          lastUpdate: new Date().toISOString(),
        },
        sessionState: 'started',
      });
      return true;
    }

    try {
      await apiRequest(`/api/v1/bookings/${bookingId}/session/arrived`, {
        method: 'POST',
      });

      set({
        sessionProgress: {
          bookingId,
          etaMinutes: 0,
          progressPercent: 0,
          currentStep: 'Arrived',
          lastUpdate: new Date().toISOString(),
        },
        sessionState: 'started',
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Stylist: Update progress
   */
  updateProgress: async (bookingId: string, progress: Partial<SessionProgress>) => {
    if (getIsDemoMode()) {
      const current = get().sessionProgress;
      set({
        sessionProgress: {
          ...current!,
          ...progress,
          bookingId,
          lastUpdate: new Date().toISOString(),
        },
        sessionState:
          progress.progressPercent === 100 ? 'complete' : 'in_progress',
      });
      return true;
    }

    try {
      await apiRequest(`/api/v1/bookings/${bookingId}/session/progress`, {
        method: 'POST',
        body: progress,
      });

      // Optimistic update
      const current = get().sessionProgress;
      set({
        sessionProgress: {
          ...current!,
          ...progress,
          bookingId,
          lastUpdate: new Date().toISOString(),
        },
        sessionState:
          progress.progressPercent === 100 ? 'complete' : 'in_progress',
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Stylist: End session
   */
  endSession: async (bookingId: string) => {
    if (getIsDemoMode()) {
      set({
        sessionProgress: null,
        sessionState: 'complete',
      });
      return true;
    }

    try {
      await apiRequest(`/api/v1/bookings/${bookingId}/session/end`, {
        method: 'POST',
      });

      set({
        sessionProgress: null,
        sessionState: 'complete',
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Customer: Mark as arrived
   */
  markCustomerArrived: async (bookingId: string) => {
    if (getIsDemoMode()) {
      return true;
    }

    try {
      await apiRequest(`/api/v1/bookings/${bookingId}/session/customer-arrived`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Reset store
   */
  reset: () => {
    const state = get();
    if (state.demoInterval) {
      clearInterval(state.demoInterval);
    }
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval);
    }
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectIsConnected = (state: SessionStore) => state.isConnected;
export const selectSessionProgress = (state: SessionStore) => state.sessionProgress;
export const selectSessionState = (state: SessionStore) => state.sessionState;
export const selectActiveSessions = (state: SessionStore) => state.activeSessions;
export const selectIsPolling = (state: SessionStore) => state.isPolling;
export const selectConnectionError = (state: SessionStore) => state.connectionError;
