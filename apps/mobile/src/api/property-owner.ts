/**
 * Property Owner API Client (V6.10.0)
 *
 * API endpoints for property owners: properties, chairs, rental requests, revenue.
 */

import { apiRequest, APIError } from './client';

// ============================================================================
// Types
// ============================================================================

export type PropertyCategory = 'LUXURY' | 'BOUTIQUE' | 'STANDARD' | 'HOME_BASED';

export type ChairType =
  | 'BRAID_CHAIR'
  | 'BARBER_CHAIR'
  | 'STYLING_STATION'
  | 'NAIL_STATION'
  | 'LASH_BED'
  | 'FACIAL_BED'
  | 'GENERAL';

export type ChairStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

export type RentalStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type RentalMode = 'PER_BOOKING' | 'PER_HOUR' | 'PER_DAY' | 'PER_WEEK' | 'PER_MONTH';

export interface Chair {
  id: string;
  propertyId: string;
  name: string;
  type: ChairType;
  status: ChairStatus;
  amenities: string[];
  hourlyRateCents: number | null;
  dailyRateCents: number | null;
  weeklyRateCents: number | null;
  monthlyRateCents: number | null;
  perBookingFeeCents: number | null;
  rentalModesEnabled: RentalMode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  category: PropertyCategory;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  description: string | null;
  operatingHours: Record<string, { open: string; close: string }>;
  approvalMode: 'FULL_APPROVAL' | 'NO_APPROVAL' | 'CONDITIONAL';
  images: string[];
  coverImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chairs: Chair[];
  pendingRentalCount?: number;
}

