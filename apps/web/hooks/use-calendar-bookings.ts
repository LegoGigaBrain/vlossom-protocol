/**
 * Calendar Booking Hooks (V5.1)
 *
 * React Query hooks for calendar/schedule integration.
 * Fetches bookings for calendar views and transforms to events.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getCalendarBookings,
  getUpcomingBookings,
  transformBookingsToCalendarEvents,
  getMonthRange,
  getWeekRange,
  getDayRange,
  type CalendarBookingEvent,
} from "@/lib/calendar-client";

// Re-export types
export type { CalendarBookingEvent } from "@/lib/calendar-client";

// Query keys
export const calendarKeys = {
  all: ["calendar"] as const,
  bookings: () => [...calendarKeys.all, "bookings"] as const,
  range: (from: string, to: string) =>
    [...calendarKeys.bookings(), from, to] as const,
  month: (year: number, month: number) =>
    [...calendarKeys.all, "month", year, month] as const,
  week: (date: string) => [...calendarKeys.all, "week", date] as const,
  day: (date: string) => [...calendarKeys.all, "day", date] as const,
  upcoming: () => [...calendarKeys.all, "upcoming"] as const,
};

/**
 * Hook to fetch bookings for a specific date range
 */
export function useCalendarBookings(
  startDate: Date,
  endDate: Date,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: calendarKeys.range(
      startDate.toISOString(),
      endDate.toISOString()
    ),
    queryFn: () => getCalendarBookings({ from: startDate, to: endDate }),
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch bookings for a month (for MonthGarden view)
 */
export function useMonthBookings(selectedDate: Date) {
  const { start, end } = useMemo(
    () => getMonthRange(selectedDate),
    [selectedDate]
  );

  const { data, isLoading, error, refetch } = useCalendarBookings(start, end);

  const events = useMemo<CalendarBookingEvent[]>(() => {
    if (!data?.bookings) return [];
    return transformBookingsToCalendarEvents(data.bookings);
  }, [data?.bookings]);

  return {
    events,
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch bookings for a week (for RhythmStrip view)
 */
export function useWeekBookings(selectedDate: Date) {
  const { start, end } = useMemo(
    () => getWeekRange(selectedDate),
    [selectedDate]
  );

  const { data, isLoading, error, refetch } = useCalendarBookings(start, end);

  const events = useMemo<CalendarBookingEvent[]>(() => {
    if (!data?.bookings) return [];
    return transformBookingsToCalendarEvents(data.bookings);
  }, [data?.bookings]);

  return {
    events,
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch bookings for a single day (for DayFlow view)
 */
export function useDayBookings(selectedDate: Date) {
  const { start, end } = useMemo(
    () => getDayRange(selectedDate),
    [selectedDate]
  );

  const { data, isLoading, error, refetch } = useCalendarBookings(start, end);

  const events = useMemo<CalendarBookingEvent[]>(() => {
    if (!data?.bookings) return [];
    return transformBookingsToCalendarEvents(data.bookings);
  }, [data?.bookings]);

  return {
    events,
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch upcoming bookings (for dashboard/widgets)
 */
export function useUpcomingBookings(limit = 5) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: calendarKeys.upcoming(),
    queryFn: () => getUpcomingBookings(limit),
    staleTime: 30 * 1000,
  });

  const events = useMemo<CalendarBookingEvent[]>(() => {
    if (!data?.bookings) return [];
    return transformBookingsToCalendarEvents(data.bookings);
  }, [data?.bookings]);

  return {
    events,
    bookings: data?.bookings ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook that selects the appropriate view based on calendar mode
 */
export function useCalendarEvents(
  selectedDate: Date,
  view: "rhythm" | "month" | "day"
) {
  const monthData = useMonthBookings(selectedDate);
  const weekData = useWeekBookings(selectedDate);
  const dayData = useDayBookings(selectedDate);

  // Return data based on view
  switch (view) {
    case "month":
      return monthData;
    case "day":
      return dayData;
    case "rhythm":
    default:
      return weekData;
  }
}
