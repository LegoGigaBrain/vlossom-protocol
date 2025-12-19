/**
 * Property Owner Rental Requests Page
 * Reference: docs/vlossom/17-property-owner-module.md
 */

"use client";

import * as React from "react";
import Image from "next/image";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getAuthToken } from "../../../lib/auth-client";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";
import { cn } from "../../../lib/utils";
import { toast } from "../../../hooks/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Types
interface RentalRequest {
  id: string;
  chairId: string;
  stylistId: string;
  propertyId: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  rentalMode: "PER_BOOKING" | "PER_HOUR" | "PER_DAY" | "PER_WEEK" | "PER_MONTH";
  startDate: string;
  endDate: string | null;
  message: string | null;
  createdAt: string;
  chair: {
    id: string;
    name: string;
    type: string;
  };
  property: {
    id: string;
    name: string;
  };
  stylist: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    rating: number | null;
    verificationStatus: string;
  };
}

// Fetch rental requests
async function fetchRentalRequests(): Promise<{ requests: RentalRequest[] }> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}/api/v1/properties/rentals/requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch requests");
  }

  return response.json();
}

// Approve/Decline request
async function updateRequestStatus(
  requestId: string,
  action: "approve" | "decline",
  reason?: string
): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `${API_URL}/api/v1/properties/rentals/requests/${requestId}/${action}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to ${action} request`);
  }

  return response.json();
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

// Rental mode labels
const RENTAL_MODE_LABELS: Record<string, string> = {
  PER_BOOKING: "Per Booking",
  PER_HOUR: "Hourly",
  PER_DAY: "Daily",
  PER_WEEK: "Weekly",
  PER_MONTH: "Monthly",
};

interface RequestCardProps {
  request: RentalRequest;
  onApprove: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}

