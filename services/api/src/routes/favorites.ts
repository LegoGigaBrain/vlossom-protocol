/**
 * Favorites API Routes (V5.2)
 *
 * Endpoints for managing user's favorite stylists.
 */

import { Router, Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { z } from "zod";
import prisma from "../lib/prisma";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const listFavoritesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const addFavoriteSchema = z.object({
  stylistId: z.string().uuid(),
});

// ============================================================================
// GET /api/v1/favorites
// List user's favorite stylists
// ============================================================================

router.get(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const input = listFavoritesSchema.parse(req.query);

      // Get favorites with stylist details
      const [favorites, total] = await Promise.all([
        prisma.favoriteStylist.findMany({
          where: { userId },
          include: {
            stylist: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                stylistProfile: {
                  select: {
                    bio: true,
                    specialties: true,
                    portfolioImages: true,
                    operatingMode: true,
                    isAcceptingBookings: true,
                    services: {
                      where: { isActive: true },
                      select: {
                        id: true,
                        name: true,
                        category: true,
                        priceAmountCents: true,
                        estimatedDurationMin: true,
                      },
                      take: 3, // Preview of services
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.favoriteStylist.count({ where: { userId } }),
      ]);

      // Transform to cleaner response format
      const stylists = favorites.map((fav) => ({
        id: fav.stylist.id,
        displayName: fav.stylist.displayName,
        avatarUrl: fav.stylist.avatarUrl,
        favoritedAt: fav.createdAt,
        profile: fav.stylist.stylistProfile
          ? {
              bio: fav.stylist.stylistProfile.bio,
              specialties: fav.stylist.stylistProfile.specialties,
              portfolioImages: fav.stylist.stylistProfile.portfolioImages,
              operatingMode: fav.stylist.stylistProfile.operatingMode,
              isAcceptingBookings:
                fav.stylist.stylistProfile.isAcceptingBookings,
              services: fav.stylist.stylistProfile.services.map((s) => ({
                ...s,
                priceAmountCents: Number(s.priceAmountCents),
              })),
            }
          : null,
      }));

      return res.json({
        favorites: stylists,
        total,
        hasMore: input.offset + favorites.length < total,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error fetching favorites", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/favorites
// Add a stylist to favorites
// ============================================================================

router.post(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const input = addFavoriteSchema.parse(req.body);

      // Check if stylist exists and has a stylist profile
      const stylist = await prisma.user.findUnique({
        where: { id: input.stylistId },
        include: { stylistProfile: true },
      });

      if (!stylist) {
        return next(createError("USER_NOT_FOUND", { message: "Stylist not found" }));
      }

      if (!stylist.stylistProfile) {
        return next(
          createError("VALIDATION_ERROR", {
            message: "User is not a stylist",
          })
        );
      }

      // Can't favorite yourself
      if (input.stylistId === userId) {
        return next(
          createError("VALIDATION_ERROR", {
            message: "Cannot favorite yourself",
          })
        );
      }

      // Check if already favorited
      const existing = await prisma.favoriteStylist.findUnique({
        where: {
          userId_stylistId: {
            userId,
            stylistId: input.stylistId,
          },
        },
      });

      if (existing) {
        return next(
          createError("DUPLICATE_ENTRY", {
            message: "Stylist is already in favorites",
          })
        );
      }

      // Add to favorites
      const favorite = await prisma.favoriteStylist.create({
        data: {
          userId,
          stylistId: input.stylistId,
        },
        include: {
          stylist: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      logger.info("Stylist added to favorites", {
        userId,
        stylistId: input.stylistId,
      });

      return res.status(201).json({
        success: true,
        favorite: {
          id: favorite.stylist.id,
          displayName: favorite.stylist.displayName,
          avatarUrl: favorite.stylist.avatarUrl,
          favoritedAt: favorite.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error adding favorite", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// DELETE /api/v1/favorites/:stylistId
// Remove a stylist from favorites
// ============================================================================

router.delete(
  "/:stylistId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { stylistId } = req.params;

      // Check if favorite exists
      const favorite = await prisma.favoriteStylist.findUnique({
        where: {
          userId_stylistId: {
            userId,
            stylistId,
          },
        },
      });

      if (!favorite) {
        return next(
          createError("NOT_FOUND", {
            message: "Stylist not in favorites",
          })
        );
      }

      // Remove from favorites
      await prisma.favoriteStylist.delete({
        where: {
          userId_stylistId: {
            userId,
            stylistId,
          },
        },
      });

      logger.info("Stylist removed from favorites", { userId, stylistId });

      return res.json({ success: true });
    } catch (error) {
      logger.error("Error removing favorite", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// GET /api/v1/favorites/:stylistId
// Check if a stylist is favorited
// ============================================================================

router.get(
  "/:stylistId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { stylistId } = req.params;

      const favorite = await prisma.favoriteStylist.findUnique({
        where: {
          userId_stylistId: {
            userId,
            stylistId,
          },
        },
      });

      return res.json({
        isFavorited: !!favorite,
        favoritedAt: favorite?.createdAt ?? null,
      });
    } catch (error) {
      logger.error("Error checking favorite status", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// GET /api/v1/favorites/count
// Get count of user's favorites
// ============================================================================

router.get(
  "/count",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const count = await prisma.favoriteStylist.count({
        where: { userId },
      });

      return res.json({ count });
    } catch (error) {
      logger.error("Error counting favorites", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

export default router;
