/**
 * API Client Base (V6.7.0)
 *
 * Base client for making authenticated API requests.
 * Uses expo-secure-store for token storage on native,
 * falls back to localStorage on web.
 */

import { Platform } from 'react-native';

// API URL - should be configured via environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

const AUTH_TOKEN_KEY = 'vlossom_auth_token';
const REFRESH_TOKEN_KEY = 'vlossom_refresh_token';

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
// Request Helpers
// ============================================================================

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: object;
  params?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, requireAuth = true } = options;

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

  // Make request
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors
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
}

export function getApiUrl(): string {
  return API_URL;
}

export { API_URL };
