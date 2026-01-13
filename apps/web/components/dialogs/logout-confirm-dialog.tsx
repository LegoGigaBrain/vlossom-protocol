"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/icons";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";
import { authFetch } from "../../lib/auth-client";

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
}

/**
 * V8.0.0: Migrated to httpOnly cookie auth
 * Logout now calls server to clear cookies
 */
export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // V8.0.0: Call server to clear httpOnly cookies
      await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
        method: "POST",
      });

      toast.success("Logged out", "You have been logged out successfully");

      onConfirm?.();
      onOpenChange(false);

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed", "Please try again");
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Log Out
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
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center">
                <Icon name="logout" size="lg" className="text-text-secondary" />
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <p className="text-text-primary">
                Are you sure you want to log out?
              </p>
              <p className="text-sm text-text-secondary mt-1">
                You&apos;ll need to sign in again to access your account.
              </p>
            </div>

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
                onClick={handleLogout}
                loading={isLoggingOut}
                className="flex-1"
              >
                <Icon name="logout" size="sm" className="mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
