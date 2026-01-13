"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { format, addDays, isSameDay, isBefore, startOfToday } from "date-fns";
import { Icon } from "@/components/icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";
import { authFetch } from "../../lib/auth-client";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  currentDate: string;
  stylistId: string;
  serviceDuration: number;
  onSuccess?: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  bookingId,
  currentDate,
  stylistId,
  serviceDuration,
  onSuccess,
}: RescheduleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [weekStart, setWeekStart] = useState(startOfToday());

  const currentBookingDate = new Date(currentDate);

  // Generate dates for the week view
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch available slots when date is selected
  const fetchAvailableSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime(null);

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/stylists/${stylistId}/availability?date=${dateStr}&duration=${serviceDuration}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    fetchAvailableSlots(date);
  };

  const handlePrevWeek = () => {
    const newStart = addDays(weekStart, -7);
    if (!isBefore(newStart, startOfToday())) {
      setWeekStart(newStart);
    }
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    try {
      const newDateTime = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`;

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${bookingId}/reschedule`,
        {
          method: "POST",
          body: JSON.stringify({
            scheduledStartTime: newDateTime,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reschedule");
      }

      toast.success(
        "Booking rescheduled",
        `Your appointment has been moved to ${format(selectedDate, "EEEE, MMM d")} at ${selectedTime}`
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        "Reschedule failed",
        error instanceof Error ? error.message : "Please try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default sticky top-0 bg-background-primary">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Reschedule Booking
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <Icon name="close" size="sm" className="text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Current Booking Info */}
            <div className="bg-background-tertiary rounded-lg p-3 flex items-center gap-2">
              <Icon name="error" size="sm" className="text-status-warning shrink-0" />
              <p className="text-sm text-text-secondary">
                Current: {format(currentBookingDate, "EEE, MMM d")} at{" "}
                {format(currentBookingDate, "h:mm a")}
              </p>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text-primary flex items-center gap-2">
                  <Icon name="calendar" size="sm" />
                  Select New Date
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevWeek}
                    disabled={isBefore(addDays(weekStart, -1), startOfToday())}
                    className="p-1 rounded hover:bg-background-tertiary disabled:opacity-50 transition-gentle"
                    aria-label="Previous week"
                  >
                    <Icon name="chevronLeft" size="sm" className="text-text-secondary" />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    className="p-1 rounded hover:bg-background-tertiary transition-gentle"
                    aria-label="Next week"
                  >
                    <Icon name="chevronRight" size="sm" className="text-text-secondary" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDates.map((date) => {
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isPast = isBefore(date, startOfToday());
                  const isCurrent = isSameDay(date, currentBookingDate);

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => !isPast && !isCurrent && handleDateSelect(date)}
                      disabled={isPast || isCurrent}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-gentle",
                        isSelected
                          ? "bg-brand-rose text-white"
                          : isPast || isCurrent
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-background-tertiary"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs",
                          isSelected ? "text-white/80" : "text-text-muted"
                        )}
                      >
                        {format(date, "EEE")}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-medium",
                          isSelected ? "text-white" : "text-text-primary"
                        )}
                      >
                        {format(date, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="space-y-3">
                <h3 className="font-medium text-text-primary flex items-center gap-2">
                  <Icon name="clock" size="sm" />
                  Select Time
                </h3>

                {isLoadingSlots ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className="h-10 rounded-lg bg-background-tertiary animate-pulse"
                      />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-4">
                    No available times on this date
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedTime(slot.time)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-sm font-medium transition-gentle",
                            selectedTime === slot.time
                              ? "bg-brand-rose text-white"
                              : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
                          )}
                        >
                          {slot.time}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {selectedDate && selectedTime && (
              <div className="bg-status-success/10 rounded-lg p-4">
                <p className="text-sm text-text-secondary">New appointment</p>
                <p className="font-medium text-text-primary">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!selectedDate || !selectedTime}
                className="flex-1"
              >
                Confirm Reschedule
              </Button>
            </div>

            {/* Policy Note */}
            <p className="text-xs text-text-muted text-center">
              Free rescheduling up to 24 hours before your appointment.
              Late changes may incur a fee.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
