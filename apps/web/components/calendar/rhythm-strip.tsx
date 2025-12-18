/**
 * Rhythm Strip - Horizontal Day Carousel (V5.0)
 *
 * Default calendar view for daily check-ins.
 * - Horizontal scroll, thumb-first design
 * - Shows 7 days centered on selected date
 * - Events shown as compact chips
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 10
 * Motion: docs/vlossom/24-brand-narrative-and-lore.md Section 13
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { EventChip, EventDot, type CalendarEvent } from "./event-chip";
import { Icon } from "@/components/icons";

interface RhythmStripProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

export function RhythmStrip({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  className,
}: RhythmStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleDays, setVisibleDays] = useState<Date[]>([]);

  // Generate 7 days centered on selected date
  useEffect(() => {
    const days: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    setVisibleDays(days);
  }, [selectedDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.scheduledStart);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format date helpers
  const formatDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Navigation
  const navigateDays = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    onDateChange(newDate);
  };

  // Get highest load level for a date (for dot color)
  const getMaxLoadLevel = (dayEvents: CalendarEvent[]) => {
    if (dayEvents.some((e) => e.loadLevel === "HIGH")) return "HIGH";
    if (dayEvents.some((e) => e.loadLevel === "MEDIUM")) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Month/Year Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-display font-semibold text-text-primary">
          {selectedDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDays(-7)}
            className="p-2 rounded-full hover:bg-background-tertiary transition-colors"
            aria-label="Previous week"
          >
            <Icon name="chevronLeft" size="md" className="text-text-secondary" />
          </button>
          <button
            onClick={() => navigateDays(7)}
            className="p-2 rounded-full hover:bg-background-tertiary transition-colors"
            aria-label="Next week"
          >
            <Icon name="chevronRight" size="md" className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Day Strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visibleDays.map((date) => {
          const dayEvents = getEventsForDate(date);
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateChange(date)}
              className={cn(
                "flex-shrink-0 w-14 py-3 rounded-xl transition-all duration-200 snap-center",
                selected
                  ? "bg-brand-rose text-white scale-105 shadow-md"
                  : today
                  ? "bg-brand-rose/10 text-brand-rose"
                  : "bg-background-primary hover:bg-background-tertiary text-text-primary"
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium",
                  selected ? "text-white/80" : "text-text-secondary"
                )}
              >
                {formatDayName(date)}
              </p>
              <p className="text-lg font-bold mt-1">{formatDayNumber(date)}</p>
              {dayEvents.length > 0 && (
                <div className="mt-2 flex justify-center">
                  <EventDot
                    loadLevel={getMaxLoadLevel(dayEvents)}
                    count={dayEvents.length}
                    className={selected ? "opacity-80" : ""}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Events */}
      <div className="space-y-2">
        {getEventsForDate(selectedDate).length > 0 ? (
          getEventsForDate(selectedDate)
            .sort(
              (a, b) =>
                new Date(a.scheduledStart).getTime() -
                new Date(b.scheduledStart).getTime()
            )
            .map((event) => (
              <EventChip
                key={event.id}
                event={event}
                variant="expanded"
                onClick={() => onEventClick?.(event)}
              />
            ))
        ) : (
          <div className="text-center py-8 bg-background-primary rounded-xl">
            <p className="text-sm text-text-secondary">No events scheduled</p>
            <p className="text-xs text-text-muted mt-1">
              A day to rest and recover
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
