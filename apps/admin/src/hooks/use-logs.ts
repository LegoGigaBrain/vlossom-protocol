/**
 * Audit Logs React Query Hooks (V7.0.0)
 *
 * Data fetching hooks for admin audit logs.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAuditLogs,
  fetchAuditStats,
  fetchAuditActions,
  fetchLogsForTarget,
  type AuditLogsListParams,
} from "../lib/logs-client";

/**
 * Query keys for logs
 */
export const logKeys = {
  all: ["logs"] as const,
  lists: () => [...logKeys.all, "list"] as const,
  list: (params: AuditLogsListParams) => [...logKeys.lists(), params] as const,
  stats: () => [...logKeys.all, "stats"] as const,
  actions: () => [...logKeys.all, "actions"] as const,
  target: (targetType: string, targetId: string) =>
    [...logKeys.all, "target", targetType, targetId] as const,
};

/**
 * Fetch paginated audit logs
 */
export function useAuditLogs(params: AuditLogsListParams = {}) {
  return useQuery({
    queryKey: logKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch audit log statistics
 */
export function useAuditStats() {
  return useQuery({
    queryKey: logKeys.stats(),
    queryFn: fetchAuditStats,
    staleTime: 60_000,
  });
}

/**
 * Fetch available actions and target types
 */
export function useAuditActions() {
  return useQuery({
    queryKey: logKeys.actions(),
    queryFn: fetchAuditActions,
    staleTime: 300_000, // 5 minutes - rarely changes
  });
}

/**
 * Fetch logs for a specific target
 */
export function useLogsForTarget(targetType: string | null, targetId: string | null) {
  return useQuery({
    queryKey: logKeys.target(targetType || "", targetId || ""),
    queryFn: () => fetchLogsForTarget(targetType!, targetId!),
    enabled: Boolean(targetType && targetId),
  });
}
