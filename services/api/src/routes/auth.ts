/**
 * Authentication routes - JWT-based auth with email/password
 * Reference: docs/specs/auth/feature-spec.md
 */

import { Router, type Request, type Response } from "express";
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

const router = Router();
const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

/**
 * POST /api/auth/signup
 * Create new user account with email/password
 * F4.7: Rate limited to 3 attempts per hour
 */
router.post("/signup", rateLimiters.signup, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, displayName } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    if (!role || !["CUSTOMER", "STYLIST"].includes(role)) {
      res.status(400).json({ error: "Role must be either CUSTOMER or STYLIST" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: "This email is already registered" });
      return;
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
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with email/password
 * F4.7: Rate limited to 5 attempts per 15 minutes, with account lockout
 */
router.post("/login", rateLimiters.login, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // F4.7: Check if account is locked
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      const retryAfter = Math.ceil((lockStatus.lockedUntil! - Date.now()) / 1000);
      logger.warn("Login attempt on locked account", { email });
      res.status(423).json({
        error: "Account temporarily locked due to too many failed attempts",
        retryAfter,
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // F4.7: Record failed attempt
      const attempt = recordFailedLogin(email);
      logger.warn("Failed login attempt - user not found", { email });
      res.status(401).json({
        error: "Invalid email or password",
        remainingAttempts: attempt.remainingAttempts,
      });
      return;
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
        res.status(423).json({
          error: "Account temporarily locked due to too many failed attempts",
          retryAfter: Math.ceil((attempt.lockedUntil! - Date.now()) / 1000),
        });
        return;
      }

      res.status(401).json({
        error: "Invalid email or password",
        remainingAttempts: attempt.remainingAttempts,
      });
      return;
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
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/logout
 * Clear JWT token (frontend will handle token removal)
 */
router.post("/logout", authenticate, (req: AuthenticatedRequest, res: Response): void => {
  logger.info("User logged out", { userId: req.userId });
  res.json({ message: "Logged out successfully" });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
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
      res.status(404).json({ error: "User not found" });
      return;
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
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
