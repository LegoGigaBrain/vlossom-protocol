/**
 * Auth Store (V6.8.0)
 *
 * Zustand store for managing authentication state.
 * Handles login, signup, logout, and user session management.
 */

import { create } from 'zustand';
import {
  login as loginAPI,
  signup as signupAPI,
  logout as logoutAPI,
  getMe,
  updateProfile as updateProfileAPI,
  type User,
  type LoginRequest,
  type SignupRequest,
  type UpdateProfileRequest,
  isAuthError,
  isAccountLockedError,
} from '../api/auth';
import { getAuthToken, clearTokens } from '../api/client';

// ============================================================================
// Types
// ============================================================================

interface AuthState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Auth operation states
  loginLoading: boolean;
  loginError: string | null;
  signupLoading: boolean;
  signupError: string | null;
  logoutLoading: boolean;

  // Profile update state
  updateLoading: boolean;
  updateError: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (request: LoginRequest) => Promise<boolean>;
  signup: (request: SignupRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (request: UpdateProfileRequest) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearErrors: () => void;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  loginLoading: false,
  loginError: null,
  signupLoading: false,
  signupError: null,
  logoutLoading: false,

  updateLoading: false,
  updateError: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  /**
   * Initialize auth state on app start
   * Checks for existing token and fetches user if authenticated
   */
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    try {
      const token = await getAuthToken();

      if (token) {
        // Token exists, try to fetch user
        try {
          const user = await getMe();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          // Token is invalid or expired
          await clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      } else {
        // No token
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      // Error reading token
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Login with email and password
   * Returns true on success, false on failure
   */
  login: async (request: LoginRequest) => {
    set({ loginLoading: true, loginError: null });

    try {
      const response = await loginAPI(request);

      set({
        user: response.user,
        isAuthenticated: true,
        loginLoading: false,
        loginError: null,
      });

      return true;
    } catch (error) {
      let errorMessage = 'Failed to login. Please try again.';

      if (isAccountLockedError(error)) {
        const minutes = Math.ceil((error as { retryAfter: number }).retryAfter / 60);
        errorMessage = `Account locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      } else if (error instanceof Error) {
        // Check for common error codes
        if (error.message.includes('INVALID_CREDENTIALS')) {
          errorMessage = 'Invalid email or password.';
        } else if (error.message.includes('ACCOUNT_LOCKED')) {
          errorMessage = 'Account temporarily locked. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        loginLoading: false,
        loginError: errorMessage,
      });

      return false;
    }
  },

  /**
   * Create a new account
   * Returns true on success, false on failure
   */
  signup: async (request: SignupRequest) => {
    set({ signupLoading: true, signupError: null });

    try {
      const response = await signupAPI(request);

      set({
        user: response.user,
        isAuthenticated: true,
        signupLoading: false,
        signupError: null,
      });

      return true;
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('EMAIL_EXISTS')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('WEAK_PASSWORD')) {
          errorMessage = 'Password must be at least 8 characters.';
        } else if (error.message.includes('INVALID_ROLE')) {
          errorMessage = 'Invalid account type selected.';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        signupLoading: false,
        signupError: errorMessage,
      });

      return false;
    }
  },

  /**
   * Logout and clear all tokens
   */
  logout: async () => {
    set({ logoutLoading: true });

    await logoutAPI();

    set({
      ...initialState,
      isInitialized: true, // Keep initialized to prevent re-init
    });
  },

  /**
   * Update user profile
   * Returns true on success, false on failure
   */
  updateProfile: async (request: UpdateProfileRequest) => {
    set({ updateLoading: true, updateError: null });

    try {
      const user = await updateProfileAPI(request);

      set({
        user,
        updateLoading: false,
        updateError: null,
      });

      return true;
    } catch (error) {
      let errorMessage = 'Failed to update profile.';

      if (error instanceof Error) {
        if (error.message.includes('EMAIL_EXISTS')) {
          errorMessage = 'This email is already in use.';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        updateLoading: false,
        updateError: errorMessage,
      });

      return false;
    }
  },

  /**
   * Refresh user data from server
   */
  refreshUser: async () => {
    const state = get();
    if (!state.isAuthenticated) return;

    try {
      const user = await getMe();
      set({ user });
    } catch (error) {
      if (isAuthError(error)) {
        // Token is invalid, log out
        await get().logout();
      }
    }
  },

  /**
   * Clear all error states
   */
  clearErrors: () => {
    set({
      loginError: null,
      signupError: null,
      updateError: null,
    });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
