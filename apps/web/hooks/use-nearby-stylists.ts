/**
 * Nearby Stylists Hook (V5.3)
 *
 * Fetches stylists near a location with mock data fallback.
 * Uses feature flag NEXT_PUBLIC_USE_MOCK_DATA for demo mode.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StylistMarker, SalonMarker } from "@/lib/mapbox";
import {
  MOCK_STYLISTS,
  MOCK_SALONS,
  USE_MOCK_DATA,
  shouldUseMockData,
} from "@/lib/mock-data";

// ============================================================================
// Types
// ============================================================================

interface StylistSearchParams {
  lat?: number;
  lng?: number;
  radius?: number; // in meters, default 10km
  operatingMode?: "FIXED" | "MOBILE" | "HYBRID";
  specialty?: string;
  minRating?: number;
  availableNow?: boolean;
  limit?: number;
  offset?: number;
}

interface StylistSearchResponse {
  stylists: StylistMarker[];
  total: number;
  hasMore: boolean;
}

interface SalonSearchResponse {
  salons: SalonMarker[];
  total: number;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchNearbyStylists(
  params: StylistSearchParams
): Promise<StylistSearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.lat !== undefined) searchParams.set("lat", params.lat.toString());
  if (params.lng !== undefined) searchParams.set("lng", params.lng.toString());
  if (params.radius) searchParams.set("radius", params.radius.toString());
  if (params.operatingMode) searchParams.set("operatingMode", params.operatingMode);
  if (params.specialty) searchParams.set("specialty", params.specialty);
  if (params.minRating) searchParams.set("minRating", params.minRating.toString());
  if (params.availableNow) searchParams.set("availableNow", "true");
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const response = await api.get(`/stylists?${searchParams.toString()}`);

  // Transform API response to StylistMarker format
  const stylists: StylistMarker[] = (response.data?.stylists || []).map(
    (stylist: Record<string, unknown>) => ({
      id: stylist.id as string,
      name: stylist.displayName as string || stylist.name as string,
      avatarUrl: stylist.avatarUrl as string | undefined,
      lat: (stylist.latitude as number) || 0,
      lng: (stylist.longitude as number) || 0,
      operatingMode: (stylist.operatingMode as "FIXED" | "MOBILE" | "HYBRID") || "FIXED",
      rating: (stylist.averageRating as number) || 0,
      reviewCount: (stylist.reviewCount as number) || 0,
      specialties: (stylist.specialties as string[]) || [],
      isAvailableNow: (stylist.isAvailableNow as boolean) || false,
      nextAvailable: stylist.nextAvailable as string | undefined,
      priceRange: stylist.priceRange as { min: number; max: number } | undefined,
    })
  );

  return {
    stylists,
    total: response.data?.total || stylists.length,
    hasMore: response.data?.hasMore || false,
  };
}

async function fetchNearbySalons(
  lat?: number,
  lng?: number
): Promise<SalonSearchResponse> {
  const searchParams = new URLSearchParams();
  if (lat !== undefined) searchParams.set("lat", lat.toString());
  if (lng !== undefined) searchParams.set("lng", lng.toString());

  const response = await api.get(`/properties?${searchParams.toString()}`);

  // Transform API response to SalonMarker format
  const salons: SalonMarker[] = (response.data?.properties || []).map(
    (property: Record<string, unknown>) => ({
      id: property.id as string,
      name: property.name as string,
      imageUrl: property.imageUrl as string | undefined,
      lat: (property.latitude as number) || 0,
      lng: (property.longitude as number) || 0,
      chairCount: (property.chairCount as number) || 0,
      availableChairs: (property.availableChairs as number) || 0,
      rating: (property.averageRating as number) || 0,
      amenities: (property.amenities as string[]) || [],
    })
  );

  return {
    salons,
    total: response.data?.total || salons.length,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch nearby stylists
 * Falls back to mock data when API returns empty or in demo mode
 */
export function useNearbyStylists(params: StylistSearchParams = {}) {
  const query = useQuery({
    queryKey: ["stylists", "nearby", params],
    queryFn: () => fetchNearbyStylists(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: {
      stylists: MOCK_STYLISTS,
      total: MOCK_STYLISTS.length,
      hasMore: false,
    },
    retry: 2,
  });

  // Determine which data to display
  const displayStylists = shouldUseMockData(query.data?.stylists)
    ? MOCK_STYLISTS
    : query.data?.stylists || [];

  return {
    ...query,
    stylists: displayStylists,
    total: query.data?.total || displayStylists.length,
    hasMore: query.data?.hasMore || false,
    isUsingMockData: shouldUseMockData(query.data?.stylists),
  };
}

/**
 * Hook to fetch nearby salons/properties
 * Falls back to mock data when API returns empty or in demo mode
 */
export function useNearbySalons(lat?: number, lng?: number) {
  const query = useQuery({
    queryKey: ["salons", "nearby", lat, lng],
    queryFn: () => fetchNearbySalons(lat, lng),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: {
      salons: MOCK_SALONS,
      total: MOCK_SALONS.length,
    },
    retry: 2,
  });

  // Determine which data to display
  const displaySalons = shouldUseMockData(query.data?.salons)
    ? MOCK_SALONS
    : query.data?.salons || [];

  return {
    ...query,
    salons: displaySalons,
    total: query.data?.total || displaySalons.length,
    isUsingMockData: shouldUseMockData(query.data?.salons),
  };
}

/**
 * Combined hook for map display
 * Returns both stylists and salons for the StylistMap component
 */
export function useMapData(params: StylistSearchParams = {}) {
  const stylistsQuery = useNearbyStylists(params);
  const salonsQuery = useNearbySalons(params.lat, params.lng);

  return {
    stylists: stylistsQuery.stylists,
    salons: salonsQuery.salons,
    isLoading: stylistsQuery.isLoading || salonsQuery.isLoading,
    isError: stylistsQuery.isError || salonsQuery.isError,
    error: stylistsQuery.error || salonsQuery.error,
    refetch: () => {
      stylistsQuery.refetch();
      salonsQuery.refetch();
    },
    isUsingMockData: stylistsQuery.isUsingMockData || salonsQuery.isUsingMockData,
  };
}

// Re-export for convenience
export { USE_MOCK_DATA };
