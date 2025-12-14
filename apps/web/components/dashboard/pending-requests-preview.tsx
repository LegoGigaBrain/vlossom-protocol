/**
 * Pending Requests Preview Component
 * Reference: docs/specs/stylist-dashboard/F3.1-stylist-dashboard.md
 */

"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { isToday } from "../../lib/utils";
import type { PendingRequest } from "../../lib/dashboard-client";

interface PendingRequestsPreviewProps {
  requests: PendingRequest[];
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
}

function formatRequestDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isToday(date)) {
    return `Today, ${date.toLocaleTimeString("en-ZA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `Tomorrow, ${date.toLocaleTimeString("en-ZA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function RequestItem({
  request,
  onApprove,
  onDecline,
}: {
  request: PendingRequest;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
}) {
  return (
    <div className="p-4 border-b border-border-default last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-text-primary truncate">
            {request.customerName}
          </p>
          <p className="text-body-small text-text-secondary truncate">
            {request.serviceName}
          </p>
          <p className="text-caption text-text-tertiary">
            {formatRequestDate(request.scheduledAt)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApprove?.(request.id)}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDecline?.(request.id)}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequestItemSkeleton() {
  return (
    <div className="p-4 border-b border-border-default last:border-0">
      <div className="animate-pulse flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-background-secondary rounded w-32"></div>
          <div className="h-3 bg-background-secondary rounded w-24"></div>
          <div className="h-3 bg-background-secondary rounded w-40"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-background-secondary rounded"></div>
          <div className="h-9 w-20 bg-background-secondary rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function PendingRequestsPreview({
  requests,
  isLoading,
  onApprove,
  onDecline,
}: PendingRequestsPreviewProps) {
  if (isLoading) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom">
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h3 className="text-h4 text-text-primary">Pending Requests</h3>
        </div>
        <RequestItemSkeleton />
        <RequestItemSkeleton />
        <RequestItemSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="text-h4 text-text-primary">Pending Requests</h3>
        <Link
          href="/stylist/dashboard/requests"
          className="text-body-small text-brand-rose hover:underline"
        >
          View All
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-body text-text-secondary">No pending requests</p>
          <p className="text-caption text-text-tertiary mt-1">
            New booking requests will appear here
          </p>
        </div>
      ) : (
        <div>
          {requests.slice(0, 3).map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              onApprove={onApprove}
              onDecline={onDecline}
            />
          ))}
          {requests.length > 3 && (
            <div className="p-4 text-center border-t border-border-default">
              <Link
                href="/stylist/dashboard/requests"
                className="text-body-small text-brand-rose hover:underline"
              >
                +{requests.length - 3} more requests
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
