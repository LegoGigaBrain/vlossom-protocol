/**
 * Weekly Schedule Component
 * Reference: docs/specs/stylist-dashboard/F3.4-availability-calendar.md
 */

"use client";

import { Button } from "../ui/button";
import { formatTime } from "../../lib/utils";
import type { WeeklySchedule, TimeSlot } from "../../lib/dashboard-client";

const DAYS = [
  { key: "mon", label: "Monday", short: "MON" },
  { key: "tue", label: "Tuesday", short: "TUE" },
  { key: "wed", label: "Wednesday", short: "WED" },
  { key: "thu", label: "Thursday", short: "THU" },
  { key: "fri", label: "Friday", short: "FRI" },
  { key: "sat", label: "Saturday", short: "SAT" },
  { key: "sun", label: "Sunday", short: "SUN" },
] as const;

interface WeeklyScheduleProps {
  schedule: WeeklySchedule;
  isLoading?: boolean;
  onEditDay: (day: keyof WeeklySchedule, label: string) => void;
}

function DayCard({
  day,
  label,
  short,
  slots,
  onEdit,
}: {
  day: string;
  label: string;
  short: string;
  slots: TimeSlot[];
  onEdit: () => void;
}) {
  const isClosed = slots.length === 0;

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 text-center">
      <p className="text-caption font-semibold text-text-secondary mb-2">{short}</p>

      {isClosed ? (
        <div className="py-4">
          <p className="text-body-small text-text-tertiary">Closed</p>
        </div>
      ) : (
        <div className="space-y-2 py-2">
          {slots.map((slot, idx) => (
            <div key={idx} className="text-body-small text-text-primary">
              <span>{formatTime(slot.start)}</span>
              <span className="text-text-tertiary mx-1">-</span>
              <span>{formatTime(slot.end)}</span>
            </div>
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onEdit} className="w-full mt-2">
        Edit
      </Button>
    </div>
  );
}

function DayCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-background-secondary rounded w-12 mx-auto mb-4"></div>
        <div className="h-4 bg-background-secondary rounded w-20 mx-auto mb-2"></div>
        <div className="h-4 bg-background-secondary rounded w-16 mx-auto mb-4"></div>
        <div className="h-9 bg-background-secondary rounded w-full"></div>
      </div>
    </div>
  );
}

export function WeeklyScheduleGrid({ schedule, isLoading, onEditDay }: WeeklyScheduleProps) {
  if (isLoading) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <h3 className="text-h4 text-text-primary mb-4">Weekly Schedule</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {DAYS.map((day) => (
            <DayCardSkeleton key={day.key} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      <h3 className="text-h4 text-text-primary mb-4">Weekly Schedule</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {DAYS.map((day) => (
          <DayCard
            key={day.key}
            day={day.key}
            label={day.label}
            short={day.short}
            slots={schedule[day.key] || []}
            onEdit={() => onEditDay(day.key as keyof WeeklySchedule, day.label)}
          />
        ))}
      </div>
    </div>
  );
}
