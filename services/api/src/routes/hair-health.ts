/**
 * Hair Health API Routes (V5.0)
 *
 * Endpoints:
 * - GET    /api/v1/hair-health/profile         - Get current user's hair profile
 * - POST   /api/v1/hair-health/profile         - Create hair profile
 * - PATCH  /api/v1/hair-health/profile         - Update hair profile
 * - DELETE /api/v1/hair-health/profile         - Delete hair profile
 * - GET    /api/v1/hair-health/learning        - Get learning progress
 * - POST   /api/v1/hair-health/learning/:nodeId - Unlock learning node
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

export default router;
