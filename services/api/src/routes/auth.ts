/**
 * Authentication routes - JWT-based auth with email/password + SIWE
 * Reference: docs/specs/auth/feature-spec.md
 * V3.2: Added SIWE (Sign-In with Ethereum) authentication
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaClient, AuthProvider } from "@prisma/client";
import { getAddress, isAddress, recoverMessageAddress, type Hex } from "viem";
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

    // Verify nonce exists and hasn't been used
    const storedNonce = await prisma.siweNonce.findUnique({
      where: { nonce },
    });

    if (!storedNonce) {
      return next(createError("SIWE_NONCE_INVALID"));
    }

    if (storedNonce.isUsed) {
      return next(createError("SIWE_NONCE_USED"));
    }

    if (new Date() > storedNonce.expiresAt) {
      return next(createError("SIWE_NONCE_INVALID"));
    }

    // Verify signature using viem's recoverMessageAddress
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

    // Mark nonce as used
    await prisma.siweNonce.update({
      where: { nonce },
      data: { isUsed: true },
    });

    // Check if external provider already exists
    let externalProvider = await prisma.externalAuthProvider.findUnique({
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

      // Create user first with temporary wallet address
      user = await prisma.user.create({
        data: {
          email: null,
          passwordHash: null,
          displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
          walletAddress: "0x0000000000000000000000000000000000000000", // Temporary
          roles: [role],
        },
      });

      // Create AA wallet
      const walletInfo = await createWallet(user.id);

      // Update user with actual wallet address
      await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: walletInfo.address },
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

      // Refresh user data
      user = await prisma.user.findUnique({
        where: { id: user.id },
      });
    }

    if (!user) {
      return next(createError("INTERNAL_ERROR"));
    }

    // Generate JWT token
    const roles = user.roles as string[];
    const token = generateToken(user.id, {
      email: user.email ?? undefined,
      walletAddress: user.walletAddress,
      roles,
      expiresIn: "30d",
    });

    logger.info("SIWE authentication successful", {
      userId: user.id,
      address,
      chainId,
      isNewUser,
    });

    res.status(isNewUser ? 201 : 200).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: roles[0] || "CUSTOMER",
        walletAddress: user.walletAddress,
      },
      token,
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

    // Verify nonce
    const storedNonce = await prisma.siweNonce.findUnique({
      where: { nonce },
    });

    if (!storedNonce || storedNonce.isUsed || new Date() > storedNonce.expiresAt) {
      return next(createError("SIWE_NONCE_INVALID"));
    }

    // Verify signature using viem's recoverMessageAddress
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

    // Mark nonce as used
    await prisma.siweNonce.update({
      where: { nonce },
      data: { isUsed: true },
    });

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

export default router;
