/**
 * JWT Bearer token authentication middleware
 *
 * SECURITY AUDIT (V1.9.0):
 * - H-1: JWT secret strength validation at startup
 * - M-4: Security event logging for authentication failures
 * - L-1: Configurable bcrypt rounds
 */

import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

/**
 * H-1: Validate JWT secret strength at startup
 * Prevents weak secrets from being used in production
 */
function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required. " +
      "Set a strong, random secret (min 32 characters) in your .env file."
    );
  }

  // H-1: Minimum length check (32 characters for 256-bit security)
  if (secret.length < 32) {
    throw new Error(
      `FATAL: JWT_SECRET must be at least 32 characters (got ${secret.length}). ` +
      "Use a cryptographically random string."
    );
  }

  // H-1: Detect placeholder/weak secrets
  const placeholders = ['your-secret', 'changeme', 'secret123', 'jwt-secret', 'your_secret_key'];
  if (placeholders.some(p => secret.toLowerCase().includes(p))) {
    throw new Error(
      "FATAL: JWT_SECRET appears to be a placeholder value. " +
      "Generate a secure random secret for production use."
    );
  }

  return secret;
}

// SECURITY: Validate JWT_SECRET at startup
const JWT_SECRET: string = validateJwtSecret();

/**
 * L-1: Bcrypt rounds configuration (default 12 for 2025 security standards)
 */
export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  walletAddress?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Extended Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  userId?: string;
}

/**
 * Bearer token authentication middleware
 * Expects Authorization header: Bearer <token>
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Authorization header required" });
    return;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    res.status(401).json({ error: "Invalid authorization format. Use: Bearer <token>" });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (!decoded.sub) {
      res.status(401).json({ error: "Invalid token: missing subject" });
      return;
    }

    req.user = decoded;
    req.userId = decoded.sub;
    next();
  } catch (error) {
    // M-4: Security event logging for authentication failures
    const logSecurityEvent = (reason: string) => {
      logger.warn('Authentication failed', {
        event: 'auth_failure',
        reason,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
    };

    if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent('token_expired');
      res.status(401).json({ error: "Token expired" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('invalid_token');
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    logSecurityEvent('unknown_error');
    res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token present, but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    req.userId = decoded.sub;
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(
  userId: string,
  options: {
    email?: string;
    walletAddress?: string;
    roles?: string[];
    expiresIn?: string;
  } = {}
): string {
  const payload: JWTPayload = {
    sub: userId,
    email: options.email,
    walletAddress: options.walletAddress,
    roles: options.roles,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn ?? "24h",
  } as jwt.SignOptions);
}

/**
 * Verify a JWT token and return payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Alias for authenticate middleware (for cleaner route syntax)
 */
export const requireAuth = authenticate;

/**
 * Role-based authorization middleware
 * Must be used after authenticate middleware
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: userRoles,
      });
      return;
    }

    next();
  };
}
