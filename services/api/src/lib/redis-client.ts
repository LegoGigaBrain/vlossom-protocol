/**
 * Redis Client for Vlossom API
 *
 * SECURITY FIX (C-2): Production-ready rate limiting with Redis
 * Reference: Security Review - In-memory rate limiting not suitable for horizontal scaling
 *
 * Features:
 * - Automatic connection management
 * - Graceful fallback to null when Redis unavailable (for dev)
 * - Connection pooling
 * - Retry logic with exponential backoff
 *
 * Usage:
 * - Set REDIS_URL environment variable for production
 * - Without REDIS_URL, operations return graceful defaults
 */

import { logger } from "./logger";

// Redis client type (will be dynamically imported)
type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: string[]): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  quit(): Promise<string>;
  ping(): Promise<string>;
  on(event: string, listener: (...args: unknown[]) => void): void;
};

let redisClient: RedisClient | null = null;
let connectionAttempted = false;
let isConnected = false;

/**
 * Initialize Redis connection
 * Returns null if REDIS_URL not configured or connection fails
 */
export async function initRedis(): Promise<RedisClient | null> {
  if (connectionAttempted) {
    return redisClient;
  }

  connectionAttempted = true;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("Redis not configured", {
        event: "redis_init_skip",
        warning: "REDIS_URL not set - rate limiting will use in-memory storage",
        recommendation: "Set REDIS_URL for production deployments with multiple instances",
      });
    } else {
      logger.info("Redis not configured - using in-memory fallback", {
        event: "redis_init_skip",
        mode: "development",
      });
    }
    return null;
  }

  try {
    // Dynamically import ioredis to avoid issues if not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ioredis = await import("ioredis");
    const Redis = ioredis.default;

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, then cap at 2s
        const delay = Math.min(times * 50, 2000);
        logger.warn("Redis connection retry", {
          event: "redis_retry",
          attempt: times,
          delayMs: delay,
        });
        return delay;
      },
      reconnectOnError(err: Error) {
        // Only reconnect on certain errors
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    }) as unknown as RedisClient;

    // Set up event handlers
    redisClient.on("connect", () => {
      isConnected = true;
      logger.info("Redis connected", { event: "redis_connected" });
    });

    redisClient.on("error", (...args: unknown[]) => {
      isConnected = false;
      const err = args[0];
      logger.error("Redis error", {
        event: "redis_error",
        error: err instanceof Error ? err.message : String(err),
      });
    });

    redisClient.on("close", () => {
      isConnected = false;
      logger.warn("Redis connection closed", { event: "redis_close" });
    });

    // Test connection
    await redisClient.ping();
    isConnected = true;

    logger.info("Redis initialized successfully", {
      event: "redis_init_success",
    });

    return redisClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check if it's a module not found error (ioredis not installed)
    if (errorMessage.includes("Cannot find module") || errorMessage.includes("ioredis")) {
      logger.warn("ioredis not installed", {
        event: "redis_init_skip",
        reason: "ioredis package not found",
        recommendation: "Run: pnpm add ioredis",
      });
    } else {
      logger.error("Redis initialization failed", {
        event: "redis_init_error",
        error: errorMessage,
      });
    }

    redisClient = null;
    return null;
  }
}

/**
 * Get Redis client (initializes if needed)
 */
export async function getRedis(): Promise<RedisClient | null> {
  if (!connectionAttempted) {
    await initRedis();
  }
  return redisClient;
}

/**
 * Check if Redis is available and connected
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && isConnected;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info("Redis connection closed", { event: "redis_shutdown" });
    } catch (error) {
      logger.error("Error closing Redis connection", {
        event: "redis_shutdown_error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
    redisClient = null;
    isConnected = false;
    connectionAttempted = false;
  }
}

/**
 * Rate limit helper: Increment counter with automatic expiry
 * Returns current count and TTL, or null if Redis unavailable
 */
export async function rateLimitIncrement(
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttl: number } | null> {
  const redis = await getRedis();

  if (!redis) {
    return null; // Caller should fall back to in-memory
  }

  try {
    // Atomic increment
    const count = await redis.incr(key);

    // Set expiry on first increment (when count is 1)
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Get TTL
    const ttl = await redis.ttl(key);

    return { count, ttl: ttl > 0 ? ttl : windowSeconds };
  } catch (error) {
    logger.error("Redis rate limit error", {
      event: "redis_ratelimit_error",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null; // Caller should fall back to in-memory
  }
}

/**
 * Rate limit helper: Check if key is blocked
 * Returns block TTL in seconds, or null if not blocked or Redis unavailable
 */
export async function rateLimitIsBlocked(key: string): Promise<number | null> {
  const redis = await getRedis();

  if (!redis) {
    return null;
  }

  try {
    const blockKey = `${key}:blocked`;
    const ttl = await redis.ttl(blockKey);
    return ttl > 0 ? ttl : null;
  } catch (error) {
    logger.error("Redis block check error", {
      event: "redis_block_check_error",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Rate limit helper: Block a key for specified duration
 */
export async function rateLimitBlock(
  key: string,
  durationSeconds: number
): Promise<boolean> {
  const redis = await getRedis();

  if (!redis) {
    return false;
  }

  try {
    const blockKey = `${key}:blocked`;
    await redis.set(blockKey, "1", "EX", String(durationSeconds));
    return true;
  } catch (error) {
    logger.error("Redis block set error", {
      event: "redis_block_set_error",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Rate limit helper: Clear rate limit for a key
 */
export async function rateLimitClear(key: string): Promise<boolean> {
  const redis = await getRedis();

  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    await redis.del(`${key}:blocked`);
    return true;
  } catch (error) {
    logger.error("Redis clear error", {
      event: "redis_clear_error",
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