export interface Stylist {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface RentalRequest {
  id: string;
  chairId: string;
  propertyId: string;
  stylistId: string;
  rentalMode: RentalMode;
  status: RentalStatus;
  startTime: string;
  endTime: string;
  totalAmountCents: number;
  platformFeeCents: number;
  ownerPayoutCents: number;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  chair?: Pick<Chair, 'id' | 'name' | 'type'>;
  stylist?: Stylist;
}

export interface PropertyStats {
  totalProperties: number;
  totalChairs: number;
  occupiedChairs: number;
  availableChairs: number;
  pendingRequests: number;
  occupancyRate: number;
}

export interface RevenueStats {
  period: string;
  totalRevenueCents: number;
  platformFeeCents: number;
  netRevenueCents: number;
  completedRentals: number;
  // Earnings breakdown
  totalEarningsCents: number;
  thisPeriodEarningsCents: number;
  lastPeriodEarningsCents: number;
  pendingPayoutCents: number;
}

export interface Transaction {
  id: string;
  date: string;
  createdAt: string;
  type: 'RENTAL_PAYOUT' | 'REFUND' | 'ADJUSTMENT' | 'PAYOUT';
  amountCents: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  stylistName?: string;
  chairName?: string;
  propertyName?: string;
}

// ============================================================================
// Properties API
// ============================================================================

/**
 * Get all properties owned by the current user
 */
export async function getMyProperties(): Promise<Property[]> {
  const response = await apiRequest<{ properties: Property[] }>('/api/v1/properties/my/all', {
    method: 'GET',
  });
  return response.properties;
}

/**
 * Get a single property by ID
 */
export async function getProperty(id: string): Promise<Property> {
  const response = await apiRequest<{ property: Property }>(`/api/v1/properties/${id}`, {
    method: 'GET',
  });
  return response.property;
}

/**
 * Create a new property
 */
export async function createProperty(data: {
  name: string;
  category: PropertyCategory;
  address: string;
  city: string;
  lat: number;
  lng: number;
  description?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  approvalMode?: 'FULL_APPROVAL' | 'NO_APPROVAL' | 'CONDITIONAL';
  images?: string[];
  coverImage?: string;
}): Promise<Property> {
  const response = await apiRequest<{ property: Property }>('/api/v1/properties', {
    method: 'POST',
    body: data,
  });
  return response.property;
}

/**
 * Update a property
 */
export async function updateProperty(
  id: string,
  data: Partial<{
    name: string;
    category: PropertyCategory;
    address: string;
    city: string;
    lat: number;
    lng: number;
    description: string;
    operatingHours: Record<string, { open: string; close: string }>;
    approvalMode: 'FULL_APPROVAL' | 'NO_APPROVAL' | 'CONDITIONAL';
    images: string[];
    coverImage: string;
  }>
): Promise<Property> {
  const response = await apiRequest<{ property: Property }>(`/api/v1/properties/${id}`, {
    method: 'PUT',
    body: data,
  });
  return response.property;
}

/**
 * Delete a property (soft delete)
 */
export async function deleteProperty(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/api/v1/properties/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Chairs API
// ============================================================================

/**
 * Get all chairs for a property
 */
export async function getChairs(propertyId: string): Promise<Chair[]> {
  const response = await apiRequest<{ property: Property }>(`/api/v1/properties/${propertyId}`, {
    method: 'GET',
  });
  return response.property.chairs;
}

/**
 * Create a new chair
 */
export async function createChair(
  propertyId: string,
  data: {
    name: string;
    type?: ChairType;
    amenities?: string[];
    hourlyRateCents?: number;
    dailyRateCents?: number;
    weeklyRateCents?: number;
    monthlyRateCents?: number;
    perBookingFeeCents?: number;
    rentalModesEnabled?: RentalMode[];
  }
): Promise<Chair> {
  const response = await apiRequest<{ chair: Chair }>(`/api/v1/properties/${propertyId}/chairs`, {
    method: 'POST',
    body: data,
  });
  return response.chair;
}

/**
 * Update a chair
 */
export async function updateChair(
  propertyId: string,
  chairId: string,
  data: Partial<{
    name: string;
    type: ChairType;
    status: ChairStatus;
    amenities: string[];
    hourlyRateCents: number;
    dailyRateCents: number;
    weeklyRateCents: number;
    monthlyRateCents: number;
    perBookingFeeCents: number;
    rentalModesEnabled: RentalMode[];
  }>
): Promise<Chair> {
  const response = await apiRequest<{ chair: Chair }>(
    `/api/v1/properties/${propertyId}/chairs/${chairId}`,
    {
      method: 'PUT',
      body: data,
    }
  );
  return response.chair;
}

/**
 * Delete a chair (soft delete)
 */
export async function deleteChair(propertyId: string, chairId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/api/v1/properties/${propertyId}/chairs/${chairId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Rental Requests API
// ============================================================================

/**
 * Get rental requests for a property
 */
export async function getRentalRequests(
  propertyId: string,
  status?: RentalStatus
): Promise<RentalRequest[]> {
  const params = status ? `?status=${status}` : '';
  const response = await apiRequest<{ rentals: RentalRequest[] }>(
    `/api/v1/properties/${propertyId}/rentals${params}`,
    {
      method: 'GET',
    }
  );
  return response.rentals;
}

/**
 * Get all rental requests across all properties
 */
export async function getAllRentalRequests(status?: RentalStatus): Promise<RentalRequest[]> {
  // First get all properties, then aggregate rental requests
  const properties = await getMyProperties();
  const allRequests: RentalRequest[] = [];

  for (const property of properties) {
    try {
      const requests = await getRentalRequests(property.id, status);
      allRequests.push(...requests);
    } catch (error) {
      console.warn(`Failed to fetch rentals for property ${property.id}:`, error);
    }
  }

  // Sort by createdAt descending
  return allRequests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Approve a rental request
 */
export async function approveRentalRequest(rentalId: string): Promise<RentalRequest> {
  const response = await apiRequest<{ rentalRequest: RentalRequest }>(
    `/api/v1/properties/rentals/${rentalId}/decision`,
    {
      method: 'POST',
      body: { decision: 'APPROVE' },
    }
  );
  return response.rentalRequest;
}

/**
 * Reject a rental request
 */
export async function rejectRentalRequest(
  rentalId: string,
  reason?: string
): Promise<RentalRequest> {
  const response = await apiRequest<{ rentalRequest: RentalRequest }>(
    `/api/v1/properties/rentals/${rentalId}/decision`,
    {
      method: 'POST',
      body: { decision: 'REJECT', rejectionReason: reason },
    }
  );
  return response.rentalRequest;
}

// ============================================================================
// Revenue API
// ============================================================================

/**
 * Get revenue stats for a period
 * Note: This is a computed endpoint - may need backend implementation
 */
export async function getRevenueStats(
  period: 'week' | 'month' | 'year'
): Promise<RevenueStats> {
  // For now, compute from rental requests
  // Backend could provide a dedicated endpoint
  const properties = await getMyProperties();
  const allRequests: RentalRequest[] = [];

  for (const property of properties) {
    try {
      const requests = await getRentalRequests(property.id, 'COMPLETED');
      allRequests.push(...requests);
    } catch {
      // Ignore errors
    }
  }

  // Filter by period
  const now = new Date();
  const periodStart = new Date();
  switch (period) {
    case 'week':
      periodStart.setDate(now.getDate() - 7);
      break;
    case 'month':
      periodStart.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      periodStart.setFullYear(now.getFullYear() - 1);
      break;
  }

  const filteredRequests = allRequests.filter(
    (r) => new Date(r.createdAt) >= periodStart
  );

  const totalRevenueCents = filteredRequests.reduce(
    (sum, r) => sum + r.totalAmountCents,
    0
  );
  const platformFeeCents = filteredRequests.reduce(
    (sum, r) => sum + r.platformFeeCents,
    0
  );

  const netRevenueCents = totalRevenueCents - platformFeeCents;

  return {
    period,
    totalRevenueCents,
    platformFeeCents,
    netRevenueCents,
    completedRentals: filteredRequests.length,
    // Earnings breakdown - derived from revenue
    totalEarningsCents: netRevenueCents,
    thisPeriodEarningsCents: netRevenueCents,
    lastPeriodEarningsCents: Math.floor(netRevenueCents * 0.9), // Mock: 90% of current
    pendingPayoutCents: Math.floor(netRevenueCents * 0.2), // Mock: 20% pending
  };
}

/**
 * Get transactions for a period
 * Note: Derived from rental requests - backend could provide dedicated endpoint
 */
export async function getTransactions(
  period: 'week' | 'month' | 'year'
): Promise<Transaction[]> {
  const properties = await getMyProperties();
  const allRequests: RentalRequest[] = [];

  for (const property of properties) {
    try {
      const requests = await getRentalRequests(property.id, 'COMPLETED');
      allRequests.push(...requests);
    } catch {
      // Ignore errors
    }
  }

  // Filter by period
  const now = new Date();
  const periodStart = new Date();
  switch (period) {
    case 'week':
      periodStart.setDate(now.getDate() - 7);
      break;
    case 'month':
      periodStart.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      periodStart.setFullYear(now.getFullYear() - 1);
      break;
  }

  const filteredRequests = allRequests
    .filter((r) => new Date(r.createdAt) >= periodStart)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return filteredRequests.map((r) => ({
    id: r.id,
    date: r.createdAt,
    createdAt: r.createdAt,
    type: 'RENTAL_PAYOUT' as const,
    amountCents: r.ownerPayoutCents,
    status: 'COMPLETED' as const,
    description: `Chair rental: ${r.chair?.name || 'Unknown chair'}`,
    stylistName: r.stylist?.displayName,
    chairName: r.chair?.name,
    propertyName: undefined,
  }));
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calculate property stats from properties list
 */
export function calculatePropertyStats(properties: Property[]): PropertyStats {
  const totalProperties = properties.length;
  let totalChairs = 0;
  let occupiedChairs = 0;
  let availableChairs = 0;
  let pendingRequests = 0;

  for (const property of properties) {
    const chairs = property.chairs || [];
    totalChairs += chairs.length;
    occupiedChairs += chairs.filter((c) => c.status === 'OCCUPIED').length;
    availableChairs += chairs.filter((c) => c.status === 'AVAILABLE').length;
    pendingRequests += property.pendingRentalCount || 0;
  }

  const occupancyRate = totalChairs > 0 ? Math.round((occupiedChairs / totalChairs) * 100) : 0;

  return {
    totalProperties,
    totalChairs,
    occupiedChairs,
    availableChairs,
    pendingRequests,
    occupancyRate,
  };
}

/**
 * Format chair rate for display
 */
export function formatChairRate(chair: Chair): string {
  if (chair.hourlyRateCents) {
    return `R${(chair.hourlyRateCents / 100).toFixed(0)}/hr`;
  }
  if (chair.dailyRateCents) {
    return `R${(chair.dailyRateCents / 100).toFixed(0)}/day`;
  }
  if (chair.perBookingFeeCents) {
    return `R${(chair.perBookingFeeCents / 100).toFixed(0)}/booking`;
  }
  return 'Rate TBD';
}

// Note: APIError is exported from client.ts via index.ts