function RequestCard({ request, onApprove, onDecline, isProcessing }: RequestCardProps) {
  const [showDeclineReason, setShowDeclineReason] = React.useState(false);
  const [declineReason, setDeclineReason] = React.useState("");

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom overflow-hidden">
      {/* Stylist Info */}
      <div className="p-4 border-b border-border-default">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-full bg-background-tertiary overflow-hidden flex-shrink-0">
            {request.stylist.avatarUrl ? (
              <Image
                src={request.stylist.avatarUrl}
                alt={request.stylist.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="profile" size="lg" className="text-text-muted" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-body font-medium text-text-primary truncate">
                {request.stylist.displayName}
              </h3>
              {request.stylist.verificationStatus === "VERIFIED" && (
                <Icon name="verified" size="sm" className="text-brand-rose flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-caption text-text-secondary mt-0.5">
              {request.stylist.rating && (
                <>
                  <span className="flex items-center gap-0.5">
                    <Icon name="star" size="sm" weight="fill" className="text-accent-orange" />
                    {request.stylist.rating.toFixed(1)}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{formatTimeAgo(request.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Message if present */}
        {request.message && (
          <div className="mt-3 p-3 bg-background-tertiary rounded text-caption text-text-secondary">
            &ldquo;{request.message}&rdquo;
          </div>
        )}
      </div>

      {/* Request Details */}
      <div className="p-4 border-b border-border-default space-y-2">
        <div className="flex items-center justify-between text-caption">
          <span className="text-text-tertiary">Chair</span>
          <span className="text-text-primary font-medium">{request.chair.name}</span>
        </div>
        <div className="flex items-center justify-between text-caption">
          <span className="text-text-tertiary">Property</span>
          <span className="text-text-primary">{request.property.name}</span>
        </div>
        <div className="flex items-center justify-between text-caption">
          <span className="text-text-tertiary">Rental Type</span>
          <span className="text-text-primary">{RENTAL_MODE_LABELS[request.rentalMode]}</span>
        </div>
        <div className="flex items-center justify-between text-caption">
          <span className="text-text-tertiary">Start Date</span>
          <span className="text-text-primary">{formatDate(request.startDate)}</span>
        </div>
        {request.endDate && (
          <div className="flex items-center justify-between text-caption">
            <span className="text-text-tertiary">End Date</span>
            <span className="text-text-primary">{formatDate(request.endDate)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        {showDeclineReason ? (
          <div className="space-y-3">
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-border-default rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-brand-rose resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowDeclineReason(false);
                  setDeclineReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={onDecline}
                disabled={isProcessing}
              >
                {isProcessing ? "Declining..." : "Decline"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDeclineReason(true)}
              disabled={isProcessing}
            >
              Decline
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={onApprove}
              disabled={isProcessing}
            >
              {isProcessing ? "Approving..." : "Approve"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom overflow-hidden">
      <div className="p-4 border-b border-border-default">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 skeleton-shimmer rounded-full" />
          <div className="flex-1">
            <div className="h-5 skeleton-shimmer rounded w-32 mb-1" />
            <div className="h-4 skeleton-shimmer rounded w-20" />
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-border-default space-y-2">
        <div className="h-4 skeleton-shimmer rounded w-full" />
        <div className="h-4 skeleton-shimmer rounded w-3/4" />
        <div className="h-4 skeleton-shimmer rounded w-1/2" />
      </div>
      <div className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 h-9 skeleton-shimmer rounded" />
          <div className="flex-1 h-9 skeleton-shimmer rounded" />
        </div>
      </div>
    </div>
  );
}

export default function PropertyOwnerRequestsPage() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "PENDING" | "APPROVED" | "DECLINED">("PENDING");

  // Fetch requests
  const { data, isLoading, error } = useQuery({
    queryKey: ["rental-requests"],
    queryFn: fetchRentalRequests,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (requestId: string) => updateRequestStatus(requestId, "approve"),
    onMutate: (requestId) => setProcessingId(requestId),
    onSettled: () => setProcessingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Request approved", "The stylist has been notified.");
    },
    onError: () => {
      toast.error("Failed to approve", "Please try again.");
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      updateRequestStatus(requestId, "decline", reason),
    onMutate: ({ requestId }) => setProcessingId(requestId),
    onSettled: () => setProcessingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-requests"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Request declined", "The stylist has been notified.");
    },
    onError: () => {
      toast.error("Failed to decline", "Please try again.");
    },
  });

  // Filter requests
  const requests = data?.requests || [];
  const filteredRequests = React.useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">Requests</h1>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <Icon name="calmError" size="xl" className="text-status-error mx-auto mb-2" />
          <p className="text-body text-status-error">Failed to load requests</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-text-primary">Requests</h1>
        <p className="text-body text-text-secondary">
          Review and manage chair rental requests from stylists
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[
          { value: "PENDING", label: "Pending", count: pendingCount },
          { value: "APPROVED", label: "Approved" },
          { value: "DECLINED", label: "Declined" },
          { value: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={cn(
              "px-4 py-2 text-body font-medium rounded-full whitespace-nowrap transition-colors",
              filter === tab.value
                ? "bg-brand-rose text-white"
                : "bg-background-tertiary text-text-secondary hover:bg-background-primary"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-caption">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RequestCardSkeleton />
          <RequestCardSkeleton />
          <RequestCardSkeleton />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center">
            <Icon name="inbox" size="2xl" className="text-text-muted" />
          </div>
          <h3 className="text-body font-medium text-text-primary mb-2">
            {filter === "PENDING"
              ? "No pending requests"
              : filter === "APPROVED"
                ? "No approved requests"
                : filter === "DECLINED"
                  ? "No declined requests"
                  : "No requests yet"}
          </h3>
          <p className="text-caption text-text-secondary max-w-md mx-auto">
            {filter === "PENDING"
              ? "When stylists request to rent your chairs, they will appear here for your review."
              : "Requests in this category will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={() => approveMutation.mutate(request.id)}
              onDecline={() =>
                declineMutation.mutate({ requestId: request.id, reason: undefined })
              }
              isProcessing={processingId === request.id}
            />
          ))}
        </div>
      )}

      {/* Help Text */}
      {filter === "PENDING" && pendingCount > 0 && (
        <div className="bg-background-tertiary rounded-card p-4">
          <div className="flex items-start gap-3">
            <Icon name="info" size="md" className="text-text-secondary mt-0.5" />
            <div className="text-caption text-text-secondary">
              <p className="font-medium mb-1">Quick Tips</p>
              <ul className="space-y-1 text-text-tertiary">
                <li>Review the stylist&apos;s profile and rating before approving</li>
                <li>Approved stylists will have access to book the chair</li>
                <li>You can always revoke access later if needed</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
