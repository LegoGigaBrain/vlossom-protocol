/**
 * Booking API Client
 * Handles booking creation, management, and status tracking
 */

import { getAuthToken } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Types
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type LocationType = "STYLIST_BASE" | "CUSTOMER_HOME";

export interface BookingStylist {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: string;
}

export interface BookingService {
  id: string;
  name: string;
  priceAmountCents: string;
  estimatedDurationMin: number;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  stylist: BookingStylist;
  service: BookingService;
  scheduledStartTime: string;
  locationType: LocationType;
  locationAddress: string;
  locationLat: number | null;
  locationLng: number | null;
  notes: string | null;
  totalAmountCents: string;
  platformFeeCents: string;
  escrowTxHash: string | null;
  createdAt: string;
  cancelledAt: string | null;
  completedAt: string | null;
}

export interface BookingPage {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateBookingRequest {
  stylistId: string;
  serviceId: string;
  scheduledStartTime: string;
  locationType: LocationType;
  locationAddress: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
}

export interface PriceBreakdown {
  serviceAmount: number;
  travelFee: number;
  platformFee: number;
  totalAmount: number;
}

/**
 * Get bookings for authenticated user
 */
export async function getBookings(params?: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}): Promise<BookingPage> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const url = `${API_URL}/api/v1/bookings${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

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
 * Get single booking by ID
 */
export async function getBooking(id: string): Promise<Booking> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/bookings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Booking not found");
    }
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch booking");
  }

  return response.json();
}

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create booking");
  }

  return response.json();
}

/**
 * Update booking status (used after payment or cancellation)
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  escrowTxHash?: string
): Promise<Booking> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/bookings/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, escrowTxHash }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update booking status");
  }

  return response.json();
}

/**
 * Confirm payment with on-chain escrow verification
 * This endpoint verifies the escrow transaction on-chain before confirming the booking
 */
export async function confirmPayment(
  bookingId: string,
  escrowTxHash: string,
  options?: { skipOnChainVerification?: boolean }
): Promise<{
  booking: Booking;
  message: string;
  escrow?: {
    customer: string;
    amount: string;
    status: number;
  };
}> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/bookings/${bookingId}/confirm-payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      escrowTxHash,
      skipOnChainVerification: options?.skipOnChainVerification ?? false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || error.error || "Failed to confirm payment");
  }

  return response.json();
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  id: string,
  reason?: string
): Promise<Booking> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/bookings/${id}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: reason || "customer_requested",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel booking");
  }

  return response.json();
}

/**
 * Calculate price breakdown for a service
 */
export function calculatePriceBreakdown(
  servicePriceCents: number,
  hasTravelFee: boolean = false
): PriceBreakdown {
  const serviceAmount = servicePriceCents;
  const travelFee = hasTravelFee ? 5000 : 0; // R50 flat fee for MVP
  const platformFee = Math.round(serviceAmount * 0.1); // 10%
  const totalAmount = serviceAmount + travelFee; // Platform fee is included

  return { serviceAmount, travelFee, platformFee, totalAmount };
}

/**
 * Get cancellation policy based on time until appointment
 */
export function getCancellationPolicy(scheduledTime: Date | string): {
  hoursUntilAppointment: number;
  refundPercentage: number;
  message: string;
} {
  const scheduled = typeof scheduledTime === "string" ? new Date(scheduledTime) : scheduledTime;
  const now = new Date();
  const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil > 24) {
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 100,
      message: "Full refund - cancelling more than 24 hours before appointment",
    };
  }
  if (hoursUntil > 12) {
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 75,
      message: "75% refund - cancelling 12-24 hours before appointment",
    };
  }
  if (hoursUntil > 2) {
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 50,
      message: "50% refund - cancelling less than 12 hours before appointment",
    };
  }
  return {
    hoursUntilAppointment: hoursUntil,
    refundPercentage: 0,
    message: "No refund - cancelling less than 2 hours before appointment",
  };
}

/**
 * Calculate refund amount based on policy
 */
export function calculateRefund(
  totalAmountCents: number,
  refundPercentage: number
): {
  refundAmount: number;
  stylistFee: number;
} {
  const refundAmount = Math.round(totalAmountCents * (refundPercentage / 100));
  const stylistFee = totalAmountCents - refundAmount;

  return { refundAmount, stylistFee };
}

/**
 * Check if a booking can be cancelled
 */
export function canCancelBooking(booking: Booking): boolean {
  // Can only cancel CONFIRMED or PENDING_PAYMENT bookings
  if (!["CONFIRMED", "PENDING_PAYMENT"].includes(booking.status)) {
    return false;
  }

  // Cannot cancel past appointments
  if (new Date(booking.scheduledStartTime) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Generate mock time slots for a date (MVP - all slots available)
 */
export function generateTimeSlots(
  date: Date,
  durationMin: number
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Skip if slot end would exceed end hour
      const slotEndMinutes = hour * 60 + minute + durationMin;
      if (slotEndMinutes > endHour * 60) continue;

      // Skip past times if today
      if (isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()))) {
        continue;
      }

      slots.push({
        time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        available: true,
      });
    }
  }

  return slots;
}
