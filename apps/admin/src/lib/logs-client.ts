/**
 * Audit Logs API Client (V7.0.0)
 *
 * Admin audit logs management API client.
 */

import { adminFetch } from "./admin-client";

export interface AuditLogAdmin {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuditLog {
  id: string;
  adminId: string;
  admin: AuditLogAdmin;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogsListParams {
  page?: number;
  pageSize?: number;
  adminId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogsListResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditStats {
  totalLogs: number;
  logsToday: number;
  logsByAction: Record<string, number>;
  logsByTargetType: Record<string, number>;
  topAdmins: Array<{ adminId: string; admin: AuditLogAdmin; count: number }>;
}

/**
 * Fetch paginated list of audit logs
 */
export async function fetchAuditLogs(
  params: AuditLogsListParams = {}
): Promise<AuditLogsListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.adminId) searchParams.set("adminId", params.adminId);
  if (params.action) searchParams.set("action", params.action);
  if (params.targetType) searchParams.set("targetType", params.targetType);
  if (params.targetId) searchParams.set("targetId", params.targetId);
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);

  const queryString = searchParams.toString();
  const url = `/api/v1/admin/logs${queryString ? `?${queryString}` : ""}`;

  const response = await adminFetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return response.json();
}

/**
 * Fetch audit log statistics
 */
export async function fetchAuditStats(): Promise<{ stats: AuditStats }> {
  const response = await adminFetch("/api/v1/admin/logs/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch audit stats");
  }

  return response.json();
}

/**
 * Fetch available actions and target types
 */
export async function fetchAuditActions(): Promise<{
  actions: string[];
  targetTypes: string[];
}> {
  const response = await adminFetch("/api/v1/admin/logs/actions");

  if (!response.ok) {
    throw new Error("Failed to fetch audit actions");
  }

  return response.json();
}

/**
 * Fetch audit logs for a specific target
 */
export async function fetchLogsForTarget(
  targetType: string,
  targetId: string
): Promise<{ logs: AuditLog[] }> {
  const response = await adminFetch(`/api/v1/admin/logs/target/${targetType}/${targetId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch target audit logs");
  }

  return response.json();
}

// Common action labels
export const ACTION_LABELS: Record<string, string> = {
  USER_FREEZE: "Froze User",
  USER_UNFREEZE: "Unfroze User",
  USER_VERIFY: "Verified User",
  USER_WARN: "Warned User",
  USER_ROLE_CHANGE: "Changed Role",
  BOOKING_STATUS_CHANGE: "Changed Booking Status",
  BOOKING_CANCEL: "Cancelled Booking",
  DISPUTE_ASSIGN: "Assigned Dispute",
  DISPUTE_RESOLVE: "Resolved Dispute",
  DISPUTE_ESCALATE: "Escalated Dispute",
  DISPUTE_CLOSE: "Closed Dispute",
  DEFI_CONFIG_CHANGE: "Changed DeFi Config",
  PAYMASTER_REFILL: "Refilled Paymaster",
  SYSTEM_CONFIG_CHANGE: "Changed System Config",
};

// Target type labels
export const TARGET_TYPE_LABELS: Record<string, string> = {
  USER: "User",
  BOOKING: "Booking",
  DISPUTE: "Dispute",
  WALLET: "Wallet",
  DEFI_CONFIG: "DeFi Config",
  PAYMASTER: "Paymaster",
  SYSTEM: "System",
};

export const getActionLabel = (action: string): string => {
  return ACTION_LABELS[action] || action.replace(/_/g, " ").toLowerCase();
};

export const getTargetTypeLabel = (targetType: string): string => {
  return TARGET_TYPE_LABELS[targetType] || targetType;
};
