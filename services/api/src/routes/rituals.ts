/**
 * Rituals API Routes (V5.2)
 *
 * Endpoints for managing hair care rituals and templates.
 */

import { Router, Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { createError } from "../middleware/error-handler";
import { logger } from "../lib/logger";
import { z } from "zod";
import prisma from "../lib/prisma";
import { LoadFactor, Prisma } from "@prisma/client";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const listRitualsSchema = z.object({
  includeTemplates: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  ritualType: z.string().optional(),
});

const createRitualSchema = z.object({
  ritualType: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultDurationMinutes: z.number().int().min(5).max(480),
  loadLevel: z.enum(["LIGHT", "STANDARD", "HEAVY"]),
  isTemplate: z.boolean().optional().default(false),
  steps: z
    .array(
      z.object({
        stepType: z.string().min(1),
        name: z.string().max(100).optional(),
        estimatedMinutes: z.number().int().min(1).max(120),
        optional: z.boolean().optional().default(false),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1)
    .max(20),
});

const updateRitualSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  defaultDurationMinutes: z.number().int().min(5).max(480).optional(),
  loadLevel: z.enum(["LIGHT", "STANDARD", "HEAVY"]).optional(),
});

const addStepSchema = z.object({
  stepType: z.string().min(1),
  name: z.string().max(100).optional(),
  estimatedMinutes: z.number().int().min(1).max(120),
  optional: z.boolean().optional().default(false),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// GET /api/v1/rituals/templates
// List system ritual templates (public)
// ============================================================================

router.get(
  "/templates",
  async (_req, res: Response, next: NextFunction) => {
    try {
      const templates = await prisma.hairRitual.findMany({
        where: {
          isTemplate: true,
          userId: null, // System templates have no user
        },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
        orderBy: { name: "asc" },
      });

      return res.json({
        templates: templates.map((t) => ({
          id: t.id,
          ritualType: t.ritualType,
          name: t.name,
          description: t.description,
          defaultDurationMinutes: t.defaultDurationMinutes,
          loadLevel: t.loadLevel,
          steps: t.steps.map((s) => ({
            id: s.id,
            stepType: s.stepType,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            optional: s.optional,
            notes: s.notes,
          })),
        })),
      });
    } catch (error) {
      logger.error("Error fetching ritual templates", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// GET /api/v1/rituals
// List user's rituals (and optionally templates)
// ============================================================================

router.get(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const input = listRitualsSchema.parse(req.query);

      const whereClause: Prisma.HairRitualWhereInput = {
        OR: [{ userId }, ...(input.includeTemplates ? [{ isTemplate: true, userId: null }] : [])],
      };

      if (input.ritualType) {
        whereClause.ritualType = input.ritualType;
      }

      const rituals = await prisma.hairRitual.findMany({
        where: whereClause,
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
        orderBy: [{ isTemplate: "asc" }, { name: "asc" }],
      });

      return res.json({
        rituals: rituals.map((r) => ({
          id: r.id,
          ritualType: r.ritualType,
          name: r.name,
          description: r.description,
          defaultDurationMinutes: r.defaultDurationMinutes,
          loadLevel: r.loadLevel,
          isTemplate: r.isTemplate,
          isOwned: r.userId === userId,
          steps: r.steps.map((s) => ({
            id: s.id,
            stepType: s.stepType,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            optional: s.optional,
            notes: s.notes,
          })),
          createdAt: r.createdAt,
        })),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error fetching rituals", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// GET /api/v1/rituals/:id
// Get a specific ritual
// ============================================================================

router.get(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const ritual = await prisma.hairRitual.findFirst({
        where: {
          id,
          OR: [{ userId }, { isTemplate: true }],
        },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      if (!ritual) {
        return next(createError("NOT_FOUND", { message: "Ritual not found" }));
      }

      return res.json({
        ritual: {
          id: ritual.id,
          ritualType: ritual.ritualType,
          name: ritual.name,
          description: ritual.description,
          defaultDurationMinutes: ritual.defaultDurationMinutes,
          loadLevel: ritual.loadLevel,
          isTemplate: ritual.isTemplate,
          isOwned: ritual.userId === userId,
          steps: ritual.steps.map((s) => ({
            id: s.id,
            stepOrder: s.stepOrder,
            stepType: s.stepType,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            optional: s.optional,
            notes: s.notes,
          })),
          createdAt: ritual.createdAt,
          updatedAt: ritual.updatedAt,
        },
      });
    } catch (error) {
      logger.error("Error fetching ritual", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/rituals
// Create a new ritual
// ============================================================================

router.post(
  "/",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const input = createRitualSchema.parse(req.body);

      // Create ritual with steps in a transaction
      const ritual = await prisma.$transaction(async (tx) => {
        const newRitual = await tx.hairRitual.create({
          data: {
            userId,
            ritualType: input.ritualType,
            name: input.name,
            description: input.description,
            defaultDurationMinutes: input.defaultDurationMinutes,
            loadLevel: input.loadLevel as LoadFactor,
            isTemplate: input.isTemplate,
          },
        });

        // Create steps
        if (input.steps.length > 0) {
          await tx.hairRitualStep.createMany({
            data: input.steps.map((step, index) => ({
              ritualId: newRitual.id,
              stepOrder: index + 1,
              stepType: step.stepType,
              name: step.name,
              estimatedMinutes: step.estimatedMinutes,
              optional: step.optional,
              notes: step.notes,
            })),
          });
        }

        return newRitual;
      });

      // Fetch with steps
      const ritualWithSteps = await prisma.hairRitual.findUnique({
        where: { id: ritual.id },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      logger.info("Ritual created", { userId, ritualId: ritual.id });

      return res.status(201).json({
        ritual: {
          id: ritualWithSteps!.id,
          ritualType: ritualWithSteps!.ritualType,
          name: ritualWithSteps!.name,
          description: ritualWithSteps!.description,
          defaultDurationMinutes: ritualWithSteps!.defaultDurationMinutes,
          loadLevel: ritualWithSteps!.loadLevel,
          isTemplate: ritualWithSteps!.isTemplate,
          steps: ritualWithSteps!.steps.map((s) => ({
            id: s.id,
            stepOrder: s.stepOrder,
            stepType: s.stepType,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            optional: s.optional,
            notes: s.notes,
          })),
          createdAt: ritualWithSteps!.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error creating ritual", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/rituals/:templateId/clone
// Clone a template to user's rituals
// ============================================================================

router.post(
  "/:templateId/clone",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { templateId } = req.params;

      // Find the template
      const template = await prisma.hairRitual.findFirst({
        where: {
          id: templateId,
          isTemplate: true,
        },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      if (!template) {
        return next(createError("NOT_FOUND", { message: "Template not found" }));
      }

      // Clone with steps
      const clonedRitual = await prisma.$transaction(async (tx) => {
        const newRitual = await tx.hairRitual.create({
          data: {
            userId,
            ritualType: template.ritualType,
            name: `${template.name} (My Copy)`,
            description: template.description,
            defaultDurationMinutes: template.defaultDurationMinutes,
            loadLevel: template.loadLevel,
            isTemplate: false,
          },
        });

        if (template.steps.length > 0) {
          await tx.hairRitualStep.createMany({
            data: template.steps.map((step) => ({
              ritualId: newRitual.id,
              stepOrder: step.stepOrder,
              stepType: step.stepType,
              name: step.name,
              estimatedMinutes: step.estimatedMinutes,
              optional: step.optional,
              notes: step.notes,
            })),
          });
        }

        return newRitual;
      });

      // Fetch with steps
      const ritualWithSteps = await prisma.hairRitual.findUnique({
        where: { id: clonedRitual.id },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      logger.info("Template cloned", { userId, templateId, ritualId: clonedRitual.id });

      return res.status(201).json({
        ritual: {
          id: ritualWithSteps!.id,
          ritualType: ritualWithSteps!.ritualType,
          name: ritualWithSteps!.name,
          description: ritualWithSteps!.description,
          defaultDurationMinutes: ritualWithSteps!.defaultDurationMinutes,
          loadLevel: ritualWithSteps!.loadLevel,
          isTemplate: false,
          steps: ritualWithSteps!.steps.map((s) => ({
            id: s.id,
            stepOrder: s.stepOrder,
            stepType: s.stepType,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            optional: s.optional,
            notes: s.notes,
          })),
          createdAt: ritualWithSteps!.createdAt,
        },
      });
    } catch (error) {
      logger.error("Error cloning template", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// PATCH /api/v1/rituals/:id
// Update a ritual
// ============================================================================

router.patch(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const input = updateRitualSchema.parse(req.body);

      // Check ownership
      const ritual = await prisma.hairRitual.findFirst({
        where: { id, userId },
      });

      if (!ritual) {
        return next(createError("NOT_FOUND", { message: "Ritual not found or not owned" }));
      }

      const updated = await prisma.hairRitual.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.defaultDurationMinutes && {
            defaultDurationMinutes: input.defaultDurationMinutes,
          }),
          ...(input.loadLevel && { loadLevel: input.loadLevel as LoadFactor }),
        },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });

      logger.info("Ritual updated", { userId, ritualId: id });

      return res.json({
        ritual: {
          id: updated.id,
          ritualType: updated.ritualType,
          name: updated.name,
          description: updated.description,
          defaultDurationMinutes: updated.defaultDurationMinutes,
          loadLevel: updated.loadLevel,
          isTemplate: updated.isTemplate,
          steps: updated.steps.map((s) => ({
            id: s.id,
            stepOrder: s.stepOrder,
            stepType: s.stepType,
            name: s.name,
            estimatedMinutes: s.estimatedMinutes,
            optional: s.optional,
            notes: s.notes,
          })),
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error updating ritual", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// DELETE /api/v1/rituals/:id
// Delete a ritual
// ============================================================================

router.delete(
  "/:id",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check ownership
      const ritual = await prisma.hairRitual.findFirst({
        where: { id, userId },
      });

      if (!ritual) {
        return next(createError("NOT_FOUND", { message: "Ritual not found or not owned" }));
      }

      // Delete (cascade will handle steps)
      await prisma.hairRitual.delete({
        where: { id },
      });

      logger.info("Ritual deleted", { userId, ritualId: id });

      return res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting ritual", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// POST /api/v1/rituals/:id/steps
// Add a step to a ritual
// ============================================================================

router.post(
  "/:id/steps",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const input = addStepSchema.parse(req.body);

      // Check ownership
      const ritual = await prisma.hairRitual.findFirst({
        where: { id, userId },
        include: {
          steps: {
            orderBy: { stepOrder: "desc" },
            take: 1,
          },
        },
      });

      if (!ritual) {
        return next(createError("NOT_FOUND", { message: "Ritual not found or not owned" }));
      }

      const maxOrder = ritual.steps[0]?.stepOrder ?? 0;

      const step = await prisma.hairRitualStep.create({
        data: {
          ritualId: id,
          stepOrder: maxOrder + 1,
          stepType: input.stepType,
          name: input.name,
          estimatedMinutes: input.estimatedMinutes,
          optional: input.optional,
          notes: input.notes,
        },
      });

      logger.info("Step added to ritual", { userId, ritualId: id, stepId: step.id });

      return res.status(201).json({
        step: {
          id: step.id,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          name: step.name,
          estimatedMinutes: step.estimatedMinutes,
          optional: step.optional,
          notes: step.notes,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError("VALIDATION_ERROR", { details: error.errors }));
      }
      logger.error("Error adding step", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

// ============================================================================
// DELETE /api/v1/rituals/:id/steps/:stepId
// Delete a step from a ritual
// ============================================================================

router.delete(
  "/:id/steps/:stepId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id, stepId } = req.params;

      // Check ownership
      const ritual = await prisma.hairRitual.findFirst({
        where: { id, userId },
      });

      if (!ritual) {
        return next(createError("NOT_FOUND", { message: "Ritual not found or not owned" }));
      }

      // Check step exists
      const step = await prisma.hairRitualStep.findFirst({
        where: { id: stepId, ritualId: id },
      });

      if (!step) {
        return next(createError("NOT_FOUND", { message: "Step not found" }));
      }

      await prisma.hairRitualStep.delete({
        where: { id: stepId },
      });

      logger.info("Step deleted from ritual", { userId, ritualId: id, stepId });

      return res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting step", { error });
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

export default router;
