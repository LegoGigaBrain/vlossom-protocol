/**
 * API Client Base (V6.7.0)
 *
 * Base client for making authenticated API requests.
 * Uses expo-secure-store for token storage.
 */

import * as SecureStore from 'expo-secure-store';

// API URL - should be configured via environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

const AUTH_TOKEN_KEY = 'vlossom_auth_token';
const REFRESH_TOKEN_KEY = 'vlossom_refresh_token';

// ============================================================================
// Token Management
// ============================================================================

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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
  body?: Record<string, unknown>;
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

export { API_URL };
