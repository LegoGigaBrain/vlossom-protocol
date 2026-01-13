/**
 * Auth Routes Integration Tests (V7.0.0)
 *
 * Tests the complete authentication flow with cookie-based auth.
 * Validates H-1 security fix: httpOnly cookies for XSS protection.
 */

import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4Q9Y5KT.jtYF.Euy', // "password123"
    displayName: 'Test User',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    roles: ['CUSTOMER'],
    phone: null,
    avatarUrl: null,
    verificationStatus: 'NONE',
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.email === 'test@example.com' || where.id === 'test-user-id') {
            return Promise.resolve(mockUser);
          }
          if (where.email === 'new@example.com') {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue({
          ...mockUser,
          id: 'new-user-id',
          email: 'new@example.com',
        }),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      $disconnect: jest.fn(),
    })),
    AuthProvider: {
      EMAIL: 'EMAIL',
      WALLET: 'WALLET',
    },
  };
});

// Mock wallet service
jest.mock('../../lib/wallet/wallet-service', () => ({
  createWallet: jest.fn().mockResolvedValue({
    address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    isDeployed: false,
  }),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((password: string) => {
    return Promise.resolve(password === 'password123');
  }),
}));

// Mock rate limiter to not block tests
jest.mock('../../middleware/rate-limiter', () => ({
  rateLimiters: {
    login: (_req: unknown, _res: unknown, next: () => void) => next(),
    signup: (_req: unknown, _res: unknown, next: () => void) => next(),
    passwordReset: (_req: unknown, _res: unknown, next: () => void) => next(),
    global: (_req: unknown, _res: unknown, next: () => void) => next(),
  },
  recordFailedLogin: jest.fn().mockReturnValue({ locked: false, remainingAttempts: 4 }),
  clearLoginAttempts: jest.fn(),
  isAccountLocked: jest.fn().mockReturnValue({ locked: false }),
}));

// Set JWT_SECRET before importing auth routes
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.COOKIE_SECRET = 'test-cookie-secret-at-least-32-chars';

// Import after mocks
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../auth';
import { COOKIE_NAMES } from '../../lib/cookie-config';

/**
 * Create test Express app with auth routes
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use('/api/v1/auth', authRouter);
  return app;
}

describe('Auth Routes Integration', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create account and set httpOnly cookies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'new@example.com',
          password: 'password123',
          role: 'CUSTOMER',
          displayName: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined(); // For mobile compatibility

      // Check cookies are set
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      // Verify access token cookie
      const accessCookie = cookies.find(c => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toContain('HttpOnly');
      expect(accessCookie).toContain('SameSite=Strict');

      // Verify refresh token cookie
      const refreshCookie = cookies.find(c => c.includes(COOKIE_NAMES.REFRESH_TOKEN));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');

      // Verify CSRF cookie (should NOT be httpOnly)
      const csrfCookie = cookies.find(c => c.includes(COOKIE_NAMES.CSRF_TOKEN));
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly');
    });

    it('should reject signup with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'new@example.com',
          // missing password and role
        });

      expect(response.status).toBe(400);
    });

    it('should reject signup with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'new@example.com',
          password: 'short',
          role: 'CUSTOMER',
        });

      expect(response.status).toBe(400);
    });

    it('should reject signup with invalid role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'new@example.com',
          password: 'password123',
          role: 'INVALID_ROLE',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login and set httpOnly cookies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBeDefined();

      // Check cookies
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();

      const accessCookie = cookies.find(c => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toContain('HttpOnly');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          // missing password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear auth cookies on logout', async () => {
      // First login to get cookies
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'] as string[];
      const accessCookie = cookies.find(c => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      const _accessToken = accessCookie?.split('=')[1]?.split(';')[0];

      // Now logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .send();

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logged out successfully');

      // Check cookies are cleared
      const logoutCookies = logoutResponse.headers['set-cookie'] as string[];
      expect(logoutCookies).toBeDefined();

      // Access token should be cleared (expired or empty)
      const clearedAccess = logoutCookies.find(c => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(clearedAccess).toBeDefined();
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user data with valid cookie auth', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'] as string[];

      // Get current user
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .send();

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user).toBeDefined();
      expect(meResponse.body.user.email).toBe('test@example.com');
    });

    it('should accept Bearer header for mobile clients', async () => {
      // Generate a valid token
      const token = jwt.sign(
        { sub: 'test-user-id', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { sub: 'test-user-id', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send();

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens using refresh cookie', async () => {
      // Login first to get refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'] as string[];

      // Refresh tokens
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .send();

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.message).toBe('Token refreshed successfully');
      expect(refreshResponse.body.token).toBeDefined();

      // New cookies should be set
      const newCookies = refreshResponse.headers['set-cookie'] as string[];
      expect(newCookies).toBeDefined();

      const newAccessCookie = newCookies.find(c => c.includes(COOKIE_NAMES.ACCESS_TOKEN));
      expect(newAccessCookie).toBeDefined();
    });

    it('should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send();

      expect(response.status).toBe(401);
    });

    it('should reject refresh with invalid refresh token', async () => {
      // Create a signed cookie with invalid token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`${COOKIE_NAMES.REFRESH_TOKEN}=invalid-token`])
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('Token Rotation', () => {
    it('should issue new refresh token on each refresh (rotation)', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies1 = loginResponse.headers['set-cookie'] as string[];
      const refreshCookie1 = cookies1.find(c => c.includes(COOKIE_NAMES.REFRESH_TOKEN));

      // First refresh
      const refresh1 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies1)
        .send();

      expect(refresh1.status).toBe(200);

      const cookies2 = refresh1.headers['set-cookie'] as string[];
      const refreshCookie2 = cookies2.find(c => c.includes(COOKIE_NAMES.REFRESH_TOKEN));

      // Refresh tokens should be different (rotation)
      expect(refreshCookie2).toBeDefined();
      expect(refreshCookie2).not.toBe(refreshCookie1);
    });
  });

  describe('Cookie Priority', () => {
    it('should prioritize cookie auth over Bearer header', async () => {
      // Login to get valid cookies
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'] as string[];

      // Create a different token for Bearer header
      const differentToken = jwt.sign(
        { sub: 'different-user-id', email: 'different@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // Request with both cookie and Bearer (cookie should win)
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${differentToken}`)
        .send();

      expect(response.status).toBe(200);
      // Should use cookie user, not Bearer user
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('CSRF Token', () => {
    it('should set non-httpOnly CSRF cookie on login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = response.headers['set-cookie'] as string[];
      const csrfCookie = cookies.find(c => c.includes(COOKIE_NAMES.CSRF_TOKEN));

      expect(csrfCookie).toBeDefined();
      // CSRF cookie must be readable by JavaScript
      expect(csrfCookie).not.toContain('HttpOnly');
      expect(csrfCookie).toContain('SameSite=Strict');
    });

    it('should clear CSRF cookie on logout', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'] as string[];

      // Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .send();

      const logoutCookies = logoutResponse.headers['set-cookie'] as string[];
      const csrfCookie = logoutCookies.find(c => c.includes(COOKIE_NAMES.CSRF_TOKEN));

      // CSRF cookie should be cleared
      expect(csrfCookie).toBeDefined();
    });
  });
});
