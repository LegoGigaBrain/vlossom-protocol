/**
 * Sessions API Client (V7.0.0)
 *
 * Active sessions (in-progress bookings) monitoring.
 */

import { adminFetch } from "./admin-client";
import type { Booking } from "./bookings-client";

export interface ActiveSession extends Booking {
  progress?: number;
  estimatedEndTime?: string;
  stylistLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
}

export interface ActiveSessionsResponse {
  sessions: ActiveSession[];
  total: number;
}

/**
 * Fetch all active (in-progress) sessions
 */
export async function fetchActiveSessions(): Promise<ActiveSessionsResponse> {
  // Fetch bookings with IN_PROGRESS status
  const response = await adminFetch("/api/v1/admin/bookings?status=IN_PROGRESS&pageSize=50");

  if (!response.ok) {
    throw new Error("Failed to fetch active sessions");
  }

  const data = await response.json();

  // Map bookings to sessions with progress calculation
  const sessions: ActiveSession[] = data.bookings.map((booking: Booking) => {
    const startTime = new Date(booking.scheduledStartTime).getTime();
    const endTime = new Date(booking.scheduledEndTime).getTime();
    const now = Date.now();

    // Calculate progress as percentage
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    // Estimate remaining time
    const remainingMs = Math.max(0, endTime - now);
    const estimatedEndTime = new Date(Date.now() + remainingMs).toISOString();

    return {
      ...booking,
      progress: Math.round(progress),
      estimatedEndTime,
    };
  });

  return {
    sessions,
    total: data.pagination.total,
  };
}

/**
 * Fetch confirmed bookings about to start (within 1 hour)
 */
export async function fetchUpcomingSessions(): Promise<ActiveSessionsResponse> {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const response = await adminFetch(
    `/api/v1/admin/bookings?status=CONFIRMED&fromDate=${now.toISOString()}&toDate=${oneHourFromNow.toISOString()}&pageSize=20`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch upcoming sessions");
  }

  const data = await response.json();

  return {
    sessions: data.bookings,
    total: data.pagination.total,
  };
}
