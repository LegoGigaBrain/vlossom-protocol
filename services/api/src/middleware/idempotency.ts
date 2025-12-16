/**
 * Idempotency Middleware (M-2)
 *
 * Implements Stripe-style idempotency for payment operations.
 * Prevents duplicate operations when clients retry requests.
 *
 * Usage:
 * - Client sends `Idempotency-Key` header with unique key (e.g., UUID)
 * - If key exists and not expired, return cached response
 * - Otherwise, execute request and cache response for 24 hours
 *
 * Reference: https://stripe.com/docs/api/idempotent_requests
 */

import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { createError } from "./error-handler";

// Extend Express Request to include idempotency key
declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

const IDEMPOTENCY_TTL_HOURS = 24;

/**
 * Middleware to require idempotency key header for payment operations
 */
export function requireIdempotencyKey(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const idempotencyKey = req.headers["idempotency-key"] as string;

  if (!idempotencyKey) {
    return next(
      createError("VALIDATION_ERROR", {
        message:
          "Idempotency-Key header is required for this operation. " +
          "Provide a unique key (e.g., UUID) to prevent duplicate requests.",
      })
    );
  }

  // Validate key format (should be UUID or similar unique identifier)
  if (idempotencyKey.length < 16 || idempotencyKey.length > 64) {
    return next(
      createError("VALIDATION_ERROR", {
        message:
          "Idempotency-Key must be between 16 and 64 characters. " +
          "Use a UUID or similar unique identifier.",
      })
    );
  }

  req.idempotencyKey = idempotencyKey;
  next();
}

/**
 * Check if we have a cached response for this idempotency key
 * Returns the cached response if found and not expired, null otherwise
 */
export async function checkIdempotency(
  key: string
): Promise<{ response: unknown; statusCode: number } | null> {
  try {
    const existing = await prisma.idempotentRequest.findUnique({
      where: { key },
    });

    if (!existing) {
      return null;
    }

    // Check if expired
    if (existing.expiresAt < new Date()) {
      // Clean up expired entry
      await prisma.idempotentRequest
        .delete({ where: { key } })
        .catch(() => {}); // Ignore errors on cleanup
      return null;
    }

    return {
      response: existing.response,
      statusCode: existing.statusCode,
    };
  } catch (error) {
    console.error("Error checking idempotency:", error);
    // On error, proceed with request (fail open for availability)
    return null;
  }
}

/**
 * Store the response for an idempotent request
 */
export async function storeIdempotentResponse(
  key: string,
  response: unknown,
  statusCode: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000);

  try {
    await prisma.idempotentRequest.upsert({
      where: { key },
      create: {
        key,
        response: response as object,
        statusCode,
        expiresAt,
      },
      update: {
        response: response as object,
        statusCode,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Error storing idempotent response:", error);
    // Don't throw - request already succeeded, just caching failed
  }
}

/**
 * Middleware that handles full idempotency check and response caching
 * Use this for routes that need automatic idempotency handling
 */
export function withIdempotency(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.idempotencyKey;

    // If no idempotency key, just run handler normally
    if (!idempotencyKey) {
      return handler(req, res, next);
    }

    // Check for cached response
    const cached = await checkIdempotency(idempotencyKey);
    if (cached) {
      // Return cached response with header indicating it's a replay
      res.setHeader("Idempotency-Replayed", "true");
      return res.status(cached.statusCode).json(cached.response);
    }

    // Capture the response to cache it
    const originalJson = res.json.bind(res);
    let responseBody: unknown;
    let responseStatus: number | undefined;

    res.json = (body: unknown) => {
      responseBody = body;
      responseStatus = res.statusCode;
      return originalJson(body);
    };

    // Run the handler
    await handler(req, res, next);

    // Cache the response if it was successful (2xx) or client error (4xx)
    // Don't cache 5xx errors as they might be transient
    if (responseBody !== undefined && responseStatus !== undefined && responseStatus < 500) {
      await storeIdempotentResponse(idempotencyKey, responseBody, responseStatus);
    }
  };
}

/**
 * Cleanup expired idempotent requests
 * Should be called periodically (e.g., every hour via cron)
 */
export async function cleanupExpiredIdempotentRequests(): Promise<number> {
  try {
    const result = await prisma.idempotentRequest.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  } catch (error) {
    console.error("Error cleaning up idempotent requests:", error);
    return 0;
  }
}
