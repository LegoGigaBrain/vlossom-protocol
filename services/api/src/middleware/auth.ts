/**
 * JWT Bearer token authentication middleware
 */

import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-change-in-production";

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
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

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
