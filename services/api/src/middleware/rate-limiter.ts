/**
 * Rate Limiter Middleware (F4.7: Security Hardening)
 * Prevents abuse by limiting request rates per IP/user
 *
 * SECURITY AUDIT (V1.9.0) - H-2: Rate Limiting Architecture
 * ============================================================
 *
 * IMPORTANT: This implementation uses IN-MEMORY storage and is suitable
 * for SINGLE-INSTANCE deployments only.
 *
 * For horizontal scaling / multi-instance deployments:
 * 1. Deploy a Redis instance (AWS ElastiCache, Redis Cloud, etc.)
 * 2. Replace the Map-based rateLimitStore with ioredis client
 * 3. Use atomic INCR/EXPIRE operations for thread-safe counting
 * 4. Consider using sliding window algorithm for more accurate limiting
 *
 * Upgrade path documented in: docs/security/rate-limiting.md
 *
 * Current limitations:
 * - Each instance maintains its own counter (no sharing)
 * - Rate limits reset on server restart
 * - Not suitable for load-balanced deployments
 *
 * @see https://redis.io/commands/incr for atomic counter pattern
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

// H-2: Production warning for in-memory rate limiting
if (process.env.NODE_ENV === 'production') {
  logger.warn('Rate limiter using in-memory storage', {
    event: 'rate_limiter_init',
    warning: 'Not suitable for horizontal scaling - consider Redis for multi-instance deployments',
    upgradeGuide: 'docs/security/rate-limiting.md',
  });
}

// In-memory store for rate limiting
// NOTE: For production with multiple instances, replace with Redis
interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipFailedRequests?: boolean; // Don't count failed requests
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Default rate limit presets
 */
export const RATE_LIMIT_PRESETS = {
  // Authentication endpoints - strict limits
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block after limit
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  // Booking creation
  createBooking: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },
  // Faucet - very strict
  faucet: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 1,
  },
  // Upload - moderate limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },
  // Global default
  global: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
};

/**
 * Get client identifier for rate limiting
 */
function getClientKey(req: Request, prefix: string = ""): string {
  // Try to get user ID from authenticated request
  const userId = (req as any).userId;
  if (userId) {
    return `${prefix}:user:${userId}`;
  }

  // Fall back to IP address
  const ip = req.ip ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  return `${prefix}:ip:${ip}`;
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    blockDurationMs,
    keyGenerator,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : getClientKey(req);
    const now = Date.now();

    // Get or create entry
    let entry = rateLimitStore.get(key);

    // Check if blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.blockedUntil / 1000));

      return res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          retryAfter,
        },
      });
    }

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    // Check if over limit
    if (entry.count > maxRequests) {
      // Apply block if configured
      if (blockDurationMs) {
        entry.blockedUntil = now + blockDurationMs;
        rateLimitStore.set(key, entry);
      }

      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);

      return res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          retryAfter,
        },
      });
    }

    next();
  };
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  login: createRateLimiter(RATE_LIMIT_PRESETS.login),
  signup: createRateLimiter(RATE_LIMIT_PRESETS.signup),
  passwordReset: createRateLimiter(RATE_LIMIT_PRESETS.passwordReset),
  createBooking: createRateLimiter(RATE_LIMIT_PRESETS.createBooking),
  faucet: createRateLimiter(RATE_LIMIT_PRESETS.faucet),
  upload: createRateLimiter(RATE_LIMIT_PRESETS.upload),
  global: createRateLimiter(RATE_LIMIT_PRESETS.global),
};

/**
 * Endpoint-specific rate limiter that creates key based on route
 */
export function routeRateLimiter(
  config: Omit<RateLimitConfig, "keyGenerator">
) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req) => getClientKey(req, `${req.method}:${req.baseUrl}${req.path}`),
  });
}

/**
 * Account lockout tracking for failed login attempts
 */
const loginAttemptStore = new Map<string, { attempts: number; lockedUntil?: number }>();

export interface AccountLockoutConfig {
  maxAttempts: number;
  lockoutDurationMs: number;
}

const DEFAULT_LOCKOUT_CONFIG: AccountLockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
};

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
} {
  const config = DEFAULT_LOCKOUT_CONFIG;
  const now = Date.now();

  let entry = loginAttemptStore.get(identifier);

  // Check if currently locked
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
    };
  }

  // Reset if lockout expired
  if (entry?.lockedUntil && entry.lockedUntil < now) {
    entry = { attempts: 0 };
  }

  // Increment attempts
  if (!entry) {
    entry = { attempts: 0 };
  }
  entry.attempts++;

  // Check if should lock
  if (entry.attempts >= config.maxAttempts) {
    entry.lockedUntil = now + config.lockoutDurationMs;
    loginAttemptStore.set(identifier, entry);
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
    };
  }

  loginAttemptStore.set(identifier, entry);
  return {
    locked: false,
    remainingAttempts: config.maxAttempts - entry.attempts,
  };
}

/**
 * Clear login attempts on successful login
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttemptStore.delete(identifier);
}

/**
 * Check if account is locked
 */
export function isAccountLocked(identifier: string): {
  locked: boolean;
  lockedUntil?: number;
} {
  const entry = loginAttemptStore.get(identifier);
  const now = Date.now();

  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return { locked: true, lockedUntil: entry.lockedUntil };
  }

  return { locked: false };
}
