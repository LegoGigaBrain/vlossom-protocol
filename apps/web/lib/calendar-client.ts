/**
 * Calendar API Client (V5.1)
 *
 * Calendar-specific functions for schedule integration.
 * Extends booking-client with calendar view support.
 */

import { getAuthToken } from "./auth-client";
import type {
  Booking,
  BookingStylist,
  BookingService,
  BookingStatus,
  LocationType,
} from "./booking-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ============================================================================
// Types
// ============================================================================

export interface CalendarBookingEvent {
  id: string;
  title: string;
  eventCategory: "BOOKING_SERVICE";
  eventType: "BOOKING";
  scheduledStart: string;
  scheduledEnd: string;
  loadLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "PLANNED" | "DUE" | "COMPLETED" | "MISSED";
  requiresRestBuffer: boolean;
  booking: {
    stylist: BookingStylist;
    service: BookingService;
    location: LocationType;
    status: BookingStatus;
  };
}

export interface CalendarBookingsResponse {
  bookings: Booking[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get bookings for a date range (for calendar views)
 */
export async function getCalendarBookings(params: {
  from: Date;
  to: Date;
  role?: "customer" | "stylist" | "all";
}): Promise<CalendarBookingsResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const searchParams = new URLSearchParams();
  searchParams.set("from", params.from.toISOString());
  searchParams.set("to", params.to.toISOString());
  if (params.role) searchParams.set("role", params.role);
  searchParams.set("limit", "100"); // Get all bookings in range

  const url = `${API_URL}/api/v1/bookings?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch bookings");
  }

  return response.json();
}

/**
 * Get upcoming bookings (confirmed, in progress)
 */
export async function getUpcomingBookings(
  limit = 10
): Promise<CalendarBookingsResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const now = new Date().toISOString();
  const searchParams = new URLSearchParams();
  searchParams.set("from", now);
  searchParams.set(
    "status",
    "CONFIRMED,IN_PROGRESS,PENDING_STYLIST_APPROVAL,PENDING_CUSTOMER_PAYMENT"
  );
  searchParams.set("limit", limit.toString());

  const url = `${API_URL}/api/v1/bookings?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch upcoming bookings");
  }

  return response.json();
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform bookings to calendar events format
 */
export function transformBookingsToCalendarEvents(
  bookings: Booking[]
): CalendarBookingEvent[] {
  return bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.service.name} with ${booking.stylist.displayName}`,
    eventCategory: "BOOKING_SERVICE" as const,
    eventType: "BOOKING" as const,
    scheduledStart: booking.scheduledStartTime,
    scheduledEnd: new Date(
      new Date(booking.scheduledStartTime).getTime() +
        booking.service.estimatedDurationMin * 60 * 1000
    ).toISOString(),
    loadLevel: getLoadLevel(booking.service.estimatedDurationMin),
    status: mapBookingStatusToCalendarStatus(booking.status),
    requiresRestBuffer: booking.service.estimatedDurationMin >= 120,
    booking: {
      stylist: booking.stylist,
      service: booking.service,
      location: booking.locationType,
      status: booking.status,
    },
  }));
}

function getLoadLevel(durationMin: number): "LOW" | "MEDIUM" | "HIGH" {
  if (durationMin >= 120) return "HIGH";
  if (durationMin >= 60) return "MEDIUM";
  return "LOW";
}

function mapBookingStatusToCalendarStatus(
  status: BookingStatus
): "PLANNED" | "DUE" | "COMPLETED" | "MISSED" {
  switch (status) {
    case "CONFIRMED":
    case "PENDING_PAYMENT":
      return "PLANNED";
    case "IN_PROGRESS":
      return "DUE";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
    case "DISPUTED":
      return "MISSED";
    default:
      return "PLANNED";
  }
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get start and end of a month for calendar queries
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * Get start and end of a week for calendar queries
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // End of week (Saturday)
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get start and end of a day for calendar queries
 */
export function getDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
