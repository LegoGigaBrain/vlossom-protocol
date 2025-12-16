/**
 * Stylists Module
 *
 * Stylist discovery and service functions for Vlossom SDK.
 */

import { VlossomClient } from './client';

export interface StylistProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  specializations: string[];
  location: {
    city: string;
    lat: number;
    lng: number;
  } | null;
  isActive: boolean;
  averageRating: number | null;
  totalReviews: number;
  completedBookings: number;
}

export interface StylistService {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  category: string;
  isActive: boolean;
}

export interface StylistWithServices extends StylistProfile {
  services: StylistService[];
}

export interface SearchStylistsParams {
  city?: string;
  specialization?: string;
  minRating?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  pendingRequests: number;
  upcomingBookings: number;
  thisMonthEarnings: number;
  totalEarnings: number;
}

export interface StylistsModule {
  /** Search for stylists */
  search(params?: SearchStylistsParams): Promise<{
    stylists: StylistProfile[];
    total: number;
  }>;
  /** Get stylist profile with services */
  getProfile(userId: string): Promise<{ stylist: StylistWithServices }>;
  /** Get stylist services */
  getServices(stylistId: string): Promise<{ services: StylistService[] }>;
  /** Get stylist availability */
  getAvailability(stylistId: string, date: string): Promise<{
    slots: Array<{ start: string; end: string; available: boolean }>;
  }>;
  /** Get dashboard stats (for authenticated stylists) */
  getDashboardStats(): Promise<{ stats: DashboardStats }>;
  /** Update stylist profile (for authenticated stylists) */
  updateProfile(data: Partial<{
    bio: string;
    specializations: string[];
    isActive: boolean;
  }>): Promise<{ profile: StylistProfile }>;
  /** Add a new service (for authenticated stylists) */
  addService(data: {
    name: string;
    description?: string;
    priceCents: number;
    durationMinutes: number;
    category: string;
  }): Promise<{ service: StylistService }>;
  /** Update a service (for authenticated stylists) */
  updateService(serviceId: string, data: Partial<{
    name: string;
    description: string;
    priceCents: number;
    durationMinutes: number;
    isActive: boolean;
  }>): Promise<{ service: StylistService }>;
}

/**
 * Create stylists module bound to a client instance
 */
export function createStylistsModule(client: VlossomClient): StylistsModule {
  return {
    async search(params: SearchStylistsParams = {}) {
      const searchParams = new URLSearchParams();
      if (params.city) searchParams.append('city', params.city);
      if (params.specialization) searchParams.append('specialization', params.specialization);
      if (params.minRating) searchParams.append('minRating', params.minRating.toString());
      if (params.lat) searchParams.append('lat', params.lat.toString());
      if (params.lng) searchParams.append('lng', params.lng.toString());
      if (params.radius) searchParams.append('radius', params.radius.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await client.get<{ stylists: StylistProfile[]; total: number }>(
        `/stylists?${searchParams}`
      );
      return response.data;
    },

    async getProfile(userId: string) {
      const response = await client.get<{ stylist: StylistWithServices }>(`/stylists/${userId}`);
      return response.data;
    },

    async getServices(stylistId: string) {
      const response = await client.get<{ services: StylistService[] }>(`/stylists/${stylistId}/services`);
      return response.data;
    },

    async getAvailability(stylistId: string, date: string) {
      const response = await client.get<{
        slots: Array<{ start: string; end: string; available: boolean }>;
      }>(`/stylists/${stylistId}/availability?date=${date}`);
      return response.data;
    },

    async getDashboardStats() {
      const response = await client.get<{ stats: DashboardStats }>('/stylists/dashboard');
      return response.data;
    },

    async updateProfile(data) {
      const response = await client.patch<{ profile: StylistProfile }>('/stylists/profile', data);
      return response.data;
    },

    async addService(data) {
      const response = await client.post<{ service: StylistService }>('/stylists/services', data);
      return response.data;
    },

    async updateService(serviceId: string, data) {
      const response = await client.patch<{ service: StylistService }>(
        `/stylists/services/${serviceId}`,
        data
      );
      return response.data;
    },
  };
}
