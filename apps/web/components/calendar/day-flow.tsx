/**
 * Day Flow - Single Day Timeline View (V5.0)
 *
 * Detailed timeline view for a single day.
 * - Vertical timeline with time markers
 * - Event cards with stagger unfold animation
 * - Rest buffers and recovery windows shown
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 10
 * Motion: docs/vlossom/24-brand-narrative-and-lore.md Section 13
 */

"use client";

import { useMemo } from "react";
import { cn } from "../../lib/utils";
import { EventChip, type CalendarEvent, type LoadLevel } from "./event-chip";
import { Icon } from "@/components/icons";

interface DayFlowProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

// Time blocks for the day
const TIME_BLOCKS = [
  { hour: 6, label: "Morning", iconName: "energy" as const },
  { hour: 12, label: "Afternoon", iconName: "energy" as const },
  { hour: 17, label: "Evening", iconName: "energy" as const },
  { hour: 21, label: "Night", iconName: "rest" as const },
];

export function DayFlow({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  className,
}: DayFlowProps) {
  // Filter events for selected date
  const dayEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.scheduledStart);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledStart).getTime() -
          new Date(b.scheduledStart).getTime()
      );
  }, [events, selectedDate]);

  // Group events by time block
  const eventsByBlock = useMemo(() => {
    const blocks: Record<string, CalendarEvent[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    };

    dayEvents.forEach((event) => {
      const hour = new Date(event.scheduledStart).getHours();
      if (hour < 12) blocks.Morning.push(event);
      else if (hour < 17) blocks.Afternoon.push(event);
      else if (hour < 21) blocks.Evening.push(event);
      else blocks.Night.push(event);
    });

    return blocks;
  }, [dayEvents]);

  // Calculate total load for the day
  const dayLoad = useMemo((): LoadLevel => {
    const highCount = dayEvents.filter((e) => e.loadLevel === "HIGH").length;
    const mediumCount = dayEvents.filter((e) => e.loadLevel === "MEDIUM").length;

    if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) return "HIGH";
    if (highCount >= 1 || mediumCount >= 2) return "MEDIUM";
    return "LOW";
  }, [dayEvents]);

  const loadColors: Record<LoadLevel, string> = {
    LOW: "text-status-success",
    MEDIUM: "text-accent-gold",
    HIGH: "text-status-warning",
  };

  // Navigate days
  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    onDateChange(newDate);
  };

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if today
  const isToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-semibold text-text-primary">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
            })}
          </h3>
          <p className="text-sm text-text-secondary">
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {isToday() && (
              <span className="ml-2 text-brand-rose font-medium">Today</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-full hover:bg-background-tertiary transition-colors"
            aria-label="Previous day"
          >
            <Icon name="chevronLeft" size="md" className="text-text-secondary" />
          </button>
          <button
            onClick={() => navigateDay(1)}
            className="p-2 rounded-full hover:bg-background-tertiary transition-colors"
            aria-label="Next day"
          >
            <Icon name="chevronRight" size="md" className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Day Summary */}
      <div className="flex items-center gap-4 p-3 bg-background-primary rounded-xl border border-border-default">
        <div className="flex-1">
          <p className="text-sm text-text-secondary">
            {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}{" "}
            scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Day load:</span>
          <span className={cn("text-sm font-medium", loadColors[dayLoad])}>
            {dayLoad.charAt(0) + dayLoad.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {TIME_BLOCKS.map((block, blockIndex) => {
          const blockEvents = eventsByBlock[block.label];

          return (
            <div key={block.label} className="relative">
              {/* Time Block Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center">
                  <Icon name={block.iconName} size="sm" className="text-text-secondary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">
                    {block.label}
                  </h4>
                  <p className="text-xs text-text-muted">
                    {block.hour}:00 - {TIME_BLOCKS[blockIndex + 1]?.hour || 24}
                    :00
                  </p>
                </div>
              </div>

              {/* Events */}
              {blockEvents.length > 0 ? (
                <div className="ml-11 space-y-2">
                  {blockEvents.map((event, eventIndex) => (
                    <div
                      key={event.id}
                      className="relative pl-4 border-l-2 border-border-default"
                      style={{
                        animationDelay: `${eventIndex * 50}ms`,
                      }}
                    >
                      {/* Time Marker */}
                      <div className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-brand-rose" />

                      {/* Event Card */}
                      <div className="pb-3">
                        <p className="text-xs text-text-muted mb-1">
                          {formatTime(event.scheduledStart)}
                        </p>
                        <EventChip
                          event={event}
                          variant="expanded"
                          onClick={() => onEventClick?.(event)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-11 py-4 text-center bg-background-secondary/50 rounded-lg">
                  <p className="text-xs text-text-muted">
                    Nothing scheduled
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {dayEvents.length === 0 && (
        <div className="text-center py-12 bg-background-primary rounded-xl border border-border-default">
          <Icon name="rest" size="2xl" className="mx-auto text-text-muted mb-3" />
          <h4 className="font-medium text-text-primary mb-1">
            A day to breathe
          </h4>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">
            No events scheduled. Rest is part of the journey.
          </p>
        </div>
      )}
    </div>
  );
}
