/**
 * Escrow Rate Limiter Tests
 *
 * H-1: Tests for escrow rate limiting to prevent fund drainage attacks
 * Covers sliding window, operation limits, amount limits, and warning thresholds
 */

import { EscrowRateLimiter, escrowRateLimiter } from './escrow-rate-limiter';

// Mock the logger
jest.mock('./logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { logger } from './logger';

describe('EscrowRateLimiter', () => {
  let rateLimiter: EscrowRateLimiter;

  beforeEach(() => {
    rateLimiter = new EscrowRateLimiter({
      maxOperationsPerMinute: 5,
      maxAmountPerHour: 10_000_000_000n, // $10,000 USDC
      warningThreshold: 0.8,
    });
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('canProceed()', () => {
    it('should allow first operation', () => {
      const result = rateLimiter.canProceed(100_000_000n, 'booking-1');

      expect(result.canProceed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow operations up to the minute limit', () => {
      // Record 4 operations
      for (let i = 0; i < 4; i++) {
        rateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
      }

      // 5th should still be allowed (limit is 5)
      const result = rateLimiter.canProceed(100_000_000n, 'booking-5');
      expect(result.canProceed).toBe(true);
    });

    it('should block when operations per minute exceeded', () => {
      // Record 5 operations (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
      }

      // 6th should be blocked
      const result = rateLimiter.canProceed(100_000_000n, 'booking-6');

      expect(result.canProceed).toBe(false);
      expect(result.reason).toContain('maximum 5 operations per minute');
      expect(logger.warn).toHaveBeenCalledWith(
        'Escrow rate limit reached: too many operations per minute',
        expect.objectContaining({
          bookingId: 'booking-6',
          currentOps: 5,
          limit: 5,
        })
      );
    });

    it('should block when hourly amount limit exceeded', () => {
      // Record $9,000 worth of operations (under $10,000 limit)
      rateLimiter.recordOperation('booking-1', 9_000_000_000n, 'release');

      // Try to add $2,000 more (would exceed $10,000 limit)
      const result = rateLimiter.canProceed(2_000_000_000n, 'booking-2');

      expect(result.canProceed).toBe(false);
      expect(result.reason).toContain('hourly amount limit reached');
      expect(logger.error).toHaveBeenCalledWith(
        'Escrow rate limit reached: hourly amount exceeded',
        expect.objectContaining({
          bookingId: 'booking-2',
        })
      );
    });

    it('should allow operations up to exact hourly amount limit', () => {
      // Record $9,000
      rateLimiter.recordOperation('booking-1', 9_000_000_000n, 'release');

      // Try to add exactly $1,000 more (equals $10,000 limit)
      const result = rateLimiter.canProceed(1_000_000_000n, 'booking-2');

      expect(result.canProceed).toBe(true);
    });

    it('should log warning when approaching hourly limit', () => {
      // Record $7,500 (75% of limit)
      rateLimiter.recordOperation('booking-1', 7_500_000_000n, 'release');

      // Check $1,000 more (would be 85%, above 80% threshold)
      rateLimiter.canProceed(1_000_000_000n, 'booking-2');

      expect(logger.warn).toHaveBeenCalledWith(
        'Escrow hourly limit warning: approaching threshold',
        expect.objectContaining({
          bookingId: 'booking-2',
        })
      );
    });

    it('should not warn when below warning threshold', () => {
      // Record $5,000 (50% of limit)
      rateLimiter.recordOperation('booking-1', 5_000_000_000n, 'release');

      // Check $1,000 more (would be 60%, below 80% threshold)
      rateLimiter.canProceed(1_000_000_000n, 'booking-2');

      expect(logger.warn).not.toHaveBeenCalledWith(
        'Escrow hourly limit warning: approaching threshold',
        expect.anything()
      );
    });

    it('should reset operation count after one minute', () => {
      // Record 5 operations (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
      }

      // Should be blocked now
      expect(rateLimiter.canProceed(100_000_000n, 'blocked').canProceed).toBe(false);

      // Advance time by 61 seconds
      jest.advanceTimersByTime(61000);

      // Should be allowed now
      const result = rateLimiter.canProceed(100_000_000n, 'allowed');
      expect(result.canProceed).toBe(true);
    });

    it('should reset amount after one hour', () => {
      // Record $9,500 (near limit)
      rateLimiter.recordOperation('booking-1', 9_500_000_000n, 'release');

      // Should be blocked for another $1,000
      expect(rateLimiter.canProceed(1_000_000_000n, 'blocked').canProceed).toBe(false);

      // Advance time by 61 minutes
      jest.advanceTimersByTime(3660000);

      // Should be allowed now
      const result = rateLimiter.canProceed(1_000_000_000n, 'allowed');
      expect(result.canProceed).toBe(true);
    });
  });

  describe('recordOperation()', () => {
    it('should record operation timestamp and amount', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastMinute).toBe(1);
      expect(stats.amountLastHour).toBe(100_000_000n);
    });

    it('should track cumulative amounts correctly', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');
      rateLimiter.recordOperation('booking-2', 200_000_000n, 'release');
      rateLimiter.recordOperation('booking-3', 300_000_000n, 'refund');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastMinute).toBe(3);
      expect(stats.amountLastHour).toBe(600_000_000n);
    });

    it('should log operation details', () => {
      rateLimiter.recordOperation('booking-123', 500_000_000n, 'release');

      expect(logger.info).toHaveBeenCalledWith(
        'Escrow operation recorded',
        expect.objectContaining({
          bookingId: 'booking-123',
          amount: '500000000',
          operation: 'release',
        })
      );
    });

    it('should correctly track release operations', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastHour).toBe(1);
    });

    it('should correctly track refund operations', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'refund');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastHour).toBe(1);
    });
  });

  describe('getStats()', () => {
    it('should return zero stats initially', () => {
      const stats = rateLimiter.getStats();

      expect(stats.operationsLastMinute).toBe(0);
      expect(stats.operationsLastHour).toBe(0);
      expect(stats.amountLastHour).toBe(0n);
      expect(stats.percentOfHourlyLimit).toBe(0);
    });

    it('should return current operation count', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');
      rateLimiter.recordOperation('booking-2', 200_000_000n, 'release');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastMinute).toBe(2);
      expect(stats.operationsLastHour).toBe(2);
    });

    it('should return current hourly amount', () => {
      rateLimiter.recordOperation('booking-1', 1_000_000_000n, 'release');
      rateLimiter.recordOperation('booking-2', 2_000_000_000n, 'release');

      const stats = rateLimiter.getStats();
      expect(stats.amountLastHour).toBe(3_000_000_000n);
    });

    it('should calculate percent of hourly limit correctly', () => {
      // Add $5,000 (50% of $10,000 limit)
      rateLimiter.recordOperation('booking-1', 5_000_000_000n, 'release');

      const stats = rateLimiter.getStats();
      expect(stats.percentOfHourlyLimit).toBe(50);
    });

    it('should show remaining capacity correctly', () => {
      // Add 3 operations
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
      }

      const stats = rateLimiter.getStats();
      // Remaining minute capacity: 5 - 3 = 2
      expect(stats.operationsLastMinute).toBe(3);
    });

    it('should differentiate minute vs hour counts after time passes', () => {
      // Record 2 operations now
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');
      rateLimiter.recordOperation('booking-2', 100_000_000n, 'release');

      // Advance 2 minutes
      jest.advanceTimersByTime(120000);

      // Record 1 more operation
      rateLimiter.recordOperation('booking-3', 100_000_000n, 'release');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastMinute).toBe(1); // Only recent one
      expect(stats.operationsLastHour).toBe(3); // All three
    });
  });

  describe('cleanup()', () => {
    it('should remove old entries from sliding window', () => {
      // Add operations
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');
      rateLimiter.recordOperation('booking-2', 100_000_000n, 'release');

      // Advance time past 1 hour + buffer
      jest.advanceTimersByTime(3700000);

      // Trigger cleanup via canProceed
      rateLimiter.canProceed(100_000_000n, 'new');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastHour).toBe(0);
      expect(stats.amountLastHour).toBe(0n);
    });

    it('should keep records within the hour window', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');

      // Advance time by 30 minutes
      jest.advanceTimersByTime(1800000);

      rateLimiter.recordOperation('booking-2', 200_000_000n, 'release');

      // Trigger cleanup
      rateLimiter.canProceed(100_000_000n, 'check');

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastHour).toBe(2);
      expect(stats.amountLastHour).toBe(300_000_000n);
    });
  });

  describe('reset()', () => {
    it('should clear all operations', () => {
      rateLimiter.recordOperation('booking-1', 100_000_000n, 'release');
      rateLimiter.recordOperation('booking-2', 200_000_000n, 'release');

      rateLimiter.reset();

      const stats = rateLimiter.getStats();
      expect(stats.operationsLastMinute).toBe(0);
      expect(stats.operationsLastHour).toBe(0);
      expect(stats.amountLastHour).toBe(0n);
    });

    it('should allow operations after reset', () => {
      // Hit the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
      }
      expect(rateLimiter.canProceed(100_000_000n, 'blocked').canProceed).toBe(false);

      // Reset
      rateLimiter.reset();

      // Should be allowed now
      expect(rateLimiter.canProceed(100_000_000n, 'allowed').canProceed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount operations', () => {
      const result = rateLimiter.canProceed(0n, 'booking-zero');
      expect(result.canProceed).toBe(true);

      rateLimiter.recordOperation('booking-zero', 0n, 'release');
      const stats = rateLimiter.getStats();
      expect(stats.operationsLastMinute).toBe(1);
      expect(stats.amountLastHour).toBe(0n);
    });

    it('should handle very large amounts', () => {
      const largeAmount = 9_999_999_999n; // Just under $10,000

      const result = rateLimiter.canProceed(largeAmount, 'booking-large');
      expect(result.canProceed).toBe(true);

      rateLimiter.recordOperation('booking-large', largeAmount, 'release');

      // Small additional amount should be blocked
      const result2 = rateLimiter.canProceed(1_000_000n, 'booking-small');
      expect(result2.canProceed).toBe(false);
    });

    it('should handle rapid sequential operations', () => {
      // Rapidly add operations
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.canProceed(100_000_000n, `booking-${i}`).canProceed).toBe(true);
        rateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
      }

      // 6th should be blocked immediately
      expect(rateLimiter.canProceed(100_000_000n, 'booking-6').canProceed).toBe(false);
    });
  });
});

