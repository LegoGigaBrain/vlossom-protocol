/**
 * Admin API Client (V7.0.0)
 *
 * Base API client for admin panel with cookie-based authentication.
 * Uses httpOnly cookies and CSRF protection consistent with web app.
 */

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/v1`;
const CSRF_COOKIE_NAME = "vlossom_csrf";

/**
 * Read CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Create headers with CSRF token for state-changing requests
 */
function createHeaders(includeContent = true): HeadersInit {
  const headers: HeadersInit = {};

  if (includeContent) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

/**
 * API error with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Refresh access token using refresh token cookie
 */
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: createHeaders(false),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Authenticated fetch with cookie credentials
 * Automatically handles CSRF tokens and 401 refresh
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: "include",
    headers: {
      ...createHeaders(options.body !== undefined),
      ...options.headers,
    },
  });

  // Handle token expiry with auto-refresh
  if (response.status === 401) {
    const data = await response.clone().json().catch(() => ({}));
    if (data.code === "TOKEN_EXPIRED") {
      const refreshed = await refreshToken();
      if (refreshed) {
        return fetch(fullUrl, {
          ...options,
          credentials: "include",
          headers: {
            ...createHeaders(options.body !== undefined),
            ...options.headers,
          },
        });
      }
    }
  }

  return response;
}

/**
 * Type-safe fetch with automatic JSON parsing
 */
export async function adminRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await adminFetch(url, options);

  if (!response.ok) {
    let errorMessage = "Request failed";
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.code;
    } catch {
      // Ignore JSON parse errors
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json();
}

/**
 * GET request helper
 */
export function adminGet<T>(url: string): Promise<T> {
  return adminRequest<T>(url, { method: "GET" });
}

/**
 * POST request helper
 */
export function adminPost<T>(url: string, data?: unknown): Promise<T> {
  return adminRequest<T>(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export function adminPut<T>(url: string, data?: unknown): Promise<T> {
  return adminRequest<T>(url, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request helper
 */
export function adminPatch<T>(url: string, data?: unknown): Promise<T> {
  return adminRequest<T>(url, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export function adminDelete<T>(url: string): Promise<T> {
  return adminRequest<T>(url, { method: "DELETE" });
}

/**
 * Check if user is authenticated (based on CSRF cookie presence)
 */
export function isAuthenticated(): boolean {
  return !!getCsrfToken();
}

/**
 * Login for admin
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ user: AdminUser }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.error || "Login failed", response.status);
  }

  return response.json();
}

/**
 * Logout admin
 */
export async function adminLogout(): Promise<void> {
  await adminFetch("/auth/logout", { method: "POST" });
}

/**
 * Get current admin user
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const response = await adminFetch("/auth/me");

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const user = result.user;

    // Check if user has admin role
    const roles = user.roles || [user.role];
    if (!roles.includes("ADMIN")) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

// Types
export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string;
  roles: string[];
  walletAddress: string;
  avatarUrl?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

/**
 * Build query string from params
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
