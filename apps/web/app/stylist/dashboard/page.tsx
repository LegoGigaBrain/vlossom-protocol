/**
 * Stylist Dashboard Overview Page
 * Reference: docs/specs/stylist-dashboard/F3.1-stylist-dashboard.md
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/use-auth";
import { useDashboard } from "../../../hooks/use-dashboard";
import { StatsCards } from "../../../components/dashboard/stats-cards";
import { UpcomingBookings } from "../../../components/dashboard/upcoming-bookings";
import { PendingRequestsPreview } from "../../../components/dashboard/pending-requests-preview";
import { TodaysBookings } from "../../../components/dashboard/todays-bookings";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function StylistDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();
  const queryClient = useQueryClient();

  // Approve booking mutation
  const approveMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to approve booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Decline booking mutation
  const declineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "Schedule conflict" }),
      });
      if (!response.ok) throw new Error("Failed to decline booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDecline = (id: string) => {
    declineMutation.mutate(id);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-text-primary">Dashboard</h1>
          <p className="text-body text-text-secondary">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <p className="text-body text-status-error">Failed to load dashboard data</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-text-primary">Dashboard</h1>
        <p className="text-body text-text-secondary">
          Welcome back, {user?.displayName || user?.email}
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        stats={data?.stats || { pendingRequests: 0, upcomingBookings: 0, thisMonthEarnings: 0, totalEarnings: 0 }}
        isLoading={isLoading}
      />

      {/* Today's Active Bookings (Start/Complete Actions) */}
      <TodaysBookings />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <PendingRequestsPreview
          requests={data?.pendingRequests || []}
          isLoading={isLoading}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />

        {/* Upcoming Bookings */}
        <UpcomingBookings
          bookings={data?.upcomingBookings || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
