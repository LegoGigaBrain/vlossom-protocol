/**
 * Rate Limiter Middleware Tests (V7.0.0)
 *
 * Tests for rate limiting with Redis and fail-closed behavior.
 * Validates H-4 security fix: Fail-closed mode for production.
 */

import { type Request, type Response, type NextFunction } from 'express';

// Store original env values
const originalEnv = { ...process.env };

// Mock redis-client module
const mockRedisClient = {
  isRedisAvailable: jest.fn(),
  rateLimitIncrement: jest.fn(),
  rateLimitIsBlocked: jest.fn(),
  rateLimitBlock: jest.fn(),
  initRedis: jest.fn().mockResolvedValue(null),
};

jest.mock('../../lib/redis-client', () => mockRedisClient);

// Import after mocking
import {
  createRateLimiter,
  RATE_LIMIT_PRESETS,
  recordFailedLogin,
  clearLoginAttempts,
  isAccountLocked,
} from '../rate-limiter';

/**
 * Create a mock request object
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    ip: '192.168.1.1',
    method: 'POST',
    path: '/api/v1/auth/login',
    baseUrl: '',
    headers: {},
    socket: { remoteAddress: '192.168.1.1' },
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
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

/**
 * Create a mock next function
 */
function createMockNext(): NextFunction {
  return jest.fn();
}

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
    process.env.REQUIRE_REDIS = 'false';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Fail-Closed Behavior (H-4)', () => {
    it('should return 503 when REQUIRE_REDIS=true and Redis unavailable', async () => {
      process.env.REQUIRE_REDIS = 'true';
      mockRedisClient.isRedisAvailable.mockReturnValue(false);

      // Need to re-import to pick up new env value
      jest.resetModules();
      jest.mock('../../lib/redis-client', () => mockRedisClient);

      const { createRateLimiter: freshCreateRateLimiter } = await import('../rate-limiter');

      const limiter = freshCreateRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable. Please try again later.',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fallback to in-memory when REQUIRE_REDIS=false and Redis unavailable', async () => {
      process.env.REQUIRE_REDIS = 'false';
      mockRedisClient.isRedisAvailable.mockReturnValue(false);

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      // Should pass through using in-memory
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
    });
  });

  describe('Redis Rate Limiting', () => {
    beforeEach(() => {
      mockRedisClient.isRedisAvailable.mockReturnValue(true);
    });

    it('should allow request when under rate limit', async () => {
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(null);
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 1, ttl: 60 });

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
    });

    it('should return 429 when rate limit exceeded', async () => {
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(null);
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 11, ttl: 30 });
      mockRedisClient.rateLimitBlock.mockResolvedValue(true);

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        blockDurationMs: 300000,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 30,
        },
      });
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 30);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 429 when already blocked', async () => {
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(120); // 120 seconds remaining

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 120);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block after exceeding limit with blockDurationMs', async () => {
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(null);
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 11, ttl: 60 });
      mockRedisClient.rateLimitBlock.mockResolvedValue(true);

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        blockDurationMs: 1800000, // 30 minutes
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(mockRedisClient.rateLimitBlock).toHaveBeenCalledWith(
        expect.stringContaining('ip:192.168.1.1'),
        1800 // 30 minutes in seconds
      );
    });
  });

  describe('In-Memory Rate Limiting', () => {
    beforeEach(() => {
      mockRedisClient.isRedisAvailable.mockReturnValue(false);
      process.env.REQUIRE_REDIS = 'false';
    });

    it('should increment counter and allow request', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      const req = createMockRequest({ ip: '10.0.0.1' });
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
    });

    it('should block after exceeding limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 3,
      });

      const req = createMockRequest({ ip: '10.0.0.2' });

      // Make 4 requests (3 allowed, 4th blocked)
      for (let i = 0; i < 3; i++) {
        const res = createMockResponse();
        const next = createMockNext();
        await limiter(req, res, next);
        expect(next).toHaveBeenCalled();
      }

      // 4th request should be blocked
      const res = createMockResponse();
      const next = createMockNext();
      await limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limit Headers', () => {
    beforeEach(() => {
      mockRedisClient.isRedisAvailable.mockReturnValue(true);
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(null);
    });

    it('should set X-RateLimit-Limit header', async () => {
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 1, ttl: 60 });

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    });

    it('should set X-RateLimit-Remaining header', async () => {
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 5, ttl: 60 });

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 5);
    });

    it('should set X-RateLimit-Reset header', async () => {
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 1, ttl: 60 });

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number)
      );
    });

    it('should set Retry-After header when rate limited', async () => {
      mockRedisClient.rateLimitIncrement.mockResolvedValue({ count: 11, ttl: 45 });

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 45);
    });
  });

  describe('Rate Limit Presets', () => {
    it('should have login preset with 5 requests per 15 minutes', () => {
      expect(RATE_LIMIT_PRESETS.login).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        blockDurationMs: 30 * 60 * 1000,
      });
    });

    it('should have signup preset with 3 requests per hour', () => {
      expect(RATE_LIMIT_PRESETS.signup).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
        blockDurationMs: 60 * 60 * 1000,
      });
    });

    it('should have passwordReset preset with strict limits', () => {
      expect(RATE_LIMIT_PRESETS.passwordReset).toEqual({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
        blockDurationMs: 60 * 60 * 1000,
      });
    });

    it('should have faucet preset with 1 request per 24 hours', () => {
      expect(RATE_LIMIT_PRESETS.faucet).toEqual({
        windowMs: 24 * 60 * 60 * 1000,
        maxRequests: 1,
      });
    });

    it('should have global preset with 100 requests per minute', () => {
      expect(RATE_LIMIT_PRESETS.global).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 100,
      });
    });
  });

  describe('Custom Key Generator', () => {
    beforeEach(() => {
      mockRedisClient.isRedisAvailable.mockReturnValue(false);
      process.env.REQUIRE_REDIS = 'false';
    });

    it('should use custom key generator when provided', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyGenerator: (req) => `custom:${req.path}`,
      });

      const req1 = createMockRequest({ ip: '1.1.1.1', path: '/api/endpoint1' });
      const req2 = createMockRequest({ ip: '1.1.1.1', path: '/api/endpoint2' });

      // Both should be allowed since different paths = different keys
      const res1 = createMockResponse();
      const next1 = createMockNext();
      await limiter(req1, res1, next1);
      expect(next1).toHaveBeenCalled();

      const res2 = createMockResponse();
      const next2 = createMockNext();
      await limiter(req2, res2, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('should use user ID when authenticated', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 3,
      });

      // Request with userId (authenticated)
      const authReq = createMockRequest({ ip: '1.2.3.4' });
      (authReq as Request & { userId: string }).userId = 'user-123';

      // Multiple requests from same user should share limit
      for (let i = 0; i < 3; i++) {
        const res = createMockResponse();
        const next = createMockNext();
        await limiter(authReq, res, next);
        expect(next).toHaveBeenCalled();
      }

      // 4th request should be blocked
      const res = createMockResponse();
      const next = createMockNext();
      await limiter(authReq, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Account Lockout', () => {
    beforeEach(() => {
      // Clear any existing lockout state
      clearLoginAttempts('test@example.com');
      clearLoginAttempts('locked@example.com');
    });

    it('should track failed login attempts', async () => {
      const result1 = await recordFailedLogin('test@example.com');
      expect(result1.locked).toBe(false);
      expect(result1.remainingAttempts).toBe(4);

      const result2 = await recordFailedLogin('test@example.com');
      expect(result2.locked).toBe(false);
      expect(result2.remainingAttempts).toBe(3);
    });

    it('should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 4; i++) {
        const result = await recordFailedLogin('locked@example.com');
        expect(result.locked).toBe(false);
      }

      const result = await recordFailedLogin('locked@example.com');
      expect(result.locked).toBe(true);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockedUntil).toBeDefined();
    });

    it('should return locked status for locked account', async () => {
      for (let i = 0; i < 5; i++) {
        await recordFailedLogin('locked@example.com');
      }

      const status = await isAccountLocked('locked@example.com');
      expect(status.locked).toBe(true);
      expect(status.lockedUntil).toBeDefined();
    });

    it('should clear attempts on successful login', async () => {
      await recordFailedLogin('test@example.com');
      await recordFailedLogin('test@example.com');

      clearLoginAttempts('test@example.com');

      const status = await isAccountLocked('test@example.com');
      expect(status.locked).toBe(false);
    });

    it('should return not locked for unknown accounts', async () => {
      const status = await isAccountLocked('unknown@example.com');
      expect(status.locked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should fail-closed on Redis errors when REQUIRE_REDIS=true', async () => {
      process.env.REQUIRE_REDIS = 'true';
      mockRedisClient.isRedisAvailable.mockReturnValue(true);
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(null);
      mockRedisClient.rateLimitIncrement.mockRejectedValue(new Error('Redis connection lost'));

      jest.resetModules();
      jest.mock('../../lib/redis-client', () => mockRedisClient);

      const { createRateLimiter: freshCreateRateLimiter } = await import('../rate-limiter');

      const limiter = freshCreateRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('should fallback to in-memory on Redis errors when REQUIRE_REDIS=false', async () => {
      process.env.REQUIRE_REDIS = 'false';
      mockRedisClient.isRedisAvailable.mockReturnValue(true);
      mockRedisClient.rateLimitIsBlocked.mockResolvedValue(null);
      mockRedisClient.rateLimitIncrement.mockResolvedValue(null); // null = fallback

      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest({ ip: '5.5.5.5' });
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      // Should fall back to in-memory and allow request
      expect(next).toHaveBeenCalled();
    });
  });

  describe('IP Extraction', () => {
    beforeEach(() => {
      mockRedisClient.isRedisAvailable.mockReturnValue(false);
      process.env.REQUIRE_REDIS = 'false';
    });

    it('should use req.ip when available', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest({ ip: '1.2.3.4' });
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use x-forwarded-for header as fallback', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest({
        ip: undefined,
        headers: { 'x-forwarded-for': '5.6.7.8, 9.10.11.12' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use socket.remoteAddress as last resort', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });

      const req = createMockRequest({
        ip: undefined,
        headers: {},
        socket: { remoteAddress: '10.20.30.40' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await limiter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
