/**
 * Authentication routes - JWT-based auth with email/password + SIWE
 * Reference: docs/specs/auth/feature-spec.md
 * V3.2: Added SIWE (Sign-In with Ethereum) authentication
 * V7.0.0: httpOnly cookies for JWT tokens (H-1 security fix)
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaClient, AuthProvider } from "@prisma/client";
import { getAddress, isAddress, recoverMessageAddress, type Hex } from "viem";
import { generateTokenPair, authenticate, type AuthenticatedRequest, BCRYPT_ROUNDS } from "../middleware/auth";
import { logger } from "../lib/logger";
import { createWallet } from "../lib/wallet/wallet-service";
import {
  rateLimiters,
  recordFailedLogin,
  clearLoginAttempts,
  isAccountLocked,
} from "../middleware/rate-limiter";
import { createError } from "../middleware/error-handler";
import {
  COOKIE_NAMES,
  ACCESS_TOKEN_OPTIONS,
  REFRESH_TOKEN_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} from "../lib/cookie-config";
import { setCsrfCookie, clearCsrfCookie } from "../middleware/csrf";

const router: ReturnType<typeof Router> = Router();
const prisma = new PrismaClient();

// SIWE Configuration (V3.2)
const SIWE_NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const SIWE_MESSAGE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const APP_NAME = "Vlossom";
const APP_URI = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Generate a random nonce for SIWE
 */
function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Create SIWE message for wallet to sign
 * Follows EIP-4361 spec: https://eips.ethereum.org/EIPS/eip-4361
 */
function createSiweMessage(
  address: string,
  nonce: string,
  chainId: number,
  issuedAt: Date
): string {
  const statement = "Sign in to Vlossom with your Ethereum wallet.";
  const expirationTime = new Date(issuedAt.getTime() + SIWE_MESSAGE_MAX_AGE_MS);

  // EIP-4361 SIWE message format
  return `${APP_NAME} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${APP_URI}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt.toISOString()}
Expiration Time: ${expirationTime.toISOString()}`;
}

/**
 * Parse SIWE message to extract fields
 */
function parseSiweMessage(message: string): {
  address: string;
  nonce: string;
  chainId: number;
  issuedAt: Date;
  expirationTime: Date;
} | null {
  try {
    const lines = message.split("\n");

    // Extract address (line 2 after "wants you to sign in...")
    const addressLine = lines[1];
    if (!addressLine || !isAddress(addressLine)) {
      return null;
    }

    // Find and parse each field
    let nonce = "";
    let chainId = 0;
    let issuedAt = new Date();
    let expirationTime = new Date();

    for (const line of lines) {
      if (line.startsWith("Nonce: ")) {
        nonce = line.substring(7);
      } else if (line.startsWith("Chain ID: ")) {
        chainId = parseInt(line.substring(10), 10);
      } else if (line.startsWith("Issued At: ")) {
        issuedAt = new Date(line.substring(11));
      } else if (line.startsWith("Expiration Time: ")) {
        expirationTime = new Date(line.substring(17));
      }
    }

    if (!nonce || !chainId) {
      return null;
    }

    return {
      address: getAddress(addressLine), // Checksum address
      nonce,
      chainId,
      issuedAt,
      expirationTime,
    };
  } catch {
    return null;
  }
}

