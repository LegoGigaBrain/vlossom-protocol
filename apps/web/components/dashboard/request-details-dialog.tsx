/**
 * Request Details Dialog Component
 * Reference: docs/specs/stylist-dashboard/F3.2-booking-requests.md
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { formatPrice, formatDuration } from "../../lib/utils";
import type { BookingRequest } from "./request-card";

interface RequestDetailsDialogProps {
  request: BookingRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  isApproving?: boolean;
  isDeclining?: boolean;
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeRange(dateString: string, durationMinutes: number): string {
  const start = new Date(dateString);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-ZA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function RequestDetailsDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onDecline,
  isApproving,
  isDeclining,
}: RequestDetailsDialogProps) {
  if (!request) return null;

  const locationLabel = request.locationType === "STYLIST_BASE"
    ? "Your Base Location"
    : "Customer Location";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Section */}
          <div>
            <p className="text-caption text-text-tertiary mb-2">Customer</p>
            <div className="bg-background-secondary rounded-lg p-3">
              <p className="text-body font-medium text-text-primary">
                {request.customerName}
              </p>
            </div>
          </div>

          {/* Service Section */}
          <div>
            <p className="text-caption text-text-tertiary mb-2">Service</p>
            <p className="text-body text-text-primary">{request.serviceName}</p>
            <p className="text-body-small text-text-secondary">
              Duration: {formatDuration(request.durationMinutes)}
            </p>
          </div>

          {/* Date & Time Section */}
          <div>
            <p className="text-caption text-text-tertiary mb-2">Date & Time</p>
            <p className="text-body text-text-primary">
              {formatFullDate(request.scheduledAt)}
            </p>
            <p className="text-body-small text-text-secondary">
              {formatTimeRange(request.scheduledAt, request.durationMinutes)}
            </p>
          </div>

          {/* Location Section */}
          <div>
            <p className="text-caption text-text-tertiary mb-2">Location</p>
            <p className="text-body text-text-primary">{locationLabel}</p>
            <p className="text-body-small text-text-secondary">
              {request.locationAddress}
            </p>
          </div>

          {/* Price Breakdown Section */}
          <div>
            <p className="text-caption text-text-tertiary mb-2">Price Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-body-small text-text-secondary">Service</span>
                <span className="text-body-small text-text-primary">
                  {formatPrice(request.quoteAmountCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-text-secondary">Platform Fee (10%)</span>
                <span className="text-body-small text-text-secondary">
                  -{formatPrice(request.platformFeeCents)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border-default">
                <span className="text-body font-medium text-text-primary">Your Payout</span>
                <span className="text-body font-semibold text-brand-rose">
                  {formatPrice(request.stylistPayoutCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onDecline(request.id)}
              disabled={isApproving || isDeclining}
            >
              {isDeclining ? "Declining..." : "Decline"}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => onApprove(request.id)}
              disabled={isApproving || isDeclining}
            >
              {isApproving ? "Approving..." : "Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
