/**
 * Travel Time Service (F4.2)
 * Calculates travel time between locations using Google Distance Matrix API
 * with in-memory caching and Haversine fallback
 *
 * M-5: Uses circuit breaker pattern to gracefully handle Google API failures
 */

import logger from "../logger";
import { googleMapsCircuitBreaker } from "../circuit-breaker";

// Types
export interface TravelTimeResult {
  travelTimeMinutes: number;
  distanceKm: number;
  cached: boolean;
  source: "google" | "haversine";
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Cache configuration
interface CacheEntry {
  result: TravelTimeResult;
  expiresAt: number;
}

// In-memory cache (Map with TTL)
const travelTimeCache = new Map<string, CacheEntry>();

// Configuration
const config = {
  googleApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  defaultTravelBufferMin: parseInt(process.env.DEFAULT_TRAVEL_BUFFER_MIN || "30", 10),
  cacheTtlMin: parseInt(process.env.TRAVEL_CACHE_TTL_MIN || "60", 10),
  // Average driving speed for Haversine fallback (km/h)
  averageSpeedKmH: 40,
  // Maximum cache size to prevent memory bloat
  maxCacheSize: 1000,
};

/**
 * Generate cache key from origin/destination coordinates
 * Rounds to 3 decimal places (~100m accuracy) for better cache hits
 */
function getCacheKey(origin: Coordinates, destination: Coordinates): string {
  const roundedOrigin = {
    lat: Math.round(origin.lat * 1000) / 1000,
    lng: Math.round(origin.lng * 1000) / 1000,
  };
  const roundedDest = {
    lat: Math.round(destination.lat * 1000) / 1000,
    lng: Math.round(destination.lng * 1000) / 1000,
  };
  return `${roundedOrigin.lat},${roundedOrigin.lng}:${roundedDest.lat},${roundedDest.lng}`;
}

/**
 * Calculate distance using Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(origin: Coordinates, destination: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time using Haversine distance
 * Adds 20% buffer for real-world driving conditions
 */
function estimateTravelTimeFromDistance(distanceKm: number): number {
  const baseTime = (distanceKm / config.averageSpeedKmH) * 60; // minutes
  const bufferedTime = baseTime * 1.2; // Add 20% buffer
  return Math.ceil(bufferedTime);
}

/**
 * Fetch travel time from Google Distance Matrix API
 * M-5: Wrapped with circuit breaker for graceful degradation
 */
async function fetchGoogleTravelTime(
  origin: Coordinates,
  destination: Coordinates
): Promise<TravelTimeResult | null> {
  if (!config.googleApiKey) {
    logger.debug("Google Maps API key not configured, skipping Google API call");
    return null;
  }

  // M-5: Check circuit breaker state before making request
  if (!googleMapsCircuitBreaker.isCallAllowed()) {
    logger.debug("Google Maps circuit breaker is OPEN, skipping API call");
    return null;
  }

  // M-5: Execute API call with circuit breaker protection
  return googleMapsCircuitBreaker.execute(
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", `${origin.lat},${origin.lng}`);
      url.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
      url.searchParams.set("mode", "driving");
      url.searchParams.set("key", config.googleApiKey);
      // Request traffic-aware routing during peak hours
      const hour = new Date().getHours();
      if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
        url.searchParams.set("departure_time", "now");
        url.searchParams.set("traffic_model", "pessimistic");
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        // Throw to trigger circuit breaker failure tracking
        throw new Error(`Google Distance Matrix API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK") {
        // API-level errors should trigger circuit breaker
        throw new Error(`Google Distance Matrix API returned status: ${data.status}`);
      }

      const element = data.rows?.[0]?.elements?.[0];
      if (!element || element.status !== "OK") {
        // Route not found is not a circuit breaker failure (just no result)
        logger.warn(`Google Distance Matrix element status: ${element?.status}`);
        return null;
      }

      // duration_in_traffic is returned when departure_time is set
      const durationSeconds = element.duration_in_traffic?.value || element.duration?.value;
      const distanceMeters = element.distance?.value;

      if (!durationSeconds || !distanceMeters) {
        logger.warn("Google Distance Matrix missing duration or distance");
        return null;
      }

      return {
        travelTimeMinutes: Math.ceil(durationSeconds / 60),
        distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
        cached: false,
        source: "google",
      } as TravelTimeResult;
    },
    // M-5: Fallback returns null, which triggers Haversine calculation
    () => {
      logger.debug("Google Maps API call failed, falling back to Haversine");
      return null;
    }
  );
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, entry] of travelTimeCache.entries()) {
    if (entry.expiresAt < now) {
      travelTimeCache.delete(key);
      deletedCount++;
    }
  }

  // If cache is still too large, remove oldest entries
  if (travelTimeCache.size > config.maxCacheSize) {
    const entries = Array.from(travelTimeCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toDelete = entries.slice(0, entries.length - config.maxCacheSize);
    toDelete.forEach(([key]) => travelTimeCache.delete(key));
    deletedCount += toDelete.length;
  }

  if (deletedCount > 0) {
    logger.debug(`Cleaned up ${deletedCount} cache entries`);
  }
}

/**
 * Get travel time between two coordinates
 * Uses cache → Google API → Haversine fallback
 */
export async function getTravelTime(
  origin: Coordinates,
  destination: Coordinates
): Promise<TravelTimeResult> {
  const cacheKey = getCacheKey(origin, destination);

  // Check cache first
  const cached = travelTimeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cached: true };
  }

  // Try Google API
  const googleResult = await fetchGoogleTravelTime(origin, destination);

  if (googleResult) {
    // Store in cache
    travelTimeCache.set(cacheKey, {
      result: googleResult,
      expiresAt: Date.now() + config.cacheTtlMin * 60 * 1000,
    });

    // Cleanup old entries periodically
    if (travelTimeCache.size > config.maxCacheSize * 0.8) {
      cleanupCache();
    }

    return googleResult;
  }

  // Fallback to Haversine
  const distanceKm = calculateHaversineDistance(origin, destination);
  const travelTimeMinutes = estimateTravelTimeFromDistance(distanceKm);

  const haversineResult: TravelTimeResult = {
    travelTimeMinutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
    cached: false,
    source: "haversine",
  };

  // Cache Haversine results too (shorter TTL)
  travelTimeCache.set(cacheKey, {
    result: haversineResult,
    expiresAt: Date.now() + (config.cacheTtlMin / 2) * 60 * 1000,
  });

  return haversineResult;
}

/**
 * Get default travel buffer time (minutes)
 */
export function getDefaultTravelBuffer(): number {
  return config.defaultTravelBufferMin;
}

/**
 * Calculate required buffer time for a mobile stylist
 * Based on travel time + default buffer
 */
export async function calculateTravelBuffer(
  stylistLocation: Coordinates,
  customerLocation: Coordinates
): Promise<number> {
  const travelTime = await getTravelTime(stylistLocation, customerLocation);
  // Add default buffer on top of travel time for parking, setup, etc.
  return travelTime.travelTimeMinutes + config.defaultTravelBufferMin;
}

/**
 * Clear the travel time cache (for testing)
 */
export function clearTravelTimeCache(): void {
  travelTimeCache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: travelTimeCache.size,
    maxSize: config.maxCacheSize,
  };
}

/**
 * Get Google Maps circuit breaker status (M-5: for monitoring)
 */
export function getCircuitBreakerStats() {
  return googleMapsCircuitBreaker.getStats();
}
