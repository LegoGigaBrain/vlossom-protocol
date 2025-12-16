/**
 * Bookings Module
 *
 * Booking management functions for Vlossom SDK.
 */

import { VlossomClient } from './client';

export type BookingStatus =
  | 'PENDING_STYLIST_APPROVAL'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'AWAITING_CUSTOMER_CONFIRMATION'
  | 'SETTLED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface Booking {
  id: string;
  customerId: string;
  stylistId: string;
  status: BookingStatus;
  serviceType: string;
  scheduledAt: string;
  totalAmountCents: number;
  platformFeeCents: number;
  stylistPayoutCents: number;
  notes?: string;
  escrowId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithDetails extends Booking {
  customer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stylist: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
}

export interface CreateBookingParams {
  stylistId: string;
  serviceIds: string[];
  scheduledAt: string;
  notes?: string;
}

export interface ListBookingsParams {
  role?: 'customer' | 'stylist';
  status?: BookingStatus | BookingStatus[];
  page?: number;
  limit?: number;
}

export interface PaginatedBookings {
  bookings: BookingWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface BookingsModule {
  /** Create a new booking */
  create(params: CreateBookingParams): Promise<{ booking: Booking }>;
  /** Get booking by ID */
  get(bookingId: string): Promise<{ booking: BookingWithDetails }>;
  /** List bookings with filters */
  list(params?: ListBookingsParams): Promise<PaginatedBookings>;
  /** Approve a booking (stylist only) */
  approve(bookingId: string): Promise<{ booking: Booking }>;
  /** Decline a booking (stylist only) */
  decline(bookingId: string, reason: string): Promise<{ booking: Booking }>;
  /** Pay for a booking (customer only) */
  pay(bookingId: string): Promise<{ booking: Booking }>;
  /** Start service (stylist only) */
  start(bookingId: string): Promise<{ booking: Booking }>;
  /** Complete service (stylist only) */
  complete(bookingId: string): Promise<{ booking: Booking }>;
  /** Confirm completion (customer only) */
  confirm(bookingId: string): Promise<{ booking: Booking }>;
  /** Cancel a booking */
  cancel(bookingId: string, reason: string): Promise<{ booking: Booking }>;
}

/**
 * Create bookings module bound to a client instance
 */
export function createBookingsModule(client: VlossomClient): BookingsModule {
  return {
    async create(params: CreateBookingParams) {
      const response = await client.post<{ booking: Booking }>('/bookings', params);
      return response.data;
    },

    async get(bookingId: string) {
      const response = await client.get<{ booking: BookingWithDetails }>(`/bookings/${bookingId}`);
      return response.data;
    },

    async list(params: ListBookingsParams = {}) {
      const searchParams = new URLSearchParams();
      if (params.role) searchParams.append('role', params.role);
      if (params.status) {
        const statuses = Array.isArray(params.status) ? params.status.join(',') : params.status;
        searchParams.append('status', statuses);
      }
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await client.get<PaginatedBookings>(`/bookings?${searchParams}`);
      return response.data;
    },

    async approve(bookingId: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/approve`);
      return response.data;
    },

    async decline(bookingId: string, reason: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/decline`, { reason });
      return response.data;
    },

    async pay(bookingId: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/pay`);
      return response.data;
    },

    async start(bookingId: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/start`);
      return response.data;
    },

    async complete(bookingId: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/complete`);
      return response.data;
    },

    async confirm(bookingId: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/confirm`);
      return response.data;
    },

    async cancel(bookingId: string, reason: string) {
      const response = await client.post<{ booking: Booking }>(`/bookings/${bookingId}/cancel`, { reason });
      return response.data;
    },
  };
}
