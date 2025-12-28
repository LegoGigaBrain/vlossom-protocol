/**
 * Location Tracking Hook
 * V5.0: Phase 4 - Consent-based, session-only location tracking
 *
 * Features:
 * - Consent-based location access
 * - Session-only tracking (no persistence)
 * - Automatic cleanup on session end
 * - Battery-efficient tracking intervals
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getAuthToken } from "../lib/auth-client";

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

interface LocationTrackingOptions {
  /** Booking ID to track for */
  bookingId: string;
  /** Tracking interval in milliseconds (default: 30000 = 30s) */
  intervalMs?: number;
  /** Enable high accuracy mode (uses more battery) */
  highAccuracy?: boolean;
  /** Callback when location updates */
  onLocationUpdate?: (location: LocationData) => void;
  /** Callback on tracking error */
  onError?: (error: GeolocationPositionError | Error) => void;
}

interface LocationTrackingState {
  /** Whether tracking is currently active */
  isTracking: boolean;
  /** Whether user has granted location permission */
  hasPermission: boolean | null;
  /** Current location (if tracking) */
  currentLocation: LocationData | null;
  /** Last error (if any) */
  error: string | null;
  /** Whether location is being fetched */
  isLoading: boolean;
}

interface LocationTrackingReturn extends LocationTrackingState {
  /** Request location permission */
  requestPermission: () => Promise<boolean>;
  /** Start tracking location */
  startTracking: () => void;
  /** Stop tracking location */
  stopTracking: () => void;
  /** Get current location once (without continuous tracking) */
  getCurrentLocation: () => Promise<LocationData | null>;
  /** Send location update to server */
  sendLocationUpdate: (location: LocationData) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export function useLocationTracking(
  options: LocationTrackingOptions
): LocationTrackingReturn {
  const { bookingId, intervalMs = 30000, highAccuracy = false, onLocationUpdate, onError } = options;
  const [token, setToken] = useState<string | null>(null);

  // Get token on mount
  useEffect(() => {
    setToken(getAuthToken());
  }, []);

  const [state, setState] = useState<LocationTrackingState>({
    isTracking: false,
    hasPermission: null,
    currentLocation: null,
    error: null,
    isLoading: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if geolocation is supported
  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  /**
   * Request location permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        hasPermission: false,
        error: "Geolocation is not supported by this browser",
      }));
      return false;
    }

    try {
      // Try to get current position - this triggers permission prompt
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      setState((prev) => ({
        ...prev,
        hasPermission: true,
        currentLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        },
        error: null,
      }));

      return true;
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      let errorMessage = "Location permission denied";

      if (geoError.code === 1) {
        errorMessage = "Location permission denied by user";
      } else if (geoError.code === 2) {
        errorMessage = "Location unavailable";
      } else if (geoError.code === 3) {
        errorMessage = "Location request timed out";
      }

      setState((prev) => ({
        ...prev,
        hasPermission: false,
        error: errorMessage,
      }));

      onError?.(geoError);
      return false;
    }
  }, [isSupported, highAccuracy, onError]);

  /**
   * Get current location once
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!isSupported) {
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
            maximumAge: 5000,
          });
        }
      );

      const location: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp),
      };

      setState((prev) => ({
        ...prev,
        currentLocation: location,
        isLoading: false,
        error: null,
      }));

      return location;
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: geoError.message || "Failed to get location",
      }));
      onError?.(geoError);
      return null;
    }
  }, [isSupported, highAccuracy, onError]);

  /**
   * Send location update to server
   */
  const sendLocationUpdate = useCallback(
    async (location: LocationData): Promise<void> => {
      if (!token || !bookingId) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/v1/bookings/${bookingId}/session/progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              lat: location.lat,
              lng: location.lng,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send location update");
        }
      } catch (error) {
        console.error("Error sending location update:", error);
        onError?.(error as Error);
      }
    },
    [token, bookingId, onError]
  );

  /**
   * Start continuous location tracking
   */
  const startTracking = useCallback(() => {
    if (!isSupported || state.isTracking) {
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    // Use watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp),
        };

        setState((prev) => ({
          ...prev,
          currentLocation: location,
          hasPermission: true,
          error: null,
        }));

        onLocationUpdate?.(location);
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error: error.message,
        }));
        onError?.(error);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    // Set up interval for sending updates to server
    intervalRef.current = setInterval(async () => {
      const location = await getCurrentLocation();
      if (location) {
        await sendLocationUpdate(location);
      }
    }, intervalMs);
  }, [
    isSupported,
    state.isTracking,
    highAccuracy,
    intervalMs,
    getCurrentLocation,
    sendLocationUpdate,
    onLocationUpdate,
    onError,
  ]);

  /**
   * Stop location tracking
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Check permission on mount
  useEffect(() => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        hasPermission: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    // Check if permission was already granted
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setState((prev) => ({
            ...prev,
            hasPermission: result.state === "granted",
          }));
        })
        .catch(() => {
          // Permissions API not supported, we'll find out when we request
        });
    }
  }, [isSupported]);

  return {
    ...state,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentLocation,
    sendLocationUpdate,
  };
}

/**
 * Hook to calculate ETA based on location
 */
export function useEtaCalculation(
  currentLocation: LocationData | null,
  destinationLat: number,
  destinationLng: number
): number | null {
  if (!currentLocation) {
    return null;
  }

  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destinationLat - currentLocation.lat);
  const dLng = toRad(destinationLng - currentLocation.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(currentLocation.lat)) *
      Math.cos(toRad(destinationLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Assume average speed of 30 km/h in urban areas
  const etaMinutes = Math.round((distanceKm / 30) * 60);

  return etaMinutes;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
