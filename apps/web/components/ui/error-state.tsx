/**
 * ErrorState component - Display errors with retry option
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Icon, type IconName } from "@/components/icons";

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
  iconName: IconName;
  title: string;
  description: string;
}> = {
  generic: {
    iconName: "calmError",
    title: "Something went wrong",
    description: "We encountered an unexpected error. Please try again.",
  },
  network: {
    iconName: "web",
    title: "Connection error",
    description: "Please check your internet connection and try again.",
  },
  server: {
    iconName: "error",
    title: "Server error",
    description: "Our servers are having issues. Please try again later.",
  },
  unauthorized: {
    iconName: "locked",
    title: "Access denied",
    description: "You don't have permission to view this content.",
  },
  notFound: {
    iconName: "search",
    title: "Not found",
    description: "The content you're looking for doesn't exist or has been moved.",
  },
};

const sizeStyles = {
  sm: {
    container: "py-6 px-4",
    iconSize: "lg" as const,
    title: "text-sm",
    description: "text-xs",
    button: "sm" as const,
  },
  md: {
    container: "py-10 px-6",
    iconSize: "xl" as const,
    title: "text-base",
    description: "text-sm",
    button: "default" as const,
  },
  lg: {
    container: "py-14 px-8",
    iconSize: "2xl" as const,
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
          <Icon name={config.iconName} size={styles.iconSize} />
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
          <Icon name="unfold" size="sm" className={cn(isRetrying && "animate-spin")} />
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
      <Icon name="calmError" size="xs" className="shrink-0" />
      {message}
    </p>
  );
}

export { ErrorState, InlineError };
export type { ErrorStateProps, ErrorType };