/**
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     summary: Create new user account
 *     description: Register a new user with email and password. Rate limited to 3 attempts per hour.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "securepassword123"
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, STYLIST]
 *               displayName:
 *                 type: string
 *                 example: "Jane Doe"
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already exists
 *       429:
 *         $ref: '#/components/responses/RateLimited'
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

    // V7.0.0: Generate token pair and set httpOnly cookies
    const roles = user.roles as string[];
    const { accessToken, refreshToken } = generateTokenPair(user.id, {
      email: user.email ?? undefined,
      walletAddress: walletInfo.address,
      roles,
    });

    // Set httpOnly cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_TOKEN_OPTIONS);
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_OPTIONS);

    // Set CSRF token cookie (readable by JS)
    setCsrfCookie(res);

    logger.info("User signed up", {
      userId: user.id,
      email: user.email,
      role,
      walletAddress: walletInfo.address,
      isDeployed: walletInfo.isDeployed,
    });

    // V7.0.0: Still return token for mobile clients (they use Bearer header)
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role,
        walletAddress: walletInfo.address,
      },
      token: accessToken, // For mobile compatibility
    });
  } catch (error) {
    // Log detailed error for debugging - Prisma errors don't serialize well
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      // Prisma-specific properties
      code: (error as { code?: string }).code,
      meta: (error as { meta?: unknown }).meta,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    } : { error };
    logger.error("Signup error", errorDetails);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticate existing user. Rate limited to 5 attempts per 15 minutes with account lockout.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 *       429:
 *         $ref: '#/components/responses/RateLimited'
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

    // V7.0.0: Generate token pair and set httpOnly cookies
    const roles = user.roles as string[];
    const { accessToken, refreshToken } = generateTokenPair(user.id, {
      email: user.email ?? undefined,
      walletAddress: user.walletAddress,
      roles,
    });

    // Set httpOnly cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_TOKEN_OPTIONS);
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_OPTIONS);

    // Set CSRF token cookie (readable by JS)
    setCsrfCookie(res);

    logger.info("User logged in", {
      userId: user.id,
      email: user.email,
    });

    // V7.0.0: Still return token for mobile clients
    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: roles[0] || "CUSTOMER",
        walletAddress: user.walletAddress,
      },
      token: accessToken, // For mobile compatibility
    });
  } catch (error) {
    logger.error("Login error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/auth/logout
 * V7.0.0: Clear httpOnly cookies on logout
 */
router.post("/logout", authenticate, (req: AuthenticatedRequest, res: Response): void => {
  // V7.0.0: Clear all auth cookies
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, CLEAR_COOKIE_OPTIONS);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...CLEAR_COOKIE_OPTIONS, path: '/api/v1/auth/refresh' });
  clearCsrfCookie(res);

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

/**
 * PATCH /api/v1/auth/me
 * Update current user's profile
 */
