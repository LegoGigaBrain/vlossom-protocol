/**
 * Cookie Configuration for Secure Authentication
 * V7.0.0: Implements httpOnly cookies to prevent XSS attacks (H-1)
 *
 * Security features:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: HTTPS only in production
 * - sameSite: CSRF protection
 * - signed: Tamper detection
 */

import type { CookieOptions } from 'express';

/**
 * Cookie names (constants to prevent typos)
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'vlossom_access',
  REFRESH_TOKEN: 'vlossom_refresh',
  CSRF_TOKEN: 'vlossom_csrf',
} as const;

/**
 * Cookie secret for signing (validated at startup)
 */
function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'FATAL: COOKIE_SECRET or JWT_SECRET environment variable is required for secure cookies.'
    );
  }

  return secret;
}

export const COOKIE_SECRET = getCookieSecret();

/**
 * Check if running in production
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the domain for cookies (allows subdomains in production)
 */
function getCookieDomain(): string | undefined {
  if (!isProduction) return undefined;

  const domain = process.env.COOKIE_DOMAIN;
  return domain || undefined;
}

/**
 * Access token cookie options
 * - Short-lived (15 minutes)
 * - httpOnly to prevent XSS
 * - Strict sameSite for CSRF protection
 */
export const ACCESS_TOKEN_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  signed: true,
  path: '/',
  domain: getCookieDomain(),
  maxAge: 15 * 60 * 1000, // 15 minutes
};

/**
 * Refresh token cookie options
 * - Longer-lived (7 days)
 * - httpOnly to prevent XSS
 * - Strict sameSite for CSRF protection
 * - Only sent to refresh endpoint
 */
export const REFRESH_TOKEN_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  signed: true,
  path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
  domain: getCookieDomain(),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * CSRF token cookie options
 * - NOT httpOnly (JavaScript needs to read it)
 * - Used for double-submit cookie pattern
 */
export const CSRF_TOKEN_OPTIONS: CookieOptions = {
  httpOnly: false, // Must be readable by JavaScript
  secure: isProduction,
  sameSite: 'strict',
  signed: false,
  path: '/',
  domain: getCookieDomain(),
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Clear cookie options (for logout)
 */
export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
  domain: getCookieDomain(),
};

/**
 * Token expiration times
 */
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;
