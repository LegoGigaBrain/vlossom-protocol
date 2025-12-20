/**
 * Auth Middleware Tests (V7.0.0)
 *
 * Tests for cookie-based authentication with Bearer header fallback.
 * Validates H-1 security fix: httpOnly cookies for XSS protection.
 */

import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock environment before importing auth module
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';

import {
  authenticate,
  optionalAuth,
  generateToken,
  generateTokenPair,
  verifyToken,
  requireRole,
  type AuthenticatedRequest,
  type JWTPayload,
} from '../auth';
import { COOKIE_NAMES } from '../../lib/cookie-config';

// Test constants
const TEST_USER_ID = 'test-user-123';
const TEST_EMAIL = 'test@example.com';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

/**
 * Create a mock request object
 */
function createMockRequest(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    signedCookies: {},
    cookies: {},
    headers: {},
    path: '/api/v1/test',
    ip: '127.0.0.1',
    get: jest.fn((header: string) => {
      if (header === 'User-Agent') return 'Jest Test';
      return undefined;
    }),
    ...overrides,
  } as AuthenticatedRequest;
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

describe('Auth Middleware', () => {
  describe('Token Extraction', () => {
    describe('Cookie-based auth (Web clients)', () => {
      it('should extract token from signed httpOnly cookie', () => {
        const token = generateToken(TEST_USER_ID, { email: TEST_EMAIL });
        const req = createMockRequest({
          signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: token },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.userId).toBe(TEST_USER_ID);
        expect(req.user?.sub).toBe(TEST_USER_ID);
        expect(req.user?.email).toBe(TEST_EMAIL);
      });

      it('should prioritize cookie over Bearer header', () => {
        const cookieToken = generateToken(TEST_USER_ID, { email: 'cookie@example.com' });
        const headerToken = generateToken('other-user', { email: 'header@example.com' });
        const req = createMockRequest({
          signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: cookieToken },
          headers: { authorization: `Bearer ${headerToken}` },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user?.email).toBe('cookie@example.com');
      });

      it('should reject non-string cookie values', () => {
        const req = createMockRequest({
          signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: { invalid: 'object' } },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Bearer header auth (Mobile clients)', () => {
      it('should extract token from Bearer header as fallback', () => {
        const token = generateToken(TEST_USER_ID, { email: TEST_EMAIL });
        const req = createMockRequest({
          headers: { authorization: `Bearer ${token}` },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.userId).toBe(TEST_USER_ID);
      });

      it('should handle lowercase bearer prefix', () => {
        const token = generateToken(TEST_USER_ID);
        const req = createMockRequest({
          headers: { authorization: `bearer ${token}` },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.userId).toBe(TEST_USER_ID);
      });

      it('should reject malformed Authorization header', () => {
        const req = createMockRequest({
          headers: { authorization: 'InvalidFormat' },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject Authorization header with too many parts', () => {
        const req = createMockRequest({
          headers: { authorization: 'Bearer token extra_part' },
        });
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('No authentication provided', () => {
      it('should return 401 when no token is provided', () => {
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('Token Validation', () => {
    it('should reject expired tokens with TOKEN_EXPIRED code', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { sub: TEST_USER_ID },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Already expired
      );
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: expiredToken },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          refreshUrl: '/api/v1/auth/refresh',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject tokens with invalid signature', () => {
      const invalidToken = jwt.sign(
        { sub: TEST_USER_ID },
        'wrong-secret-key-that-is-different',
        { expiresIn: '1h' }
      );
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: invalidToken },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject malformed tokens', () => {
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: 'not-a-valid-jwt' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject tokens without subject claim', () => {
      const tokenWithoutSub = jwt.sign(
        { email: TEST_EMAIL },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: tokenWithoutSub },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token: missing subject' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth Middleware', () => {
    it('should attach user when valid token is provided', () => {
      const token = generateToken(TEST_USER_ID, { email: TEST_EMAIL });
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: token },
      });
      const res = createMockResponse();
      const next = createMockNext();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe(TEST_USER_ID);
      expect(req.user?.email).toBe(TEST_EMAIL);
    });

    it('should continue without error when no token is provided', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(req.userId).toBeUndefined();
    });

    it('should continue without error when token is invalid', () => {
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: 'invalid-token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('Token Generation', () => {
    describe('generateToken', () => {
      it('should generate a valid JWT token', () => {
        const token = generateToken(TEST_USER_ID, {
          email: TEST_EMAIL,
          walletAddress: TEST_WALLET,
          roles: ['CUSTOMER'],
        });

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        expect(decoded.sub).toBe(TEST_USER_ID);
        expect(decoded.email).toBe(TEST_EMAIL);
        expect(decoded.walletAddress).toBe(TEST_WALLET);
        expect(decoded.roles).toEqual(['CUSTOMER']);
      });

      it('should use 15m expiry for access tokens by default', () => {
        const token = generateToken(TEST_USER_ID, { tokenType: 'access' });

        const decoded = jwt.decode(token) as JWTPayload;
        expect(decoded.exp).toBeDefined();

        // Check expiry is approximately 15 minutes from now
        const expiryTime = decoded.exp! * 1000;
        const expectedExpiry = Date.now() + 15 * 60 * 1000;
        expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000); // 5 second tolerance
      });

      it('should use 7d expiry for refresh tokens', () => {
        const token = generateToken(TEST_USER_ID, { tokenType: 'refresh' });

        const decoded = jwt.decode(token) as JWTPayload;
        expect(decoded.exp).toBeDefined();

        // Check expiry is approximately 7 days from now
        const expiryTime = decoded.exp! * 1000;
        const expectedExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
        expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000);
      });

      it('should allow custom expiry override', () => {
        const token = generateToken(TEST_USER_ID, { expiresIn: '1h' });

        const decoded = jwt.decode(token) as JWTPayload;
        const expiryTime = decoded.exp! * 1000;
        const expectedExpiry = Date.now() + 60 * 60 * 1000;
        expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(5000);
      });
    });

    describe('generateTokenPair', () => {
      it('should generate both access and refresh tokens', () => {
        const { accessToken, refreshToken } = generateTokenPair(TEST_USER_ID, {
          email: TEST_EMAIL,
          roles: ['STYLIST'],
        });

        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();

        const accessDecoded = jwt.decode(accessToken) as JWTPayload;
        const refreshDecoded = jwt.decode(refreshToken) as JWTPayload;

        expect(accessDecoded.sub).toBe(TEST_USER_ID);
        expect(refreshDecoded.sub).toBe(TEST_USER_ID);

        // Refresh token should have longer expiry
        expect(refreshDecoded.exp!).toBeGreaterThan(accessDecoded.exp!);
      });
    });

    describe('verifyToken', () => {
      it('should return payload for valid token', () => {
        const token = generateToken(TEST_USER_ID, { email: TEST_EMAIL });
        const payload = verifyToken(token);

        expect(payload).not.toBeNull();
        expect(payload?.sub).toBe(TEST_USER_ID);
        expect(payload?.email).toBe(TEST_EMAIL);
      });

      it('should return null for invalid token', () => {
        const payload = verifyToken('invalid-token');
        expect(payload).toBeNull();
      });

      it('should return null for expired token', () => {
        const expiredToken = jwt.sign(
          { sub: TEST_USER_ID },
          process.env.JWT_SECRET!,
          { expiresIn: '-1h' }
        );
        const payload = verifyToken(expiredToken);
        expect(payload).toBeNull();
      });
    });
  });

  describe('Role-based Authorization', () => {
    it('should allow access when user has required role', () => {
      const token = generateToken(TEST_USER_ID, { roles: ['ADMIN', 'CUSTOMER'] });
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: token },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // First authenticate
      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();

      // Then check role
      const roleNext = createMockNext();
      requireRole('ADMIN')(req, res, roleNext);
      expect(roleNext).toHaveBeenCalled();
    });

    it('should deny access when user lacks required role', () => {
      const token = generateToken(TEST_USER_ID, { roles: ['CUSTOMER'] });
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: token },
      });
      const res = createMockResponse();
      const next = createMockNext();

      // First authenticate
      authenticate(req, res, next);

      // Then check role
      const roleNext = createMockNext();
      requireRole('ADMIN')(req, res, roleNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient permissions',
          required: ['ADMIN'],
          current: ['CUSTOMER'],
        })
      );
      expect(roleNext).not.toHaveBeenCalled();
    });

    it('should allow access when user has any of the required roles', () => {
      const token = generateToken(TEST_USER_ID, { roles: ['STYLIST'] });
      const req = createMockRequest({
        signedCookies: { [COOKIE_NAMES.ACCESS_TOKEN]: token },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req, res, next);

      const roleNext = createMockNext();
      requireRole('ADMIN', 'STYLIST')(req, res, roleNext);
      expect(roleNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      requireRole('ADMIN')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
