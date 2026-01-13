/**
 * Auth API Client (V7.1.0)
 *
 * Authentication endpoints: login, signup, logout, getMe, updateProfile,
 * forgotPassword, resetPassword, validateResetToken, addRole, removeRole.
 * Uses SecureStore for token management.
 *
 * V7.0.0: Added validateResetToken for H-6 security fix
 * V7.1.0: Added multi-role support with addRole/removeRole endpoints
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
  role: UserRole; // Primary role (backwards compatible)
  roles: UserRole[]; // V7.1: Full roles array for multi-role support
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
  const response = await apiRequest<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: request,
    requireAuth: false,
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
  const response = await apiRequest<AuthResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: request,
    requireAuth: false,
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
    await apiRequest<{ message: string }>('/api/v1/auth/logout', {
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
  const response = await apiRequest<{ user: User }>('/api/v1/auth/me', {
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
  const response = await apiRequest<{ user: User }>('/api/v1/auth/me', {
    method: 'PATCH',
    body: request,
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
// Password Management
// ============================================================================

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Change password for authenticated user (V7.1)
 *
 * @throws {APIError} On invalid current password or weak new password
 */
export async function changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/v1/auth/change-password', {
    method: 'POST',
    body: request,
  });
}

// V7.0.0 (H-6): Token validation response
export interface ValidateResetTokenResponse {
  valid: boolean;
  expired?: boolean;
}

/**
 * Request password reset email
 *
 * @throws {APIError} On invalid email or rate limit
 */
export async function forgotPassword(request: ForgotPasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: request,
    requireAuth: false,
  });
}

/**
 * Reset password with token from email
 *
 * @throws {APIError} On invalid/expired token or weak password
 */
export async function resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: request,
    requireAuth: false,
  });
}

/**
 * V7.0.0 (H-6): Validate reset token before showing form
 * Checks if token exists, is not used, and not expired
 *
 * @throws {APIError} On network/server error
 */
export async function validateResetToken(token: string): Promise<ValidateResetTokenResponse> {
  return apiRequest<ValidateResetTokenResponse>(`/api/v1/auth/reset-password/validate?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    requireAuth: false,
  });
}

// ============================================================================
// Role Management (V7.1)
// ============================================================================

export type PartnerRole = 'STYLIST' | 'PROPERTY_OWNER';

export interface AddRoleRequest {
  role: PartnerRole;
}

export interface AddRoleResponse {
  message: string;
  user: User;
}

/**
 * V7.1: Add a new role to the current user's account
 * Used for partner onboarding (become a stylist / list a property)
 *
 * @throws {APIError} On invalid role or role already exists
 */
export async function addRole(request: AddRoleRequest): Promise<AddRoleResponse> {
  return apiRequest<AddRoleResponse>('/api/v1/auth/add-role', {
    method: 'POST',
    body: request,
  });
}

/**
 * V7.1: Remove a role from the current user's account
 * Cannot remove CUSTOMER role (base role for all users)
 *
 * @throws {APIError} On invalid role or role not exists
 */
export async function removeRole(request: AddRoleRequest): Promise<AddRoleResponse> {
  return apiRequest<AddRoleResponse>('/api/v1/auth/remove-role', {
    method: 'DELETE',
    body: request,
  });
}

// Note: APIError is exported from client.ts via index.ts
