/**
 * Booking Hooks
 * React Query hooks for booking data fetching and mutations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  confirmPayment,
  cancelBooking,
  getBookingStats,
  type BookingStatus,
  type BookingStats,
  type CreateBookingRequest,
} from "@/lib/booking-client";

/**
 * Hook to fetch user's bookings
 */
export function useBookings(status?: BookingStatus) {
  return useQuery({
    queryKey: ["bookings", status],
    queryFn: () => getBookings({ status }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch single booking by ID
 */
export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBooking(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingRequest) => createBooking(data),
    onSuccess: () => {
      // Invalidate bookings list to refetch
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/**
 * Hook to update booking status (after payment)
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      escrowTxHash,
    }: {
      id: string;
      status: BookingStatus;
      escrowTxHash?: string;
    }) => updateBookingStatus(id, status, escrowTxHash),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", variables.id] });
    },
  });
}

/**
 * Hook to confirm payment with on-chain escrow verification
 * This is the preferred method for confirming payments as it verifies
 * the escrow transaction on-chain before updating booking status
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      escrowTxHash,
      skipOnChainVerification,
    }: {
      bookingId: string;
      escrowTxHash: string;
      skipOnChainVerification?: boolean;
    }) => confirmPayment(bookingId, escrowTxHash, { skipOnChainVerification }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", variables.bookingId] });
      // Also refresh wallet as balance has changed
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelBooking(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", variables.id] });
      // Also refresh wallet as refund might have occurred
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

/**
 * Hook to fetch booking statistics for the authenticated user
 */
export function useBookingStats() {
  return useQuery({
    queryKey: ["bookings", "stats"],
    queryFn: () => getBookingStats(),
    staleTime: 60 * 1000, // 1 minute
    select: (data) => data.stats,
  });
}

// Re-export types
export type { BookingStats };
