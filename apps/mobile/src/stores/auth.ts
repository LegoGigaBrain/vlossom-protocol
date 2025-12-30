/**
 * Auth Store (V7.1.0)
 *
 * Zustand store for managing authentication state.
 * Handles login, signup, logout, and user session management.
 * V7.1: Added multi-role support with addRole action
 */

import { create } from 'zustand';
import {
  login as loginAPI,
  signup as signupAPI,
  logout as logoutAPI,
  getMe,
  updateProfile as updateProfileAPI,
  addRole as addRoleAPI,
  changePassword as changePasswordAPI,
  type User,
  type LoginRequest,
  type SignupRequest,
  type UpdateProfileRequest,
  type ChangePasswordRequest,
  type PartnerRole,
  isAuthError,
  isAccountLockedError,
} from '../api/auth';
import { getAuthToken, clearTokens } from '../api/client';
import { getIsDemoMode } from './demo-mode';
import { MOCK_USER } from '../data/mock-data';

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

  // V7.1: Role management state
  addRoleLoading: boolean;
  addRoleError: string | null;

  // V7.1: Password change state
  changePasswordLoading: boolean;
  changePasswordError: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (request: LoginRequest) => Promise<boolean>;
  signup: (request: SignupRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (request: UpdateProfileRequest) => Promise<boolean>;
  addRole: (role: PartnerRole) => Promise<boolean>; // V7.1
  changePassword: (request: ChangePasswordRequest) => Promise<boolean>; // V7.1
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

  // V7.1: Role management
  addRoleLoading: false,
  addRoleError: null,

  // V7.1: Password change
  changePasswordLoading: false,
  changePasswordError: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  /**
   * Initialize auth state on app start
   * Checks for existing token and fetches user if authenticated
   * V7.2.0: Demo mode skips token check and initializes without auth
   */
  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    // V7.2.0: In demo mode, don't require authentication
    // User can log in with demo mode to get mock user
    if (getIsDemoMode()) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

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
   * V7.2.0: Demo mode returns mock user without API call
   */
  login: async (request: LoginRequest) => {
    set({ loginLoading: true, loginError: null });

    // V7.2.0: In demo mode, return mock user immediately
    if (getIsDemoMode()) {
      // Simulate a small delay for realism
      await new Promise((resolve) => setTimeout(resolve, 500));

      set({
        user: MOCK_USER,
        isAuthenticated: true,
        loginLoading: false,
        loginError: null,
      });

      return true;
    }

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
   * V7.2.0: Demo mode returns mock user without API call
   */
  signup: async (request: SignupRequest) => {
    set({ signupLoading: true, signupError: null });

    // V7.2.0: In demo mode, return mock user immediately
    if (getIsDemoMode()) {
      // Simulate a small delay for realism
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a mock user with the signup data
      const mockSignupUser = {
        ...MOCK_USER,
        displayName: request.displayName || 'Demo User',
        email: request.email,
        role: request.role as typeof MOCK_USER.role,
        roles: [request.role] as typeof MOCK_USER.roles,
      };

      set({
        user: mockSignupUser,
        isAuthenticated: true,
        signupLoading: false,
        signupError: null,
      });

      return true;
    }

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
   * V7.1: Add a new role to the user's account (partner onboarding)
   * Returns true on success, false on failure
   */
  addRole: async (role: PartnerRole) => {
    set({ addRoleLoading: true, addRoleError: null });

    try {
      const response = await addRoleAPI({ role });

      set({
        user: response.user,
        addRoleLoading: false,
        addRoleError: null,
      });

      return true;
    } catch (error) {
      let errorMessage = 'Failed to add role. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('DUPLICATE_ENTRY')) {
          errorMessage = `You already have the ${role} role.`;
        } else if (error.message.includes('INVALID_ROLE')) {
          errorMessage = 'Invalid role selected.';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        addRoleLoading: false,
        addRoleError: errorMessage,
      });

      return false;
    }
  },

  /**
   * V7.1: Change user password
   * Returns true on success, false on failure
   */
  changePassword: async (request: ChangePasswordRequest) => {
    set({ changePasswordLoading: true, changePasswordError: null });

    try {
      await changePasswordAPI(request);

      set({
        changePasswordLoading: false,
        changePasswordError: null,
      });

      return true;
    } catch (error) {
      let errorMessage = 'Failed to change password. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('INVALID_PASSWORD')) {
          errorMessage = 'Current password is incorrect.';
        } else if (error.message.includes('WEAK_PASSWORD')) {
          errorMessage = 'New password must be at least 8 characters with uppercase, lowercase, and number.';
        } else if (error.message.includes('SAME_PASSWORD')) {
          errorMessage = 'New password must be different from current password.';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        changePasswordLoading: false,
        changePasswordError: errorMessage,
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
      addRoleError: null,
      changePasswordError: null,
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

// V7.1: Role selectors
// V7.2.0: Fixed to use nullish coalescing and ensure array is always returned
export const selectUserRoles = (state: AuthState): string[] => state.user?.roles ?? [];
export const selectHasRole = (role: string) => (state: AuthState) =>
  Array.isArray(state.user?.roles) && state.user.roles.includes(role as any);
export const selectIsStylist = (state: AuthState) =>
  state.user?.roles?.includes('STYLIST') || false;
export const selectIsPropertyOwner = (state: AuthState) =>
  state.user?.roles?.includes('PROPERTY_OWNER') || false;
export const selectAddRoleLoading = (state: AuthState) => state.addRoleLoading;
export const selectAddRoleError = (state: AuthState) => state.addRoleError;

// V7.1: Password change selectors
export const selectChangePasswordLoading = (state: AuthState) => state.changePasswordLoading;
export const selectChangePasswordError = (state: AuthState) => state.changePasswordError;
