/**
 * Bookings API Client (V7.0.0)
 *
 * Admin bookings management API client.
 */

import { adminFetch } from "./admin-client";

export interface BookingUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress?: string | null;
}

export interface BookingService {
  id: string;
  name: string;
  priceAmountCents: number;
}

export interface Booking {
  id: string;
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  quoteAmountCents: number;
  platformFeeCents: number;
  stylistPayoutCents: number;
  createdAt: string;
  updatedAt: string;
  customer: BookingUser;
  stylist: BookingUser | null;
  service: BookingService | null;
}

export interface BookingDetail extends Booking {
  statusHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    reason: string | null;
    changedAt: string;
  }>;
}

export interface BookingsListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  customerId?: string;
  stylistId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: "createdAt" | "scheduledStartTime" | "quoteAmountCents";
  sortOrder?: "asc" | "desc";
}

export interface BookingsListResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingStats {
  totalBookings: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  monthlyGrowth: string | number;
  byStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenueThisMonth: number;
}

/**
 * Fetch paginated list of bookings
 */
export async function fetchBookings(params: BookingsListParams = {}): Promise<BookingsListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.status) searchParams.set("status", params.status);
  if (params.customerId) searchParams.set("customerId", params.customerId);
  if (params.stylistId) searchParams.set("stylistId", params.stylistId);
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const url = `/api/v1/admin/bookings${queryString ? `?${queryString}` : ""}`;

  const response = await adminFetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return response.json();
}

/**
 * Fetch single booking details
 */
export async function fetchBooking(id: string): Promise<{ booking: BookingDetail }> {
  const response = await adminFetch(`/api/v1/admin/bookings/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Booking not found");
    }
    throw new Error("Failed to fetch booking");
  }

  return response.json();
}

/**
 * Fetch booking statistics
 */
export async function fetchBookingStats(): Promise<{ stats: BookingStats }> {
  const response = await adminFetch("/api/v1/admin/bookings/stats/overview");

  if (!response.ok) {
    throw new Error("Failed to fetch booking stats");
  }

  return response.json();
}

/**
 * Update booking status (admin override)
 */
export async function updateBookingStatus(
  id: string,
  data: { status: string; reason?: string }
): Promise<{ booking: Booking }> {
  const response = await adminFetch(`/api/v1/admin/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update booking status");
  }

  return response.json();
}

// Booking status constants
export const BOOKING_STATUSES = {
  PENDING_STYLIST_APPROVAL: "Pending Approval",
  PENDING_CUSTOMER_PAYMENT: "Pending Payment",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
} as const;

export const getStatusLabel = (status: string): string => {
  return BOOKING_STATUSES[status as keyof typeof BOOKING_STATUSES] || status;
};
