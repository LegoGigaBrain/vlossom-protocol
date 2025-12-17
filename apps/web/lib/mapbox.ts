/**
 * Mapbox Configuration (V5.0)
 *
 * Handles Mapbox GL JS setup and utilities for the map-first home experience.
 *
 * Reference: docs/vlossom/15-frontend-ux-flows.md
 */

// Mapbox public token - safe to expose in client code
// For production, use environment variable
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Default map settings
export const MAP_DEFAULTS = {
  // Johannesburg, South Africa as default center
  center: { lng: 28.0473, lat: -26.2041 },
  zoom: 12,
  minZoom: 8,
  maxZoom: 18,
  style: "mapbox://styles/mapbox/light-v11", // Clean, minimal style
};

// Map style variants
export const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
};

// Stylist operating mode colors (from Doc 16)
export const STYLIST_MODE_COLORS = {
  FIXED: "#22C55E", // Green - Fixed location
  MOBILE: "#F59E0B", // Amber - Mobile/traveling
  HYBRID: "#3B82F6", // Blue - Both modes
  HOME_CALL: "#EF4444", // Red - Home calls only
};

// Pin sizes
export const PIN_SIZES = {
  default: 40,
  selected: 52,
  cluster: 48,
};

// Animation durations (aligned with brand motion principles)
export const MAP_ANIMATIONS = {
  flyTo: 1500, // ms
  ease: "ease-out",
};

/**
 * Calculate bounds to fit multiple points
 */
export function calculateBounds(
  points: Array<{ lat: number; lng: number }>
): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;

  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;

  points.forEach((point) => {
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
  });

  // Add padding
  const lngPadding = (maxLng - minLng) * 0.1 || 0.01;
  const latPadding = (maxLat - minLat) * 0.1 || 0.01;

  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding],
  ];
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Stylist marker data structure
 */
export interface StylistMarker {
  id: string;
  name: string;
  avatarUrl?: string;
  lat: number;
  lng: number;
  operatingMode: "FIXED" | "MOBILE" | "HYBRID";
  rating: number;
  reviewCount: number;
  specialties: string[];
  isAvailableNow: boolean;
  nextAvailable?: string;
  priceRange?: {
    min: number;
    max: number;
  };
}

/**
 * Salon/Property marker data structure
 */
export interface SalonMarker {
  id: string;
  name: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  chairCount: number;
  availableChairs: number;
  rating: number;
  amenities: string[];
}

/**
 * Cluster data structure
 */
export interface MarkerCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  markers: StylistMarker[];
}
