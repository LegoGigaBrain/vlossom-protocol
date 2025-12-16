/**
 * Booking Requests Page
 * Reference: docs/specs/stylist-dashboard/F3.2-booking-requests.md
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RequestCard, RequestCardSkeleton, type BookingRequest } from "../../../../components/dashboard/request-card";
import { RequestDetailsDialog } from "../../../../components/dashboard/request-details-dialog";
import { DeclineDialog } from "../../../../components/dashboard/decline-dialog";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { InboxIcon } from "@/components/ui/icons";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [requestToDecline, setRequestToDecline] = useState<string | null>(null);

  // Fetch pending requests
  const { data, isLoading, error } = useQuery({
    queryKey: ["stylist-pending-requests"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/v1/stylists/bookings?status=PENDING_STYLIST_APPROVAL`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json() as Promise<{ bookings: BookingRequest[]; total: number }>;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to approve booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDetailsOpen(false);
      toast.success("Booking approved", {
        description: "The customer has been notified.",
      });
    },
    onError: (error) => {
      toast.error("Failed to approve booking", {
        description: getErrorMessage(error),
      });
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const response = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/decline`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to decline booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylist-pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeclineDialogOpen(false);
      setDetailsOpen(false);
      setRequestToDecline(null);
      toast.success("Booking declined", {
        description: "The customer has been notified.",
      });
    },
    onError: (error) => {
      toast.error("Failed to decline booking", {
        description: getErrorMessage(error),
      });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDeclineClick = (id: string) => {
    setRequestToDecline(id);
    setDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = (reason: string) => {
    if (requestToDecline) {
      declineMutation.mutate({ bookingId: requestToDecline, reason });
    }
  };

  const handleViewDetails = (request: BookingRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  // Handle retry
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["stylist-pending-requests"] });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">Booking Requests</h1>
        <div
          className="bg-status-error/10 border border-status-error rounded-card p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-body text-status-error">Failed to load requests</p>
          <p className="text-caption text-text-secondary mt-1 mb-4">
            {getErrorMessage(error)}
          </p>
          <Button variant="secondary" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Booking Requests</h1>
          <p className="text-body text-text-secondary">
            Review and respond to booking requests from customers
          </p>
        </div>
        {data && data.total > 0 && (
          <span className="px-3 py-1 bg-status-warning/10 text-status-warning text-body-small rounded-full">
            {data.total} pending
          </span>
        )}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          <RequestCardSkeleton />
          <RequestCardSkeleton />
          <RequestCardSkeleton />
        </div>
      ) : data?.bookings.length === 0 ? (
        <div className="bg-background-primary rounded-card shadow-vlossom p-12 text-center">
          <InboxIcon className="h-12 w-12 mx-auto text-text-tertiary mb-4" />
          <h3 className="text-h4 text-text-primary mb-2">No pending requests</h3>
          <p className="text-body text-text-secondary">
            When customers request bookings, they'll appear here for you to review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.bookings.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onDecline={handleDeclineClick}
              onViewDetails={handleViewDetails}
              isApproving={approveMutation.isPending && approveMutation.variables === request.id}
              isDeclining={declineMutation.isPending && declineMutation.variables?.bookingId === request.id}
            />
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <RequestDetailsDialog
        request={selectedRequest}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onApprove={handleApprove}
        onDecline={handleDeclineClick}
        isApproving={approveMutation.isPending}
        isDeclining={declineMutation.isPending}
      />

      {/* Decline Dialog */}
      <DeclineDialog
        open={declineDialogOpen}
        onOpenChange={setDeclineDialogOpen}
        onConfirm={handleDeclineConfirm}
        isLoading={declineMutation.isPending}
        customerName={data?.bookings.find((r) => r.id === requestToDecline)?.customerName}
      />
    </div>
  );
}
