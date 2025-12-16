/**
 * Request Card Component
 * Reference: docs/specs/stylist-dashboard/F3.2-booking-requests.md
 */

"use client";

import { formatPrice, formatDuration, isToday } from "../../lib/utils";
import { Button } from "../ui/button";
import { CalendarIcon, LocationIcon, CurrencyIcon } from "../ui/icons";

export interface BookingRequest {
  id: string;
  customerName: string;
  serviceName: string;
  serviceCategory: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: "STYLIST_BASE" | "CUSTOMER_HOME";
  locationAddress: string;
  quoteAmountCents: number;
  platformFeeCents: number;
  stylistPayoutCents: number;
  createdAt: string;
}

interface RequestCardProps {
  request: BookingRequest;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onViewDetails: (request: BookingRequest) => void;
  isApproving?: boolean;
  isDeclining?: boolean;
}

function formatRequestDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday(date)) {
    return `Today at ${timeStr}`;
  }

  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `Tomorrow at ${timeStr}`;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + ` at ${timeStr}`;
}

export function RequestCard({
  request,
  onApprove,
  onDecline,
  onViewDetails,
  isApproving,
  isDeclining,
}: RequestCardProps) {
  const locationLabel = request.locationType === "STYLIST_BASE"
    ? "Your Location"
    : "Customer Location";

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-body font-semibold text-text-primary">
            {request.customerName}
          </h3>
          <p className="text-body-small text-text-secondary">
            {request.serviceName} · {formatDuration(request.durationMinutes)}
          </p>
        </div>
        <span className="px-2 py-1 bg-status-warning/10 text-status-warning text-caption rounded-full">
          Pending
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-body-small text-text-secondary">
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span>{formatRequestDate(request.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-body-small text-text-secondary">
          <LocationIcon className="h-4 w-4 shrink-0" />
          <span>{locationLabel} ({request.locationAddress.split(",")[0]})</span>
        </div>
        <div className="flex items-center gap-2 text-body-small text-text-secondary">
          <CurrencyIcon className="h-4 w-4 shrink-0" />
          <span>{formatPrice(request.quoteAmountCents)}</span>
          <span className="text-text-tertiary">
            (You receive {formatPrice(request.stylistPayoutCents)})
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-border-default">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(request)}
        >
          View Details
        </Button>
        <div className="flex-1"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDecline(request.id)}
          disabled={isApproving || isDeclining}
        >
          {isDeclining ? "Declining..." : "Decline"}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onApprove(request.id)}
          disabled={isApproving || isDeclining}
        >
          {isApproving ? "Approving..." : "Approve"}
        </Button>
      </div>
    </div>
  );
}

export function RequestCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-background-secondary rounded w-32"></div>
            <div className="h-3 bg-background-secondary rounded w-40"></div>
          </div>
          <div className="h-6 bg-background-secondary rounded w-16"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-background-secondary rounded w-48"></div>
          <div className="h-4 bg-background-secondary rounded w-40"></div>
          <div className="h-4 bg-background-secondary rounded w-56"></div>
        </div>
        <div className="flex gap-2 pt-4 border-t border-border-default">
          <div className="h-9 bg-background-secondary rounded w-24"></div>
          <div className="flex-1"></div>
          <div className="h-9 bg-background-secondary rounded w-20"></div>
          <div className="h-9 bg-background-secondary rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}
