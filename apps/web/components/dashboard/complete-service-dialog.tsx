/**
 * Complete Service Dialog Component
 * Reference: docs/specs/stylist-dashboard/F3.7-completion-flow.md
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { formatPrice, formatDuration } from "../../lib/utils";
import type { ActiveBooking } from "./active-booking-card";

interface CompleteServiceDialogProps {
  booking: ActiveBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function calculateActualDuration(startTime: string | undefined): number {
  if (!startTime) return 0;
  const start = new Date(startTime).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60)); // minutes
}

export function CompleteServiceDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CompleteServiceDialogProps) {
  const [actualDuration, setActualDuration] = useState(0);

  useEffect(() => {
    if (booking?.actualStartTime && open) {
      setActualDuration(calculateActualDuration(booking.actualStartTime));
    }
  }, [booking?.actualStartTime, open]);

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Service?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            You&apos;re completing:
          </p>

          <div className="p-4 bg-background-secondary rounded-lg space-y-2">
            <p className="text-body font-semibold text-text-primary">
              {booking.serviceName}
            </p>
            <p className="text-body-small text-text-secondary">
              Customer: {booking.customerName}
            </p>
            <p className="text-body-small text-text-secondary">
              Duration: {formatDuration(actualDuration)} (estimated:{" "}
              {formatDuration(booking.durationMinutes)})
            </p>
          </div>

          {/* Payout Breakdown */}
          <div className="p-4 bg-background-primary border border-border-default rounded-lg">
            <p className="text-body font-semibold text-text-primary mb-3">
              Your Payout
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-body-small text-text-secondary">
                  Service Fee
                </span>
                <span className="text-body-small text-text-primary">
                  {formatPrice(booking.quoteAmountCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-small text-text-secondary">
                  Platform Fee (10%)
                </span>
                <span className="text-body-small text-text-tertiary">
                  -{formatPrice(booking.platformFeeCents)}
                </span>
              </div>
              <hr className="border-border-default" />
              <div className="flex justify-between">
                <span className="text-body font-semibold text-text-primary">
                  You Receive
                </span>
                <span className="text-body font-bold text-status-success">
                  {formatPrice(booking.stylistPayoutCents)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-brand-rose/5 border border-brand-rose/20 rounded-lg">
            <p className="text-body-small text-text-secondary">
              ℹ️ The customer will be asked to confirm completion. Funds will be
              released within 24 hours if they don&apos;t respond.
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
              {isLoading ? "Completing..." : "✓ Mark Complete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
