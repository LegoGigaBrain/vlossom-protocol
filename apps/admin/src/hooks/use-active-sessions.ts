/**
 * Active Sessions React Query Hooks (V7.0.0)
 *
 * Real-time monitoring of in-progress sessions.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchActiveSessions, fetchUpcomingSessions } from "../lib/sessions-client";

/**
 * Query keys for sessions
 */
export const sessionKeys = {
  all: ["sessions"] as const,
  active: () => [...sessionKeys.all, "active"] as const,
  upcoming: () => [...sessionKeys.all, "upcoming"] as const,
};

/**
 * Fetch active (in-progress) sessions with auto-refresh
 */
export function useActiveSessions() {
  return useQuery({
    queryKey: sessionKeys.active(),
    queryFn: fetchActiveSessions,
    refetchInterval: 30_000, // Refresh every 30 seconds
    staleTime: 10_000, // Consider stale after 10 seconds
  });
}

/**
 * Fetch upcoming sessions (starting within 1 hour)
 */
export function useUpcomingSessions() {
  return useQuery({
    queryKey: sessionKeys.upcoming(),
    queryFn: fetchUpcomingSessions,
    refetchInterval: 60_000, // Refresh every minute
    staleTime: 30_000,
  });
}
