# Rate Limiting Architecture

## Overview

Vlossom uses rate limiting to prevent abuse and ensure fair usage of API resources. This document describes the current implementation and upgrade path for production scaling.

## Current Implementation (V1.9.0)

The current rate limiter uses **in-memory storage** via JavaScript `Map` objects. This is suitable for:

- Single-instance deployments
- Development and testing
- Beta launch with limited traffic

### Limitations

1. **No distributed state**: Each server instance maintains its own rate limit counters
2. **State loss on restart**: Counters reset when the server restarts
3. **Not suitable for horizontal scaling**: Load-balanced deployments will not share rate limit state

## Configuration

Rate limits are configured in `services/api/src/middleware/rate-limiter.ts`:

| Endpoint | Window | Max Requests | Block Duration |
|----------|--------|--------------|----------------|
| Login | 15 min | 5 | 30 min |
| Signup | 1 hour | 3 | 1 hour |
| Password Reset | 1 hour | 3 | - |
| Create Booking | 1 hour | 20 | - |
| Faucet | 24 hours | 1 | - |
| Upload | 1 hour | 50 | - |
| Global | 1 min | 100 | - |

## Upgrade Path: Redis-Backed Rate Limiting

When scaling to multiple instances, upgrade to Redis-backed rate limiting:

### Step 1: Deploy Redis

Options:
- AWS ElastiCache (Redis mode)
- Redis Cloud
- Self-hosted Redis with replication

### Step 2: Install ioredis

```bash
cd services/api
npm install ioredis
```

### Step 3: Replace In-Memory Store

Replace the `Map`-based store with Redis operations:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Atomic increment with TTL
async function incrementRateLimit(key: string, windowMs: number): Promise<number> {
  const multi = redis.multi();
  multi.incr(key);
  multi.pttl(key);
  const results = await multi.exec();

  const count = results[0][1] as number;
  const ttl = results[1][1] as number;

  // Set TTL if this is the first request in the window
  if (ttl === -1) {
    await redis.pexpire(key, windowMs);
  }

  return count;
}
```

### Step 4: Update Configuration

Add to `.env`:

```env
REDIS_HOST=your-redis-host.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Step 5: Implement Sliding Window (Optional)

For more accurate rate limiting, implement a sliding window algorithm:

```typescript
async function slidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis sorted set with timestamps as scores
  await redis.zremrangebyscore(key, 0, windowStart);
  const count = await redis.zcard(key);

  if (count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await redis.zadd(key, now, `${now}`);
  await redis.pexpire(key, windowMs);

  return { allowed: true, remaining: maxRequests - count - 1 };
}
```

## Monitoring

Monitor rate limiting effectiveness:

1. **Logs**: Watch for `rate_limiter_init` and rate limit exceeded events
2. **Metrics**: Track blocked requests per endpoint
3. **Alerts**: Set up alerts for sustained high rate of blocked requests

## Security Considerations

- Rate limits are applied per IP address or authenticated user ID
- Stricter limits for sensitive endpoints (login, signup)
- Account lockout after repeated failed login attempts
- X-Forwarded-For header trusted only behind known proxies

## Related Documentation

- [Security Hardening (V1.9.0)](../project/changelog.md#v190-security-hardening-release)
- [API Security Headers](./security-headers.md)
