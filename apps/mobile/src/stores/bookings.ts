/**
 * Bookings Store (V7.0.0)
 *
 * Zustand store for managing booking state.
 * Handles booking list, creation, status updates, and cancellations.
 * Supports demo mode with mock data.
 */

import { create } from 'zustand';
import {
  getBookings,
  getBooking,
  createBooking as createBookingAPI,
  cancelBooking as cancelBookingAPI,
  confirmPayment as confirmPaymentAPI,
  getBookingStats,
  getStylistAvailability,
  type Booking,
  type BookingStatus,
  type BookingStats,
  type CreateBookingRequest,
  type AvailabilitySlot,
} from '../api/bookings';
import { MOCK_BOOKINGS, getMockBooking, MOCK_AVAILABILITY_SLOTS } from '../data/mock-data';
import { getIsDemoMode } from './demo-mode';

// ============================================================================
// Types
// ============================================================================

interface BookingsState {
  // Bookings list
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
  hasMoreBookings: boolean;
  bookingsPage: number;

  // Current booking
  currentBooking: Booking | null;
  currentBookingLoading: boolean;
  currentBookingError: string | null;

  // Booking stats
  stats: BookingStats | null;
  statsLoading: boolean;

  // Availability
  availability: AvailabilitySlot[];
  availabilityDate: string | null;
  availabilityLoading: boolean;

  // Create booking state
  createLoading: boolean;
  createError: string | null;

  // Cancel booking state
  cancelLoading: boolean;
  cancelError: string | null;

  // Confirm payment state
  confirmPaymentLoading: boolean;
  confirmPaymentError: string | null;

  // Filter state
  statusFilter: BookingStatus | null;

  // Actions
  fetchBookings: (refresh?: boolean) => Promise<void>;
  fetchBooking: (id: string) => Promise<Booking | null>;
  fetchStats: () => Promise<void>;
  fetchAvailability: (stylistId: string, date: string) => Promise<void>;
  createBooking: (data: CreateBookingRequest) => Promise<Booking | null>;
  cancelBooking: (id: string, reason?: string) => Promise<boolean>;
  confirmPayment: (bookingId: string, escrowTxHash: string) => Promise<boolean>;
  setStatusFilter: (status: BookingStatus | null) => void;
  clearErrors: () => void;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  bookings: [],
  bookingsLoading: false,
  bookingsError: null,
  hasMoreBookings: false,
  bookingsPage: 1,

  currentBooking: null,
  currentBookingLoading: false,
  currentBookingError: null,

  stats: null,
  statsLoading: false,

  availability: [],
  availabilityDate: null,
  availabilityLoading: false,

  createLoading: false,
  createError: null,

  cancelLoading: false,
  cancelError: null,

  confirmPaymentLoading: false,
  confirmPaymentError: null,

  statusFilter: null,
};

