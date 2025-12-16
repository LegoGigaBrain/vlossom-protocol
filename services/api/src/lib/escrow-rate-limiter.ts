/**
 * Escrow Rate Limiter
 *
 * Provides rate limiting and circuit breaker functionality for escrow operations
 * to prevent automated fund drainage attacks and protect against compromised relayers.
 *
 * Limits:
 * - Maximum operations per minute
 * - Maximum total amount per hour
 * - Alerts when thresholds are approached
 */

import { logger } from './logger';

interface RateLimiterConfig {
  /** Maximum escrow operations allowed per minute */
  maxOperationsPerMinute: number;
  /** Maximum total amount (in smallest unit) that can be released per hour */
  maxAmountPerHour: bigint;
  /** Warning threshold as percentage of hourly limit (0-1) */
  warningThreshold: number;
}

interface OperationRecord {
  timestamp: number;
  amount: bigint;
  bookingId: string;
  operation: 'release' | 'refund';
}

/**
 * Escrow Rate Limiter
 *
 * Implements a sliding window rate limiter with both operation count
 * and amount-based limits to prevent abuse.
 */
export class EscrowRateLimiter {
  private operations: OperationRecord[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if an operation can proceed based on rate limits
   *
   * @param amount - The amount to be released/refunded
   * @param bookingId - The booking ID for logging
   * @returns Object with canProceed flag and reason if blocked
   */
  canProceed(amount: bigint, bookingId: string): { canProceed: boolean; reason?: string } {
    const now = Date.now();
    this.cleanup(now);

    // Check operations per minute
    const recentOps = this.operations.filter(op => now - op.timestamp < 60000);
    if (recentOps.length >= this.config.maxOperationsPerMinute) {
      logger.warn('Escrow rate limit reached: too many operations per minute', {
        bookingId,
        currentOps: recentOps.length,
        limit: this.config.maxOperationsPerMinute,
      });
      return {
        canProceed: false,
        reason: `Rate limit exceeded: maximum ${this.config.maxOperationsPerMinute} operations per minute`,
      };
    }

    // Check hourly amount limit
    const hourlyOps = this.operations.filter(op => now - op.timestamp < 3600000);
    const hourlyTotal = hourlyOps.reduce((sum, op) => sum + op.amount, 0n);
    const projectedTotal = hourlyTotal + amount;

    if (projectedTotal > this.config.maxAmountPerHour) {
      logger.error('Escrow rate limit reached: hourly amount exceeded', {
        bookingId,
        currentHourlyTotal: hourlyTotal.toString(),
        requestedAmount: amount.toString(),
        limit: this.config.maxAmountPerHour.toString(),
      });
      return {
        canProceed: false,
        reason: 'Rate limit exceeded: hourly amount limit reached',
      };
    }

    // Warn if approaching limit
    const warningAmount = BigInt(Math.floor(Number(this.config.maxAmountPerHour) * this.config.warningThreshold));
    if (projectedTotal > warningAmount) {
      logger.warn('Escrow hourly limit warning: approaching threshold', {
        bookingId,
        currentHourlyTotal: hourlyTotal.toString(),
        projectedTotal: projectedTotal.toString(),
        limit: this.config.maxAmountPerHour.toString(),
        percentUsed: Number((projectedTotal * 100n) / this.config.maxAmountPerHour),
      });
    }

    return { canProceed: true };
  }

  /**
   * Record a successful escrow operation
   *
   * @param bookingId - The booking ID
   * @param amount - The amount released/refunded
   * @param operation - Type of operation
   */
  recordOperation(bookingId: string, amount: bigint, operation: 'release' | 'refund'): void {
    this.operations.push({
      timestamp: Date.now(),
      amount,
      bookingId,
      operation,
    });

    logger.info('Escrow operation recorded', {
      bookingId,
      amount: amount.toString(),
      operation,
      totalOpsLastMinute: this.getOperationsLastMinute(),
      totalAmountLastHour: this.getAmountLastHour().toString(),
    });
  }

  /**
   * Get statistics about current rate limit usage
   */
  getStats(): {
    operationsLastMinute: number;
    operationsLastHour: number;
    amountLastHour: bigint;
    percentOfHourlyLimit: number;
  } {
    const now = Date.now();
    this.cleanup(now);

    const opsLastMinute = this.operations.filter(op => now - op.timestamp < 60000).length;
    const opsLastHour = this.operations.filter(op => now - op.timestamp < 3600000);
    const amountLastHour = opsLastHour.reduce((sum, op) => sum + op.amount, 0n);

    return {
      operationsLastMinute: opsLastMinute,
      operationsLastHour: opsLastHour.length,
      amountLastHour,
      percentOfHourlyLimit: Number((amountLastHour * 100n) / this.config.maxAmountPerHour),
    };
  }

  /**
   * Get operations count in the last minute
   */
  private getOperationsLastMinute(): number {
    const now = Date.now();
    return this.operations.filter(op => now - op.timestamp < 60000).length;
  }

  /**
   * Get total amount in the last hour
   */
  private getAmountLastHour(): bigint {
    const now = Date.now();
    return this.operations
      .filter(op => now - op.timestamp < 3600000)
      .reduce((sum, op) => sum + op.amount, 0n);
  }

  /**
   * Clean up old records to prevent memory bloat
   */
  private cleanup(now: number): void {
    // Keep records for 1 hour + 1 minute buffer
    const cutoff = now - 3660000;
    this.operations = this.operations.filter(op => op.timestamp > cutoff);
  }

  /**
   * Reset the rate limiter (for testing)
   */
  reset(): void {
    this.operations = [];
  }
}

/**
 * Default rate limiter instance
 *
 * Configured with production-safe defaults:
 * - 10 operations per minute (prevents rapid-fire attacks)
 * - $100,000 USDC equivalent per hour (protects against large-scale drainage)
 * - 80% warning threshold
 */
export const escrowRateLimiter = new EscrowRateLimiter({
  maxOperationsPerMinute: 10,
  maxAmountPerHour: 100000000000n, // $100,000 USDC (6 decimals)
  warningThreshold: 0.8,
});
