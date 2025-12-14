"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  getCancellationPolicy,
  calculateRefund,
  type Booking,
} from "@/lib/booking-client";
import { useCancelBooking } from "@/hooks/use-bookings";

type CancelState = "idle" | "processing" | "success" | "error";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  onSuccess: () => void;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: CancelBookingDialogProps) {
  const [state, setState] = useState<CancelState>("idle");
  const [error, setError] = useState<string | null>(null);
  const cancelBooking = useCancelBooking();

  // Get cancellation policy
  const policy = getCancellationPolicy(booking.scheduledStartTime);
  const totalAmount = parseInt(booking.totalAmountCents);
  const { refundAmount, stylistFee } = calculateRefund(
    totalAmount,
    policy.refundPercentage
  );

  const handleCancel = async () => {
    try {
      setState("processing");
      setError(null);

      await cancelBooking.mutateAsync({
        id: booking.id,
        reason: "customer_requested",
      });

      setState("success");

      // Brief delay before closing
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  };

  const handleClose = () => {
    if (state !== "processing") {
      setState("idle");
      setError(null);
      onOpenChange(false);
    }
  };

  // Success state
  if (state === "success") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Booking Cancelled
          </h3>
          {policy.refundPercentage > 0 && (
            <p className="text-text-secondary">
              Your refund of {formatPrice(refundAmount)} has been returned to
              your wallet.
            </p>
          )}
        </div>
      </Dialog>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Cancellation Failed
            </h3>
            <p className="text-text-secondary">{error}</p>
          </div>
          <Button onClick={() => setState("idle")} className="w-full">
            Try Again
          </Button>
        </div>
      </Dialog>
    );
  }

  // Processing state
  if (state === "processing") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Cancelling Booking...
          </h3>
          <p className="text-text-secondary">Processing your refund</p>
        </div>
      </Dialog>
    );
  }

  // Idle state - confirmation dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="space-y-4">
        <h2 className="text-xl font-display font-semibold text-text-primary">
          Cancel Booking
        </h2>

        <p className="text-text-secondary">
          Are you sure you want to cancel your appointment with{" "}
          <span className="font-medium text-text-primary">
            {booking.stylist.displayName}
          </span>
          ?
        </p>

        {/* Cancellation Policy */}
        <div
          className={`rounded-lg p-4 ${
            policy.refundPercentage === 0
              ? "bg-accent/10 border border-accent"
              : policy.refundPercentage < 100
              ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500"
              : "bg-surface"
          }`}
        >
          <div className="flex items-start gap-2">
            {policy.refundPercentage === 0 ? (
              <svg
                className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-text-secondary flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div>
              <p
                className={`font-medium ${
                  policy.refundPercentage === 0
                    ? "text-accent"
                    : "text-text-primary"
                }`}
              >
                Cancellation Policy
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {policy.message}
              </p>
            </div>
          </div>
        </div>

        {/* Refund Summary */}
        <div className="bg-surface rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Refund Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-text-primary">
              <span>Original Amount</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-text-primary">
              <span>Refund ({policy.refundPercentage}%)</span>
              <span className="text-tertiary">{formatPrice(refundAmount)}</span>
            </div>
            {stylistFee > 0 && (
              <div className="flex justify-between text-text-secondary text-sm">
                <span>Stylist Fee</span>
                <span>{formatPrice(stylistFee)}</span>
              </div>
            )}
          </div>
        </div>

        {/* No refund warning */}
        {policy.refundPercentage === 0 && (
          <p className="text-sm text-accent">
            You will not receive a refund if you proceed with cancellation.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Keep Booking
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 text-accent border-accent hover:bg-accent hover:text-white"
          >
            Cancel & Refund
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
