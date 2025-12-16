/**
 * Authentication routes - JWT-based auth with email/password
 * Reference: docs/specs/auth/feature-spec.md
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken, authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import { createWallet } from "../lib/wallet/wallet-service";
import {
  rateLimiters,
  recordFailedLogin,
  clearLoginAttempts,
  isAccountLocked,
} from "../middleware/rate-limiter";
import { createError } from "../middleware/error-handler";

const router: ReturnType<typeof Router> = Router();
const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

/**
 * POST /api/v1/auth/signup
 * Create new user account with email/password
 * F4.7: Rate limited to 3 attempts per hour
 */
router.post("/signup", rateLimiters.signup, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role, displayName } = req.body;

    // Validation
    if (!email || !password) {
      return next(createError("MISSING_FIELD", { fields: ["email", "password"] }));
    }

    if (password.length < 8) {
      return next(createError("WEAK_PASSWORD"));
    }

    if (!role || !["CUSTOMER", "STYLIST"].includes(role)) {
      return next(createError("INVALID_ROLE"));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createError("EMAIL_EXISTS"));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split("@")[0],
        walletAddress: "0x0000000000000000000000000000000000000000", // Temporary, will be updated
        roles: [role],
      },
    });

    // Create AA wallet using deterministic CREATE2
    const walletInfo = await createWallet(user.id);

    // Update user with actual wallet address
    await prisma.user.update({
      where: { id: user.id },
      data: { walletAddress: walletInfo.address },
    });

    // Generate JWT token
    const token = generateToken(user.id, {
      email: user.email ?? undefined,
      walletAddress: walletInfo.address,
      roles: user.roles as string[],
      expiresIn: "30d",
    });

    logger.info("User signed up", {
      userId: user.id,
      email: user.email,
      role,
      walletAddress: walletInfo.address,
      isDeployed: walletInfo.isDeployed,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role,
        walletAddress: walletInfo.address,
      },
      token,
    });
  } catch (error) {
    logger.error("Signup error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate existing user with email/password
 * F4.7: Rate limited to 5 attempts per 15 minutes, with account lockout
 */
router.post("/login", rateLimiters.login, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return next(createError("MISSING_FIELD", { fields: ["email", "password"] }));
    }

    // F4.7: Check if account is locked
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      const retryAfter = Math.ceil((lockStatus.lockedUntil! - Date.now()) / 1000);
      logger.warn("Login attempt on locked account", { email });
      return next(createError("ACCOUNT_LOCKED", { retryAfter }));
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // F4.7: Record failed attempt
      const attempt = recordFailedLogin(email);
      logger.warn("Failed login attempt - user not found", { email });
      return next(createError("INVALID_CREDENTIALS", { remainingAttempts: attempt.remainingAttempts }));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // F4.7: Record failed attempt
      const attempt = recordFailedLogin(email);
      logger.warn("Failed login attempt - wrong password", {
        userId: user.id,
        email,
      });

      if (attempt.locked) {
        return next(createError("ACCOUNT_LOCKED", { retryAfter: Math.ceil((attempt.lockedUntil! - Date.now()) / 1000) }));
      }

      return next(createError("INVALID_CREDENTIALS", { remainingAttempts: attempt.remainingAttempts }));
    }

    // F4.7: Clear failed login attempts on successful login
    clearLoginAttempts(email);

    // Generate JWT token
    const roles = user.roles as string[];
    const token = generateToken(user.id, {
      email: user.email ?? undefined,
      walletAddress: user.walletAddress,
      roles,
      expiresIn: "30d",
    });

    logger.info("User logged in", {
      userId: user.id,
      email: user.email,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: roles[0] || "CUSTOMER",
        walletAddress: user.walletAddress,
      },
      token,
    });
  } catch (error) {
    logger.error("Login error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/auth/logout
 * Clear JWT token (frontend will handle token removal)
 */
router.post("/logout", authenticate, (req: AuthenticatedRequest, res: Response): void => {
  logger.info("User logged out", { userId: req.userId });
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get("/me", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      return next(createError("UNAUTHORIZED"));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        walletAddress: true,
        roles: true,
        avatarUrl: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      return next(createError("USER_NOT_FOUND"));
    }

    const roles = user.roles as string[];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: roles[0] || "CUSTOMER",
        walletAddress: user.walletAddress,
        avatarUrl: user.avatarUrl,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    logger.error("Get user error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
