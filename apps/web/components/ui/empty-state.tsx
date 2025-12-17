/**
 * EmptyState component - Display when no content is available
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  CalendarIllustration,
  SearchIllustration,
  WalletIllustration,
  ScissorsIllustration,
  InboxIllustration,
  ReviewsIllustration,
  MessageIllustration,
} from "./illustrations";

type IllustrationType =
  | "calendar"
  | "search"
  | "wallet"
  | "scissors"
  | "inbox"
  | "reviews"
  | "message"
  | "custom";

interface EmptyStateProps {
  /**
   * Pre-built illustration type
   */
  illustration?: IllustrationType;
  /**
   * Custom illustration component (when illustration="custom")
   */
  customIllustration?: React.ReactNode;
  /**
   * Main title text
   */
  title: string;
  /**
   * Description text below the title
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  /**
   * Secondary action (link style)
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

const illustrations: Record<Exclude<IllustrationType, "custom">, React.FC<{ className?: string }>> = {
  calendar: CalendarIllustration,
  search: SearchIllustration,
  wallet: WalletIllustration,
  scissors: ScissorsIllustration,
  inbox: InboxIllustration,
  reviews: ReviewsIllustration,
  message: MessageIllustration,
};

const sizeStyles = {
  sm: {
    container: "py-8 px-4",
    illustration: "w-24 h-24",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    container: "py-12 px-6",
    illustration: "w-32 h-32",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    container: "py-16 px-8",
    illustration: "w-40 h-40",
    title: "text-xl",
    description: "text-base",
  },
};

function EmptyState({
  illustration = "search",
  customIllustration,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const styles = sizeStyles[size];
  const IllustrationComponent =
    illustration !== "custom" ? illustrations[illustration] : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      {/* Illustration */}
      <div className={cn("mb-6 text-text-muted", styles.illustration)}>
        {illustration === "custom" && customIllustration
          ? customIllustration
          : IllustrationComponent && (
              <IllustrationComponent className="w-full h-full" />
            )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-semibold text-text-primary mb-2",
          styles.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "text-text-secondary max-w-sm mb-6",
            styles.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {action && (
            <Button
              variant={action.variant || "primary"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-sm text-brand-rose hover:text-brand-clay transition-gentle underline underline-offset-4"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps, IllustrationType };
