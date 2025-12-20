/**
 * Auth API Client (V6.10.0)
 *
 * Authentication endpoints: login, signup, logout, getMe, updateProfile,
 * forgotPassword, resetPassword.
 * Uses SecureStore for token management.
 */

import { apiRequest, setAuthToken, clearTokens, APIError } from './client';

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'CUSTOMER' | 'STYLIST' | 'PROPERTY_OWNER' | 'ADMIN';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  role: UserRole;
  walletAddress: string;
  avatarUrl: string | null;
  verificationStatus: VerificationStatus;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
  role: 'CUSTOMER' | 'STYLIST';
}

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

// ============================================================================
// Auth API Functions
// ============================================================================

/**
 * Login with email and password
 *
 * @throws {APIError} On invalid credentials, account locked, or rate limit
 */
export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
    requiresAuth: false,
  });

  // Store the token on successful login
  await setAuthToken(response.token);

  return response;
}

/**
 * Create a new user account
 *
 * @throws {APIError} On email exists, weak password, or rate limit
 */
export async function signup(request: SignupRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(request),
    requiresAuth: false,
  });

  // Store the token on successful signup
  await setAuthToken(response.token);

  return response;
}

/**
 * Logout the current user
 * Clears tokens from SecureStore
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Even if the API call fails, we should clear local tokens
    console.warn('Logout API call failed, clearing local tokens anyway');
  }

  // Always clear tokens locally
  await clearTokens();
}

/**
 * Get the current authenticated user
 *
 * @throws {APIError} If not authenticated or user not found
 */
export async function getMe(): Promise<User> {
  const response = await apiRequest<{ user: User }>('/auth/me', {
    method: 'GET',
  });

  return response.user;
}

/**
 * Update the current user's profile
 *
 * @throws {APIError} On validation error or email already exists
 */
export async function updateProfile(request: UpdateProfileRequest): Promise<User> {
  const response = await apiRequest<{ user: User }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(request),
  });

  return response.user;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 401 || error.code === 'UNAUTHORIZED';
  }
  return false;
}

/**
 * Check if an error is an account locked error
 */
export function isAccountLockedError(error: unknown): error is APIError & { retryAfter: number } {
  if (error instanceof APIError) {
    return error.status === 423 || error.code === 'ACCOUNT_LOCKED';
  }
  return false;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 429;
  }
  return false;
}

// ============================================================================
// Password Recovery
// ============================================================================

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Request password reset email
 *
 * @throws {APIError} On invalid email or rate limit
 */
export async function forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(request),
    requiresAuth: false,
  });
}

/**
 * Reset password with token from email
 *
 * @throws {APIError} On invalid/expired token or weak password
 */
export async function resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(request),
    requiresAuth: false,
  });
}

// Re-export APIError for convenience
export { APIError };
