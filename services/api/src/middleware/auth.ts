/**
 * JWT Authentication Middleware
 *
 * SECURITY AUDIT (V1.9.0):
 * - H-1: JWT secret strength validation at startup
 * - M-4: Security event logging for authentication failures
 * - L-1: Configurable bcrypt rounds
 *
 * V7.0.0 Security Updates (H-1):
 * - Primary: httpOnly signed cookies (XSS protection)
 * - Fallback: Bearer header (for mobile apps)
 * - Reduced token expiry (15min access + 7d refresh)
 */

import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";
import { COOKIE_NAMES, TOKEN_EXPIRY } from "../lib/cookie-config";

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
 * Extract JWT token from request
 * V7.0.0: Priority order:
 * 1. Signed httpOnly cookie (web clients - most secure)
 * 2. Bearer header (mobile clients - uses SecureStore)
 */
function extractToken(req: AuthenticatedRequest): string | null {
  // V7.0.0: Try signed cookie first (web clients)
  const cookieToken = req.signedCookies?.[COOKIE_NAMES.ACCESS_TOKEN];
  if (cookieToken && typeof cookieToken === 'string') {
    return cookieToken;
  }

  // Fallback: Bearer header (mobile clients)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }

  return null;
}

/**
 * Authentication middleware
 * V7.0.0: Reads from httpOnly cookies (web) or Bearer header (mobile)
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

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
      // V7.0.0: Include refresh hint for expired tokens
      res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
        refreshUrl: "/api/v1/auth/refresh"
      });
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
 * V7.0.0: Uses same token extraction as authenticate()
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

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
 * Token type for V7.0.0 dual-token system
 */
export type TokenType = 'access' | 'refresh';

/**
 * Generate a JWT token for a user
 * V7.0.0: Default to short-lived access tokens (15min)
 */
export function generateToken(
  userId: string,
  options: {
    email?: string;
    walletAddress?: string;
    roles?: string[];
    expiresIn?: string;
    tokenType?: TokenType;
  } = {}
): string {
  const payload: JWTPayload = {
    sub: userId,
    email: options.email,
    walletAddress: options.walletAddress,
    roles: options.roles,
  };

  // V7.0.0: Use appropriate expiry based on token type
  let expiry = options.expiresIn;
  if (!expiry) {
    expiry = options.tokenType === 'refresh' ? TOKEN_EXPIRY.REFRESH : TOKEN_EXPIRY.ACCESS;
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiry,
  } as jwt.SignOptions);
}

/**
 * Generate access and refresh token pair
 * V7.0.0: Used for login/signup responses
 */
export function generateTokenPair(
  userId: string,
  options: {
    email?: string;
    walletAddress?: string;
    roles?: string[];
  } = {}
): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateToken(userId, { ...options, tokenType: 'access' }),
    refreshToken: generateToken(userId, { ...options, tokenType: 'refresh' }),
  };
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
