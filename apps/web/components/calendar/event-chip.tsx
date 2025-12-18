/**
 * Event Chip - Calendar Event Display (V5.0)
 *
 * Displays a calendar event with:
 * - Icon based on event category
 * - Load color (soft green, warm sand, muted terracotta)
 * - Optional rest marker
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 10
 */

"use client";

import { cn } from "../../lib/utils";
import { Icon, type IconName } from "@/components/icons";

export type EventCategory =
  | "HAIR_RITUAL"
  | "BOOKING_SERVICE"
  | "EDUCATION_PROMPT"
  | "REST_BUFFER"
  | "RECOVERY_WINDOW";

export type LoadLevel = "LOW" | "MEDIUM" | "HIGH";

export type EventStatus =
  | "PLANNED"
  | "DUE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "RESCHEDULED";

export interface CalendarEvent {
  id: string;
  title: string;
  eventCategory: EventCategory;
  eventType: string;
  scheduledStart: string;
  scheduledEnd: string;
  loadLevel?: LoadLevel;
  status: EventStatus;
  requiresRestBuffer?: boolean;
}

interface EventChipProps {
  event: CalendarEvent;
  variant?: "compact" | "default" | "expanded";
  onClick?: () => void;
  className?: string;
}

const categoryIcons: Record<EventCategory, IconName> = {
  HAIR_RITUAL: "care",
  BOOKING_SERVICE: "calendar",
  EDUCATION_PROMPT: "learning",
  REST_BUFFER: "resting",
  RECOVERY_WINDOW: "favorite",
};

const loadColors: Record<LoadLevel, { bg: string; text: string; dot: string }> = {
  LOW: {
    bg: "bg-status-success/10",
    text: "text-status-success",
    dot: "bg-status-success",
  },
  MEDIUM: {
    bg: "bg-accent-gold/10",
    text: "text-accent-gold",
    dot: "bg-accent-gold",
  },
  HIGH: {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning",
  },
};

const statusStyles: Record<EventStatus, string> = {
  PLANNED: "opacity-100",
  DUE: "ring-2 ring-brand-rose ring-offset-1",
  IN_PROGRESS: "animate-pulse",
  COMPLETED: "opacity-60",
  SKIPPED: "opacity-40 line-through",
  RESCHEDULED: "opacity-50 border-dashed",
};

export function EventChip({
  event,
  variant = "default",
  onClick,
  className,
}: EventChipProps) {
  const iconName = categoryIcons[event.eventCategory] || "sparkle";
  const load = event.loadLevel || "MEDIUM";
  const colors = loadColors[load];

  // Format time
  const startTime = new Date(event.scheduledStart);
  const timeStr = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200",
          colors.bg,
          statusStyles[event.status],
          onClick && "hover:scale-105 cursor-pointer",
          className
        )}
        aria-label={event.title}
      >
        <Icon name={iconName} size="xs" className={colors.text} />
        {event.requiresRestBuffer && (
          <Icon name="resting" size="xs" className="text-brand-purple" />
        )}
      </button>
    );
  }

  if (variant === "expanded") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full p-3 rounded-xl border border-border-default transition-all duration-200",
          colors.bg,
          statusStyles[event.status],
          onClick && "hover:shadow-md cursor-pointer",
          className
        )}
        aria-label={event.title}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              colors.bg
            )}
          >
            <Icon name={iconName} size="md" className={colors.text} />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-text-primary text-sm">
                {event.title}
              </h4>
              {event.requiresRestBuffer && (
                <Icon name="resting" size="xs" className="text-brand-purple" />
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">{timeStr}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
              <span className="text-xs text-text-muted capitalize">
                {load.toLowerCase()} load
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        colors.bg,
        statusStyles[event.status],
        onClick && "hover:scale-[1.02] cursor-pointer",
        className
      )}
      aria-label={event.title}
    >
      <Icon name={iconName} size="sm" className={colors.text} />
      <span className="text-sm text-text-primary truncate flex-1 text-left">
        {event.title}
      </span>
      {event.requiresRestBuffer && (
        <Icon name="resting" size="xs" className="text-brand-purple" />
      )}
      <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
    </button>
  );
}

/**
 * Event Dot - Minimal indicator for month view
 */
interface EventDotProps {
  loadLevel?: LoadLevel;
  count?: number;
  className?: string;
}

export function EventDot({ loadLevel = "MEDIUM", count = 1, className }: EventDotProps) {
  const colors = loadColors[loadLevel];

  if (count > 1) {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
        <span className="text-[10px] text-text-muted">+{count - 1}</span>
      </div>
    );
  }

  return (
    <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot, className)} />
  );
}
