/**
 * Badge Component
 *
 * A small status indicator or label.
 */

import * as React from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "danger" | "info" | "secondary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  error: "bg-status-error/10 text-status-error",
  danger: "bg-status-error/10 text-status-error",
  info: "bg-tertiary/10 text-tertiary",
  secondary: "bg-background-secondary text-text-secondary",
};

export function Badge({
  children,
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium ${variantClasses[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
