/**
 * Time Block Editor Dialog
 * Reference: docs/specs/stylist-dashboard/F3.4-availability-calendar.md
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import type { TimeSlot } from "../../lib/dashboard-client";

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

interface TimeBlockEditorProps {
  day: string;
  dayLabel: string;
  slots: TimeSlot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (slots: TimeSlot[]) => void;
  isLoading?: boolean;
}

export function TimeBlockEditor({
  day,
  dayLabel,
  slots: initialSlots,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: TimeBlockEditorProps) {
  const [isAvailable, setIsAvailable] = useState(initialSlots.length > 0);
  const [slots, setSlots] = useState<TimeSlot[]>(
    initialSlots.length > 0 ? initialSlots : [{ start: "09:00", end: "17:00" }]
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setIsAvailable(initialSlots.length > 0);
      setSlots(
        initialSlots.length > 0 ? initialSlots : [{ start: "09:00", end: "17:00" }]
      );
      setErrors([]);
    }
  }, [open, initialSlots]);

  const addSlot = () => {
    if (slots.length < 4) {
      setSlots([...slots, { start: "09:00", end: "17:00" }]);
    }
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: "start" | "end", value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (isAvailable) {
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);

        // Check start is before end
        if (startMinutes >= endMinutes) {
          newErrors.push(`Slot ${i + 1}: End time must be after start time`);
        }

        // Check minimum duration (30 minutes)
        if (endMinutes - startMinutes < 30) {
          newErrors.push(`Slot ${i + 1}: Minimum duration is 30 minutes`);
        }

        // Check for overlaps with other slots
        for (let j = i + 1; j < slots.length; j++) {
          const otherStart = timeToMinutes(slots[j].start);
          const otherEnd = timeToMinutes(slots[j].end);

          if (
            (startMinutes < otherEnd && endMinutes > otherStart)
          ) {
            newErrors.push(`Slots ${i + 1} and ${j + 1} overlap`);
          }
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (isAvailable) {
      // Sort slots by start time before saving
      const sortedSlots = [...slots].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
      );
      onSave(sortedSlots);
    } else {
      onSave([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {dayLabel} Hours</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-5 h-5 rounded border-border-default text-brand-rose focus:ring-brand-rose"
            />
            <span className="text-body text-text-primary">
              Available on {dayLabel}s
            </span>
          </label>

          {/* Time Slots */}
          {isAvailable && (
            <div className="space-y-4">
              {slots.map((slot, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-text-secondary">
                      Time Slot {index + 1}
                    </span>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="text-caption text-status-error hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-caption text-text-tertiary">Start</label>
                      <select
                        value={slot.start}
                        onChange={(e) => updateSlot(index, "start", e.target.value)}
                        className="w-full h-11 px-3 border border-border-default rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-caption text-text-tertiary">End</label>
                      <select
                        value={slot.end}
                        onChange={(e) => updateSlot(index, "end", e.target.value)}
                        className="w-full h-11 px-3 border border-border-default rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {slots.length < 4 && (
                <button
                  type="button"
                  onClick={addSlot}
                  className="text-body-small text-brand-rose hover:underline"
                >
                  + Add another time slot
                </button>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-status-error/10 border border-status-error rounded-lg">
              {errors.map((error, i) => (
                <p key={i} className="text-caption text-status-error">{error}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helpers
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}
