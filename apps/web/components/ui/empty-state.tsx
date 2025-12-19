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
          "font-display font-semibold text-text-primary mb-2",
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

/**
 * Preset empty states for common use cases (UX P0)
 * Reference: UX Review - Inconsistent empty states across pages
 */

export interface EmptyStatePreset {
  illustration: IllustrationType;
  title: string;
  description: string;
}

export const emptyStatePresets: Record<string, EmptyStatePreset> = {
  /** No stylists found in search area */
  noStylists: {
    illustration: "search",
    title: "No stylists nearby",
    description: "Try expanding your search area or adjusting your filters to find more stylists.",
  },
  /** No services available */
  noServices: {
    illustration: "scissors",
    title: "No services available",
    description: "This stylist hasn't added any services yet. Check back later!",
  },
  /** No availability slots */
  noAvailability: {
    illustration: "calendar",
    title: "No availability",
    description: "No open slots for the selected dates. Try a different time or date.",
  },
  /** No upcoming bookings */
  noBookings: {
    illustration: "calendar",
    title: "No upcoming appointments",
    description: "You don't have any scheduled appointments. Book your next session!",
  },
  /** No past bookings */
  noHistory: {
    illustration: "calendar",
    title: "No booking history",
    description: "Your completed appointments will appear here.",
  },
  /** Empty wallet - no transactions */
  noTransactions: {
    illustration: "wallet",
    title: "No transactions yet",
    description: "Your transaction history will appear here once you make a booking.",
  },
  /** No notifications */
  noNotifications: {
    illustration: "inbox",
    title: "All caught up!",
    description: "You'll see booking updates, messages, and alerts here.",
  },
  /** No reviews */
  noReviews: {
    illustration: "reviews",
    title: "No reviews yet",
    description: "Reviews from your clients will appear here.",
  },
  /** No messages */
  noMessages: {
    illustration: "message",
    title: "No messages",
    description: "Start a conversation with a stylist or client.",
  },
  /** Search with no results */
  noSearchResults: {
    illustration: "search",
    title: "No results found",
    description: "Try different keywords or adjust your filters.",
  },
  /** Favorites empty */
  noFavorites: {
    illustration: "scissors",
    title: "No favorites yet",
    description: "Save your favorite stylists to quickly book with them again.",
  },
  /** Network error */
  networkError: {
    illustration: "inbox",
    title: "Connection issue",
    description: "We couldn't load this content. Check your connection and try again.",
  },
};

/**
 * Helper to use preset empty states
 */
export function getEmptyStateProps(preset: keyof typeof emptyStatePresets): EmptyStatePreset {
  return emptyStatePresets[preset];
}

export { EmptyState };
export type { EmptyStateProps, IllustrationType };
