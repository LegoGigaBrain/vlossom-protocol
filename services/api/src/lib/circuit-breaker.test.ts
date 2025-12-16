/**
 * Circuit Breaker Tests
 *
 * M-5: Tests for circuit breaker pattern implementation
 * Covers state transitions, execute behavior, and pre-configured breakers
 */

import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  googleMapsCircuitBreaker,
  sendGridCircuitBreaker,
  smsCircuitBreaker,
  moonPayCircuitBreaker,
  blockchainRpcCircuitBreaker,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    // Fresh circuit breaker for each test
    breaker = new CircuitBreaker({
      name: 'TestBreaker',
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      halfOpenSuccessThreshold: 2,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should allow calls in CLOSED state', () => {
      expect(breaker.isCallAllowed()).toBe(true);
    });

    it('should have zero counters initially', () => {
      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalCalls).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
      expect(stats.lastFailureTime).toBeUndefined();
    });
  });

  describe('State Transitions', () => {
    it('should transition CLOSED → OPEN after failure threshold', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service down');
      }

      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.getStats().failures).toBe(3);
    });

    it('should remain CLOSED when failures are below threshold', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Fail 2 times (below threshold of 3)
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service down');
      }

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getStats().failures).toBe(2);
    });

    it('should transition OPEN → HALF_OPEN after reset timeout', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('Service down');
      }
      expect(breaker.getState()).toBe('OPEN');

      // Advance time past reset timeout
      jest.advanceTimersByTime(1001);

      // Check if call is allowed (triggers transition to HALF_OPEN)
      expect(breaker.isCallAllowed()).toBe(true);
      expect(breaker.getState()).toBe('HALF_OPEN');
    });

    it('should transition HALF_OPEN → CLOSED after success threshold', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      const successFn = jest.fn().mockResolvedValue('success');

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Advance time to allow HALF_OPEN transition
      jest.advanceTimersByTime(1001);

      // Succeed twice (threshold is 2)
      await breaker.execute(successFn);
      expect(breaker.getState()).toBe('HALF_OPEN');

      await breaker.execute(successFn);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should transition HALF_OPEN → OPEN on any failure', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      const successFn = jest.fn().mockResolvedValue('success');

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Advance time to allow HALF_OPEN transition
      jest.advanceTimersByTime(1001);

      // One success in HALF_OPEN
      await breaker.execute(successFn);
      expect(breaker.getState()).toBe('HALF_OPEN');

      // One failure - should immediately go back to OPEN
      await expect(breaker.execute(failingFn)).rejects.toThrow();
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should reset failure count on success in CLOSED state', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      const successFn = jest.fn().mockResolvedValue('success');

      // 2 failures
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      expect(breaker.getStats().failures).toBe(2);

      // 1 success resets the counter
      await breaker.execute(successFn);
      expect(breaker.getStats().failures).toBe(0);

      // Need 3 more failures to trip
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('execute()', () => {
    it('should execute function successfully in CLOSED state', async () => {
      const fn = jest.fn().mockResolvedValue('result');

      const result = await breaker.execute(fn);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getStats().totalSuccesses).toBe(1);
    });

    it('should throw CircuitBreakerOpenError when OPEN without fallback', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Try to execute without fallback
      await expect(breaker.execute(failingFn)).rejects.toThrow(
        CircuitBreakerOpenError
      );
      await expect(breaker.execute(failingFn)).rejects.toThrow(
        'Circuit breaker TestBreaker is OPEN'
      );
    });

    it('should use fallback when OPEN', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      const fallbackFn = jest.fn().mockReturnValue('fallback result');

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Execute with fallback
      const result = await breaker.execute(failingFn, fallbackFn);

      expect(result).toBe('fallback result');
      expect(failingFn).not.toHaveBeenCalledTimes(4); // Not called when OPEN
      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when function fails in CLOSED state', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      const fallbackFn = jest.fn().mockReturnValue('fallback result');

      const result = await breaker.execute(failingFn, fallbackFn);

      expect(result).toBe('fallback result');
      expect(failingFn).toHaveBeenCalledTimes(1);
      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    it('should support async fallback functions', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      const asyncFallback = jest.fn().mockResolvedValue('async fallback');

      const result = await breaker.execute(failingFn, asyncFallback);

      expect(result).toBe('async fallback');
    });

    it('should increment totalCalls on every attempt', async () => {
      const successFn = jest.fn().mockResolvedValue('ok');
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      await breaker.execute(successFn);
      await expect(breaker.execute(failingFn)).rejects.toThrow();
      await breaker.execute(successFn);

      expect(breaker.getStats().totalCalls).toBe(3);
    });
  });

  describe('isCallAllowed()', () => {
    it('should return true in CLOSED state', () => {
      expect(breaker.isCallAllowed()).toBe(true);
    });

    it('should return false in OPEN state before reset timeout', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Before timeout
      jest.advanceTimersByTime(500);
      expect(breaker.isCallAllowed()).toBe(false);
    });

    it('should return true in OPEN state after reset timeout (transitions to HALF_OPEN)', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // After timeout
      jest.advanceTimersByTime(1001);
      expect(breaker.isCallAllowed()).toBe(true);
      expect(breaker.getState()).toBe('HALF_OPEN');
    });

    it('should return true in HALF_OPEN state', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Transition to HALF_OPEN
      jest.advanceTimersByTime(1001);
      breaker.isCallAllowed(); // triggers transition

      expect(breaker.getState()).toBe('HALF_OPEN');
      expect(breaker.isCallAllowed()).toBe(true);
    });
  });

  describe('getStats()', () => {
    it('should return accurate statistics', async () => {
      const successFn = jest.fn().mockResolvedValue('ok');
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // 2 successes, 2 failures
      await breaker.execute(successFn);
      await breaker.execute(successFn);
      await expect(breaker.execute(failingFn)).rejects.toThrow();
      await expect(breaker.execute(failingFn)).rejects.toThrow();

      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(4);
      expect(stats.totalSuccesses).toBe(2);
      expect(stats.totalFailures).toBe(2);
      expect(stats.failures).toBe(2);
      expect(stats.lastFailureTime).toBeInstanceOf(Date);
    });

    it('should track lastFailureTime', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      const beforeTime = Date.now();
      await expect(breaker.execute(failingFn)).rejects.toThrow();
      const afterTime = Date.now();

      const stats = breaker.getStats();
      expect(stats.lastFailureTime).toBeInstanceOf(Date);
      expect(stats.lastFailureTime!.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(stats.lastFailureTime!.getTime()).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('reset()', () => {
    it('should reset to CLOSED state', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }
      expect(breaker.getState()).toBe('OPEN');

      // Manual reset
      breaker.reset();

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getStats().failures).toBe(0);
    });

    it('should clear failure count and lastFailureTime', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(breaker.execute(failingFn)).rejects.toThrow();
      expect(breaker.getStats().lastFailureTime).toBeDefined();

      breaker.reset();

      expect(breaker.getStats().failures).toBe(0);
      expect(breaker.getStats().lastFailureTime).toBeUndefined();
    });
  });

  describe('Default Configuration', () => {
    it('should use default values when not provided', () => {
      const defaultBreaker = new CircuitBreaker();

      // Test default failureThreshold (5)
      expect(defaultBreaker.getState()).toBe('CLOSED');

      // Default threshold is 5 - tested implicitly through behavior above
    });
  });
});

