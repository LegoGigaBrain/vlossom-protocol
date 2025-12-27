/**
 * Bookings API Client (V6.10.0)
 *
 * Handles all booking-related API calls:
 * - Create bookings
 * - Get bookings list
 * - Get booking details
 * - Update booking status
 * - Cancel bookings
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type LocationType = 'STYLIST_BASE' | 'CUSTOMER_HOME';

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

export interface BookingStats {
  asCustomer: {
    total: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    totalSpentCents: string;
  };
  asStylist: {
    total: number;
    thisMonth: number;
    completed: number;
    cancelled: number;
    grossEarnedCents: string;
    netEarnedCents: string;
  };
  combined: {
    total: number;
    thisMonth: number;
    completed: number;
  };
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface StylistAvailability {
  date: string;
  slots: AvailabilitySlot[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get bookings for authenticated user
 */
export async function getBookings(params?: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}): Promise<BookingPage> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const url = `/api/v1/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest<BookingPage>(url);
}

/**
 * Get single booking by ID
 */
export async function getBooking(id: string): Promise<Booking> {
  return apiRequest<Booking>(`/api/v1/bookings/${id}`);
}

/**
 * Create a new booking
 */
export async function createBooking(data: CreateBookingRequest): Promise<Booking> {
  return apiRequest<Booking>('/api/v1/bookings', {
    method: 'POST',
    body: data,
  });
}

/**
 * Update booking status (used after payment)
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  escrowTxHash?: string
): Promise<Booking> {
  return apiRequest<Booking>(`/api/v1/bookings/${id}/status`, {
    method: 'PATCH',
    body: { status, escrowTxHash },
  });
}

/**
 * Confirm payment with on-chain escrow verification
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
  return apiRequest(`/api/v1/bookings/${bookingId}/confirm-payment`, {
    method: 'POST',
    body: {
      escrowTxHash,
      skipOnChainVerification: options?.skipOnChainVerification ?? false,
    },
  });
}

/**
 * Cancel a booking
 */
export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return apiRequest<Booking>(`/api/v1/bookings/${id}/cancel`, {
    method: 'POST',
    body: {
      reason: reason || 'customer_requested',
    },
  });
}

/**
 * Get booking statistics for authenticated user
 */
export async function getBookingStats(): Promise<{ stats: BookingStats }> {
  return apiRequest<{ stats: BookingStats }>('/api/v1/bookings/stats');
}

/**
 * Get stylist availability for a date
 */
export async function getStylistAvailability(
  stylistId: string,
  date: string // YYYY-MM-DD
): Promise<StylistAvailability> {
  return apiRequest<StylistAvailability>(`/api/v1/stylists/${stylistId}/availability?date=${date}`);
}

// ============================================================================
// Utility Functions
// ============================================================================

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
  const scheduled = typeof scheduledTime === 'string' ? new Date(scheduledTime) : scheduledTime;
  const now = new Date();
  const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil > 24) {
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 100,
      message: 'Full refund - cancelling more than 24 hours before appointment',
    };
  }
  if (hoursUntil > 12) {
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 75,
      message: '75% refund - cancelling 12-24 hours before appointment',
    };
  }
  if (hoursUntil > 2) {
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 50,
      message: '50% refund - cancelling less than 12 hours before appointment',
    };
  }
  return {
    hoursUntilAppointment: hoursUntil,
    refundPercentage: 0,
    message: 'No refund - cancelling less than 2 hours before appointment',
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
  if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.status)) {
    return false;
  }

  // Cannot cancel past appointments
  if (new Date(booking.scheduledStartTime) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Generate time slots for a date
 */
export function generateTimeSlots(
  date: Date,
  durationMin: number
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
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
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        available: true,
      });
    }
  }

  return slots;
}

// ============================================================================
// Review Types & Functions
// ============================================================================

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  review: Review;
  message: string;
}

/**
 * Submit a review for a completed booking
 */
export async function submitReview(data: CreateReviewRequest): Promise<ReviewResponse> {
  return apiRequest<ReviewResponse>('/api/v1/reviews', {
    method: 'POST',
    body: data,
  });
}

/**
 * Get reviews for a stylist
 */
export async function getStylistReviews(
  stylistId: string,
  params?: { page?: number; limit?: number }
): Promise<{
  reviews: Review[];
  total: number;
  averageRating: number;
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());

  const url = `/api/v1/stylists/${stylistId}/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest(url);
}

/**
 * Check if a booking has been reviewed
 */
export async function getBookingReview(bookingId: string): Promise<Review | null> {
  try {
    return await apiRequest<Review>(`/api/v1/bookings/${bookingId}/review`);
  } catch {
    return null;
  }
}

// ============================================================================
// Display Utility Functions
// ============================================================================

/**
 * Format booking status for display
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Pending Payment';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'DISPUTED':
      return 'Disputed';
    default:
      return status;
  }
}

/**
 * Get status color for booking status
 */
export function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT':
      return '#F59E0B'; // Amber
    case 'CONFIRMED':
      return '#22C55E'; // Green
    case 'IN_PROGRESS':
      return '#3B82F6'; // Blue
    case 'COMPLETED':
      return '#22C55E'; // Green
    case 'CANCELLED':
      return '#EF4444'; // Red
    case 'DISPUTED':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}
