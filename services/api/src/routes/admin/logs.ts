/**
 * Admin Audit Logs API Routes
 * Reference: docs/vlossom/22-admin-control-panel.md
 */

import { Router, type Response, type NextFunction } from "express";
import { authenticate, type AuthenticatedRequest, requireRole } from "../../middleware/auth";
import { z } from "zod";
import { createError } from "../../middleware/error-handler";
import {
  getAuditLogs,
  getAuditLogsForTarget,
  getAuditStats,
  AuditActions,
  TargetTypes,
} from "../../lib/audit";

const router: ReturnType<typeof Router> = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole("ADMIN"));

// Validation schemas
const listLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

/**
 * GET /api/v1/admin/logs
 * List audit logs with filtering
 */
router.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = listLogsSchema.parse(req.query);
    const { page, pageSize, adminId, action, targetType, targetId, fromDate, toDate } = params;

    const filters = {
      adminId,
      action: action ? action.split(",") : undefined,
      targetType: targetType ? targetType.split(",") : undefined,
      targetId,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    };

    const { logs, total } = await getAuditLogs(filters, page, pageSize);

    res.json({
      logs,
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
    console.error("Failed to list audit logs:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/logs/stats
 * Get audit log statistics
 */
router.get("/stats", async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getAuditStats();
    res.json({ stats });
  } catch (error) {
    console.error("Failed to get audit stats:", error);
    return next(createError("INTERNAL_ERROR"));
  }
});

/**
 * GET /api/v1/admin/logs/actions
 * Get list of available audit actions
 */
router.get("/actions", async (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    actions: Object.values(AuditActions),
    targetTypes: Object.values(TargetTypes),
  });
});

/**
 * GET /api/v1/admin/logs/target/:targetType/:targetId
 * Get audit logs for a specific target
 */
router.get(
  "/target/:targetType/:targetId",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { targetType, targetId } = req.params;

      // Validate target type
      if (!Object.values(TargetTypes).includes(targetType as typeof TargetTypes[keyof typeof TargetTypes])) {
        return next(createError("VALIDATION_ERROR", {
          message: `Invalid target type: ${targetType}`,
        }));
      }

      const logs = await getAuditLogsForTarget(
        targetType as typeof TargetTypes[keyof typeof TargetTypes],
        targetId
      );

      res.json({ logs });
    } catch (error) {
      console.error("Failed to get target audit logs:", error);
      return next(createError("INTERNAL_ERROR"));
    }
  }
);

export default router;
