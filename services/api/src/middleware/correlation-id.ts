/**
 * Correlation ID Middleware
 *
 * Generates or extracts a unique request ID for every request.
 * This ID is used for tracing requests through logs, errors, and downstream services.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request interface to include requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// Header name for correlation ID
export const CORRELATION_ID_HEADER = 'X-Request-ID';

/**
 * Middleware that generates or extracts a correlation ID for each request
 *
 * - If the incoming request has an X-Request-ID header, use it
 * - Otherwise, generate a new UUID
 * - Attach the ID to the request object for use in handlers
 * - Add the ID to the response headers for client-side tracing
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Get existing correlation ID from header or generate new one
  const requestId = (req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string) || randomUUID();

  // Attach to request object for use in route handlers
  req.requestId = requestId;

  // Add to response headers for client-side tracing
  res.setHeader(CORRELATION_ID_HEADER, requestId);

  next();
}

/**
 * Get the current request ID from the request object
 * Returns undefined if called outside of a request context
 */
export function getRequestId(req?: Request): string | undefined {
  return req?.requestId;
}

export default correlationIdMiddleware;
