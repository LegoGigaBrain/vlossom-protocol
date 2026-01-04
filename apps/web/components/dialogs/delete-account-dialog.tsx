"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "../../hooks/use-toast";
import { authFetch } from "../../lib/auth-client";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
}

/**
 * V8.0.0: Migrated to httpOnly cookie auth
 */
export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.toLowerCase() === "delete";

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);

    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast.success(
        "Account deleted",
        "Your account has been permanently deleted"
      );

      onConfirm?.();
      onOpenChange(false);

      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      toast.error(
        "Deletion failed",
        error instanceof Error ? error.message : "Please try again"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-status-error/30 bg-status-error/5">
            <div className="flex items-center gap-2">
              <Icon name="calmError" size="sm" className="text-status-error" />
              <Dialog.Title className="text-lg font-semibold text-status-error">
                Delete Account
              </Dialog.Title>
            </div>
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
            {/* Warning */}
            <div className="bg-status-error/10 rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-2">
                This action cannot be undone
              </h3>
              <ul className="text-sm text-text-secondary space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-status-error">•</span>
                  Your profile and all personal data will be permanently deleted
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-error">•</span>
                  All booking history will be removed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-error">•</span>
                  Any remaining wallet balance will be lost
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-status-error">•</span>
                  Reviews you&apos;ve written will be anonymized
                </li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label
                htmlFor="confirmDelete"
                className="block text-sm font-medium text-text-primary"
              >
                Type <span className="font-bold text-status-error">DELETE</span>{" "}
                to confirm
              </label>
              <Input
                id="confirmDelete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className={cn(
                  canDelete && "border-status-error focus:ring-status-error"
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
                disabled={!canDelete}
                className="flex-1"
              >
                <Icon name="delete" size="sm" className="mr-2" />
                Delete Account
              </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-text-muted text-center">
              If you have any pending bookings or disputes, please resolve them
              before deleting your account.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
