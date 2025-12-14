"use client";

import { useState, useMemo } from "react";
import { formatDate, formatTime, isPastDate, isToday } from "@/lib/utils";
import { generateTimeSlots } from "@/lib/booking-client";
import { Button } from "@/components/ui/button";

interface DateTimePickerProps {
  serviceDurationMin: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  onContinue: () => void;
}

export function DateTimePicker({
  serviceDurationMin,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onContinue,
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];

    // Empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate, serviceDurationMin);
  }, [selectedDate, serviceDurationMin]);

  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    if (isPastDate(date)) return true;

    // Check if date is more than 30 days in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (date > maxDate) return true;

    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-surface rounded-lg p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-background rounded transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3 className="font-semibold text-text-primary">{monthYear}</h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-background rounded transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-text-secondary py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-10" />;
            }

            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);
            const today = isToday(date);

            return (
              <button
                key={index}
                onClick={() => !disabled && onDateSelect(date)}
                disabled={disabled}
                className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                  selected
                    ? "bg-primary text-white"
                    : disabled
                    ? "text-text-secondary/30 cursor-not-allowed"
                    : today
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-text-primary hover:bg-background"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="font-semibold text-text-primary mb-3">
            Available Times
          </h3>
          {timeSlots.length === 0 ? (
            <p className="text-text-secondary text-center py-4">
              No available times for this date
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && onTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedTime === slot.time
                      ? "bg-primary text-white"
                      : slot.available
                      ? "bg-surface text-text-primary hover:bg-secondary"
                      : "bg-border text-text-secondary cursor-not-allowed"
                  }`}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-surface rounded-lg p-3">
          <p className="text-sm text-text-secondary">Selected</p>
          <p className="font-semibold text-text-primary">
            {formatDate(selectedDate)} at {formatTime(selectedTime)}
          </p>
        </div>
      )}

      {/* Continue */}
      <Button
        onClick={onContinue}
        disabled={!selectedDate || !selectedTime}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
