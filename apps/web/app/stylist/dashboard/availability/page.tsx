/**
 * Availability Calendar Page
 * Reference: docs/specs/stylist-dashboard/F3.4-availability-calendar.md
 */

"use client";

import { useState } from "react";
import { WeeklyScheduleGrid } from "../../../../components/dashboard/weekly-schedule";
import { TimeBlockEditor } from "../../../../components/dashboard/time-block-editor";
import { ExceptionManager } from "../../../../components/dashboard/exception-manager";
import {
  useAvailability,
  useUpdateAvailability,
  useAddException,
  useRemoveException,
} from "../../../../hooks/use-dashboard";
import type { WeeklySchedule, TimeSlot, DateException } from "../../../../lib/dashboard-client";

const DEFAULT_SCHEDULE: WeeklySchedule = {
  mon: [{ start: "09:00", end: "17:00" }],
  tue: [{ start: "09:00", end: "17:00" }],
  wed: [{ start: "09:00", end: "17:00" }],
  thu: [{ start: "09:00", end: "17:00" }],
  fri: [{ start: "09:00", end: "17:00" }],
  sat: [],
  sun: [],
};

export default function AvailabilityPage() {
  const { data, isLoading, error } = useAvailability();
  const updateScheduleMutation = useUpdateAvailability();
  const addExceptionMutation = useAddException();
  const removeExceptionMutation = useRemoveException();

  const [editingDay, setEditingDay] = useState<{
    key: keyof WeeklySchedule;
    label: string;
  } | null>(null);

  const schedule = data?.schedule || DEFAULT_SCHEDULE;
  const exceptions = data?.exceptions || [];

  const handleEditDay = (day: keyof WeeklySchedule, label: string) => {
    setEditingDay({ key: day, label });
  };

  const handleSaveDay = (slots: TimeSlot[]) => {
    if (!editingDay) return;

    const newSchedule: WeeklySchedule = {
      ...schedule,
      [editingDay.key]: slots,
    };

    updateScheduleMutation.mutate(newSchedule, {
      onSuccess: () => setEditingDay(null),
    });
  };

  const handleAddException = (exception: DateException) => {
    addExceptionMutation.mutate(exception);
  };

  const handleRemoveException = (date: string) => {
    removeExceptionMutation.mutate(date);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">My Availability</h1>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <p className="text-body text-status-error">Failed to load availability</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-text-primary">My Availability</h1>
        <p className="text-body text-text-secondary">
          Set your working hours and block specific dates
        </p>
      </div>

      {/* Weekly Schedule */}
      <WeeklyScheduleGrid
        schedule={schedule}
        isLoading={isLoading}
        onEditDay={handleEditDay}
      />

      {/* Blocked Dates */}
      <ExceptionManager
        exceptions={exceptions}
        isLoading={isLoading}
        onAdd={handleAddException}
        onRemove={handleRemoveException}
      />

      {/* Time Block Editor Dialog */}
      {editingDay && (
        <TimeBlockEditor
          day={editingDay.key}
          dayLabel={editingDay.label}
          slots={schedule[editingDay.key] || []}
          open={!!editingDay}
          onOpenChange={(open) => !open && setEditingDay(null)}
          onSave={handleSaveDay}
          isLoading={updateScheduleMutation.isPending}
        />
      )}
    </div>
  );
}
