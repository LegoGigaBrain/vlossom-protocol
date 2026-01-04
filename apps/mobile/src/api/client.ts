/**
 * API Client Base (V8.0.0)
 *
 * Base client for making authenticated API requests.
 * Uses expo-secure-store for token storage on native,
 * falls back to localStorage on web.
 *
 * V8.0.0: Added automatic token refresh on 401 responses
 */

import { Platform } from 'react-native';

// API URL - should be configured via environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

const AUTH_TOKEN_KEY = 'vlossom_auth_token';
const REFRESH_TOKEN_KEY = 'vlossom_refresh_token';

// V8.0.0: Token refresh state to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// ============================================================================
// Token Management (Platform-specific)
// ============================================================================

// Lazy load SecureStore only on native platforms
let SecureStore: typeof import('expo-secure-store') | null = null;

async function getSecureStore() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!SecureStore) {
    SecureStore = await import('expo-secure-store');
  }
  return SecureStore;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    const store = await getSecureStore();
    return store ? await store.getItemAsync(AUTH_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  const store = await getSecureStore();
  if (store) {
    await store.setItemAsync(AUTH_TOKEN_KEY, token);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    const store = await getSecureStore();
    return store ? await store.getItemAsync(REFRESH_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  const store = await getSecureStore();
  if (store) {
    await store.setItemAsync(REFRESH_TOKEN_KEY, token);
  }
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(AUTH_TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

// ============================================================================
// API Error
// ============================================================================

export class APIError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// ============================================================================
// V8.0.0: Token Refresh Flow
// ============================================================================

/**
 * Attempt to refresh the access token using the refresh token
 * Returns true if refresh was successful, false otherwise
 */
async function refreshAccessToken(): Promise<boolean> {
  // Prevent concurrent refresh attempts
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        console.log('[Auth] No refresh token available');
        return false;
      }

      // Call the refresh endpoint
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('[Auth] Refresh token rejected:', response.status);
        await clearTokens();
        return false;
      }

      const data = await response.json();

      if (data.accessToken) {
        await setAuthToken(data.accessToken);
      }

      if (data.refreshToken) {
        await setRefreshToken(data.refreshToken);
      }

      console.log('[Auth] Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      await clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ============================================================================
// Request Helpers
// ============================================================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: object;
  params?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
  /** V8.0.0: Skip auto-retry on 401 (used internally for refresh endpoint) */
  skipRetry?: boolean;
  /** V8.0.0: Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Make an API request with automatic token refresh on 401
 * V8.0.0: Added retry logic and timeout support
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    params,
    requireAuth = true,
    skipRetry = false,
    timeout = 30000,
  } = options;

  // Build URL with query params
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth) {
    const token = await getAuthToken();
    if (!token) {
      throw new APIError('Not authenticated', 401, 'UNAUTHENTICATED');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  // V8.0.0: Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Make request
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // V8.0.0: Handle 401 with token refresh
    if (response.status === 401 && requireAuth && !skipRetry) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Retry the original request with new token
        return apiRequest<T>(endpoint, { ...options, skipRetry: true });
      }

      // Refresh failed, throw auth error
      throw new APIError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'Request failed';
      let errorCode: string | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        errorCode = errorData.error?.code || errorData.code;
      } catch {
        // Ignore JSON parse errors
      }

      throw new APIError(errorMessage, response.status, errorCode);
    }

    // Parse response
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError('Request timeout', 408, 'TIMEOUT');
    }

    // Re-throw API errors
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}

export function getApiUrl(): string {
  return API_URL;
}

export { API_URL };
