/**
 * Stylist Context API Routes (V5.0 Phase 5)
 *
 * Consent-based hair profile sharing between customers and stylists.
 * Enables stylists to view customer hair data with explicit permission.
 *
 * Endpoints:
 * - GET    /api/v1/stylist-context/:stylistId     - Get shared context (customer view)
 * - POST   /api/v1/stylist-context/grant          - Grant access to a stylist
 * - DELETE /api/v1/stylist-context/:stylistId     - Revoke access from a stylist
 * - GET    /api/v1/stylist-context/customers      - Get all customers who shared (stylist view)
 * - GET    /api/v1/stylist-context/customer/:id   - Get specific customer context (stylist view)
 * - PATCH  /api/v1/stylist-context/customer/:id   - Update stylist notes (stylist view)
 */

import { Router, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { z } from "zod";
import { getProfile } from "../lib/hair-health";
import { analyzeProfile, getQuickHealthScore } from "../lib/hair-health/intelligence-engine";
import type { ConsentScope, HairProfileResponse, StylistContextResponse } from "../lib/hair-health/types";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const grantAccessSchema = z.object({
  stylistUserId: z.string().uuid(),
  consentScope: z.array(
    z.enum(["TEXTURE", "POROSITY", "SENSITIVITY", "ROUTINE", "FULL"])
  ).min(1),
});

const updateNotesSchema = z.object({
  stylistNotes: z.string().max(2000).optional(),
  lastServiceNotes: z.string().max(1000).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

function filterProfileByScope(
  profile: HairProfileResponse,
  scope: ConsentScope[]
): Partial<HairProfileResponse> {
  // FULL scope returns everything
  if (scope.includes("FULL")) {
    return profile;
  }

  const filtered: Partial<HairProfileResponse> = {
    id: profile.id,
    profileVersion: profile.profileVersion,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  if (scope.includes("TEXTURE")) {
    filtered.textureClass = profile.textureClass;
    filtered.patternFamily = profile.patternFamily;
    filtered.strandThickness = profile.strandThickness;
    filtered.densityLevel = profile.densityLevel;
    filtered.shrinkageTendency = profile.shrinkageTendency;
  }

  if (scope.includes("POROSITY")) {
    filtered.porosityLevel = profile.porosityLevel;
    filtered.retentionRisk = profile.retentionRisk;
  }

  if (scope.includes("SENSITIVITY")) {
    filtered.detangleTolerance = profile.detangleTolerance;
    filtered.manipulationTolerance = profile.manipulationTolerance;
    filtered.tensionSensitivity = profile.tensionSensitivity;
    filtered.scalpSensitivity = profile.scalpSensitivity;
  }

  if (scope.includes("ROUTINE")) {
    filtered.washDayLoadFactor = profile.washDayLoadFactor;
    filtered.estimatedWashDayMinutes = profile.estimatedWashDayMinutes;
    filtered.routineType = profile.routineType;
  }

  return filtered;
}

function formatContextResponse(
  context: NonNullable<Awaited<ReturnType<typeof prisma.stylistClientContext.findUnique>>>,
  sharedProfile?: Partial<HairProfileResponse>
): StylistContextResponse {
  return {
    id: context.id,
    customerUserId: context.customerUserId,
    stylistUserId: context.stylistUserId,
    consentGranted: context.consentGranted,
    consentGrantedAt: context.consentGrantedAt?.toISOString() ?? null,
    consentScope: context.consentScope as ConsentScope[],
    sharedProfileSnapshot: sharedProfile ?? null,
    stylistNotes: context.stylistNotes,
    lastServiceNotes: context.lastServiceNotes,
    createdAt: context.createdAt.toISOString(),
    updatedAt: context.updatedAt.toISOString(),
  };
}

// ============================================================================
// Customer Routes (managing their own consent)
// ============================================================================

/**
 * GET /api/v1/stylist-context/:stylistId
 * Get shared context for a specific stylist (customer view)
 */
router.get(
  "/:stylistId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userId!;
      const { stylistId } = req.params;

      const context = await prisma.stylistClientContext.findUnique({
        where: {
          customerUserId_stylistUserId: {
            customerUserId: customerId,
            stylistUserId: stylistId,
          },
        },
      });

      if (!context) {
        return res.status(404).json({
          error: "Context not found",
          message: "No shared context exists with this stylist",
        });
      }

      return res.json({ data: formatContextResponse(context) });
    } catch (error) {
      logger.error("Error fetching stylist context", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * POST /api/v1/stylist-context/grant
 * Grant a stylist access to hair profile data
 */
router.post(
  "/grant",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userId!;
      const input = grantAccessSchema.parse(req.body);

      // Verify stylist exists and is actually a stylist
      const stylist = await prisma.user.findUnique({
        where: { id: input.stylistUserId },
        include: { stylistProfile: true },
      });

      if (!stylist || !stylist.stylistProfile) {
        return res.status(404).json({
          error: "Stylist not found",
          message: "The specified user is not a registered stylist",
        });
      }

      // Check if customer has a hair profile
      const profile = await getProfile(customerId);
      if (!profile) {
        return res.status(400).json({
          error: "Profile required",
          message: "Create a hair health profile before sharing with stylists",
        });
      }

      // Create or update the context
      const context = await prisma.stylistClientContext.upsert({
        where: {
          customerUserId_stylistUserId: {
            customerUserId: customerId,
            stylistUserId: input.stylistUserId,
          },
        },
        create: {
          customerUserId: customerId,
          stylistUserId: input.stylistUserId,
          consentGranted: true,
          consentGrantedAt: new Date(),
          consentScope: input.consentScope,
        },
        update: {
          consentGranted: true,
          consentGrantedAt: new Date(),
          consentScope: input.consentScope,
          updatedAt: new Date(),
        },
      });

      logger.info("Stylist context granted", {
        customerId,
        stylistId: input.stylistUserId,
        scope: input.consentScope,
      });

      return res.status(201).json({
        data: formatContextResponse(context),
        message: "Access granted successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error granting stylist context", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * DELETE /api/v1/stylist-context/:stylistId
 * Revoke a stylist's access to hair profile data
 */
router.delete(
  "/:stylistId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userId!;
      const { stylistId } = req.params;

      const context = await prisma.stylistClientContext.findUnique({
        where: {
          customerUserId_stylistUserId: {
            customerUserId: customerId,
            stylistUserId: stylistId,
          },
        },
      });

      if (!context) {
        return res.status(404).json({
          error: "Context not found",
          message: "No shared context exists with this stylist",
        });
      }

      // Soft revoke - keep the record but mark as revoked
      await prisma.stylistClientContext.update({
        where: { id: context.id },
        data: {
          consentGranted: false,
          consentScope: [],
          updatedAt: new Date(),
        },
      });

      logger.info("Stylist context revoked", {
        customerId,
        stylistId,
      });

      return res.json({
        success: true,
        message: "Access revoked successfully",
      });
    } catch (error) {
      logger.error("Error revoking stylist context", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * GET /api/v1/stylist-context/my-shares
 * Get all stylists the customer has shared with
 */
router.get(
  "/my-shares",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customerId = req.userId!;

      const contexts = await prisma.stylistClientContext.findMany({
        where: { customerUserId: customerId },
        include: {
          stylist: {
            include: {
              stylistProfile: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      const shares = contexts.map((ctx) => ({
        ...formatContextResponse(ctx),
        stylist: {
          id: ctx.stylist.id,
          displayName: ctx.stylist.displayName,
          avatarUrl: ctx.stylist.avatarUrl,
          bio: ctx.stylist.stylistProfile?.bio,
          specialties: ctx.stylist.stylistProfile?.specialties,
        },
      }));

      return res.json({
        data: shares,
        count: shares.length,
      });
    } catch (error) {
      logger.error("Error fetching customer shares", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// Stylist Routes (viewing customer data)
// ============================================================================

/**
 * GET /api/v1/stylist-context/customers
 * Get all customers who have shared their profile with the stylist
 */
router.get(
  "/customers",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stylistId = req.userId!;

      // Verify user is a stylist
      const stylistProfile = await prisma.stylistProfile.findUnique({
        where: { userId: stylistId },
      });

      if (!stylistProfile) {
        return res.status(403).json({
          error: "Not a stylist",
          message: "Only stylists can view customer contexts",
        });
      }

      const contexts = await prisma.stylistClientContext.findMany({
        where: {
          stylistUserId: stylistId,
          consentGranted: true,
        },
        include: {
          customer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // Enrich with profile summaries
      const customers = await Promise.all(
        contexts.map(async (ctx) => {
          const profile = await getProfile(ctx.customerUserId);
          let profileSummary = null;

          if (profile) {
            const healthScore = getQuickHealthScore(profile);

            profileSummary = {
              archetype: profile.patternFamily,
              healthGrade: healthScore.grade,
              lastUpdated: profile.updatedAt,
            };
          }

          return {
            context: formatContextResponse(ctx),
            customer: {
              id: ctx.customer.id,
              displayName: ctx.customer.displayName,
              avatarUrl: ctx.customer.avatarUrl,
            },
            profileSummary,
          };
        })
      );

      return res.json({
        data: customers,
        count: customers.length,
      });
    } catch (error) {
      logger.error("Error fetching stylist customers", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * GET /api/v1/stylist-context/customer/:customerId
 * Get detailed context for a specific customer (stylist view)
 */
router.get(
  "/customer/:customerId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stylistId = req.userId!;
      const { customerId } = req.params;

      // Verify user is a stylist
      const stylistProfile = await prisma.stylistProfile.findUnique({
        where: { userId: stylistId },
      });

      if (!stylistProfile) {
        return res.status(403).json({
          error: "Not a stylist",
          message: "Only stylists can view customer contexts",
        });
      }

      const context = await prisma.stylistClientContext.findUnique({
        where: {
          customerUserId_stylistUserId: {
            customerUserId: customerId,
            stylistUserId: stylistId,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              phone: true,
            },
          },
        },
      });

      if (!context) {
        return res.status(404).json({
          error: "Context not found",
          message: "No shared context exists with this customer",
        });
      }

      if (!context.consentGranted) {
        return res.status(403).json({
          error: "Access revoked",
          message: "Customer has revoked access to their profile",
        });
      }

      // Get and filter the profile based on consent scope
      const profile = await getProfile(customerId);
      let sharedProfile: Partial<HairProfileResponse> | null = null;
      let analysis = null;

      if (profile) {
        sharedProfile = filterProfileByScope(
          profile,
          context.consentScope as ConsentScope[]
        );

        // Only include analysis if FULL scope
        if ((context.consentScope as ConsentScope[]).includes("FULL")) {
          analysis = analyzeProfile(profile);
        }
      }

      return res.json({
        data: {
          context: formatContextResponse(context, sharedProfile ?? undefined),
          customer: {
            id: context.customer.id,
            displayName: context.customer.displayName,
            avatarUrl: context.customer.avatarUrl,
          },
          analysis,
        },
      });
    } catch (error) {
      logger.error("Error fetching customer context", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

/**
 * PATCH /api/v1/stylist-context/customer/:customerId
 * Update stylist's notes for a customer
 */
router.patch(
  "/customer/:customerId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stylistId = req.userId!;
      const { customerId } = req.params;
      const input = updateNotesSchema.parse(req.body);

      // Verify user is a stylist
      const stylistProfile = await prisma.stylistProfile.findUnique({
        where: { userId: stylistId },
      });

      if (!stylistProfile) {
        return res.status(403).json({
          error: "Not a stylist",
          message: "Only stylists can update notes",
        });
      }

      const context = await prisma.stylistClientContext.findUnique({
        where: {
          customerUserId_stylistUserId: {
            customerUserId: customerId,
            stylistUserId: stylistId,
          },
        },
      });

      if (!context) {
        return res.status(404).json({
          error: "Context not found",
          message: "No shared context exists with this customer",
        });
      }

      const updated = await prisma.stylistClientContext.update({
        where: { id: context.id },
        data: {
          ...(input.stylistNotes !== undefined && { stylistNotes: input.stylistNotes }),
          ...(input.lastServiceNotes !== undefined && { lastServiceNotes: input.lastServiceNotes }),
          updatedAt: new Date(),
        },
      });

      return res.json({
        data: formatContextResponse(updated),
        message: "Notes updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error updating stylist notes", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

export default router;
