/**
 * Admin Disputes API Routes
 * Reference: docs/vlossom/22-admin-control-panel.md
 */

import { Router, type Response, type NextFunction } from "express";
import { authenticate, type AuthenticatedRequest, requireRole } from "../../middleware/auth";
import { z } from "zod";
import { createError } from "../../middleware/error-handler";
import {
  listDisputes,
  getDisputeById,
  assignDispute,
  startReview,
  resolveDispute,
  escalateDispute,
  closeDispute,
  addDisputeMessage,
  getDisputeStats,
  DisputeStatus,
  DisputeType,
  DisputeResolution,
} from "../../lib/disputes";

const router: ReturnType<typeof Router> = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole("ADMIN"));

// Validation schemas
const listDisputesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  type: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  priority: z.coerce.number().int().min(1).max(5).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

const assignSchema = z.object({
  assignedToId: z.string().uuid(),
});

const resolveSchema = z.object({
  resolution: z.enum([
    "FULL_REFUND_CUSTOMER",
    "PARTIAL_REFUND",
    "NO_REFUND",
    "SPLIT_FUNDS",
    "STYLIST_PENALTY",
    "CUSTOMER_WARNING",
    "MUTUAL_CANCELLATION",
    "ESCALATED_TO_LEGAL",
  ] as const),
  resolutionNotes: z.string().min(10).max(2000),
  refundPercent: z.number().int().min(0).max(100).optional(),
});

const escalateSchema = z.object({
  escalationReason: z.string().min(10).max(500),
});

const addMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
  attachmentUrls: z.array(z.string().url()).optional(),
});

/**
 * GET /api/v1/admin/disputes
 * List all disputes with filtering
 */
router.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = listDisputesSchema.parse(req.query);
    const { page, pageSize, status, type, assignedToId, priority, fromDate, toDate } = params;

    const filters = {
      status: status ? (status.split(",") as DisputeStatus[]) : undefined,
      type: type ? (type.split(",") as DisputeType[]) : undefined,
      assignedToId,
      priority,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const { disputes, total } = await listDisputes(filters, page, pageSize);

    res.json({
      disputes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to list disputes:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/disputes/stats
 * Get dispute statistics
 */
router.get("/stats", async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getDisputeStats();
    res.json({ stats });
  } catch (error) {
    console.error("Failed to get dispute stats:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/disputes/:id
 * Get dispute details
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const dispute = await getDisputeById(id);

    if (!dispute) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    res.json({ dispute });
  } catch (error) {
    console.error("Failed to get dispute:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/admin/disputes/:id/assign
 * Assign dispute to an admin
 */
router.post("/:id/assign", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assignedToId } = assignSchema.parse(req.body);

    // Get current dispute to check status
    const existing = await getDisputeById(id);
    if (!existing) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    if (!["OPEN", "ASSIGNED"].includes(existing.status)) {
      return next(createError("INVALID_STATUS", {
        message: "Dispute cannot be assigned in current status",
      }));
    }

    const dispute = await assignDispute({ disputeId: id, assignedToId });

    res.json({ dispute });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to assign dispute:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/admin/disputes/:id/review
 * Start reviewing a dispute
 */
router.post("/:id/review", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await getDisputeById(id);
    if (!existing) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    if (existing.status !== "ASSIGNED") {
      return next(createError("INVALID_STATUS", {
        message: "Dispute must be assigned before review",
      }));
    }

    const dispute = await startReview(id);

    res.json({ dispute });
  } catch (error) {
    console.error("Failed to start review:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/admin/disputes/:id/resolve
 * Resolve a dispute
 */
router.post("/:id/resolve", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const { resolution, resolutionNotes, refundPercent } = resolveSchema.parse(req.body);

    const existing = await getDisputeById(id);
    if (!existing) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    if (!["ASSIGNED", "UNDER_REVIEW", "ESCALATED"].includes(existing.status)) {
      return next(createError("INVALID_STATUS", {
        message: "Dispute cannot be resolved in current status",
      }));
    }

    // Validate refund percent for partial refunds
    if (resolution === "PARTIAL_REFUND" && !refundPercent) {
      return next(createError("VALIDATION_ERROR", {
        message: "Refund percent required for partial refunds",
      }));
    }

    const dispute = await resolveDispute({
      disputeId: id,
      resolvedById: adminId,
      resolution: resolution as DisputeResolution,
      resolutionNotes,
      refundPercent,
    });

    res.json({ dispute });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to resolve dispute:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/admin/disputes/:id/escalate
 * Escalate a dispute
 */
router.post("/:id/escalate", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const { escalationReason } = escalateSchema.parse(req.body);

    const existing = await getDisputeById(id);
    if (!existing) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    if (!["ASSIGNED", "UNDER_REVIEW"].includes(existing.status)) {
      return next(createError("INVALID_STATUS", {
        message: "Dispute cannot be escalated in current status",
      }));
    }

    const dispute = await escalateDispute({
      disputeId: id,
      escalatedById: adminId,
      escalationReason,
    });

    res.json({ dispute });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to escalate dispute:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/admin/disputes/:id/close
 * Close a resolved dispute
 */
router.post("/:id/close", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await getDisputeById(id);
    if (!existing) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    if (existing.status !== "RESOLVED") {
      return next(createError("INVALID_STATUS", {
        message: "Only resolved disputes can be closed",
      }));
    }

    const dispute = await closeDispute(id);

    res.json({ dispute });
  } catch (error) {
    console.error("Failed to close dispute:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * POST /api/v1/admin/disputes/:id/messages
 * Add a message to dispute thread
 */
router.post("/:id/messages", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.userId!;
    const { content, isInternal, attachmentUrls } = addMessageSchema.parse(req.body);

    const existing = await getDisputeById(id);
    if (!existing) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    await addDisputeMessage({
      disputeId: id,
      authorId: adminId,
      content,
      isInternal,
      attachmentUrls,
    });

    // Return updated dispute with messages
    const updated = await getDisputeById(id);

    res.json({ dispute: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError("VALIDATION_ERROR", { details: error.errors }));
    }
    console.error("Failed to add message:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/disputes/:id/messages
 * Get dispute messages
 */
router.get("/:id/messages", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const includeInternal = req.query.includeInternal === "true";

    const dispute = await getDisputeById(id);
    if (!dispute) {
      return next(createError("NOT_FOUND", { resource: "Dispute" }));
    }

    const messages = dispute.messages?.filter(
      (m) => includeInternal || !m.isInternal
    );

    res.json({ messages });
  } catch (error) {
    console.error("Failed to get messages:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

export default router;
