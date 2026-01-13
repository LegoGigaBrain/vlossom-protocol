/**
 * API Client Re-export
 *
 * Re-exports from src/lib/api.ts for backwards compatibility
 * with components that import from lib/api
 *
 * V8.0.0 Security Update: Migrated from localStorage tokens to httpOnly cookies
 */

export * from "../src/lib/api";

import { authFetch } from "./auth-client";

// Generic API client for admin pages
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

/**
 * V8.0.0: Secure request helper using httpOnly cookies
 * Uses authFetch which handles credentials and CSRF tokens automatically
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authFetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponse = any;

// Generic API client with get/post/put/delete methods
export const api = {
  get: <T = AnyResponse>(endpoint: string) => request<T>(endpoint),
  post: <T = AnyResponse>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T = AnyResponse>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T = AnyResponse>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T = AnyResponse>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};