router.patch("/me", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      return next(createError("UNAUTHORIZED"));
    }

    const { displayName, email, phone, avatarUrl } = req.body;

    // Build update data (only include provided fields)
    const updateData: Record<string, string | null> = {};

    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.length < 2) {
        return next(createError("VALIDATION_ERROR", { message: "Display name must be at least 2 characters" }));
      }
      updateData.displayName = displayName;
    }

    if (email !== undefined) {
      if (email !== null && email !== "") {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return next(createError("INVALID_EMAIL"));
        }
        // Check if email is already in use by another user
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== req.userId) {
          return next(createError("EMAIL_EXISTS"));
        }
      }
      updateData.email = email || null;
    }

    if (phone !== undefined) {
      if (phone !== null && phone !== "") {
        // Basic phone validation
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phone)) {
          return next(createError("VALIDATION_ERROR", { message: "Invalid phone number format" }));
        }
        // Check if phone is already in use
        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser && existingUser.id !== req.userId) {
          return next(createError("VALIDATION_ERROR", { message: "Phone number already in use" }));
        }
      }
      updateData.phone = phone || null;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl || null;
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
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

    const roles = user.roles as string[];
    logger.info("User profile updated", { userId: req.userId, fields: Object.keys(updateData) });

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
    logger.error("Update user error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// SIWE (Sign-In with Ethereum) Routes - V3.2
// ============================================================================

/**
 * POST /api/v1/auth/siwe/challenge
 * Generate a SIWE challenge for wallet authentication
 * V3.2: Returns a nonce and message for wallet to sign
 */
router.post("/siwe/challenge", rateLimiters.login, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address, chainId = 84532 } = req.body; // Default to Base Sepolia

    // Validate address
    if (!address || !isAddress(address)) {
      return next(createError("MISSING_FIELD", { fields: ["address"] }));
    }

    // Normalize address to checksum format
    const checksumAddress = getAddress(address);

    // Generate nonce and store it
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + SIWE_NONCE_EXPIRY_MS);
    const issuedAt = new Date();

    await prisma.siweNonce.create({
      data: {
        nonce,
        address: checksumAddress,
        expiresAt,
      },
    });

    // Create SIWE message
    const message = createSiweMessage(checksumAddress, nonce, chainId, issuedAt);

    logger.info("SIWE challenge created", {
      address: checksumAddress,
      chainId,
      nonce,
    });

    res.json({
      message,
      nonce,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error("SIWE challenge error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/auth/siwe
 * Verify SIWE signature and authenticate/create user
 * V3.2: Creates user with AA wallet if new, returns JWT token
 */
router.post("/siwe", rateLimiters.login, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, signature, role = "CUSTOMER" } = req.body;

    // Validate inputs
    if (!message || !signature) {
      return next(createError("MISSING_FIELD", { fields: ["message", "signature"] }));
    }

    // Parse the SIWE message
    const parsed = parseSiweMessage(message);
    if (!parsed) {
      return next(createError("INVALID_SIWE_MESSAGE"));
    }

    const { address, nonce, chainId, expirationTime } = parsed;

    // Check if message has expired
    if (new Date() > expirationTime) {
      return next(createError("SIWE_MESSAGE_EXPIRED"));
    }

    // Verify signature using viem's recoverMessageAddress BEFORE consuming nonce
    // This prevents wasting nonces on invalid signatures
    let recoveredAddress: string;
    try {
      recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as Hex,
      });
    } catch {
      return next(createError("INVALID_SIWE_SIGNATURE"));
    }

    // Check if recovered address matches (both checksummed)
    if (getAddress(recoveredAddress) !== address) {
      return next(createError("INVALID_SIWE_SIGNATURE"));
    }

    // SECURITY FIX (C-1): Atomically verify AND consume nonce in a single transaction
    // This prevents race condition where multiple requests could use the same nonce
    // Reference: Security Review C-1 - SIWE Nonce Replay Attack
    try {
      await prisma.$transaction(async (tx) => {
        const nonceRecord = await tx.siweNonce.findUnique({
          where: { nonce },
        });

        if (!nonceRecord) {
          throw new Error("SIWE_NONCE_INVALID");
        }

        if (nonceRecord.isUsed) {
          throw new Error("SIWE_NONCE_USED");
        }

        if (new Date() > nonceRecord.expiresAt) {
          throw new Error("SIWE_NONCE_EXPIRED");
        }

        // Atomically mark nonce as used within the same transaction
        await tx.siweNonce.update({
          where: { nonce },
          data: { isUsed: true },
        });
      });
    } catch (nonceError) {
      // Map transaction errors to proper API errors
      const errorMessage = nonceError instanceof Error ? nonceError.message : "SIWE_NONCE_INVALID";
      if (errorMessage === "SIWE_NONCE_USED") {
        return next(createError("SIWE_NONCE_USED"));
      }
      if (errorMessage === "SIWE_NONCE_EXPIRED") {
        return next(createError("SIWE_NONCE_INVALID"));
      }
      return next(createError("SIWE_NONCE_INVALID"));
    }

    // Check if external provider already exists
    const externalProvider = await prisma.externalAuthProvider.findUnique({
      where: { address },
      include: { user: true },
    });

    let user;
    let isNewUser = false;

    if (externalProvider) {
      // Existing user - just log them in
      user = externalProvider.user;
    } else {
      // New user - create account with AA wallet
      isNewUser = true;

      // Validate role
      if (!["CUSTOMER", "STYLIST"].includes(role)) {
        return next(createError("INVALID_ROLE"));
      }

      // Use a transaction to ensure atomicity
      try {
        // Create AA wallet first (before user, so we get the address)
        // We'll use a temporary user ID based on the address hash
        const tempUserId = Buffer.from(address.slice(2), "hex").toString("base64").slice(0, 36);
        const walletInfo = await createWallet(tempUserId);

        // Now create user with actual AA wallet address
        user = await prisma.user.create({
          data: {
            email: null,
            passwordHash: null,
            displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
            walletAddress: walletInfo.address,
            roles: [role],
          },
        });

        // Update wallet record with actual user ID
        await prisma.wallet.updateMany({
          where: { address: walletInfo.address },
          data: { userId: user.id },
        });

        // Create external auth provider
        await prisma.externalAuthProvider.create({
          data: {
            userId: user.id,
            provider: AuthProvider.ETHEREUM,
            address,
            chainId,
          },
        });

        // Create linked account record
        await prisma.linkedAccount.create({
          data: {
            userId: user.id,
            provider: AuthProvider.ETHEREUM,
            identifier: address,
            isPrimary: true,
            verifiedAt: new Date(),
          },
        });
      } catch (walletError) {
        logger.error("Failed to create AA wallet for SIWE user", { error: walletError, address });
        return next(createError("WALLET_CREATION_FAILED"));
      }
    }

    if (!user) {
      return next(createError("INTERNAL_ERROR"));
    }

    // V7.0.0: Generate token pair and set httpOnly cookies
    const roles = user.roles as string[];
    const { accessToken, refreshToken } = generateTokenPair(user.id, {
      email: user.email ?? undefined,
      walletAddress: user.walletAddress,
      roles,
    });

    // Set httpOnly cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_TOKEN_OPTIONS);
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, REFRESH_TOKEN_OPTIONS);

    // Set CSRF token cookie (readable by JS)
    setCsrfCookie(res);

    logger.info("SIWE authentication successful", {
      userId: user.id,
      address,
      chainId,
      isNewUser,
    });

    // V7.0.0: Still return token for mobile clients
    res.status(isNewUser ? 201 : 200).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: roles[0] || "CUSTOMER",
        walletAddress: user.walletAddress,
      },
      token: accessToken, // For mobile compatibility
      isNewUser,
    });
  } catch (error) {
    logger.error("SIWE authentication error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// Account Linking Routes - V3.2
// ============================================================================

/**
 * GET /api/v1/auth/linked-accounts
 * Get all linked authentication methods for the current user
 * V3.2: Returns list of linked accounts (email, wallets)
 */
router.get("/linked-accounts", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      return next(createError("UNAUTHORIZED"));
    }

    const linkedAccounts = await prisma.linkedAccount.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        provider: true,
        identifier: true,
        isPrimary: true,
        verifiedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Mask email addresses for privacy
    const maskedAccounts = linkedAccounts.map((account) => ({
      ...account,
      identifier:
        account.provider === AuthProvider.EMAIL
          ? account.identifier.replace(/(.{2})(.*)(@.*)/, "$1***$3")
          : `${account.identifier.slice(0, 6)}...${account.identifier.slice(-4)}`,
      identifierFull: account.identifier, // Full identifier for the current user
    }));

    res.json({ linkedAccounts: maskedAccounts });
  } catch (error) {
    logger.error("Get linked accounts error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/auth/link-wallet
 * Link an external wallet to the current user's account
 * V3.2: Requires SIWE signature to prove wallet ownership
 */
router.post("/link-wallet", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      return next(createError("UNAUTHORIZED"));
    }

    const { message, signature } = req.body;

    if (!message || !signature) {
      return next(createError("MISSING_FIELD", { fields: ["message", "signature"] }));
    }

    // Parse the SIWE message
    const parsed = parseSiweMessage(message);
    if (!parsed) {
      return next(createError("INVALID_SIWE_MESSAGE"));
    }

    const { address, nonce, chainId, expirationTime } = parsed;

    // Check if message has expired
    if (new Date() > expirationTime) {
      return next(createError("SIWE_MESSAGE_EXPIRED"));
    }

    // Verify signature using viem's recoverMessageAddress BEFORE consuming nonce
    // This prevents wasting nonces on invalid signatures
    let recoveredAddress: string;
    try {
      recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as Hex,
      });
    } catch {
      return next(createError("INVALID_SIWE_SIGNATURE"));
    }

    if (getAddress(recoveredAddress) !== address) {
      return next(createError("INVALID_SIWE_SIGNATURE"));
    }

    // SECURITY FIX (H-3): Atomically verify AND consume nonce in a single transaction
    // This prevents race condition where multiple requests could use the same nonce
    // Reference: V7.0.0 Security Review H-3
    try {
      await prisma.$transaction(async (tx) => {
        const nonceRecord = await tx.siweNonce.findUnique({
          where: { nonce },
        });

        if (!nonceRecord) {
          throw new Error("SIWE_NONCE_INVALID");
        }

        if (nonceRecord.isUsed) {
          throw new Error("SIWE_NONCE_USED");
        }

        if (new Date() > nonceRecord.expiresAt) {
          throw new Error("SIWE_NONCE_EXPIRED");
        }

        // Atomically mark nonce as used within the same transaction
        await tx.siweNonce.update({
          where: { nonce },
          data: { isUsed: true },
        });
      });
    } catch (nonceError) {
      // Map transaction errors to proper API errors
      const errorMessage = nonceError instanceof Error ? nonceError.message : "SIWE_NONCE_INVALID";
      if (errorMessage === "SIWE_NONCE_USED") {
        return next(createError("SIWE_NONCE_USED"));
      }
      if (errorMessage === "SIWE_NONCE_EXPIRED") {
        return next(createError("SIWE_NONCE_INVALID"));
      }
      return next(createError("SIWE_NONCE_INVALID"));
    }

    // Check if wallet is already linked to another account
    const existingProvider = await prisma.externalAuthProvider.findUnique({
      where: { address },
    });

    if (existingProvider) {
      if (existingProvider.userId === req.userId) {
        return next(createError("DUPLICATE_ENTRY", { message: "This wallet is already linked to your account" }));
      }
      return next(createError("WALLET_ALREADY_LINKED"));
    }

    // Create external auth provider
    await prisma.externalAuthProvider.create({
      data: {
        userId: req.userId,
        provider: AuthProvider.ETHEREUM,
        address,
        chainId,
      },
    });

    // Create linked account record
    const linkedAccount = await prisma.linkedAccount.create({
      data: {
        userId: req.userId,
        provider: AuthProvider.ETHEREUM,
        identifier: address,
        isPrimary: false,
        verifiedAt: new Date(),
      },
    });

    logger.info("Wallet linked successfully", {
      userId: req.userId,
      address,
      chainId,
    });

    res.status(201).json({
      linkedAccount: {
        id: linkedAccount.id,
        provider: linkedAccount.provider,
        identifier: `${address.slice(0, 6)}...${address.slice(-4)}`,
        identifierFull: address,
        isPrimary: linkedAccount.isPrimary,
        verifiedAt: linkedAccount.verifiedAt,
        createdAt: linkedAccount.createdAt,
      },
    });
  } catch (error) {
    logger.error("Link wallet error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * DELETE /api/v1/auth/unlink-account/:id
 * Unlink an authentication method from the current user's account
 * V3.2: Prevents unlinking if it's the only auth method
 */
router.delete("/unlink-account/:id", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      return next(createError("UNAUTHORIZED"));
    }

    const { id } = req.params;

    // Find the linked account
    const linkedAccount = await prisma.linkedAccount.findFirst({
      where: { id, userId: req.userId },
    });

    if (!linkedAccount) {
      return next(createError("AUTH_METHOD_NOT_FOUND"));
    }

    // Count remaining auth methods
    const accountCount = await prisma.linkedAccount.count({
      where: { userId: req.userId },
    });

    // Check if user has password (email auth)
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { passwordHash: true },
    });

    // Prevent unlinking if it's the only auth method
    if (accountCount <= 1 && !user?.passwordHash) {
      return next(createError("CANNOT_UNLINK_LAST_AUTH"));
    }

    // If unlinking email and no password, also prevent
    if (linkedAccount.provider === AuthProvider.EMAIL && accountCount <= 1) {
      return next(createError("CANNOT_UNLINK_LAST_AUTH"));
    }

    // Delete the linked account
    await prisma.linkedAccount.delete({
      where: { id },
    });

    // If it's an Ethereum provider, also delete the external auth provider
    if (linkedAccount.provider === AuthProvider.ETHEREUM) {
      await prisma.externalAuthProvider.deleteMany({
        where: {
          userId: req.userId,
          address: linkedAccount.identifier,
        },
      });
    }

    logger.info("Account unlinked successfully", {
      userId: req.userId,
      provider: linkedAccount.provider,
      identifier: linkedAccount.identifier,
    });

    res.json({ message: "Account unlinked successfully" });
  } catch (error) {
    logger.error("Unlink account error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// Password Reset Routes
// ============================================================================

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset email
 * V7.0.0 (M-2): Added proper rate limiting (3/hour with 60-min block)
 */
router.post("/forgot-password", rateLimiters.passwordReset, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createError("MISSING_FIELD", { fields: ["email"] }));
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      message: "If an account exists with this email, you will receive a password reset link.",
    };

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      // User doesn't exist or doesn't have password auth - return success anyway
      logger.info("Password reset requested for non-existent or non-password user", { email });
      res.json(successResponse);
      return;
    }

    // Invalidate any existing tokens
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() }, // Expire immediately
    });

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send email via SendGrid
    // V8.0.0 Security Fix: Never log password reset links in production
    const resetLink = `${APP_URI}/reset-password?token=${token}`;
    logger.info("Password reset token created", {
      userId: user.id,
      email: user.email,
      // V8.0.0: Only include link in development for debugging
      ...(process.env.NODE_ENV === 'development' ? { resetLink } : {}),
      expiresAt,
    });

    res.json(successResponse);
  } catch (error) {
    logger.error("Forgot password error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/auth/reset-password/validate
 * V7.0.0 (H-6): Validate reset token before showing form
 * Checks token format, existence, and expiration
 */
router.get("/reset-password/validate", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.json({ valid: false });
      return;
    }

    // V7.0.0 (H-6): Validate token format - must be 64 hex characters
    if (!/^[0-9a-fA-F]{64}$/.test(token)) {
      res.json({ valid: false });
      return;
    }

    // Check token exists and is valid
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      res.json({ valid: false });
      return;
    }

    if (resetToken.usedAt) {
      res.json({ valid: false, expired: false });
      return;
    }

    if (new Date() > resetToken.expiresAt) {
      res.json({ valid: false, expired: true });
      return;
    }

    res.json({ valid: true });
  } catch (error) {
    logger.error("Reset token validation error", { error });
    res.json({ valid: false });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
router.post("/reset-password", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(createError("MISSING_FIELD", { fields: ["token", "password"] }));
    }

    // V7.0.0 (H-6): Validate token format - must be 64 hex characters
    if (typeof token !== 'string' || !/^[0-9a-fA-F]{64}$/.test(token)) {
      return next(createError("INVALID_RESET_TOKEN"));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(createError("WEAK_PASSWORD"));
    }

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return next(createError("INVALID_RESET_TOKEN"));
    }

    if (resetToken.usedAt) {
      return next(createError("RESET_TOKEN_USED"));
    }

    if (new Date() > resetToken.expiresAt) {
      return next(createError("RESET_TOKEN_EXPIRED"));
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    logger.info("Password reset successful", {
      userId: resetToken.userId,
    });

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    logger.error("Reset password error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/auth/change-password
 * Change password for authenticated user
 */
router.post("/change-password", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.userId) {
      return next(createError("UNAUTHORIZED"));
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(createError("MISSING_FIELD", { fields: ["currentPassword", "newPassword"] }));
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return next(createError("WEAK_PASSWORD"));
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user || !user.passwordHash) {
      return next(createError("NO_PASSWORD_AUTH"));
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return next(createError("INVALID_CURRENT_PASSWORD"));
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash },
    });

    logger.info("Password changed successfully", {
      userId: req.userId,
    });

    res.json({ message: "Password changed successfully." });
  } catch (error) {
    logger.error("Change password error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

// ============================================================================
// Token Refresh Routes - V7.0.0
// ============================================================================

/**
 * POST /api/v1/auth/refresh
 * V7.0.0: Refresh access token using refresh token cookie
 * Returns new access token in httpOnly cookie
 */
router.post("/refresh", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get refresh token from signed cookie
    const refreshToken = req.signedCookies?.[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      return next(createError("UNAUTHORIZED", { message: "Refresh token required" }));
    }

    // Verify refresh token
    let decoded;
    try {
      // Import verifyToken from auth middleware
      const jwt = await import("jsonwebtoken");
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(createError("INTERNAL_ERROR"));
      }
      decoded = jwt.default.verify(refreshToken, jwtSecret) as { sub: string; email?: string; walletAddress?: string; roles?: string[] };
    } catch (error) {
      logger.warn("Invalid refresh token", { error });
      // Clear invalid cookies
      res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, CLEAR_COOKIE_OPTIONS);
      res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...CLEAR_COOKIE_OPTIONS, path: '/api/v1/auth/refresh' });
      return next(createError("UNAUTHORIZED", { message: "Invalid refresh token" }));
    }

    if (!decoded.sub) {
      return next(createError("UNAUTHORIZED", { message: "Invalid token payload" }));
    }

    // Get user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, walletAddress: true, roles: true },
    });

    if (!user) {
      return next(createError("USER_NOT_FOUND"));
    }

    // Generate new token pair (refresh token rotation for security)
    const roles = user.roles as string[];
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user.id, {
      email: user.email ?? undefined,
      walletAddress: user.walletAddress,
      roles,
    });

    // Set new cookies
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_TOKEN_OPTIONS);
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, REFRESH_TOKEN_OPTIONS);

    // Ensure CSRF token exists
    setCsrfCookie(res);

    logger.info("Token refreshed", { userId: user.id });

    res.json({
      message: "Token refreshed successfully",
      // Return access token for mobile clients
      token: accessToken,
    });
  } catch (error) {
    logger.error("Token refresh error", { error });
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
