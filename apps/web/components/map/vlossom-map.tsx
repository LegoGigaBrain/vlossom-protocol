/**
 * Vlossom Map Component (V8.0)
 *
 * Uber-style map experience using Google Maps with:
 * - Muted aesthetic theme (brand-tinted)
 * - Botanical pin markers (🪴 Salon, 🌺 Fixed, 🌼 Mobile)
 * - User location tracking
 * - Smooth animations
 * - Dark mode support
 *
 * Usage:
 * ```tsx
 * <VlossomMap
 *   stylists={stylists}
 *   salons={salons}
 *   onStylistSelect={(stylist) => ...}
 * />
 * ```
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  VlossomPinSalon,
  VlossomPinFixed,
  VlossomPinMobile,
  VlossomPinLocation,
} from "@/components/ui/vlossom-icons";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons";
import { vlossomMapStyleLight, vlossomMapStyleDark, vlossomMapOptions } from "@vlossom/config/map-styles";
import { StylistMarker, SalonMarker, MAP_DEFAULTS, formatDistance, calculateDistance } from "@/lib/mapbox";

// Google Maps type augmentation
declare global {
  interface Window {
    google: typeof google;
  }
}

interface VlossomMapProps {
  /** List of stylists to display */
  stylists: StylistMarker[];
  /** List of salons to display */
  salons?: SalonMarker[];
  /** Currently selected stylist ID */
  selectedStylistId?: string | null;
  /** Callback when stylist is selected */
  onStylistSelect?: (stylist: StylistMarker) => void;
  /** Callback when salon is selected */
  onSalonSelect?: (salon: SalonMarker) => void;
  /** User's current location */
  userLocation?: { lat: number; lng: number } | null;
  /** Custom class name */
  className?: string;
  /** Center override */
  center?: { lat: number; lng: number };
  /** Zoom override */
  zoom?: number;
  /** Show loading state */
  isLoading?: boolean;
}

/**
 * Main Vlossom Map Component
 */
