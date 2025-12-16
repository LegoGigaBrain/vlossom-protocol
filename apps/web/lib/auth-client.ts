/**
 * Authentication API client
 * Reference: docs/specs/auth/feature-spec.md
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

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
    headers: {
      "Content-Type": "application/json",
    },
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
 * V3.2: Creates account if new user, returns JWT token
 */
export async function authenticateWithSiwe(
  data: SiweAuthRequest
): Promise<SiweAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/siwe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "SIWE authentication failed");
  }

  const result = await response.json();

  // Store token in localStorage
  if (result.token) {
    localStorage.setItem("vlossomToken", result.token);
  }

  return result;
}

/**
 * Get all linked authentication methods
 * V3.2: Returns list of linked accounts (email, wallets)
 */
export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/auth/linked-accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to get linked accounts");
  }

  const result = await response.json();
  return result.linkedAccounts;
}

/**
 * Link an external wallet to the current account
 * V3.2: Requires SIWE signature to prove wallet ownership
 */
export async function linkWallet(
  message: string,
  signature: string
): Promise<LinkedAccount> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/auth/link-wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
 * V3.2: Cannot unlink if it's the only auth method
 */
export async function unlinkAccount(accountId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/auth/unlink-account/${accountId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to unlink account");
  }
}
