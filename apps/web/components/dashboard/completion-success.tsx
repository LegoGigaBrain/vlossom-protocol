/**
 * Completion Success Dialog Component
 * Reference: docs/specs/stylist-dashboard/F3.7-completion-flow.md
 */

"use client";

import {
  Dialog,
  DialogContent,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { formatPrice } from "../../lib/utils";

interface CompletionSuccessProps {
  customerName: string;
  payoutAmount: number;
  open: boolean;
  onClose: () => void;
}

export function CompletionSuccess({
  customerName,
  payoutAmount,
  open,
  onClose,
}: CompletionSuccessProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="py-6 space-y-4">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto bg-status-success/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>

          {/* Title */}
          <h2 className="text-h2 text-text-primary">Service Completed!</h2>

          {/* Message */}
          <p className="text-body text-text-secondary">
            {customerName} has been notified to confirm.
          </p>

          {/* Payout Info */}
          <div className="p-4 bg-status-success/5 border border-status-success/20 rounded-lg">
            <p className="text-body text-text-secondary">
              Your payout of{" "}
              <span className="font-semibold text-status-success">
                {formatPrice(payoutAmount)}
              </span>{" "}
              will be released to your wallet within 24 hours.
            </p>
          </div>

          {/* Back Button */}
          <Button variant="primary" className="w-full" onClick={onClose}>
            Back to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
