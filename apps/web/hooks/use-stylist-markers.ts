/**
 * Stylist Markers Hook (V5.1)
 *
 * Transforms stylist API data into map markers.
 * Falls back to mock data when API data lacks coordinates.
 */

"use client";

import { useMemo } from "react";
import { useStylists } from "./use-stylists";
import type { StylistMarker } from "@/lib/mapbox";
import type { StylistSummary, StylistFilters } from "@/lib/stylist-client";

// Default location (Johannesburg) for stylists without coordinates
const DEFAULT_LOCATION = { lat: -26.2041, lng: 28.0473 };

// Spread offset to prevent markers from stacking
function getSpreadOffset(index: number): { lat: number; lng: number } {
  const angle = (index * 137.5 * Math.PI) / 180; // Golden angle
  const radius = 0.005 + (index * 0.002); // Increasing radius
  return {
    lat: Math.cos(angle) * radius,
    lng: Math.sin(angle) * radius,
  };
}

/**
 * Transform API stylist to map marker
 */
function transformToMarker(
  stylist: StylistSummary,
  index: number
): StylistMarker {
  // Use real coordinates if available, otherwise spread around default
  const hasLocation = stylist.baseLocation?.lat && stylist.baseLocation?.lng;
  const offset = hasLocation ? { lat: 0, lng: 0 } : getSpreadOffset(index);

  return {
    id: stylist.id,
    name: stylist.displayName || "Stylist",
    avatarUrl: stylist.avatarUrl ?? undefined,
    lat: hasLocation
      ? stylist.baseLocation!.lat + offset.lat
      : DEFAULT_LOCATION.lat + offset.lat,
    lng: hasLocation
      ? stylist.baseLocation!.lng + offset.lng
      : DEFAULT_LOCATION.lng + offset.lng,
    operatingMode: stylist.operatingMode,
    rating: 4.5 + Math.random() * 0.5, // Placeholder - needs reviews integration
    reviewCount: Math.floor(Math.random() * 100) + 10, // Placeholder
    specialties: stylist.specialties || [],
    isAvailableNow: stylist.isAcceptingBookings,
    priceRange: stylist.startingPrice
      ? { min: stylist.startingPrice, max: stylist.startingPrice * 3 }
      : undefined,
  };
}

/**
 * Hook to fetch stylists as map markers
 */
export function useStylistMarkers(filters?: StylistFilters) {
  const { data, isLoading, error, refetch } = useStylists(filters);

  const markers = useMemo<StylistMarker[]>(() => {
    if (!data?.stylists?.length) return [];
    return data.stylists.map((stylist, index) =>
      transformToMarker(stylist, index)
    );
  }, [data?.stylists]);

  return {
    markers,
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
    hasMore: data?.hasMore ?? false,
  };
}

/**
 * Hook to fetch stylists with availability filter
 */
export function useAvailableStylistMarkers() {
  return useStylistMarkers({ limit: 50 });
}

/**
 * Filter markers by various criteria
 */
export function filterMarkers(
  markers: StylistMarker[],
  options: {
    availableOnly?: boolean;
    topRatedOnly?: boolean;
    minRating?: number;
    searchQuery?: string;
    operatingMode?: "FIXED" | "MOBILE" | "HYBRID";
  }
): StylistMarker[] {
  return markers.filter((marker) => {
    if (options.availableOnly && !marker.isAvailableNow) {
      return false;
    }

    if (options.topRatedOnly && marker.rating < 4.8) {
      return false;
    }

    if (options.minRating && marker.rating < options.minRating) {
      return false;
    }

    if (options.operatingMode && marker.operatingMode !== options.operatingMode) {
      return false;
    }

    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      return (
        marker.name.toLowerCase().includes(query) ||
        marker.specialties.some((s) => s.toLowerCase().includes(query))
      );
    }

    return true;
  });
}
