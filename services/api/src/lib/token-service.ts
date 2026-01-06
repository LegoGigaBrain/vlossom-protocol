/**
 * V8.0.0: Refresh Token Service
 *
 * Provides secure refresh token management with:
 * - Database storage for token revocation
 * - Token rotation with family tracking
 * - Token reuse detection
 * - SHA-256 hashing (never store plaintext tokens)
 */

import { createHash, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

// Token configuration
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const TOKEN_BYTES = 32; // 256-bit random token

/**
 * Hash a token using SHA-256
 * We never store plaintext refresh tokens
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Create a new refresh token and store it in the database
 * Returns the plaintext token (to be sent to client) and the stored record
 */
export async function createRefreshToken(
  userId: string,
  options: {
    userAgent?: string;
    ipAddress?: string;
    familyId?: string; // For token rotation, use existing family
  } = {}
): Promise<{ token: string; tokenId: string; familyId: string }> {
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const familyId = options.familyId || randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const record = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      familyId,
      expiresAt,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
    },
  });

  logger.info("Refresh token created", { userId, familyId, tokenId: record.id });

  return {
    token,
    tokenId: record.id,
    familyId,
  };
}

/**
 * Validate a refresh token and return the associated record
 * Returns null if token is invalid, expired, or revoked
 */
export async function validateRefreshToken(
  token: string
): Promise<{
  valid: boolean;
  userId?: string;
  tokenId?: string;
  familyId?: string;
  reuseDetected?: boolean;
}> {
  const tokenHash = hashToken(token);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // Token not found
  if (!record) {
    return { valid: false };
  }

  // Token expired
  if (record.expiresAt < new Date()) {
    logger.warn("Expired refresh token used", { tokenId: record.id, userId: record.userId });
    return { valid: false };
  }

  // Token revoked
  if (record.revokedAt) {
    logger.warn("Revoked refresh token reuse detected", {
      tokenId: record.id,
      userId: record.userId,
      familyId: record.familyId,
    });

    // Token reuse attack detected! Revoke entire family
    await revokeTokenFamily(record.familyId, "Token reuse detected - potential attack");

    return { valid: false, reuseDetected: true };
  }

  // Token already rotated (has a replacement)
  if (record.replacedById) {
    logger.warn("Already-rotated refresh token used", {
      tokenId: record.id,
      userId: record.userId,
      familyId: record.familyId,
    });

    // Token reuse attack detected! Revoke entire family
    await revokeTokenFamily(record.familyId, "Rotated token reused - potential attack");

    return { valid: false, reuseDetected: true };
  }

  return {
    valid: true,
    userId: record.userId,
    tokenId: record.id,
    familyId: record.familyId,
  };
}

/**
 * Rotate a refresh token: invalidate old one and create new one
 * Used during token refresh to implement rotation
 */
export async function rotateRefreshToken(
  oldToken: string,
  options: {
    userAgent?: string;
    ipAddress?: string;
  } = {}
): Promise<{
  success: boolean;
  newToken?: string;
  userId?: string;
  error?: string;
}> {
  const validation = await validateRefreshToken(oldToken);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.reuseDetected ? "Token reuse detected" : "Invalid token",
    };
  }

  const oldTokenHash = hashToken(oldToken);

  // Create new token with same family
  const { token: newToken, tokenId: newTokenId } = await createRefreshToken(
    validation.userId!,
    {
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
      familyId: validation.familyId,
    }
  );

  // Mark old token as replaced
  await prisma.refreshToken.update({
    where: { tokenHash: oldTokenHash },
    data: { replacedById: newTokenId },
  });

  logger.info("Refresh token rotated", {
    userId: validation.userId,
    oldTokenId: validation.tokenId,
    newTokenId,
    familyId: validation.familyId,
  });

  return {
    success: true,
    newToken,
    userId: validation.userId,
  };
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  try {
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all tokens in a family (for security incidents)
 */
export async function revokeTokenFamily(familyId: string, reason: string): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  logger.warn("Token family revoked", { familyId, reason, tokensRevoked: result.count });

  return result.count;
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  logger.info("All user tokens revoked", { userId, tokensRevoked: result.count });

  return result.count;
}

/**
 * Clean up expired and old revoked tokens
 * Should be called periodically by scheduler
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        // Delete expired tokens older than 30 days
        { expiresAt: { lt: thirtyDaysAgo } },
        // Delete revoked tokens older than 30 days
        { revokedAt: { lt: thirtyDaysAgo } },
      ],
    },
  });

  if (result.count > 0) {
    logger.info("Cleaned up expired refresh tokens", { count: result.count });
  }

  return result.count;
}
