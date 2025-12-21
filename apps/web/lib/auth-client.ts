/**
 * Authentication API client
 * Reference: docs/specs/auth/feature-spec.md
 *
 * V7.0.0 Security Updates (H-1):
 * - Removed localStorage token storage (XSS vulnerability)
 * - Uses httpOnly cookies via credentials: 'include'
 * - Adds CSRF token handling for state-changing requests
 * - Auto-refresh on 401 TOKEN_EXPIRED responses
 */

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/v1`;

// CSRF token cookie name (must match server)
const CSRF_COOKIE_NAME = "vlossom_csrf";

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
  token?: string; // Still returned for mobile clients
}

/**
 * V7.0.0: Read CSRF token from cookie
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
 * V7.0.0: Create headers with CSRF token for state-changing requests
 */
function createHeaders(includeContent = true): HeadersInit {
  const headers: HeadersInit = {};

  if (includeContent) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for state-changing requests
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

/**
 * V7.0.0: Authenticated fetch with cookie credentials
 * Automatically handles CSRF tokens and 401 refresh
 */
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Include cookies
    headers: {
      ...createHeaders(options.body !== undefined),
      ...options.headers,
    },
  });

  // V7.0.0: Handle token expiry with auto-refresh
  if (response.status === 401) {
    const data = await response.clone().json().catch(() => ({}));
    if (data.code === "TOKEN_EXPIRED") {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        return fetch(url, {
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
 * V7.0.0: Refresh access token using refresh token cookie
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
 * Sign up a new user
 * V7.0.0: Token is set via httpOnly cookie automatically
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Signup failed");
  }

  return response.json();
}

/**
 * Log in an existing user
 * V7.0.0: Token is set via httpOnly cookie automatically
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
}

/**
 * Log out the current user
 * V7.0.0: Clears httpOnly cookies on server
 */
export async function logout(): Promise<void> {
  try {
    await authFetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
    });
  } catch {
    // Ignore logout errors
  }
}

/**
 * Get the current authenticated user
 * V7.0.0: Uses cookies for authentication
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await authFetch(`${API_BASE_URL}/auth/me`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.user;
  } catch {
    return null;
  }
}

/**
 * V7.0.0: Check if user is authenticated
 * Note: This only checks for CSRF cookie presence as a hint.
 * The actual auth state should be determined by getCurrentUser().
 */
export function isAuthenticated(): boolean {
  return !!getCsrfToken();
}

/**
 * @deprecated V7.0.0: Tokens are now stored in httpOnly cookies.
 * This function is kept for backwards compatibility but always returns null.
 */
export function getAuthToken(): string | null {
  console.warn(
    "[V7.0.0] getAuthToken() is deprecated. Auth tokens are now stored in httpOnly cookies."
  );
  return null;
}

// ============================================================================
// SIWE (Sign-In with Ethereum) Functions - V3.2
// ============================================================================

export interface SiweChallenge {
  message: string;
  nonce: string;
  expiresAt: string;
}

export interface SiweAuthRequest {
  message: string;
  signature: string;
  role?: "CUSTOMER" | "STYLIST";
}

export interface SiweAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

export interface LinkedAccount {
  id: string;
  provider: "EMAIL" | "ETHEREUM";
  identifier: string;
  identifierFull: string;
  isPrimary: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

/**
 * Request a SIWE challenge for wallet authentication
 * V3.2: Returns a message for the wallet to sign
 */
export async function requestSiweChallenge(
  address: string,
  chainId: number = 84532
): Promise<SiweChallenge> {
  const response = await fetch(`${API_BASE_URL}/auth/siwe/challenge`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, chainId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get SIWE challenge");
  }

  return response.json();
}

/**
 * Authenticate with SIWE signature
 * V7.0.0: Token is set via httpOnly cookie automatically
 */
export async function authenticateWithSiwe(
  data: SiweAuthRequest
): Promise<SiweAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/siwe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "SIWE authentication failed");
  }

  return response.json();
}

/**
 * Get all linked authentication methods
 * V7.0.0: Uses cookies for authentication
 */
export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  const response = await authFetch(`${API_BASE_URL}/auth/linked-accounts`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get linked accounts");
  }

  const result = await response.json();
  return result.linkedAccounts;
}

/**
 * Link an external wallet to the current account
 * V7.0.0: Uses cookies for authentication, CSRF token in header
 */
export async function linkWallet(
  message: string,
  signature: string
): Promise<LinkedAccount> {
  const response = await authFetch(`${API_BASE_URL}/auth/link-wallet`, {
    method: "POST",
    body: JSON.stringify({ message, signature }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to link wallet");
  }

  const result = await response.json();
  return result.linkedAccount;
}

/**
 * Unlink an authentication method from the current account
 * V7.0.0: Uses cookies for authentication, CSRF token in header
 */
export async function unlinkAccount(accountId: string): Promise<void> {
  const response = await authFetch(
    `${API_BASE_URL}/auth/unlink-account/${accountId}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to unlink account");
  }
}
