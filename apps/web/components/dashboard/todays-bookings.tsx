/**
 * Today's Bookings Component
 * Reference: docs/specs/stylist-dashboard/F3.7-completion-flow.md
 *
 * Shows confirmed and in-progress bookings for today with action buttons
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActiveBookingCard,
  ActiveBookingCardSkeleton,
  type ActiveBooking,
} from "./active-booking-card";
import { StartServiceDialog } from "./start-service-dialog";
import { CompleteServiceDialog } from "./complete-service-dialog";
import { CompletionSuccess } from "./completion-success";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function TodaysBookings() {
  const queryClient = useQueryClient();

  const [selectedBooking, setSelectedBooking] = useState<ActiveBooking | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [completedPayoutAmount, setCompletedPayoutAmount] = useState(0);
  const [completedCustomerName, setCompletedCustomerName] = useState("");

  // Fetch today's active bookings (CONFIRMED or IN_PROGRESS)
  const { data, isLoading, error } = useQuery({
    queryKey: ["todays-active-bookings"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `${API_BASE}/api/stylists/bookings?status=CONFIRMED,IN_PROGRESS&date=${today}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json() as Promise<{ bookings: ActiveBooking[] }>;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Start service mutation
  const startMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/start`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to start service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todays-active-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setStartDialogOpen(false);
      setSelectedBooking(null);
    },
  });

  // Complete service mutation
  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/complete`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to complete service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todays-active-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stylist-earnings"] });

      if (selectedBooking) {
        setCompletedPayoutAmount(selectedBooking.stylistPayoutCents);
        setCompletedCustomerName(selectedBooking.customerName);
      }

      setCompleteDialogOpen(false);
      setSuccessDialogOpen(true);
    },
  });

  const handleStartClick = (booking: ActiveBooking) => {
    setSelectedBooking(booking);
    setStartDialogOpen(true);
  };

  const handleCompleteClick = (booking: ActiveBooking) => {
    setSelectedBooking(booking);
    setCompleteDialogOpen(true);
  };

  const handleStartConfirm = () => {
    if (selectedBooking) {
      startMutation.mutate(selectedBooking.id);
    }
  };

  const handleCompleteConfirm = () => {
    if (selectedBooking) {
      completeMutation.mutate(selectedBooking.id);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    setSelectedBooking(null);
  };

  const activeBookings = data?.bookings || [];
  const hasActiveBookings = activeBookings.length > 0;

  if (error) {
    return null; // Silent fail, dashboard still works
  }

  // Don't show section if no active bookings
  if (!isLoading && !hasActiveBookings) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-h4 text-text-primary">Today's Bookings</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActiveBookingCardSkeleton />
          <ActiveBookingCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeBookings.map((booking) => (
            <ActiveBookingCard
              key={booking.id}
              booking={booking}
              onStart={handleStartClick}
              onComplete={handleCompleteClick}
            />
          ))}
        </div>
      )}

      {/* Start Service Dialog */}
      <StartServiceDialog
        booking={selectedBooking}
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onConfirm={handleStartConfirm}
        isLoading={startMutation.isPending}
      />

      {/* Complete Service Dialog */}
      <CompleteServiceDialog
        booking={selectedBooking}
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        onConfirm={handleCompleteConfirm}
        isLoading={completeMutation.isPending}
      />

      {/* Completion Success */}
      <CompletionSuccess
        customerName={completedCustomerName}
        payoutAmount={completedPayoutAmount}
        open={successDialogOpen}
        onClose={handleSuccessClose}
      />
    </div>
  );
}
