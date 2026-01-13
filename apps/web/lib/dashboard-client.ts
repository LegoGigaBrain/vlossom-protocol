/**
 * Dashboard API Client
 * Reference: docs/specs/stylist-dashboard/MILESTONE-3-PLAN.md
 *
 * V8.0.0 Security Update: Migrated from Bearer tokens to httpOnly cookies
 */

import { authFetch } from "./auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  pendingRequests: number;
  upcomingBookings: number;
  thisMonthEarnings: number;
  totalEarnings: number;
}

export interface UpcomingBooking {
  id: string;
  customerName: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
}

export interface PendingRequest {
  id: string;
  customerName: string;
  serviceName: string;
  requestedAt: string;
  scheduledAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  upcomingBookings: UpcomingBooking[];
  pendingRequests: PendingRequest[];
}

export interface StylistService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  priceAmountCents: number;
  estimatedDurationMin: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateServiceInput {
  name: string;
  category: string;
  description?: string;
  priceAmountCents: number;
  estimatedDurationMin: number;
  isActive?: boolean;
}

export interface WeeklySchedule {
  mon: TimeSlot[];
  tue: TimeSlot[];
  wed: TimeSlot[];
  thu: TimeSlot[];
  fri: TimeSlot[];
  sat: TimeSlot[];
  sun: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DateException {
  date: string;
  blocked: boolean;
  note?: string;
}

export interface AvailabilityData {
  schedule: WeeklySchedule;
  exceptions: DateException[];
}

export interface StylistProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  operatingMode: "FIXED" | "MOBILE" | "HYBRID";
  baseLocationLat: number | null;
  baseLocationLng: number | null;
  baseLocationAddress: string | null;
  serviceRadius: number | null;
  specialties: string[];
  portfolioImages: string[];
  isAcceptingBookings: boolean;
}

export interface EarningsSummary {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingEarnings: number;
  pendingBookingsCount: number;
  completedBookingsCount: number;
}

export interface EarningsTrendData {
  date: string;
  earnings: number;
}

export interface PayoutHistoryItem {
  id: string;
  date: string;
  serviceName: string;
  customerName: string;
  amount: number;
  status: string;
}

// ============================================================================
// HELPER
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.error?.message || error.message || "Request failed");
  }
  return response.json();
}

// ============================================================================
// DASHBOARD API
// ============================================================================

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchDashboard(): Promise<DashboardData> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/dashboard`);
  return handleResponse<DashboardData>(response);
}

// ============================================================================
// SERVICES API
// ============================================================================

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchServices(): Promise<{ services: StylistService[]; total: number }> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/services`);
  return handleResponse(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function createService(input: CreateServiceInput): Promise<StylistService> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/services`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return handleResponse<StylistService>(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function updateService(
  id: string,
  input: Partial<CreateServiceInput>
): Promise<StylistService> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return handleResponse<StylistService>(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function deleteService(id: string): Promise<void> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/services/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.error?.message || "Delete failed");
  }
}

// ============================================================================
// AVAILABILITY API
// ============================================================================

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchAvailability(): Promise<AvailabilityData> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/availability`);
  return handleResponse<AvailabilityData>(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function updateAvailability(schedule: WeeklySchedule): Promise<AvailabilityData> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/availability`, {
    method: "PUT",
    body: JSON.stringify({ schedule }),
  });
  return handleResponse<AvailabilityData>(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function addException(exception: DateException): Promise<{ exceptions: DateException[] }> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/availability/exceptions`, {
    method: "POST",
    body: JSON.stringify(exception),
  });
  return handleResponse(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function removeException(date: string): Promise<void> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/availability/exceptions/${date}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.error?.message || "Delete failed");
  }
}

// ============================================================================
// PROFILE API
// ============================================================================

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchProfile(): Promise<StylistProfile> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/profile`);
  return handleResponse<StylistProfile>(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function updateProfile(input: Partial<StylistProfile>): Promise<StylistProfile> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/profile`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return handleResponse<StylistProfile>(response);
}

// ============================================================================
// EARNINGS API
// ============================================================================

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchEarnings(): Promise<EarningsSummary> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/earnings`);
  return handleResponse<EarningsSummary>(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchEarningsTrend(
  period: "week" | "month" | "year" = "week"
): Promise<{ period: string; data: EarningsTrendData[] }> {
  const response = await authFetch(`${API_BASE}/api/v1/stylists/earnings/trend?period=${period}`);
  return handleResponse(response);
}

/**
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function fetchPayoutHistory(
  page: number = 1,
  limit: number = 10
): Promise<{
  payouts: PayoutHistoryItem[];
  pagination: { page: number; limit: number; total: number; hasMore: boolean };
}> {
  const response = await authFetch(
    `${API_BASE}/api/v1/stylists/earnings/history?page=${page}&limit=${limit}`
  );
  return handleResponse(response);
}
