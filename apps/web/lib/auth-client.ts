/**
 * Authentication API client
 * Reference: docs/specs/auth/feature-spec.md
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  role: "CUSTOMER" | "STYLIST";
  walletAddress: string;
  avatarUrl?: string | null;
  verificationStatus?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  role: "CUSTOMER" | "STYLIST";
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Signup failed");
  }

  const result = await response.json();

  // Store token in localStorage
  if (result.token) {
    localStorage.setItem("vlossomToken", result.token);
  }

  return result;
}

/**
 * Log in an existing user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const result = await response.json();

  // Store token in localStorage
  if (result.token) {
    localStorage.setItem("vlossomToken", result.token);
  }

  return result;
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  const token = localStorage.getItem("vlossomToken");

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore logout errors
    }
  }

  // Always remove token from localStorage
  localStorage.removeItem("vlossomToken");
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = localStorage.getItem("vlossomToken");

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid or expired
      localStorage.removeItem("vlossomToken");
      return null;
    }

    const result = await response.json();
    return result.user;
  } catch {
    // Network error or other issue
    return null;
  }
}

/**
 * Get the stored auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("vlossomToken");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
