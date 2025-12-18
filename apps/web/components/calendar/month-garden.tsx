/**
 * Month Garden - Full Month Calendar View (V5.0)
 *
 * Expanded month view with organic grid spacing.
 * - Soft dividers, breathable layout
 * - Signature accent dots for rituals
 * - Day selection with ring expand animation
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 10
 * Motion: docs/vlossom/24-brand-narrative-and-lore.md Section 13
 */

"use client";

import { useState, useMemo } from "react";
import { cn } from "../../lib/utils";
import { EventDot, type CalendarEvent, type LoadLevel } from "./event-chip";
import { Icon } from "@/components/icons";

interface MonthGardenProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGarden({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  className,
}: MonthGardenProps) {
  const [viewDate, setViewDate] = useState(selectedDate);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Previous month days to show
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        isSelected:
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear(),
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  }, [viewDate, selectedDate]);

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

  // Get highest load level for a date
  const getMaxLoadLevel = (dayEvents: CalendarEvent[]): LoadLevel => {
    if (dayEvents.some((e) => e.loadLevel === "HIGH")) return "HIGH";
    if (dayEvents.some((e) => e.loadLevel === "MEDIUM")) return "MEDIUM";
    return "LOW";
  };

  // Navigate months
  const navigateMonth = (direction: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setViewDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateChange(today);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-display font-semibold text-text-primary">
            {viewDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={goToToday}
            className="text-xs text-brand-rose hover:underline"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-full hover:bg-background-tertiary transition-colors"
            aria-label="Previous month"
          >
            <Icon name="chevronLeft" size="md" className="text-text-secondary" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-full hover:bg-background-tertiary transition-colors"
            aria-label="Next month"
          >
            <Icon name="chevronRight" size="md" className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-text-secondary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day.date);
          const hasEvents = dayEvents.length > 0;

          return (
            <button
              key={index}
              onClick={() => {
                onDateChange(day.date);
                if (day.date.getMonth() !== viewDate.getMonth()) {
                  setViewDate(day.date);
                }
              }}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200",
                day.isCurrentMonth
                  ? "text-text-primary"
                  : "text-text-muted",
                day.isSelected &&
                  "bg-brand-rose text-white ring-2 ring-brand-rose ring-offset-2 ring-offset-background-primary",
                day.isToday &&
                  !day.isSelected &&
                  "bg-brand-rose/10 text-brand-rose font-bold",
                !day.isSelected &&
                  "hover:bg-background-tertiary"
              )}
            >
              <span className="text-sm">{day.date.getDate()}</span>
              {hasEvents && !day.isSelected && (
                <div className="absolute bottom-1">
                  <EventDot
                    loadLevel={getMaxLoadLevel(dayEvents)}
                    count={dayEvents.length}
                  />
                </div>
              )}
              {hasEvents && day.isSelected && (
                <div className="absolute bottom-1">
                  <span className="text-[10px] text-white/80">
                    {dayEvents.length}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Events Preview */}
      {getEventsForDate(selectedDate).length > 0 && (
        <div className="pt-4 border-t border-border-default">
          <h4 className="text-sm font-medium text-text-primary mb-2">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h4>
          <div className="space-y-1">
            {getEventsForDate(selectedDate)
              .slice(0, 3)
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left text-sm text-text-secondary hover:text-text-primary transition-colors truncate"
                >
                  • {event.title}
                </button>
              ))}
            {getEventsForDate(selectedDate).length > 3 && (
              <p className="text-xs text-text-muted">
                +{getEventsForDate(selectedDate).length - 3} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
