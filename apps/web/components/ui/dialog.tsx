"use client";

/**
 * Accessible Dialog Component
 *
 * Built on Radix UI Dialog for full accessibility support:
 * - Automatic focus trapping
 * - ESC key to close
 * - Focus restoration on close
 * - Proper ARIA attributes (role="dialog", aria-modal)
 * - Backdrop click handling
 *
 * @see https://www.radix-ui.com/primitives/docs/components/dialog
 */

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /**
   * If true, prevents closing the dialog via backdrop click or ESC key.
   * Use during critical operations like payment processing.
   */
  preventClose?: boolean;
  /**
   * Optional aria-label for the dialog when no visible title
   */
  "aria-label"?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  preventClose = false,
  "aria-label": ariaLabel,
}: DialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    // If preventClose is true, only allow opening, not closing
    if (preventClose && !newOpen) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={handleOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut"
        />
        <RadixDialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card bg-background-primary p-4 sm:p-6 shadow-vlossom focus:outline-none max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain data-[state=open]:animate-dialogIn data-[state=closed]:animate-dialogOut"
          aria-label={ariaLabel}
          onInteractOutside={(e) => {
            if (preventClose) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (preventClose) {
              e.preventDefault();
            }
          }}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={`space-y-4 ${className || ""}`}>{children}</div>;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <RadixDialog.Title className={`text-h2 text-text-primary ${className || ""}`}>
      {children}
    </RadixDialog.Title>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <RadixDialog.Description className={`text-body text-text-secondary ${className || ""}`}>
      {children}
    </RadixDialog.Description>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return <div className={`flex gap-3 mt-6 ${className || ""}`}>{children}</div>;
}

/**
 * Close button that can be placed inside the dialog
 * Automatically handles closing the dialog
 */
export const DialogClose = RadixDialog.Close;
