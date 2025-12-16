/**
 * Idempotency Middleware Tests
 *
 * M-2: Tests for Stripe-style idempotency to prevent duplicate payment operations
 * Covers header validation, cache operations, and middleware behavior
 */

import { Request, Response, NextFunction } from 'express';
import {
  requireIdempotencyKey,
  checkIdempotency,
  storeIdempotentResponse,
  withIdempotency,
  cleanupExpiredIdempotentRequests,
} from './idempotency';

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    idempotentRequest: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock error handler
jest.mock('./error-handler', () => ({
  createError: jest.fn((code: string, options?: { message?: string }) => ({
    code,
    message: options?.message || code,
    status: code === 'VALIDATION_ERROR' ? 400 : 500,
  })),
}));

import prisma from '../lib/prisma';
import { createError } from './error-handler';

describe('Idempotency Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      statusCode: 200,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireIdempotencyKey()', () => {
    it('should reject request without Idempotency-Key header', () => {
      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
        })
      );
      expect(createError).toHaveBeenCalledWith('VALIDATION_ERROR', {
        message: expect.stringContaining('Idempotency-Key header is required'),
      });
    });

    it('should reject keys shorter than 16 characters', () => {
      mockReq.headers = { 'idempotency-key': 'short-key' }; // 9 chars

      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
        })
      );
      expect(createError).toHaveBeenCalledWith('VALIDATION_ERROR', {
        message: expect.stringContaining('between 16 and 64 characters'),
      });
    });

    it('should reject keys longer than 64 characters', () => {
      mockReq.headers = {
        'idempotency-key': 'a'.repeat(65), // 65 chars
      };

      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
        })
      );
      expect(createError).toHaveBeenCalledWith('VALIDATION_ERROR', {
        message: expect.stringContaining('between 16 and 64 characters'),
      });
    });

    it('should accept valid UUID-format keys', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000'; // 36 chars
      mockReq.headers = { 'idempotency-key': validUuid };

      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).idempotencyKey).toBe(validUuid);
    });

    it('should accept keys at minimum length (16 characters)', () => {
      mockReq.headers = { 'idempotency-key': '1234567890123456' }; // exactly 16

      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).idempotencyKey).toBe('1234567890123456');
    });

    it('should accept keys at maximum length (64 characters)', () => {
      const maxKey = 'a'.repeat(64);
      mockReq.headers = { 'idempotency-key': maxKey };

      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockReq as any).idempotencyKey).toBe(maxKey);
    });

    it('should attach key to request object', () => {
      const key = 'valid-idempotency-key-123';
      mockReq.headers = { 'idempotency-key': key };

      requireIdempotencyKey(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).idempotencyKey).toBe(key);
    });
  });

  describe('checkIdempotency()', () => {
    it('should return null for new keys', async () => {
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkIdempotency('new-key-12345678');

      expect(result).toBeNull();
      expect(prisma.idempotentRequest.findUnique).toHaveBeenCalledWith({
        where: { key: 'new-key-12345678' },
      });
    });

    it('should return cached response for existing keys', async () => {
      const cachedData = {
        key: 'existing-key-123',
        response: { success: true, data: 'cached' },
        statusCode: 200,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(cachedData);

      const result = await checkIdempotency('existing-key-123');

      expect(result).toEqual({
        response: { success: true, data: 'cached' },
        statusCode: 200,
      });
    });

    it('should delete and return null for expired entries', async () => {
      const expiredData = {
        key: 'expired-key-1234',
        response: { success: true },
        statusCode: 200,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(expiredData);
      (prisma.idempotentRequest.delete as jest.Mock).mockResolvedValue({});

      const result = await checkIdempotency('expired-key-1234');

      expect(result).toBeNull();
      expect(prisma.idempotentRequest.delete).toHaveBeenCalledWith({
        where: { key: 'expired-key-1234' },
      });
    });

    it('should handle database errors gracefully (fail open)', async () => {
      (prisma.idempotentRequest.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await checkIdempotency('error-key-12345');

      expect(result).toBeNull(); // Fail open - allow request to proceed
    });

    it('should ignore errors when deleting expired entries', async () => {
      const expiredData = {
        key: 'expired-key-error',
        response: { success: true },
        statusCode: 200,
        expiresAt: new Date(Date.now() - 1000),
      };
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(expiredData);
      (prisma.idempotentRequest.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed')
      );

      const result = await checkIdempotency('expired-key-error');

      expect(result).toBeNull(); // Should still return null
    });
  });

  describe('storeIdempotentResponse()', () => {
    it('should store response with 24-hour TTL', async () => {
      (prisma.idempotentRequest.upsert as jest.Mock).mockResolvedValue({});

      const beforeTime = Date.now();
      await storeIdempotentResponse('store-key-12345', { success: true }, 200);
      const afterTime = Date.now();

      expect(prisma.idempotentRequest.upsert).toHaveBeenCalled();
      const call = (prisma.idempotentRequest.upsert as jest.Mock).mock.calls[0][0];

      // Verify 24-hour TTL
      const expiresAt = call.create.expiresAt.getTime();
      const expectedMin = beforeTime + 24 * 60 * 60 * 1000;
      const expectedMax = afterTime + 24 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should upsert existing entries', async () => {
      (prisma.idempotentRequest.upsert as jest.Mock).mockResolvedValue({});

      await storeIdempotentResponse('upsert-key-12345', { data: 'new' }, 201);

      expect(prisma.idempotentRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'upsert-key-12345' },
          create: expect.objectContaining({
            key: 'upsert-key-12345',
            response: { data: 'new' },
            statusCode: 201,
          }),
          update: expect.objectContaining({
            response: { data: 'new' },
            statusCode: 201,
          }),
        })
      );
    });

    it('should handle storage errors gracefully', async () => {
      (prisma.idempotentRequest.upsert as jest.Mock).mockRejectedValue(
        new Error('Storage failed')
      );

      // Should not throw
      await expect(
        storeIdempotentResponse('error-key-12345', { data: 'test' }, 200)
      ).resolves.not.toThrow();
    });
  });

  describe('withIdempotency()', () => {
    let wrappedHandler: ReturnType<typeof withIdempotency>;
    let mockHandler: jest.Mock;

    beforeEach(() => {
      mockHandler = jest.fn().mockImplementation(async (_req, res) => {
        res.status(200).json({ success: true });
      });
      wrappedHandler = withIdempotency(mockHandler);
    });

    it('should return cached response with Idempotency-Replayed header', async () => {
      (mockReq as any).idempotencyKey = 'cached-key-12345678';
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue({
        key: 'cached-key-12345678',
        response: { cached: true },
        statusCode: 200,
        expiresAt: new Date(Date.now() + 3600000),
      });

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Idempotency-Replayed', 'true');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ cached: true });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should cache 2xx responses', async () => {
      (mockReq as any).idempotencyKey = 'new-key-12345678';
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.idempotentRequest.upsert as jest.Mock).mockResolvedValue({});

      mockHandler.mockImplementation(async (_req, res) => {
        res.statusCode = 200;
        res.json({ success: true });
      });

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalled();
      expect(prisma.idempotentRequest.upsert).toHaveBeenCalled();
    });

    it('should cache 4xx responses', async () => {
      (mockReq as any).idempotencyKey = 'error-key-1234567';
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.idempotentRequest.upsert as jest.Mock).mockResolvedValue({});

      mockHandler.mockImplementation(async (_req, res) => {
        res.statusCode = 400;
        res.json({ error: 'Bad request' });
      });

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.idempotentRequest.upsert).toHaveBeenCalled();
    });

    it('should NOT cache 5xx responses', async () => {
      (mockReq as any).idempotencyKey = 'server-error-key';
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);

      mockHandler.mockImplementation(async (_req, res) => {
        res.statusCode = 500;
        res.json({ error: 'Server error' });
      });

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.idempotentRequest.upsert).not.toHaveBeenCalled();
    });

    it('should pass through when no idempotency key', async () => {
      // No idempotencyKey on request
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalled();
      expect(prisma.idempotentRequest.findUnique).not.toHaveBeenCalled();
    });

    it('should execute handler for new idempotency keys', async () => {
      (mockReq as any).idempotencyKey = 'fresh-key-123456';
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.idempotentRequest.upsert as jest.Mock).mockResolvedValue({});

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should capture response body for caching', async () => {
      (mockReq as any).idempotencyKey = 'capture-key-12345';
      (prisma.idempotentRequest.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.idempotentRequest.upsert as jest.Mock).mockResolvedValue({});

      const responseData = { id: 123, status: 'created' };
      mockHandler.mockImplementation(async (_req, res) => {
        res.statusCode = 201;
        res.json(responseData);
      });

      await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.idempotentRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            response: responseData,
            statusCode: 201,
          }),
        })
      );
    });
  });

  describe('cleanupExpiredIdempotentRequests()', () => {
    it('should delete expired entries', async () => {
      (prisma.idempotentRequest.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const count = await cleanupExpiredIdempotentRequests();

      expect(count).toBe(5);
      expect(prisma.idempotentRequest.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should return count of deleted entries', async () => {
      (prisma.idempotentRequest.deleteMany as jest.Mock).mockResolvedValue({
        count: 10,
      });

      const count = await cleanupExpiredIdempotentRequests();

      expect(count).toBe(10);
    });

    it('should return 0 when no entries to delete', async () => {
      (prisma.idempotentRequest.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      const count = await cleanupExpiredIdempotentRequests();

      expect(count).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      (prisma.idempotentRequest.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Cleanup failed')
      );

      const count = await cleanupExpiredIdempotentRequests();

      expect(count).toBe(0);
    });
  });
});
