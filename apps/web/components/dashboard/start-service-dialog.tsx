/**
 * Start Service Dialog Component
 * Reference: docs/specs/stylist-dashboard/F3.7-completion-flow.md
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { formatTimeFromDate, formatDuration } from "../../lib/utils";
import type { ActiveBooking } from "./active-booking-card";

interface StartServiceDialogProps {
  booking: ActiveBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function StartServiceDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: StartServiceDialogProps) {
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Service?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            You're about to start:
          </p>

          <div className="p-4 bg-background-secondary rounded-lg space-y-2">
            <p className="text-body font-semibold text-text-primary">
              {booking.serviceName}
            </p>
            <p className="text-body-small text-text-secondary">
              Customer: {booking.customerName}
            </p>
            <p className="text-body-small text-text-secondary">
              Scheduled: {formatTimeFromDate(booking.scheduledStartTime)} -{" "}
              {formatTimeFromDate(booking.scheduledEndTime)}
            </p>
            <p className="text-body-small text-text-secondary">
              Duration: {formatDuration(booking.durationMinutes)}
            </p>
          </div>

          <div className="p-3 bg-brand-rose/5 border border-brand-rose/20 rounded-lg">
            <p className="text-body-small text-text-secondary">
              ℹ️ Starting the service confirms you've met the customer and are
              beginning work.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "🚀 Start Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
