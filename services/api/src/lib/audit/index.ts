/**
 * Audit Module
 * Unified exports for audit logging
 */

export {
  AuditActions,
  TargetTypes,
  createAuditLog,
  getAuditLogs,
  getAuditLogsForTarget,
  getAuditStats,
  auditFromRequest,
  type AuditAction,
  type TargetType,
  type AuditLogEntry,
  type CreateAuditLogInput,
  type AuditLogFilters,
} from "./audit-service";