describe('Default escrowRateLimiter Instance', () => {
  beforeEach(() => {
    escrowRateLimiter.reset();
    jest.clearAllMocks();
  });

  it('should have production configuration', () => {
    // Default is 10 ops/min, test with 9 operations
    for (let i = 0; i < 9; i++) {
      escrowRateLimiter.recordOperation(`booking-${i}`, 100_000_000n, 'release');
    }

    // 10th should be allowed (limit is 10)
    expect(escrowRateLimiter.canProceed(100_000_000n, 'booking-10').canProceed).toBe(true);
  });

  it('should have $100,000 hourly limit', () => {
    // Record $99,999 (just under limit)
    escrowRateLimiter.recordOperation('booking-1', 99_999_000_000n, 'release');

    // $1 should be allowed
    expect(escrowRateLimiter.canProceed(1_000_000n, 'booking-2').canProceed).toBe(true);

    // But $2 should exceed limit
    expect(escrowRateLimiter.canProceed(2_000_000n, 'booking-3').canProceed).toBe(false);
  });

  it('should warn at 80% of hourly limit', () => {
    // Record $75,000 (75% of limit)
    escrowRateLimiter.recordOperation('booking-1', 75_000_000_000n, 'release');

    // Check $10,000 more (would be 85%)
    escrowRateLimiter.canProceed(10_000_000_000n, 'booking-2');

    expect(logger.warn).toHaveBeenCalledWith(
      'Escrow hourly limit warning: approaching threshold',
      expect.anything()
    );
  });
});
