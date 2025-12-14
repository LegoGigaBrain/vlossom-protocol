/**
 * Internal service-to-service authentication middleware
 * Used for internal API calls (e.g., wallet creation on signup)
 */

import { type Request, type Response, type NextFunction } from "express";

const INTERNAL_AUTH_SECRET = process.env.INTERNAL_AUTH_SECRET || "internal-dev-secret";

/**
 * Extended Request for internal service calls
 */
export interface InternalRequest extends Request {
  isInternal?: boolean;
  serviceName?: string;
}

/**
 * Internal authentication middleware
 * Expects X-Internal-Auth header with shared secret
 */
export function internalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["x-internal-auth"] as string | undefined;
  const serviceName = req.headers["x-service-name"] as string | undefined;

  if (!authHeader) {
    res.status(401).json({ error: "Internal authentication required" });
    return;
  }

  if (authHeader !== INTERNAL_AUTH_SECRET) {
    res.status(403).json({ error: "Invalid internal authentication" });
    return;
  }

  (req as InternalRequest).isInternal = true;
  (req as InternalRequest).serviceName = serviceName;
  next();
}

/**
 * Combined auth middleware that accepts either JWT or internal auth
 * Useful for endpoints that can be called both by users and internal services
 */
export function flexibleAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const internalAuthHeader = req.headers["x-internal-auth"] as string | undefined;

  if (internalAuthHeader === INTERNAL_AUTH_SECRET) {
    (req as InternalRequest).isInternal = true;
    next();
    return;
  }

  // Fall through to JWT auth (will be handled by authenticate middleware)
  next();
}

/**
 * Generate internal auth headers for service-to-service calls
 */
export function getInternalAuthHeaders(serviceName: string): Record<string, string> {
  return {
    "X-Internal-Auth": INTERNAL_AUTH_SECRET,
    "X-Service-Name": serviceName,
  };
}
