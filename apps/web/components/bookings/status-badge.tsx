"use client";

import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/booking-client";

interface StatusBadgeProps {
  status: BookingStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  PENDING_PAYMENT: {
    label: "Awaiting Payment",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-800 dark:text-yellow-200",
    dotColor: "bg-yellow-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-800 dark:text-green-200",
    dotColor: "bg-green-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-800 dark:text-blue-200",
    dotColor: "bg-blue-500",
  },
  COMPLETED: {
    label: "Completed",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-800 dark:text-gray-200",
    dotColor: "bg-gray-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-800 dark:text-red-200",
    dotColor: "bg-red-500",
  },
  DISPUTED: {
    label: "Under Review",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-800 dark:text-orange-200",
    dotColor: "bg-orange-500",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          config.dotColor,
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"
        )}
      />
      {config.label}
    </span>
  );
}
