/**
 * Circuit Breaker Pattern Implementation
 *
 * M-5: Prevents cascading failures when external services are unavailable.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are immediately rejected
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * Reference: https://martinfowler.com/bliki/CircuitBreaker.html
 */

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms to wait before testing if service recovered (default: 60000) */
  resetTimeoutMs: number;
  /** Number of successful requests needed in HALF_OPEN to close circuit (default: 2) */
  halfOpenSuccessThreshold: number;
  /** Optional name for logging */
  name?: string;
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

/**
 * Generic circuit breaker for protecting external service calls
 */
export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private halfOpenSuccesses = 0;
  private lastFailureTime?: number;
  private totalCalls = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeoutMs: config.resetTimeoutMs ?? 60000,
      halfOpenSuccessThreshold: config.halfOpenSuccessThreshold ?? 2,
      name: config.name ?? "CircuitBreaker",
    };
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param fn - The async function to execute
   * @param fallback - Optional fallback function to call when circuit is OPEN
   * @returns The result of fn or fallback
   * @throws CircuitBreakerOpenError if circuit is OPEN and no fallback provided
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    this.totalCalls++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === "OPEN" && this.shouldAttemptReset()) {
      this.transitionTo("HALF_OPEN");
    }

    // If circuit is OPEN, use fallback or throw
    if (this.state === "OPEN") {
      if (fallback) {
        console.log(`[${this.config.name}] Circuit OPEN - using fallback`);
        return fallback();
      }
      throw new CircuitBreakerOpenError(
        `Circuit breaker ${this.config.name} is OPEN`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      if (fallback) {
        console.log(`[${this.config.name}] Request failed - using fallback`);
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Check if the circuit breaker is allowing requests
   */
  isCallAllowed(): boolean {
    if (this.state === "CLOSED") return true;
    if (this.state === "HALF_OPEN") return true;
    if (this.state === "OPEN" && this.shouldAttemptReset()) {
      this.transitionTo("HALF_OPEN");
      return true;
    }
    return false;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.halfOpenSuccesses,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime)
        : undefined,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.transitionTo("CLOSED");
    this.failures = 0;
    this.halfOpenSuccesses = 0;
    this.lastFailureTime = undefined;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs;
  }

  private onSuccess(): void {
    this.totalSuccesses++;

    if (this.state === "HALF_OPEN") {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.halfOpenSuccessThreshold) {
        this.transitionTo("CLOSED");
      }
    } else if (this.state === "CLOSED") {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  private onFailure(error: unknown): void {
    this.totalFailures++;
    this.failures++;
    this.lastFailureTime = Date.now();

    console.error(
      `[${this.config.name}] Request failed (${this.failures}/${this.config.failureThreshold}):`,
      error instanceof Error ? error.message : error
    );

    if (this.state === "HALF_OPEN") {
      // Any failure in HALF_OPEN immediately opens the circuit again
      this.transitionTo("OPEN");
    } else if (
      this.state === "CLOSED" &&
      this.failures >= this.config.failureThreshold
    ) {
      this.transitionTo("OPEN");
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      console.log(
        `[${this.config.name}] Circuit state: ${this.state} → ${newState}`
      );
      this.state = newState;

      if (newState === "CLOSED") {
        this.failures = 0;
        this.halfOpenSuccesses = 0;
      } else if (newState === "HALF_OPEN") {
        this.halfOpenSuccesses = 0;
      }
    }
  }
}

/**
 * Error thrown when circuit breaker is OPEN and no fallback is provided
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitBreakerOpenError";
  }
}

// ============================================================================
// PRE-CONFIGURED CIRCUIT BREAKERS FOR EXTERNAL SERVICES
// ============================================================================

/**
 * Circuit breaker for Google Maps API (travel time calculations)
 * More lenient settings since it's used for scheduling optimization
 */
export const googleMapsCircuitBreaker = new CircuitBreaker({
  name: "GoogleMaps",
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  halfOpenSuccessThreshold: 2,
});

/**
 * Circuit breaker for SendGrid email service
 * More aggressive settings since email is important
 */
export const sendGridCircuitBreaker = new CircuitBreaker({
  name: "SendGrid",
  failureThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenSuccessThreshold: 2,
});

/**
 * Circuit breaker for SMS service (Twilio/AfricasTalking)
 */
export const smsCircuitBreaker = new CircuitBreaker({
  name: "SMS",
  failureThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenSuccessThreshold: 2,
});

/**
 * Circuit breaker for MoonPay fiat on/off-ramp
 */
export const moonPayCircuitBreaker = new CircuitBreaker({
  name: "MoonPay",
  failureThreshold: 3,
  resetTimeoutMs: 120000, // 2 minutes
  halfOpenSuccessThreshold: 2,
});

/**
 * Circuit breaker for blockchain RPC calls (except escrow which has rate limiter)
 */
export const blockchainRpcCircuitBreaker = new CircuitBreaker({
  name: "BlockchainRPC",
  failureThreshold: 10,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenSuccessThreshold: 3,
});
