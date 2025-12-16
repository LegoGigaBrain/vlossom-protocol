/**
 * Audit Log Service
 * Tracks admin actions for compliance and security
 * Reference: docs/vlossom/22-admin-control-panel.md
 */

import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { logger } from "../logger";

// Common admin actions
export const AuditActions = {
  // User actions
  FREEZE_USER: "FREEZE_USER",
  UNFREEZE_USER: "UNFREEZE_USER",
  WARN_USER: "WARN_USER",
  VERIFY_USER: "VERIFY_USER",
  DELETE_USER: "DELETE_USER",
  UPDATE_USER_ROLE: "UPDATE_USER_ROLE",

  // Booking actions
  OVERRIDE_BOOKING_STATUS: "OVERRIDE_BOOKING_STATUS",
  FORCE_CANCEL_BOOKING: "FORCE_CANCEL_BOOKING",
  FORCE_COMPLETE_BOOKING: "FORCE_COMPLETE_BOOKING",

  // Dispute actions
  ASSIGN_DISPUTE: "ASSIGN_DISPUTE",
  RESOLVE_DISPUTE: "RESOLVE_DISPUTE",
  ESCALATE_DISPUTE: "ESCALATE_DISPUTE",
  CLOSE_DISPUTE: "CLOSE_DISPUTE",

  // Property actions
  VERIFY_PROPERTY: "VERIFY_PROPERTY",
  REJECT_PROPERTY: "REJECT_PROPERTY",
  SUSPEND_PROPERTY: "SUSPEND_PROPERTY",

  // Financial actions
  PROCESS_REFUND: "PROCESS_REFUND",
  MANUAL_SETTLEMENT: "MANUAL_SETTLEMENT",
  ADJUST_BALANCE: "ADJUST_BALANCE",

  // System actions
  UPDATE_CONFIG: "UPDATE_CONFIG",
  CLEAR_CACHE: "CLEAR_CACHE",
  EXPORT_DATA: "EXPORT_DATA",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

// Target types
export const TargetTypes = {
  USER: "USER",
  BOOKING: "BOOKING",
  DISPUTE: "DISPUTE",
  PROPERTY: "PROPERTY",
  TRANSACTION: "TRANSACTION",
  SYSTEM: "SYSTEM",
} as const;

export type TargetType = (typeof TargetTypes)[keyof typeof TargetTypes];

// Audit log entry
export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  admin?: {
    id: string;
    displayName: string;
    email: string | null;
  };
}

// Input for creating audit log
export interface CreateAuditLogInput {
  adminId: string;
  action: AuditAction;
  targetType: TargetType;
  targetId: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Filters for querying audit logs
export interface AuditLogFilters {
  adminId?: string;
  action?: string[];
  targetType?: string[];
  targetId?: string;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  try {
    const log = await prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        details: input.details || null,
        metadata: (input.metadata || {}) as Prisma.InputJsonValue,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });

    logger.info("[Audit] Log created", {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      adminId: input.adminId,
    });

    return log as AuditLogEntry;
  } catch (error) {
    logger.error("[Audit] Failed to create log", {
      error: error instanceof Error ? error.message : "Unknown error",
      input,
    });
    throw error;
  }
}

/**
 * Get audit logs with filters and pagination
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
  page = 1,
  pageSize = 50
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const where: Record<string, unknown> = {};

  if (filters.adminId) {
    where.adminId = filters.adminId;
  }

  if (filters.action?.length) {
    where.action = { in: filters.action };
  }

  if (filters.targetType?.length) {
    where.targetType = { in: filters.targetType };
  }

  if (filters.targetId) {
    where.targetId = filters.targetId;
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      (where.createdAt as Record<string, Date>).gte = filters.fromDate;
    }
    if (filters.toDate) {
      (where.createdAt as Record<string, Date>).lte = filters.toDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Enrich with admin info
  const adminIds = [...new Set(logs.map((l) => l.adminId))];
  const admins = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, displayName: true, email: true },
  });
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  const enrichedLogs = logs.map((log) => ({
    ...log,
    metadata: log.metadata as Record<string, unknown>,
    admin: adminMap.get(log.adminId),
  })) as AuditLogEntry[];

  return { logs: enrichedLogs, total };
}

/**
 * Get audit logs for a specific target
 */
export async function getAuditLogsForTarget(
  targetType: TargetType,
  targetId: string
): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
  });

  return logs.map((log) => ({
    ...log,
    metadata: log.metadata as Record<string, unknown>,
  })) as AuditLogEntry[];
}

/**
 * Get audit statistics
 */
export async function getAuditStats(): Promise<{
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  actionCounts: Record<string, number>;
  topAdmins: Array<{ adminId: string; count: number; displayName?: string }>;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalLogs, logsToday, logsThisWeek, actionGroups, adminGroups] =
    await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ["adminId"],
        _count: true,
        orderBy: { _count: { adminId: "desc" } },
        take: 10,
      }),
    ]);

  // Get admin names for top admins
  const adminIds = adminGroups.map((g) => g.adminId);
  const admins = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, displayName: true },
  });
  const adminMap = new Map(admins.map((a) => [a.id, a.displayName]));

  return {
    totalLogs,
    logsToday,
    logsThisWeek,
    actionCounts: Object.fromEntries(
      actionGroups.map((g) => [g.action, g._count])
    ),
    topAdmins: adminGroups.map((g) => ({
      adminId: g.adminId,
      count: g._count,
      displayName: adminMap.get(g.adminId),
    })),
  };
}

/**
 * Helper to create audit log from request context
 */
export function auditFromRequest(
  req: { userId?: string; ip?: string; headers: Record<string, unknown> },
  action: AuditAction,
  targetType: TargetType,
  targetId: string,
  details?: string,
  metadata?: Record<string, unknown>
): Promise<AuditLogEntry> {
  return createAuditLog({
    adminId: req.userId || "unknown",
    action,
    targetType,
    targetId,
    details,
    metadata,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] as string | undefined,
  });
}
