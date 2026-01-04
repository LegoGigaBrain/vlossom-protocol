"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";
import { authFetch } from "../../lib/auth-client";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  stylistName: string;
  stylistAvatarUrl?: string | null;
  onSuccess?: () => void;
}

const presetAmounts = [
  { value: 5, label: "$5" },
  { value: 10, label: "$10" },
  { value: 15, label: "$15" },
  { value: 20, label: "$20" },
  { value: 25, label: "$25" },
  { value: 50, label: "$50" },
];

/**
 * V8.0.0: Migrated to httpOnly cookie auth
 */
export function TipDialog({
  open,
  onOpenChange,
  bookingId,
  stylistName,
  stylistAvatarUrl,
  onSuccess,
}: TipDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = (value: number) => {
    setSelectedAmount(value);
    setShowCustom(false);
    setCustomAmount("");
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    setSelectedAmount(null);
  };

  const tipAmount = showCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount || 0;

  const handleSubmit = async () => {
    if (tipAmount <= 0) {
      toast.error("Invalid amount", "Please enter a tip amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${bookingId}/tip`,
        {
          method: "POST",
          body: JSON.stringify({ amount: tipAmount }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send tip");
      }

      toast.success(
        "Tip sent!",
        `Your $${tipAmount.toFixed(2)} tip has been sent to ${stylistName}.`
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        "Tip failed",
        error instanceof Error ? error.message : "Please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName = stylistName.split(" ")[0];
  const initials = stylistName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Send a Tip
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <Icon name="close" size="sm" className="text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Stylist Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-background-tertiary mb-3">
                {stylistAvatarUrl ? (
                  <Image
                    src={stylistAvatarUrl}
                    alt={stylistName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-text-secondary">
                    {initials}
                  </div>
                )}
              </div>
              <p className="text-lg font-medium text-text-primary">
                {stylistName}
              </p>
              <p className="text-sm text-text-secondary flex items-center gap-1 mt-1">
                <Icon name="favorite" size="sm" className="text-brand-rose" />
                Show your appreciation
              </p>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={cn(
                    "py-3 rounded-lg text-lg font-medium transition-gentle",
                    selectedAmount === preset.value && !showCustom
                      ? "bg-brand-rose text-white"
                      : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <button
              type="button"
              onClick={handleCustomClick}
              className={cn(
                "w-full py-2 rounded-lg text-sm font-medium transition-gentle",
                showCustom
                  ? "bg-brand-rose/10 text-brand-rose"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              Enter custom amount
            </button>

            {showCustom && (
              <div className="relative">
                <Icon name="currency" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 text-xl font-medium rounded-lg border border-border-default bg-background-primary text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-brand-rose"
                />
              </div>
            )}

            {/* Selected Amount Display */}
            {tipAmount > 0 && (
              <div className="bg-status-success/10 rounded-lg p-4 text-center">
                <p className="text-sm text-text-secondary">
                  You&apos;re tipping {firstName}
                </p>
                <p className="text-2xl font-bold text-status-success">
                  ${tipAmount.toFixed(2)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={tipAmount <= 0}
                className="flex-1"
              >
                Send Tip
              </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-text-muted text-center">
              100% of your tip goes directly to {firstName}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
