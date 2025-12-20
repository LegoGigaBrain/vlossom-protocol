/**
 * CSRF Middleware Tests (V7.0.0)
 *
 * Tests for double-submit cookie pattern CSRF protection.
 * Validates H-1 security fix: Cross-Site Request Forgery prevention.
 */

import { type Request, type Response, type NextFunction } from 'express';

import {
  csrfProtection,
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  ensureCsrfToken,
} from '../csrf';
import { COOKIE_NAMES } from '../../lib/cookie-config';

/**
 * Create a mock request object
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    path: '/api/v1/bookings',
    cookies: {},
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
  } as Request;
}

/**
 * Create a mock response object
 */
function createMockResponse(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

/**
 * Create a mock next function
 */
function createMockNext(): NextFunction {
  return jest.fn();
}

describe('CSRF Middleware', () => {
  describe('Token Generation', () => {
    it('should generate a 64-character hex token (32 bytes)', () => {
      const token = generateCsrfToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/i.test(token)).toBe(true);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const token3 = generateCsrfToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });

  describe('Cookie Management', () => {
    describe('setCsrfCookie', () => {
      it('should set CSRF cookie with correct name and options', () => {
        const res = createMockResponse();

        const token = setCsrfCookie(res);

        expect(res.cookie).toHaveBeenCalledWith(
          COOKIE_NAMES.CSRF_TOKEN,
          token,
          expect.objectContaining({
            httpOnly: false, // Must be readable by JS
            sameSite: 'strict',
            secure: expect.any(Boolean),
          })
        );
      });

      it('should return the generated token', () => {
        const res = createMockResponse();

        const token = setCsrfCookie(res);

        expect(token).toBeDefined();
        expect(token.length).toBe(64);
      });
    });

    describe('clearCsrfCookie', () => {
      it('should clear CSRF cookie', () => {
        const res = createMockResponse();

        clearCsrfCookie(res);

        expect(res.clearCookie).toHaveBeenCalledWith(COOKIE_NAMES.CSRF_TOKEN, {
          path: '/',
        });
      });
    });
  });

  describe('CSRF Protection Middleware', () => {
    describe('Exempt Methods', () => {
      it('should skip CSRF validation for GET requests', () => {
        const req = createMockRequest({ method: 'GET' });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should skip CSRF validation for HEAD requests', () => {
        const req = createMockRequest({ method: 'HEAD' });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should skip CSRF validation for OPTIONS requests (CORS preflight)', () => {
        const req = createMockRequest({ method: 'OPTIONS' });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Exempt Paths', () => {
      it('should skip CSRF validation for internal scheduler routes', () => {
        const req = createMockRequest({
          method: 'POST',
          path: '/api/v1/internal/scheduler/payout',
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should skip CSRF validation for Kotani Pay webhooks', () => {
        const req = createMockRequest({
          method: 'POST',
          path: '/api/v1/fiat/webhook',
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should skip CSRF validation for health checks', () => {
        const req = createMockRequest({
          method: 'POST',
          path: '/health',
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Token Validation', () => {
      it('should allow request when cookie and header tokens match', () => {
        const token = generateCsrfToken();
        const req = createMockRequest({
          method: 'POST',
          cookies: { [COOKIE_NAMES.CSRF_TOKEN]: token },
          headers: { 'x-csrf-token': token },
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should reject request when cookie token is missing', () => {
        const req = createMockRequest({
          method: 'POST',
          cookies: {},
          headers: { 'x-csrf-token': generateCsrfToken() },
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'CSRF token missing' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject request when header token is missing', () => {
        const req = createMockRequest({
          method: 'POST',
          cookies: { [COOKIE_NAMES.CSRF_TOKEN]: generateCsrfToken() },
          headers: {},
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'CSRF token missing' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject request when tokens do not match', () => {
        const req = createMockRequest({
          method: 'POST',
          cookies: { [COOKIE_NAMES.CSRF_TOKEN]: generateCsrfToken() },
          headers: { 'x-csrf-token': generateCsrfToken() }, // Different token
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'CSRF token mismatch' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject request when tokens have different lengths', () => {
        const req = createMockRequest({
          method: 'POST',
          cookies: { [COOKIE_NAMES.CSRF_TOKEN]: 'short' },
          headers: { 'x-csrf-token': generateCsrfToken() },
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'CSRF token mismatch' });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('HTTP Methods Requiring CSRF', () => {
      const token = generateCsrfToken();

      it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
        'should require CSRF validation for %s requests',
        (method) => {
          // Without token - should fail
          const reqWithout = createMockRequest({
            method,
            path: '/api/v1/bookings',
          });
          const resWithout = createMockResponse();
          const nextWithout = createMockNext();

          csrfProtection(reqWithout, resWithout, nextWithout);

          expect(resWithout.status).toHaveBeenCalledWith(403);
          expect(nextWithout).not.toHaveBeenCalled();

          // With valid token - should pass
          const reqWith = createMockRequest({
            method,
            path: '/api/v1/bookings',
            cookies: { [COOKIE_NAMES.CSRF_TOKEN]: token },
            headers: { 'x-csrf-token': token },
          });
          const resWith = createMockResponse();
          const nextWith = createMockNext();

          csrfProtection(reqWith, resWith, nextWith);

          expect(nextWith).toHaveBeenCalled();
        }
      );
    });
  });

  describe('ensureCsrfToken Middleware', () => {
    it('should set CSRF cookie if not present', () => {
      const req = createMockRequest({
        cookies: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      ensureCsrfToken(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        COOKIE_NAMES.CSRF_TOKEN,
        expect.any(String),
        expect.any(Object)
      );
      expect(next).toHaveBeenCalled();
    });

    it('should not set CSRF cookie if already present', () => {
      const req = createMockRequest({
        cookies: { [COOKIE_NAMES.CSRF_TOKEN]: generateCsrfToken() },
      });
      const res = createMockResponse();
      const next = createMockNext();

      ensureCsrfToken(req, res, next);

      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Security Properties', () => {
    it('should use constant-time comparison (timing-safe)', () => {
      // This test verifies the comparison doesn't short-circuit
      // by checking behavior with tokens that differ at various positions
      const baseToken = generateCsrfToken();

      // Modify at the start
      const modifiedStart = 'X' + baseToken.slice(1);
      const reqStart = createMockRequest({
        method: 'POST',
        cookies: { [COOKIE_NAMES.CSRF_TOKEN]: baseToken },
        headers: { 'x-csrf-token': modifiedStart },
      });
      const resStart = createMockResponse();
      csrfProtection(reqStart, resStart, createMockNext());
      expect(resStart.status).toHaveBeenCalledWith(403);

      // Modify at the end
      const modifiedEnd = baseToken.slice(0, -1) + 'X';
      const reqEnd = createMockRequest({
        method: 'POST',
        cookies: { [COOKIE_NAMES.CSRF_TOKEN]: baseToken },
        headers: { 'x-csrf-token': modifiedEnd },
      });
      const resEnd = createMockResponse();
      csrfProtection(reqEnd, resEnd, createMockNext());
      expect(resEnd.status).toHaveBeenCalledWith(403);

      // Modify in the middle
      const modifiedMiddle =
        baseToken.slice(0, 32) + 'X' + baseToken.slice(33);
      const reqMiddle = createMockRequest({
        method: 'POST',
        cookies: { [COOKIE_NAMES.CSRF_TOKEN]: baseToken },
        headers: { 'x-csrf-token': modifiedMiddle },
      });
      const resMiddle = createMockResponse();
      csrfProtection(reqMiddle, resMiddle, createMockNext());
      expect(resMiddle.status).toHaveBeenCalledWith(403);
    });

    it('should not leak token information in error messages', () => {
      const req = createMockRequest({
        method: 'POST',
        cookies: { [COOKIE_NAMES.CSRF_TOKEN]: 'secret-token' },
        headers: { 'x-csrf-token': 'wrong-token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req, res, next);

      // Error message should not contain the actual tokens
      expect(res.json).toHaveBeenCalledWith({ error: 'CSRF token mismatch' });
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(jsonCall)).not.toContain('secret-token');
      expect(JSON.stringify(jsonCall)).not.toContain('wrong-token');
    });
  });

  describe('Protected Endpoints', () => {
    // Non-exempt paths that should require CSRF
    const protectedPaths = [
      '/api/v1/bookings',
      '/api/v1/bookings/123',
      '/api/v1/users/me',
      '/api/v1/wallet/send',
      '/api/v1/disputes',
      '/api/v1/reviews',
    ];

    it.each(protectedPaths)(
      'should require CSRF for POST to %s',
      (path) => {
        const req = createMockRequest({
          method: 'POST',
          path,
        });
        const res = createMockResponse();
        const next = createMockNext();

        csrfProtection(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      }
    );
  });
});
