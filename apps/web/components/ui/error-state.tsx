/**
 * ErrorState component - Display errors with retry option
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { AlertTriangle, RefreshCw, WifiOff, ServerCrash, Lock } from "lucide-react";

type ErrorType = "generic" | "network" | "server" | "unauthorized" | "notFound";

interface ErrorStateProps {
  /**
   * Type of error to display
   */
  type?: ErrorType;
  /**
   * Custom title (overrides default for error type)
   */
  title?: string;
  /**
   * Custom description (overrides default for error type)
   */
  description?: string;
  /**
   * Retry callback
   */
  onRetry?: () => void;
  /**
   * Whether retry is in progress
   */
  isRetrying?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Hide the icon
   */
  hideIcon?: boolean;
}

const errorConfig: Record<ErrorType, {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}> = {
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "We encountered an unexpected error. Please try again.",
  },
  network: {
    icon: WifiOff,
    title: "Connection error",
    description: "Please check your internet connection and try again.",
  },
  server: {
    icon: ServerCrash,
    title: "Server error",
    description: "Our servers are having issues. Please try again later.",
  },
  unauthorized: {
    icon: Lock,
    title: "Access denied",
    description: "You don't have permission to view this content.",
  },
  notFound: {
    icon: AlertTriangle,
    title: "Not found",
    description: "The content you're looking for doesn't exist or has been moved.",
  },
};

const sizeStyles = {
  sm: {
    container: "py-6 px-4",
    icon: "w-8 h-8",
    title: "text-sm",
    description: "text-xs",
    button: "sm" as const,
  },
  md: {
    container: "py-10 px-6",
    icon: "w-12 h-12",
    title: "text-base",
    description: "text-sm",
    button: "default" as const,
  },
  lg: {
    container: "py-14 px-8",
    icon: "w-16 h-16",
    title: "text-lg",
    description: "text-base",
    button: "default" as const,
  },
};

function ErrorState({
  type = "generic",
  title,
  description,
  onRetry,
  isRetrying = false,
  className,
  size = "md",
  hideIcon = false,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const styles = sizeStyles[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
      role="alert"
    >
      {/* Icon */}
      {!hideIcon && (
        <div
          className={cn(
            "mb-4 text-status-error bg-status-error/10 rounded-full p-3",
            size === "sm" && "p-2",
            size === "lg" && "p-4"
          )}
        >
          <Icon className={styles.icon} />
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          "font-semibold text-text-primary mb-1",
          styles.title
        )}
      >
        {title || config.title}
      </h3>

      {/* Description */}
      <p
        className={cn(
          "text-text-secondary max-w-sm mb-4",
          styles.description
        )}
      >
        {description || config.description}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button
          variant="outline"
          size={styles.button}
          onClick={onRetry}
          loading={isRetrying}
          disabled={isRetrying}
        >
          <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline error message for form fields
 */
function InlineError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-sm text-status-error flex items-center gap-1.5 mt-1.5",
        className
      )}
      role="alert"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export { ErrorState, InlineError };
export type { ErrorStateProps, ErrorType };