export function VlossomMap({
  stylists,
  salons = [],
  selectedStylistId,
  onStylistSelect,
  onSalonSelect,
  userLocation,
  className,
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  isLoading = false,
}: VlossomMapProps) {
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get the appropriate map style based on theme
  const mapStyle = useMemo(() => {
    return resolvedTheme === "dark" ? vlossomMapStyleDark : vlossomMapStyleLight;
  }, [resolvedTheme]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if Google Maps is loaded
    if (!window.google?.maps) {
      setMapError("Google Maps not loaded. Please add your API key.");
      return;
    }

    const initMap = async () => {
      try {
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");

        const map = new Map(mapContainerRef.current!, {
          ...vlossomMapOptions,
          center: { lat: center.lat, lng: center.lng },
          zoom,
          styles: mapStyle,
          mapId: "VLOSSOM_MAP_ID", // Required for AdvancedMarkerElement
        });

        mapInstanceRef.current = map;
        setIsMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error("Failed to initialize Google Maps:", error);
        setMapError("Failed to load map. Please check your connection.");
      }
    };

    initMap();

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, [center.lat, center.lng, zoom, mapStyle]);

  // Update map style when theme changes
  useEffect(() => {
    if (mapInstanceRef.current && isMapLoaded) {
      mapInstanceRef.current.setOptions({ styles: mapStyle });
    }
  }, [mapStyle, isMapLoaded]);

  // Create botanical marker element
  const createMarkerElement = useCallback(
    (type: "salon" | "fixed" | "mobile" | "user", status?: "available" | "busy" | "offline") => {
      const container = document.createElement("div");
      container.className = "vlossom-marker";

      // Render SVG based on type
      if (type === "salon") {
        container.innerHTML = `
          <div class="text-primary dark:text-primary-light cursor-pointer hover:scale-110 transition-transform">
            ${renderPinSalon(status)}
          </div>
        `;
      } else if (type === "fixed") {
        container.innerHTML = `
          <div class="text-primary dark:text-primary-light cursor-pointer hover:scale-110 transition-transform">
            ${renderPinFixed(status)}
          </div>
        `;
      } else if (type === "mobile") {
        container.innerHTML = `
          <div class="text-primary dark:text-primary-light cursor-pointer hover:scale-110 transition-transform animate-breathe">
            ${renderPinMobile(status)}
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="text-accent-orange">
            ${renderPinLocation()}
          </div>
        `;
      }

      return container;
    },
    []
  );

  // Add/update markers when stylists change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];

    // Add stylist markers
    stylists.forEach((stylist) => {
      const markerType = stylist.operatingMode === "FIXED" ? "fixed" :
                         stylist.operatingMode === "MOBILE" ? "mobile" : "fixed";
      const status = stylist.isAvailableNow ? "available" : "busy";

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: stylist.lat, lng: stylist.lng },
        content: createMarkerElement(markerType, status),
        title: stylist.name,
      });

      marker.addListener("click", () => {
        onStylistSelect?.(stylist);
      });

      markersRef.current.push(marker);
    });

    // Add salon markers
    salons.forEach((salon) => {
      const status = salon.availableChairs > 0 ? "available" : "busy";

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: salon.lat, lng: salon.lng },
        content: createMarkerElement("salon", status),
        title: salon.name,
      });

      marker.addListener("click", () => {
        onSalonSelect?.(salon);
      });

      markersRef.current.push(marker);
    });
  }, [stylists, salons, isMapLoaded, createMarkerElement, onStylistSelect, onSalonSelect]);

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.position = { lat: userLocation.lat, lng: userLocation.lng };
    } else {
      userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        content: createMarkerElement("user"),
        title: "Your location",
      });
    }
  }, [userLocation, isMapLoaded, createMarkerElement]);

  // Handle locate me
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapInstanceRef.current?.panTo(newCenter);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || zoom;
      mapInstanceRef.current.setZoom(Math.min(currentZoom + 1, MAP_DEFAULTS.maxZoom));
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || zoom;
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, MAP_DEFAULTS.minZoom));
    }
  }, [zoom]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("relative w-full h-full bg-background-tertiary", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div className={cn("relative w-full h-full bg-background-tertiary", className)}>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <VlossomPinLocation size={48} className="mx-auto text-text-tertiary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Map Unavailable
              </h3>
              <p className="text-text-secondary text-sm">{mapError}</p>
            </div>
            <FallbackMapView
              stylists={stylists}
              salons={salons}
              onStylistSelect={onStylistSelect}
              onSalonSelect={onSalonSelect}
              userLocation={userLocation}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {/* Locate Me */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLocate}
          disabled={isLocating}
          className="w-10 h-10 p-0 bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-md"
          aria-label="Find my location"
        >
          <Icon name="location" size="md" className={cn(isLocating && "animate-pulse")} />
        </Button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-lg shadow-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="w-10 h-10 p-0 rounded-none border-b border-border-subtle"
            aria-label="Zoom in"
          >
            <Icon name="add" size="md" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="w-10 h-10 p-0 rounded-none"
            aria-label="Zoom out"
          >
            <span className="text-lg font-medium">−</span>
          </Button>
        </div>
      </div>

      {/* Stylist Count Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-full px-3 py-1.5 shadow-md">
          <p className="text-sm font-medium text-text-primary">
            {stylists.length} stylist{stylists.length !== 1 ? "s" : ""} nearby
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-surface-elevated-light/90 dark:bg-surface-elevated-dark/90 backdrop-blur-sm rounded-lg p-3 shadow-md z-10">
        <p className="text-xs font-medium text-text-primary mb-2">Map Legend</p>
        <div className="space-y-1.5">
          <MapLegendItem icon="🪴" label="Salon" />
          <MapLegendItem icon="🌺" label="Fixed Stylist" />
          <MapLegendItem icon="🌼" label="Mobile Stylist" />
        </div>
      </div>
    </div>
  );
}

// Legend item component
function MapLegendItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

// Fallback list view when map is unavailable
function FallbackMapView({
  stylists,
  salons,
  onStylistSelect,
  onSalonSelect,
  userLocation,
}: {
  stylists: StylistMarker[];
  salons?: SalonMarker[];
  onStylistSelect?: (stylist: StylistMarker) => void;
  onSalonSelect?: (salon: SalonMarker) => void;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const sortedStylists = useMemo(() => {
    if (!userLocation) return stylists;
    return [...stylists].sort((a, b) => {
      const distA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
      const distB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
      return distA - distB;
    });
  }, [stylists, userLocation]);

  return (
    <div className="mt-4 max-h-64 overflow-y-auto">
      <ul className="space-y-2">
        {sortedStylists.slice(0, 5).map((stylist) => {
          const distance = userLocation
            ? formatDistance(calculateDistance(userLocation, { lat: stylist.lat, lng: stylist.lng }))
            : null;

          return (
            <li key={stylist.id}>
              <button
                onClick={() => onStylistSelect?.(stylist)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface-light hover:bg-surface-dark transition-colors text-left"
              >
                <span>{stylist.operatingMode === "MOBILE" ? "🌼" : "🌺"}</span>
                <span className="flex-1 text-sm font-medium truncate">{stylist.name}</span>
                {distance && <span className="text-xs text-text-muted">{distance}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// SVG render helpers for markers
function renderPinSalon(status?: "available" | "busy" | "offline") {
  const color = status === "available" ? "#22C55E" : status === "busy" ? "#F59E0B" : "#6B7280";
  return `<svg viewBox="0 0 32 40" width="32" height="40" fill="none" stroke="${color}" stroke-width="1.5"><path d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z" fill="${color}25"/><circle cx="16" cy="13" r="1.5" fill="${color}"/></svg>`;
}

function renderPinFixed(status?: "available" | "busy" | "offline") {
  const color = status === "available" ? "#22C55E" : status === "busy" ? "#F59E0B" : "#6B7280";
  return `<svg viewBox="0 0 32 40" width="32" height="40" fill="none" stroke="${color}" stroke-width="1.5"><path d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z" fill="${color}25"/><circle cx="16" cy="13" r="2.5" fill="${color}"/></svg>`;
}

function renderPinMobile(status?: "available" | "busy" | "offline") {
  const color = status === "available" ? "#22C55E" : status === "busy" ? "#F59E0B" : "#6B7280";
  return `<svg viewBox="0 0 32 40" width="32" height="40" fill="none" stroke="${color}" stroke-width="1.5"><path d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z" fill="${color}25"/><circle cx="16" cy="13" r="3.5" fill="${color}"/></svg>`;
}

function renderPinLocation() {
  return `<svg viewBox="0 0 32 40" width="24" height="30" fill="none" stroke="#FF510D" stroke-width="1.5"><path d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z" fill="#FF510D25"/><circle cx="16" cy="12" r="4" fill="#FF510D"/></svg>`;
}

export default VlossomMap;
