/**
 * Hair Health API Routes (V5.0 + V6.9 Calendar Intelligence)
 *
 * Endpoints:
 * - GET    /api/v1/hair-health/profile             - Get current user's hair profile
 * - POST   /api/v1/hair-health/profile             - Create hair profile
 * - PATCH  /api/v1/hair-health/profile             - Update hair profile
 * - DELETE /api/v1/hair-health/profile             - Delete hair profile
 * - GET    /api/v1/hair-health/learning            - Get learning progress
 * - POST   /api/v1/hair-health/learning/:nodeId    - Unlock learning node
 *
 * V6.9 Calendar Intelligence:
 * - GET    /api/v1/hair-health/ritual-plan         - Get personalized ritual recommendations
 * - POST   /api/v1/hair-health/calendar/generate   - Generate calendar from ritual plan
 * - GET    /api/v1/hair-health/calendar/upcoming   - Get upcoming rituals
 * - GET    /api/v1/hair-health/calendar/summary    - Get calendar widget summary
 * - POST   /api/v1/hair-health/calendar/:id/complete - Mark event as completed
 * - POST   /api/v1/hair-health/calendar/:id/skip   - Skip an event
 * - PATCH  /api/v1/hair-health/calendar/:id/reschedule - Reschedule an event
 */

import { Router, Response, NextFunction } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getLearningProgress,
  unlockLearningNode,
} from "../lib/hair-health";
import type { HairProfileCreateInput, HairProfileUpdateInput } from "../lib/hair-health";
import { generateRitualPlan, getAllRitualTemplates } from "../lib/hair-health/ritual-generator";
import {
  generateCalendarFromPlan,
  getUpcomingRituals,
  getCalendarSummary,
  completeEvent,
  skipEvent,
  rescheduleEvent,
} from "../lib/hair-health/calendar-scheduler";

const router: ReturnType<typeof Router> = Router();

// ============================================================================
// Profile Routes
// ============================================================================

/**
 * GET /api/v1/hair-health/profile
 * Get current user's hair health profile
 */
router.get("/profile", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await getProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Hair health profile has not been created yet",
      });
    }

    return res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hair-health/profile
 * Create hair health profile
 */
