/**
 * Toaster component - Renders active toasts
 * Add <Toaster /> to your root layout
 */

"use client";

import { useToast } from "../../hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { Icon, type IconName } from "@/components/icons";

const iconNames: Record<string, IconName | null> = {
  success: "success",
  error: "error",
  warning: "calmError",
  info: "info",
  default: null,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const iconName = variant ? iconNames[variant] : null;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3">
              {iconName && (
                <Icon name={iconName} size="sm" className="shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
