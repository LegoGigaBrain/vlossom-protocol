/**
 * Decline Dialog Component
 * Reference: docs/specs/stylist-dashboard/F3.2-booking-requests.md
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";

const DECLINE_REASONS = [
  "Schedule conflict",
  "Service not available",
  "Location too far",
  "Need more information",
  "Other",
];

interface DeclineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  customerName?: string;
}

export function DeclineDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  customerName,
}: DeclineDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  const handleConfirm = () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (reason) {
      onConfirm(reason);
    }
  };

  const isValid = selectedReason && (selectedReason !== "Other" || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline Booking Request</DialogTitle>
          <DialogDescription>
            {customerName
              ? `Let ${customerName} know why you can't accept this booking.`
              : "Please select a reason for declining this booking."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            {DECLINE_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedReason === reason
                    ? "border-brand-rose bg-brand-rose/5"
                    : "border-border-default hover:border-border-focus"
                }`}
              >
                <input
                  type="radio"
                  name="declineReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-brand-rose focus:ring-brand-rose"
                />
                <span className="text-body text-text-primary">{reason}</span>
              </label>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === "Other" && (
            <div>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide a reason..."
                className="w-full p-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose text-body resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
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
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
            >
              {isLoading ? "Declining..." : "Decline Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
