"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle, DollarSign, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";

interface ConfirmServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  serviceName: string;
  totalAmount: string;
  onSuccess?: () => void;
  onReviewPrompt?: () => void;
}

const tipOptions = [
  { label: "No tip", value: 0 },
  { label: "$5", value: 5 },
  { label: "$10", value: 10 },
  { label: "$20", value: 20 },
  { label: "Custom", value: -1 },
];

export function ConfirmServiceDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  serviceName,
  totalAmount,
  onSuccess,
  onReviewPrompt,
}: ConfirmServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTipSelect = (value: number) => {
    if (value === -1) {
      setShowCustomInput(true);
      setSelectedTip(0);
    } else {
      setShowCustomInput(false);
      setCustomTip("");
      setSelectedTip(value);
    }
  };

  const actualTip = showCustomInput ? parseFloat(customTip) || 0 : selectedTip;

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("vlossom_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/confirm-completion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tip: actualTip > 0 ? actualTip : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to confirm service");
      }

      toast.success(
        "Service confirmed!",
        actualTip > 0
          ? `Your payment and $${actualTip.toFixed(2)} tip have been sent.`
          : "Your payment has been released to the stylist."
      );

      onSuccess?.();
      onOpenChange(false);

      // Prompt for review after a short delay
      setTimeout(() => {
        onReviewPrompt?.();
      }, 500);
    } catch (error) {
      toast.error(
        "Confirmation failed",
        error instanceof Error ? error.message : "Please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Confirm Service Completion
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-status-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-status-success" />
              </div>
            </div>

            {/* Service Summary */}
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                Service completed by
              </p>
              <p className="text-lg font-medium text-text-primary">
                {stylistName}
              </p>
              <p className="text-sm text-text-muted mt-1">{serviceName}</p>
            </div>

            {/* Amount */}
            <div className="bg-background-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Service total</span>
                <span className="text-lg font-semibold text-text-primary">
                  ${totalAmount}
                </span>
              </div>
              {actualTip > 0 && (
                <>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-default">
                    <span className="text-text-secondary">Tip</span>
                    <span className="text-brand-rose font-medium">
                      +${actualTip.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-default">
                    <span className="font-medium text-text-primary">Total</span>
                    <span className="text-lg font-bold text-text-primary">
                      ${(parseFloat(totalAmount) + actualTip).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tip Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">
                  Add a tip for {stylistName.split(" ")[0]}?
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {tipOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTipSelect(option.value)}
                    className={cn(
                      "py-2 px-2 rounded-lg text-sm font-medium transition-gentle",
                      (option.value === -1 && showCustomInput) ||
                        (option.value !== -1 &&
                          !showCustomInput &&
                          selectedTip === option.value)
                        ? "bg-brand-rose text-white"
                        : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {showCustomInput && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                    $
                  </span>
                  <input
                    type="number"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-4 py-2 rounded-lg border border-border-default bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              )}
            </div>

            {/* Info */}
            <p className="text-xs text-text-muted text-center">
              By confirming, the payment will be released from escrow to{" "}
              {stylistName.split(" ")[0]}.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                loading={isSubmitting}
                className="flex-1"
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