export const useBookingsStore = create<BookingsState>((set, get) => ({
  ...initialState,

  /**
   * Fetch bookings list with optional filter
   * In demo mode, returns mock bookings
   */
  fetchBookings: async (refresh = false) => {
    const state = get();
    if (state.bookingsLoading) return;

    const page = refresh ? 1 : state.bookingsPage;
    set({ bookingsLoading: true, bookingsError: null });

    // Demo mode: return mock bookings
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let mockData = [...MOCK_BOOKINGS];
      // Apply status filter if set
      if (state.statusFilter) {
        mockData = mockData.filter((b) => b.status === state.statusFilter);
      }

      set({
        bookings: mockData,
        hasMoreBookings: false,
        bookingsPage: 1,
        bookingsLoading: false,
      });
      return;
    }

    try {
      const response = await getBookings({
        status: state.statusFilter || undefined,
        page,
        limit: 20,
      });

      set({
        bookings: refresh
          ? response.bookings
          : [...state.bookings, ...response.bookings],
        hasMoreBookings: response.hasMore,
        bookingsPage: page + 1,
        bookingsLoading: false,
      });
    } catch (error) {
      set({
        bookingsLoading: false,
        bookingsError: error instanceof Error ? error.message : 'Failed to fetch bookings',
      });
    }
  },

  /**
   * Fetch single booking by ID
   * In demo mode, returns mock booking
   */
  fetchBooking: async (id: string) => {
    set({ currentBookingLoading: true, currentBookingError: null });

    // Demo mode: return mock booking
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const mockBooking = getMockBooking(id);
      set({
        currentBooking: mockBooking,
        currentBookingLoading: false,
      });
      return mockBooking;
    }

    try {
      const booking = await getBooking(id);
      set({
        currentBooking: booking,
        currentBookingLoading: false,
      });
      return booking;
    } catch (error) {
      set({
        currentBookingLoading: false,
        currentBookingError: error instanceof Error ? error.message : 'Failed to fetch booking',
      });
      return null;
    }
  },

  /**
   * Fetch booking statistics
   * In demo mode, returns mock stats
   */
  fetchStats: async () => {
    set({ statsLoading: true });

    // Demo mode: return mock stats
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const total = MOCK_BOOKINGS.length;
      const completed = MOCK_BOOKINGS.filter((b) => b.status === 'COMPLETED').length;
      const cancelled = MOCK_BOOKINGS.filter((b) => b.status === 'CANCELLED').length;
      set({
        stats: {
          asCustomer: {
            total,
            thisMonth: total,
            completed,
            cancelled,
            totalSpentCents: '0',
          },
          asStylist: {
            total: 0,
            thisMonth: 0,
            completed: 0,
            cancelled: 0,
            grossEarnedCents: '0',
            netEarnedCents: '0',
          },
          combined: {
            total,
            thisMonth: total,
            completed,
          },
        },
        statsLoading: false,
      });
      return;
    }

    try {
      const response = await getBookingStats();
      set({
        stats: response.stats,
        statsLoading: false,
      });
    } catch (error) {
      console.warn('Failed to fetch booking stats:', error);
      set({ statsLoading: false });
    }
  },

  /**
   * Fetch stylist availability for a date
   * In demo mode, returns mock availability slots
   */
  fetchAvailability: async (stylistId: string, date: string) => {
    set({ availabilityLoading: true, availabilityDate: date });

    // Demo mode: return mock availability slots
    if (getIsDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      set({
        availability: MOCK_AVAILABILITY_SLOTS,
        availabilityLoading: false,
      });
      return;
    }

    try {
      const response = await getStylistAvailability(stylistId, date);
      set({
        availability: response.slots,
        availabilityLoading: false,
      });
    } catch (error) {
      console.warn('Failed to fetch availability:', error);
      // Fallback to generated slots if API fails
      set({
        availability: [],
        availabilityLoading: false,
      });
    }
  },

  /**
   * Create a new booking
   */
  createBooking: async (data: CreateBookingRequest) => {
    set({ createLoading: true, createError: null });

    try {
      const booking = await createBookingAPI(data);

      // Add to bookings list
      set((state) => ({
        bookings: [booking, ...state.bookings],
        currentBooking: booking,
        createLoading: false,
      }));

      return booking;
    } catch (error) {
      let errorMessage = 'Failed to create booking';

      if (error instanceof Error) {
        if (error.message.includes('SLOT_UNAVAILABLE')) {
          errorMessage = 'This time slot is no longer available';
        } else if (error.message.includes('STYLIST_UNAVAILABLE')) {
          errorMessage = 'This stylist is not available at this time';
        } else if (error.message.includes('SERVICE_NOT_FOUND')) {
          errorMessage = 'Service not found';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        createLoading: false,
        createError: errorMessage,
      });
      return null;
    }
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (id: string, reason?: string) => {
    set({ cancelLoading: true, cancelError: null });

    try {
      const booking = await cancelBookingAPI(id, reason);

      // Update in list
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? booking : b
        ),
        currentBooking: state.currentBooking?.id === id ? booking : state.currentBooking,
        cancelLoading: false,
      }));

      return true;
    } catch (error) {
      let errorMessage = 'Failed to cancel booking';

      if (error instanceof Error) {
        if (error.message.includes('CANNOT_CANCEL')) {
          errorMessage = 'This booking cannot be cancelled';
        } else if (error.message.includes('BOOKING_NOT_FOUND')) {
          errorMessage = 'Booking not found';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        cancelLoading: false,
        cancelError: errorMessage,
      });
      return false;
    }
  },

  /**
   * Confirm payment for a booking
   */
  confirmPayment: async (bookingId: string, escrowTxHash: string) => {
    set({ confirmPaymentLoading: true, confirmPaymentError: null });

    try {
      const response = await confirmPaymentAPI(bookingId, escrowTxHash);

      // Update booking in list
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? response.booking : b
        ),
        currentBooking: state.currentBooking?.id === bookingId
          ? response.booking
          : state.currentBooking,
        confirmPaymentLoading: false,
      }));

      return true;
    } catch (error) {
      let errorMessage = 'Failed to confirm payment';

      if (error instanceof Error) {
        if (error.message.includes('ESCROW_NOT_FOUND')) {
          errorMessage = 'Escrow transaction not found';
        } else if (error.message.includes('ESCROW_MISMATCH')) {
          errorMessage = 'Escrow amount does not match booking';
        } else {
          errorMessage = error.message;
        }
      }

      set({
        confirmPaymentLoading: false,
        confirmPaymentError: errorMessage,
      });
      return false;
    }
  },

  /**
   * Set status filter for bookings list
   */
  setStatusFilter: (status: BookingStatus | null) => {
    set({
      statusFilter: status,
      bookings: [],
      bookingsPage: 1,
      hasMoreBookings: false,
    });
    // Refetch with new filter
    get().fetchBookings(true);
  },

  /**
   * Clear all error states
   */
  clearErrors: () => {
    set({
      bookingsError: null,
      currentBookingError: null,
      createError: null,
      cancelError: null,
      confirmPaymentError: null,
    });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectBookings = (state: BookingsState) => state.bookings;
export const selectBookingsLoading = (state: BookingsState) => state.bookingsLoading;
export const selectCurrentBooking = (state: BookingsState) => state.currentBooking;
export const selectBookingStats = (state: BookingsState) => state.stats;
export const selectAvailability = (state: BookingsState) => state.availability;
export const selectCreateLoading = (state: BookingsState) => state.createLoading;
export const selectCreateError = (state: BookingsState) => state.createError;

// Derived selectors
export const selectUpcomingBookings = (state: BookingsState) =>
  state.bookings.filter(
    (b) =>
      ['CONFIRMED', 'PENDING_PAYMENT'].includes(b.status) &&
      new Date(b.scheduledStartTime) >= new Date()
  );

export const selectPastBookings = (state: BookingsState) =>
  state.bookings.filter(
    (b) =>
      b.status === 'COMPLETED' ||
      new Date(b.scheduledStartTime) < new Date()
  );

export const selectNextBooking = (state: BookingsState) => {
  const upcoming = state.bookings
    .filter(
      (b) =>
        b.status === 'CONFIRMED' &&
        new Date(b.scheduledStartTime) >= new Date()
    )
    .sort((a, b) =>
      new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    );
  return upcoming[0] || null;
};