router.post("/profile", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    // Check if profile already exists
    const existing = await getProfile(userId);
    if (existing) {
      return res.status(409).json({
        error: "Profile already exists",
        message: "Use PATCH to update existing profile",
      });
    }

    const input: HairProfileCreateInput = req.body;
    const profile = await createProfile(userId, input);

    return res.status(201).json({ data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/hair-health/profile
 * Update hair health profile
 */
router.patch("/profile", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const input: HairProfileUpdateInput = req.body;
    const profile = await updateProfile(userId, input);

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Create a profile first using POST",
      });
    }

    return res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/hair-health/profile
 * Delete hair health profile
 */
router.delete("/profile", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const deleted = await deleteProfile(userId);

    if (!deleted) {
      return res.status(404).json({
        error: "Profile not found",
        message: "No profile to delete",
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Learning Routes
// ============================================================================

/**
 * GET /api/v1/hair-health/learning
 * Get learning progress (unlocked nodes)
 */
router.get("/learning", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const nodes = await getLearningProgress(userId);

    return res.json({
      data: {
        unlockedNodes: nodes,
        totalAvailable: 6, // TODO: Make this dynamic
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hair-health/learning/:nodeId
 * Unlock a learning node
 */
router.post("/learning/:nodeId", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const { nodeId } = req.params;

    // Validate nodeId
    const validNodes = [
      "POROSITY_BASICS",
      "MOISTURE_PROTEIN_BALANCE",
      "PROTECTIVE_STYLING",
      "HEAT_STYLING_SAFETY",
      "SCALP_HEALTH",
      "PRODUCT_INGREDIENTS",
    ];

    if (!validNodes.includes(nodeId)) {
      return res.status(400).json({
        error: "Invalid node ID",
        validNodes,
      });
    }

    const updatedNodes = await unlockLearningNode(userId, nodeId);

    return res.json({
      data: {
        unlockedNodes: updatedNodes,
        justUnlocked: nodeId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Profile not found") {
      return res.status(404).json({
        error: "Profile not found",
        message: "Create a hair health profile first",
      });
    }
    next(error);
  }
});

// ============================================================================
// V6.9 Calendar Intelligence Routes
// ============================================================================

/**
 * GET /api/v1/hair-health/ritual-plan
 * Get personalized ritual recommendations based on profile
 */
router.get("/ritual-plan", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await getProfile(userId);
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Create a hair health profile first to get ritual recommendations",
      });
    }

    const plan = generateRitualPlan(profile);

    return res.json({
      data: {
        recommendations: plan.recommendations.map((r) => ({
          templateId: r.template.id,
          name: r.template.name,
          description: r.template.description,
          ritualType: r.template.ritualType,
          loadLevel: r.template.loadLevel,
          durationMinutes: r.template.defaultDurationMinutes,
          frequency: r.suggestedFrequency,
          priority: r.priority,
          reasoning: r.reasoning,
          steps: r.template.steps,
        })),
        weeklySchedule: plan.weeklySchedule,
        loadSummary: plan.loadSummary,
        reasoning: plan.reasoning,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/hair-health/ritual-templates
 * Get all available ritual templates
 */
router.get("/ritual-templates", async (_req, res: Response, next: NextFunction) => {
  try {
    const templates = getAllRitualTemplates();

    return res.json({
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        ritualType: t.ritualType,
        loadLevel: t.loadLevel,
        durationMinutes: t.defaultDurationMinutes,
        frequency: t.frequency,
        steps: t.steps,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hair-health/calendar/generate
 * Generate calendar events from ritual plan
 */
router.post("/calendar/generate", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await getProfile(userId);
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Create a hair health profile first",
      });
    }

    const { weeksToGenerate = 2, replaceExisting = false } = req.body;

    const result = await generateCalendarFromPlan(userId, profile, {
      weeksToGenerate: Math.min(4, Math.max(1, weeksToGenerate)),
      replaceExisting,
      includeRestBuffers: true,
      includeEducationPrompts: true,
    });

    return res.json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/hair-health/calendar/upcoming
 * Get upcoming rituals for the next N days
 */
router.get("/calendar/upcoming", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const daysAhead = Math.min(30, Math.max(1, parseInt(req.query.days as string) || 14));

    const result = await getUpcomingRituals(userId, daysAhead);

    return res.json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/hair-health/calendar/summary
 * Get calendar summary for widget display
 */
router.get("/calendar/summary", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const profile = await getProfile(userId);
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Create a hair health profile first",
      });
    }

    const summary = await getCalendarSummary(userId, profile);

    return res.json({
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hair-health/calendar/:id/complete
 * Mark an event as completed
 */
router.post("/calendar/:id/complete", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { quality = "GOOD" } = req.body;

    const validQualities = ["EXCELLENT", "GOOD", "ADEQUATE", "POOR"];
    if (!validQualities.includes(quality)) {
      return res.status(400).json({
        error: "Invalid quality",
        validQualities,
      });
    }

    const result = await completeEvent(userId, id, quality);

    if (!result.success) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    return res.json({
      data: { success: true, message: "Event marked as completed" },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/hair-health/calendar/:id/skip
 * Skip an event
 */
router.post("/calendar/:id/skip", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await skipEvent(userId, id, reason);

    if (!result.success) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    return res.json({
      data: {
        success: true,
        message: "Event skipped",
        suggestedMakeup: result.suggestedMakeup,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/hair-health/calendar/:id/reschedule
 * Reschedule an event
 */
router.patch("/calendar/:id/reschedule", authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { newDate } = req.body;

    if (!newDate) {
      return res.status(400).json({
        error: "newDate is required",
      });
    }

    const profile = await getProfile(userId);
    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
      });
    }

    const result = await rescheduleEvent(userId, id, new Date(newDate), profile);

    if (!result.success && result.warnings.includes("Event not found")) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    return res.json({
      data: {
        success: result.success,
        warnings: result.warnings,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
