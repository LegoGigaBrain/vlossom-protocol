/**
 * Stylists API Client (V6.8.0)
 *
 * Handles all stylist-related API calls:
 * - Search/discovery with location
 * - Stylist details
 * - Services and availability
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type ServiceCategory = 'Hair' | 'Nails' | 'Makeup' | 'Lashes' | 'Facials';
export type OperatingMode = 'FIXED' | 'MOBILE' | 'HYBRID';
export type SortOption = 'distance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface StylistLocation {
  lat: number;
  lng: number;
  address: string | null;
}

export interface StylistService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  priceAmountCents: string;
  estimatedDurationMin: number;
}

export interface StylistSummary {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: string;
  bio: string | null;
  specialties: string[];
  operatingMode: OperatingMode;
  baseLocation: StylistLocation | null;
  serviceRadius: number | null;
  distance: number | null; // Distance from search location in km
  services: StylistService[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface StylistDetail extends StylistSummary {
  memberSince: string;
  serviceCategories: string[];
  portfolioImages: string[];
  isAcceptingBookings: boolean;
}

// ============================================================================
// Stylist Dashboard Types (for stylist role users)
// ============================================================================

export interface PendingRequest {
  id: string;
  customerName: string;
  customerAvatarUrl: string | null;
  serviceName: string;
  requestedDate: string;
  requestedTime: string;
  priceAmountCents: string;
  createdAt: string;
}

export interface StylistDashboard {
  stats: {
    pendingRequests: number;
    upcomingBookings: number;
    thisMonthEarnings: number;
    totalEarnings: number;
    completedBookings: number;
    averageRating: number;
  };
  pendingRequests: PendingRequest[];
  upcomingBookings: Array<{
    id: string;
    customerName: string;
    serviceName: string;
    scheduledStartTime: string;
    locationAddress: string;
    status: string;
  }>;
}

export interface StylistEarnings {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingEarnings: number;
  pendingBookingsCount: number;
  completedBookingsCount: number;
}

export interface SearchStylistsParams {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km
  serviceCategory?: ServiceCategory;
  operatingMode?: OperatingMode;
  minPrice?: number;
  maxPrice?: number;
  availability?: string; // YYYY-MM-DD
  sortBy?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface SearchStylistsResponse {
  items: StylistSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    query: string | null;
    serviceCategory: ServiceCategory | null;
    operatingMode: OperatingMode | null;
    priceRange: { min: number | null; max: number | null } | null;
    availability: string | null;
    sortBy: SortOption | null;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search stylists with filters
 */