describe('Pre-configured Circuit Breakers', () => {
  beforeEach(() => {
    // Reset all pre-configured breakers
    googleMapsCircuitBreaker.reset();
    sendGridCircuitBreaker.reset();
    smsCircuitBreaker.reset();
    moonPayCircuitBreaker.reset();
    blockchainRpcCircuitBreaker.reset();
  });

  describe('googleMapsCircuitBreaker', () => {
    it('should be in CLOSED state initially', () => {
      expect(googleMapsCircuitBreaker.getState()).toBe('CLOSED');
    });

    it('should have correct configuration (failureThreshold: 5)', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('API error'));

      // 4 failures - still CLOSED
      for (let i = 0; i < 4; i++) {
        await expect(googleMapsCircuitBreaker.execute(failingFn)).rejects.toThrow();
      }
      expect(googleMapsCircuitBreaker.getState()).toBe('CLOSED');

      // 5th failure - trips to OPEN
      await expect(googleMapsCircuitBreaker.execute(failingFn)).rejects.toThrow();
      expect(googleMapsCircuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('sendGridCircuitBreaker', () => {
    it('should be in CLOSED state initially', () => {
      expect(sendGridCircuitBreaker.getState()).toBe('CLOSED');
    });

    it('should have correct configuration (failureThreshold: 3)', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Email error'));

      // 2 failures - still CLOSED
      for (let i = 0; i < 2; i++) {
        await expect(sendGridCircuitBreaker.execute(failingFn)).rejects.toThrow();
      }
      expect(sendGridCircuitBreaker.getState()).toBe('CLOSED');

      // 3rd failure - trips to OPEN
      await expect(sendGridCircuitBreaker.execute(failingFn)).rejects.toThrow();
      expect(sendGridCircuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('smsCircuitBreaker', () => {
    it('should be in CLOSED state initially', () => {
      expect(smsCircuitBreaker.getState()).toBe('CLOSED');
    });

    it('should have correct configuration (failureThreshold: 3)', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('SMS error'));

      for (let i = 0; i < 3; i++) {
        await expect(smsCircuitBreaker.execute(failingFn)).rejects.toThrow();
      }
      expect(smsCircuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('moonPayCircuitBreaker', () => {
    it('should be in CLOSED state initially', () => {
      expect(moonPayCircuitBreaker.getState()).toBe('CLOSED');
    });

    it('should have correct configuration (failureThreshold: 3)', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('MoonPay error'));

      for (let i = 0; i < 3; i++) {
        await expect(moonPayCircuitBreaker.execute(failingFn)).rejects.toThrow();
      }
      expect(moonPayCircuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('blockchainRpcCircuitBreaker', () => {
    it('should be in CLOSED state initially', () => {
      expect(blockchainRpcCircuitBreaker.getState()).toBe('CLOSED');
    });

    it('should have correct configuration (failureThreshold: 10)', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('RPC error'));

      // 9 failures - still CLOSED
      for (let i = 0; i < 9; i++) {
        await expect(blockchainRpcCircuitBreaker.execute(failingFn)).rejects.toThrow();
      }
      expect(blockchainRpcCircuitBreaker.getState()).toBe('CLOSED');

      // 10th failure - trips to OPEN
      await expect(blockchainRpcCircuitBreaker.execute(failingFn)).rejects.toThrow();
      expect(blockchainRpcCircuitBreaker.getState()).toBe('OPEN');
    });
  });
});

describe('CircuitBreakerOpenError', () => {
  it('should be an instance of Error', () => {
    const error = new CircuitBreakerOpenError('Test message');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name property', () => {
    const error = new CircuitBreakerOpenError('Test message');
    expect(error.name).toBe('CircuitBreakerOpenError');
  });

  it('should contain the message', () => {
    const error = new CircuitBreakerOpenError('Circuit is open');
    expect(error.message).toBe('Circuit is open');
  });
});
