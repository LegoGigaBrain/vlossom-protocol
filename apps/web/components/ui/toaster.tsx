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
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: null,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant ? icons[variant] : null;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3">
              {Icon && (
                <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
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