export async function searchStylists(
  params: SearchStylistsParams = {}
): Promise<SearchStylistsResponse> {
  const queryParams = new URLSearchParams();

  if (params.query) queryParams.set('query', params.query);
  if (params.lat !== undefined) queryParams.set('lat', params.lat.toString());
  if (params.lng !== undefined) queryParams.set('lng', params.lng.toString());
  if (params.radius !== undefined) queryParams.set('radius', params.radius.toString());
  if (params.serviceCategory) queryParams.set('serviceCategory', params.serviceCategory);
  if (params.operatingMode) queryParams.set('operatingMode', params.operatingMode);
  if (params.minPrice !== undefined) queryParams.set('minPrice', params.minPrice.toString());
  if (params.maxPrice !== undefined) queryParams.set('maxPrice', params.maxPrice.toString());
  if (params.availability) queryParams.set('availability', params.availability);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.page !== undefined) queryParams.set('page', params.page.toString());
  if (params.pageSize !== undefined) queryParams.set('pageSize', params.pageSize.toString());

  const url = `/api/v1/stylists${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest<SearchStylistsResponse>(url);
}

/**
 * Get stylist by ID with full details
 */
export async function getStylistById(id: string): Promise<StylistDetail> {
  return apiRequest<StylistDetail>(`/api/v1/stylists/${id}`);
}

/**
 * Get nearby stylists (convenience wrapper)
 */
export async function getNearbyStylists(
  lat: number,
  lng: number,
  options: {
    radius?: number;
    limit?: number;
    operatingMode?: OperatingMode;
  } = {}
): Promise<StylistSummary[]> {
  const response = await searchStylists({
    lat,
    lng,
    radius: options.radius || 25, // Default 25km
    pageSize: options.limit || 20,
    operatingMode: options.operatingMode,
    sortBy: 'distance',
  });
  return response.items;
}

/**
 * Get available stylists for a specific date
 */
export async function getAvailableStylists(
  date: string, // YYYY-MM-DD
  options: {
    lat?: number;
    lng?: number;
    serviceCategory?: ServiceCategory;
  } = {}
): Promise<StylistSummary[]> {
  const response = await searchStylists({
    availability: date,
    lat: options.lat,
    lng: options.lng,
    serviceCategory: options.serviceCategory,
    sortBy: options.lat && options.lng ? 'distance' : undefined,
    pageSize: 50,
  });
  return response.items;
}

// ============================================================================
// Stylist Dashboard API (for stylist role users)
// ============================================================================

/**
 * Get stylist dashboard data (earnings, pending requests, upcoming bookings)
 * Requires authenticated user with STYLIST role
 */
export async function getStylistDashboard(): Promise<StylistDashboard> {
  return apiRequest<StylistDashboard>('/api/v1/stylists/dashboard');
}

/**
 * Get stylist earnings details
 * Requires authenticated user with STYLIST role
 */
export async function getStylistEarnings(): Promise<StylistEarnings> {
  return apiRequest<StylistEarnings>('/api/v1/stylists/earnings');
}

/**
 * Approve a pending booking request
 */
export async function approveBookingRequest(requestId: string): Promise<void> {
  return apiRequest(`/api/v1/bookings/${requestId}/approve`, {
    method: 'POST',
  });
}

/**
 * Decline a pending booking request
 */
export async function declineBookingRequest(
  requestId: string,
  reason?: string
): Promise<void> {
  return apiRequest(`/api/v1/bookings/${requestId}/decline`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================================
// Availability Types & API
// ============================================================================

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WeeklySchedule {
  mon: TimeSlot[];
  tue: TimeSlot[];
  wed: TimeSlot[];
  thu: TimeSlot[];
  fri: TimeSlot[];
  sat: TimeSlot[];
  sun: TimeSlot[];
}

export interface AvailabilityException {
  date: string; // YYYY-MM-DD
  blocked: boolean;
  note?: string;
}

export interface StylistAvailability {
  id: string;
  stylistId: string;
  schedule: WeeklySchedule;
  exceptions: AvailabilityException[];
  updatedAt: string;
}

/**
 * Get stylist's availability settings
 */
export async function getStylistAvailability(): Promise<StylistAvailability> {
  return apiRequest<StylistAvailability>('/api/v1/stylists/availability');
}

/**
 * Update weekly availability schedule
 */
export async function updateStylistAvailability(
  schedule: Partial<WeeklySchedule>
): Promise<StylistAvailability> {
  return apiRequest<StylistAvailability>('/api/v1/stylists/availability', {
    method: 'PUT',
    body: { schedule },
  });
}

/**
 * Add an exception date (holiday, time off, etc.)
 */
export async function addAvailabilityException(
  exception: Omit<AvailabilityException, 'id'>
): Promise<StylistAvailability> {
  return apiRequest<StylistAvailability>('/api/v1/stylists/availability/exceptions', {
    method: 'POST',
    body: exception,
  });
}

/**
 * Remove an exception date
 */
export async function removeAvailabilityException(
  date: string
): Promise<StylistAvailability> {
  return apiRequest<StylistAvailability>(`/api/v1/stylists/availability/exceptions/${date}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format price in ZAR
 */
export function formatPrice(cents: number | string): string {
  const amount = typeof cents === 'string' ? parseInt(cents, 10) : cents;
  return `R${(amount / 100).toFixed(0)}`;
}

/**
 * Format price range
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

/**
 * Format distance
 */
export function formatDistance(km: number | null): string {
  if (km === null) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Get pin color based on operating mode
 */
export function getPinColor(operatingMode: OperatingMode): string {
  switch (operatingMode) {
    case 'FIXED':
      return '#22C55E'; // Green - salon/fixed location
    case 'MOBILE':
      return '#EF4444'; // Red - comes to you
    case 'HYBRID':
      return '#F59E0B'; // Amber - both
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get operating mode label
 */
export function getOperatingModeLabel(mode: OperatingMode): string {
  switch (mode) {
    case 'FIXED':
      return 'Salon';
    case 'MOBILE':
      return 'Mobile';
    case 'HYBRID':
      return 'Salon & Mobile';
    default:
      return mode;
  }
}
