/**
 * CSRF Protection Middleware
 * V7.0.0: Implements double-submit cookie pattern for CSRF protection (H-1)
 *
 * How it works:
 * 1. Server generates CSRF token and sets it as a readable cookie
 * 2. Client reads cookie and sends token in X-CSRF-Token header
 * 3. Server compares cookie value with header value
 * 4. If they match, request is allowed; if not, 403 Forbidden
 *
 * This pattern works with httpOnly auth cookies because:
 * - Auth cookie is httpOnly (JS can't read it, XSS can't steal it)
 * - CSRF cookie is readable (JS reads it to send in header)
 * - Attacker can't read CSRF cookie from different origin (SameSite=Strict)
 * - Attacker can't set X-CSRF-Token header from cross-origin form submit
 */

import { type Request, type Response, type NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { CSRF_TOKEN_OPTIONS, COOKIE_NAMES } from '../lib/cookie-config';
import { logger } from '../lib/logger';

/**
 * Generate a cryptographically random CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Routes that don't require CSRF protection
 * (public GET endpoints, CORS preflight, etc.)
 */
const CSRF_EXEMPT_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Routes that are exempt from CSRF (webhooks, etc.)
 * These should use alternative authentication (signature verification)
 * V8.0.0: Added /auth/refresh (cookies-only endpoint, no CSRF needed)
 */
const CSRF_EXEMPT_PATHS = [
  '/api/v1/internal/', // Internal scheduler routes (use internal auth)
  '/api/v1/fiat/webhook', // Kotani Pay webhooks (use signature verification)
  '/api/v1/auth/refresh', // Token refresh uses httpOnly cookies only
  '/api/v1/auth/siwe/challenge', // SIWE challenge is read-only state creation
  '/health', // Health check
];

/**
 * Set CSRF token cookie if not present
 * Call this on login/signup responses
 */
export function setCsrfCookie(res: Response): string {
  const token = generateCsrfToken();
  res.cookie(COOKIE_NAMES.CSRF_TOKEN, token, CSRF_TOKEN_OPTIONS);
  return token;
}

/**
 * Clear CSRF cookie (call on logout)
 */
export function clearCsrfCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.CSRF_TOKEN, { path: '/' });
}

/**
 * CSRF protection middleware
 * Validates X-CSRF-Token header against cookie value
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip CSRF for safe methods
  if (CSRF_EXEMPT_METHODS.includes(req.method)) {
    return next();
  }

  // Skip CSRF for exempt paths
  if (CSRF_EXEMPT_PATHS.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Get CSRF token from cookie (unsigned cookie)
  const cookieToken = req.cookies?.[COOKIE_NAMES.CSRF_TOKEN];

  // Get CSRF token from header
  const headerToken = req.headers['x-csrf-token'] as string | undefined;

  // Both must be present
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF validation failed: missing token', {
      event: 'csrf_failure',
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken,
      path: req.path,
      ip: req.ip,
    });
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  // Tokens must match (constant-time comparison to prevent timing attacks)
  if (!timingSafeEqual(cookieToken, headerToken)) {
    logger.warn('CSRF validation failed: token mismatch', {
      event: 'csrf_failure',
      path: req.path,
      ip: req.ip,
    });
    res.status(403).json({ error: 'CSRF token mismatch' });
    return;
  }

  next();
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Middleware to ensure CSRF token cookie exists
 * Call on all authenticated requests
 */
export function ensureCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const existingToken = req.cookies?.[COOKIE_NAMES.CSRF_TOKEN];

  if (!existingToken) {
    setCsrfCookie(res);
  }

  next();
}
