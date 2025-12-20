/**
 * Bookings React Query Hooks (V7.0.0)
 *
 * Data fetching hooks for admin booking management.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBookings,
  fetchBooking,
  fetchBookingStats,
  updateBookingStatus,
  type BookingsListParams,
} from "../lib/bookings-client";

/**
 * Query keys for bookings
 */
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (params: BookingsListParams) => [...bookingKeys.lists(), params] as const,
  details: () => [...bookingKeys.all, "detail"] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  stats: () => [...bookingKeys.all, "stats"] as const,
};

/**
 * Fetch paginated bookings list
 */
export function useBookings(params: BookingsListParams = {}) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => fetchBookings(params),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetch single booking details
 */
export function useBooking(id: string | null) {
  return useQuery({
    queryKey: bookingKeys.detail(id || ""),
    queryFn: () => fetchBooking(id!),
    enabled: Boolean(id),
  });
}

/**
 * Fetch booking statistics
 */
export function useBookingStats() {
  return useQuery({
    queryKey: bookingKeys.stats(),
    queryFn: fetchBookingStats,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Update booking status mutation
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; reason?: string } }) =>
      updateBookingStatus(id, data),
    onSuccess: (_, variables) => {
      // Invalidate list and specific booking queries
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.stats() });
    },
  });
}
