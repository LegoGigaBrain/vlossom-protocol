/**
 * Active Booking Card Component
 * Reference: docs/specs/stylist-dashboard/F3.7-completion-flow.md
 */

"use client";

import { useState, useEffect } from "react";
import { formatDuration, formatTimeFromDate } from "../../lib/utils";
import { Button } from "../ui/button";

export interface ActiveBooking {
  id: string;
  customerName: string;
  serviceName: string;
  status: "CONFIRMED" | "IN_PROGRESS";
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  durationMinutes: number;
  locationType: "STYLIST_BASE" | "CUSTOMER_HOME";
  locationAddress: string;
  quoteAmountCents: number;
  platformFeeCents: number;
  stylistPayoutCents: number;
}

interface ActiveBookingCardProps {
  booking: ActiveBooking;
  onStart: (booking: ActiveBooking) => void;
  onComplete: (booking: ActiveBooking) => void;
}

function useElapsedTime(startTime: string | undefined) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    if (!startTime) return;

    const updateElapsed = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const diff = now - start;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setElapsed({ hours, minutes });
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

function canStartService(scheduledTime: string): boolean {
  const scheduled = new Date(scheduledTime).getTime();
  const now = Date.now();
  // Can start up to 15 minutes early
  return now >= scheduled - 15 * 60 * 1000;
}

export function ActiveBookingCard({
  booking,
  onStart,
  onComplete,
}: ActiveBookingCardProps) {
  const elapsed = useElapsedTime(booking.actualStartTime);
  const canStart = canStartService(booking.scheduledStartTime);

  const isConfirmed = booking.status === "CONFIRMED";
  const isInProgress = booking.status === "IN_PROGRESS";

  const statusColor = isInProgress
    ? "bg-status-success/10 text-status-success"
    : "bg-brand-rose/10 text-brand-rose";

  const statusLabel = isInProgress ? "IN PROGRESS" : "CONFIRMED";

  const locationLabel = booking.locationType === "STYLIST_BASE"
    ? "Your Location"
    : "Customer Location";

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6 border-l-4 border-brand-rose">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className={`px-2 py-1 text-caption rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
        <span className="text-body-small text-text-secondary">
          {formatTimeFromDate(booking.scheduledStartTime)} -{" "}
          {formatTimeFromDate(booking.scheduledEndTime)}
        </span>
      </div>

      {/* Customer & Service Info */}
      <div className="mb-4">
        <h3 className="text-body font-semibold text-text-primary">
          {booking.customerName}
        </h3>
        <p className="text-body-small text-text-secondary">
          {booking.serviceName} · {formatDuration(booking.durationMinutes)}
        </p>
        <p className="text-caption text-text-tertiary mt-1">
          📍 {locationLabel} ({booking.locationAddress.split(",")[0]})
        </p>
      </div>

      {/* Elapsed Time (for in-progress) */}
      {isInProgress && booking.actualStartTime && (
        <div className="mb-4 p-3 bg-background-secondary rounded-lg">
          <p className="text-body-small text-text-secondary">
            ⏱️ Elapsed: {elapsed.hours > 0 ? `${elapsed.hours}h ` : ""}
            {elapsed.minutes}min
          </p>
          <p className="text-caption text-text-tertiary">
            Started at {formatTimeFromDate(booking.actualStartTime)}
          </p>
        </div>
      )}

      {/* Actions */}
      {isConfirmed && (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onStart(booking)}
          disabled={!canStart}
        >
          {canStart ? "🚀 Start Service" : `Available at ${formatTimeFromDate(booking.scheduledStartTime)}`}
        </Button>
      )}

      {isInProgress && (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onComplete(booking)}
        >
          ✓ Complete Service
        </Button>
      )}
    </div>
  );
}

export function ActiveBookingCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6 border-l-4 border-background-secondary">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="h-6 bg-background-secondary rounded w-24"></div>
          <div className="h-4 bg-background-secondary rounded w-32"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-background-secondary rounded w-32"></div>
          <div className="h-4 bg-background-secondary rounded w-40"></div>
          <div className="h-3 bg-background-secondary rounded w-48"></div>
        </div>
        <div className="h-11 bg-background-secondary rounded w-full"></div>
      </div>
    </div>
  );
}
