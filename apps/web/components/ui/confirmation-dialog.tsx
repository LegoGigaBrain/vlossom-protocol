"use client";

/**
 * Confirmation Dialog Component
 *
 * A reusable dialog for confirming destructive or important actions.
 * Replaces native browser confirm() with proper accessible UI.
 *
 * Features:
 * - Variants: default, danger, warning
 * - Animated entry/exit
 * - Full keyboard accessibility
 * - Proper focus management
 */

import * as React from "react";
import { Icon, type IconName } from "@/components/icons";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: "default" | "danger" | "warning";
  isLoading?: boolean;
}

const variantConfig = {
  default: {
    iconName: "info" as IconName,
    iconColor: "text-brand-purple",
    iconBg: "bg-brand-purple/10",
    confirmVariant: "primary" as const,
  },
  danger: {
    iconName: "calmError" as IconName,
    iconColor: "text-status-error",
    iconBg: "bg-status-error/10",
    confirmVariant: "destructive" as const,
  },
  warning: {
    iconName: "error" as IconName,
    iconColor: "text-status-warning",
    iconBg: "bg-status-warning/10",
    confirmVariant: "primary" as const,
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !isLoading) {
          handleCancel();
        }
      }}
      preventClose={isLoading}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}
        >
          <Icon name={config.iconName} size="lg" className={config.iconColor} />
        </div>

        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="w-full flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

/**
 * Hook for managing confirmation dialog state
 */
export function useConfirmation() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: "default" | "danger" | "warning";
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: "default" | "danger" | "warning";
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel || "Confirm",
          cancelLabel: options.cancelLabel || "Cancel",
          variant: options.variant || "default",
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    },
    []
  );

  const setOpen = React.useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  }, []);

  return {
    ...state,
    setOpen,
    confirm,
  };
}
