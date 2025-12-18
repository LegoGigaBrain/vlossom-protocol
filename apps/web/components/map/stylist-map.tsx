/**
 * Stylist Map - Full-Screen Map Component (V6.5)
 *
 * Main map component for discovering stylists and salons.
 * Features:
 * - Google Maps integration with custom Uber-style dark theme
 * - Vlossom brand colors for roads and highlights
 * - List view fallback for accessibility
 * - Empty state handling
 * - Low-end device optimizations (reduced motion, lazy loading)
 * - Keyboard navigation support
 * - User preference persistence
 *
 * How Uber achieves their custom map look:
 * 1. Google Maps Styling API with JSON configuration
 * 2. Custom feature colors (roads, water, land, etc.)
 * 3. Hiding unnecessary POIs and labels
 * 4. High contrast for roads against dark background
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { cn } from "../../lib/utils";
import {
  MAP_DEFAULTS,
  STYLIST_MODE_COLORS,
  type StylistMarker,
  type SalonMarker,
  formatDistance,
  calculateDistance,
} from "../../lib/mapbox";
import {
  MapPin,
  Locate,
  List,
  Map as MapIcon,
  MapPinOff,
  Star,
  Layers,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../ui/button";

// View modes for accessibility and performance
type ViewMode = "map" | "list";
type MapTheme = "dark" | "light";

// Storage keys for user preferences
const VIEW_PREFERENCE_KEY = "vlossom-map-view-preference";
const THEME_PREFERENCE_KEY = "vlossom-map-theme-preference";

/**
 * Custom Vlossom Map Styles - Uber-inspired dark theme with brand purple
 *
 * Vlossom uses brand purple (#311E6B) as the accent color on a dark base.
 * Reference: https://mapstyle.withgoogle.com/ for creating custom styles
 * Inspired by: https://snazzymaps.com/style/45212/uber-blue-map
 */
const vlossomDarkMapStyle: google.maps.MapTypeStyle[] = [
  // Hide all labels by default for cleaner look
  { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] },
  // White text on dark backgrounds where labels are needed
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { lightness: 13 }] },
  // Administrative (borders)
  { featureType: "administrative", elementType: "geometry.fill", stylers: [{ color: "#000000" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#311E6B" }, { lightness: 14 }, { weight: 1.4 }] },
  // Landscape - dark background
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#0f171c" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#0f0f1a" }] },
  // Hide points of interest
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 5 }, { visibility: "off" }] },
  // Highways - Vlossom purple highlight
  { featureType: "road.highway", elementType: "all", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ADA5C4" }, { visibility: "on" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#311E6B" }, { lightness: 25 }, { visibility: "off" }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Arterial roads - lighter purple
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#6B5B95" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#311E6B" }, { lightness: 16 }, { visibility: "off" }] },
  // Local roads - dark
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.local", elementType: "geometry.stroke", stylers: [{ visibility: "simplified" }] },
  // Transit - hidden
  { featureType: "transit", elementType: "all", stylers: [{ color: "#311E6B" }, { visibility: "off" }] },
  { featureType: "transit.line", elementType: "all", stylers: [{ visibility: "off" }] },
  // Water - deep dark blue-purple
  { featureType: "water", elementType: "all", stylers: [{ color: "#021019" }] },
];

// Light mode alternative - clean minimal look with brand colors
const vlossomLightMapStyle: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Subtle brand color on water
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#d4e4f7" }] },
  // Subtle brand color on parks
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#e8f0e3" }] },
  // Light cream for landscape
  { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f9f6f1" }] },
  // Purple-tinted roads
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#ADA5C4" }, { weight: 1 }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#EFE3D0" }, { weight: 0.5 }] },
];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

/**
 * Hook to detect if user prefers reduced motion
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

/**
 * Hook to detect low-end device (memory < 4GB or slow connection)
 */
function useIsLowEndDevice(): boolean {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    // Check device memory (Chrome/Edge only)
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
    const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory < 4;

    // Check connection speed
    const slowConnection = nav.connection?.effectiveType === "slow-2g" ||
                          nav.connection?.effectiveType === "2g";

    setIsLowEnd(lowMemory || slowConnection);
  }, []);

  return isLowEnd;
}

/**
 * Hook to persist and retrieve user's view preference
 */
function useViewPreference(defaultView: ViewMode): [ViewMode, (view: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultView);

  useEffect(() => {
    const stored = localStorage.getItem(VIEW_PREFERENCE_KEY);
    if (stored === "map" || stored === "list") {
      setViewModeState(stored);
    }
  }, []);

  const setViewMode = useCallback((view: ViewMode) => {
    setViewModeState(view);
    localStorage.setItem(VIEW_PREFERENCE_KEY, view);
  }, []);

  return [viewMode, setViewMode];
}

/**
 * Hook to persist and retrieve user's map theme preference
 */
function useMapTheme(): [MapTheme, (theme: MapTheme) => void] {
  const [theme, setThemeState] = useState<MapTheme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
    }
  }, []);

  const setTheme = useCallback((newTheme: MapTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_PREFERENCE_KEY, newTheme);
  }, []);

  return [theme, setTheme];
}

interface StylistMapProps {
  stylists: StylistMarker[];
  salons?: SalonMarker[];
  selectedStylistId?: string | null;
  onStylistSelect?: (stylist: StylistMarker) => void;
  onSalonSelect?: (salon: SalonMarker) => void;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  /** Initial view mode (default: map) */
  defaultView?: ViewMode;
  /** Whether map is currently loading */
  isLoading?: boolean;
}

export function StylistMap({
  stylists,
  salons = [],
  selectedStylistId,
  onStylistSelect,
  onSalonSelect,
  userLocation,
  className,
  defaultView = "map",
  isLoading = false,
}: StylistMapProps) {
  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Performance & accessibility hooks
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLowEndDevice = useIsLowEndDevice();

  // Use list view by default on low-end devices for better performance
  const effectiveDefaultView = isLowEndDevice ? "list" : defaultView;
  const [viewMode, setViewMode] = useViewPreference(effectiveDefaultView);
  const [mapTheme, setMapTheme] = useMapTheme();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(userLocation || MAP_DEFAULTS.center);
  const [showSalons, setShowSalons] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<StylistMarker | null>(null);

  // Ref for keyboard navigation
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Update center when user location changes
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);

  // Sort stylists by distance if user location is available
  const sortedStylists = useMemo(() => {
    if (!userLocation) return stylists;
    return [...stylists].sort((a, b) => {
      const distA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
      const distB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
      return distA - distB;
    });
  }, [stylists, userLocation]);

  // Handle user location request
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
        setCenter(newCenter);
        if (map) {
          map.panTo(newCenter);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [map]);

  // Toggle view mode (persists preference)
  const toggleViewMode = () => setViewMode(viewMode === "map" ? "list" : "map");

  // Toggle map theme
  const toggleMapTheme = () => setMapTheme(mapTheme === "dark" ? "light" : "dark");

  // Map callbacks
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Get marker icon based on stylist mode
  const getMarkerIcon = (operatingMode: string, isSelected: boolean) => {
    const color = STYLIST_MODE_COLORS[operatingMode as keyof typeof STYLIST_MODE_COLORS] || STYLIST_MODE_COLORS.FIXED;
    const scale = isSelected ? 1.3 : 1;

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: mapTheme === "dark" ? "#ffffff" : "#311E6B",
      strokeWeight: 2,
      scale: 12 * scale,
    };
  };

  // Get current map styles based on theme
  const currentMapStyles = mapTheme === "dark" ? vlossomDarkMapStyle : vlossomLightMapStyle;

  // Empty state check
  const isEmpty = stylists.length === 0 && salons.length === 0;

  // Loading state (either component loading or Google Maps loading)
  if (isLoading || !isLoaded) {
    return (
      <div
        className={cn("relative w-full h-full bg-background-tertiary", className)}
        role="status"
        aria-label="Loading map"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-brand-rose/20 border-t-brand-rose rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">
              {isLoading ? "Finding stylists near you..." : "Loading map..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div
        className={cn("relative w-full h-full bg-background-tertiary", className)}
        role="alert"
        aria-label="Map error"
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <MapPinOff className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Map unavailable
              </h3>
              <p className="text-text-secondary text-sm">
                We couldn't load the map. Please try again later or use the list view.
              </p>
            </div>
            <Button onClick={toggleViewMode} className="mx-auto">
              <List className="w-4 h-4 mr-2" />
              Switch to list view
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div
        className={cn("relative w-full h-full bg-background-tertiary", className)}
        role="region"
        aria-label="No stylists found"
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 mx-auto bg-background-secondary rounded-full flex items-center justify-center">
              <MapPinOff className="w-8 h-8 text-text-tertiary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                No stylists nearby
              </h3>
              <p className="text-text-secondary text-sm">
                We couldn't find any stylists in this area. Try expanding your search
                or enabling location services.
              </p>
            </div>
            <Button
              onClick={handleLocate}
              disabled={isLocating}
              className="mx-auto"
              aria-label="Enable location to find stylists"
            >
              <Locate className={cn("w-4 h-4 mr-2", isLocating && "animate-pulse")} />
              {isLocating ? "Finding location..." : "Use my location"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={cn(
        "relative w-full h-full bg-background-tertiary",
        prefersReducedMotion && "[&_*]:!transition-none [&_*]:!animate-none",
        className
      )}
      role="region"
      aria-label={`Stylist map showing ${stylists.length} stylists.`}
    >
      {/* Low-end device indicator (dev only) */}
      {process.env.NODE_ENV === "development" && isLowEndDevice && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-b z-50">
          Low-end mode
        </div>
      )}

      {/* View Toggle - Map/List */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <div className="bg-background-primary rounded-full px-3 py-1.5 shadow-md">
          <p className="text-sm font-medium text-text-primary">
            {stylists.length} stylist{stylists.length !== 1 ? "s" : ""} nearby
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="w-10 h-10 p-0 bg-background-primary shadow-md"
          aria-label={viewMode === "map" ? "Switch to list view" : "Switch to map view"}
          aria-pressed={viewMode === "list"}
        >
          {viewMode === "map" ? <List className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
        </Button>
      </div>

      {/* List View */}
      {viewMode === "list" ? (
        <div className="absolute inset-0 overflow-y-auto pt-16 pb-4 px-4">
          <ul className="space-y-3" role="list" aria-label="Nearby stylists">
            {sortedStylists.map((stylist) => (
              <li key={stylist.id}>
                <StylistListItem
                  stylist={stylist}
                  userLocation={userLocation}
                  isSelected={selectedStylistId === stylist.id}
                  onClick={() => onStylistSelect?.(stylist)}
                />
              </li>
            ))}
            {showSalons && salons.map((salon) => (
              <li key={salon.id}>
                <SalonListItem
                  salon={salon}
                  userLocation={userLocation}
                  onClick={() => onSalonSelect?.(salon)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Google Maps View */
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={MAP_DEFAULTS.zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            styles: currentMapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
              position: typeof google !== "undefined" ? google.maps.ControlPosition.RIGHT_TOP : 3,
            },
            gestureHandling: "greedy",
          }}
        >
          {/* User location marker */}
          {userLocation && (
            <MarkerF
              position={userLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                scale: 8,
              }}
              title="Your location"
            />
          )}

          {/* Stylist markers */}
          {sortedStylists.map((stylist) => (
            <MarkerF
              key={stylist.id}
              position={{ lat: stylist.lat, lng: stylist.lng }}
              icon={getMarkerIcon(stylist.operatingMode, selectedStylistId === stylist.id)}
              onClick={() => {
                setSelectedMarker(stylist);
                onStylistSelect?.(stylist);
              }}
              title={stylist.name}
            />
          ))}

          {/* Salon markers */}
          {showSalons && salons.map((salon) => (
            <MarkerF
              key={salon.id}
              position={{ lat: salon.lat, lng: salon.lng }}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: "#E91E63",
                fillOpacity: 1,
                strokeColor: mapTheme === "dark" ? "#ffffff" : "#311E6B",
                strokeWeight: 2,
                scale: 6,
              }}
              onClick={() => onSalonSelect?.(salon)}
              title={salon.name}
            />
          ))}

          {/* Info window for selected stylist */}
          {selectedMarker && (
            <InfoWindowF
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  {selectedMarker.avatarUrl ? (
                    <img
                      src={selectedMarker.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {selectedMarker.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedMarker.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedMarker.operatingMode === "FIXED" ? "Fixed Location" :
                       selectedMarker.operatingMode === "MOBILE" ? "Mobile" : "Hybrid"}
                    </p>
                  </div>
                </div>
                {selectedMarker.rating && (
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{selectedMarker.rating.toFixed(1)}</span>
                  </div>
                )}
                {selectedMarker.specialties && selectedMarker.specialties.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {selectedMarker.specialties.slice(0, 3).join(" • ")}
                  </p>
                )}
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      )}

      {/* Map Controls (only show in map view) */}
      {viewMode === "map" && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-30" style={{ marginTop: "60px" }}>
          {/* Locate Me */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocate}
            disabled={isLocating}
            className="w-10 h-10 p-0 bg-background-primary shadow-md"
            aria-label="Find my location"
          >
            <Locate className={cn("w-5 h-5", isLocating && "animate-pulse")} aria-hidden="true" />
          </Button>

          {/* Theme Toggle (Dark/Light) */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMapTheme}
            className="w-10 h-10 p-0 bg-background-primary shadow-md"
            aria-label={mapTheme === "dark" ? "Switch to light map" : "Switch to dark map"}
          >
            {mapTheme === "dark" ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </Button>

          {/* Layer Toggle */}
          <Button
            variant={showSalons ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowSalons(!showSalons)}
            className="w-10 h-10 p-0 shadow-md"
            aria-label={showSalons ? "Hide salons" : "Show salons"}
            aria-pressed={showSalons}
          >
            <Layers className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Legend (only show in map view) */}
      {viewMode === "map" && (
        <div
          className={cn(
            "absolute bottom-4 left-4 backdrop-blur-sm rounded-lg p-3 shadow-md z-30",
            mapTheme === "dark" ? "bg-gray-900/90 text-white" : "bg-background-primary/90"
          )}
          role="region"
          aria-label="Map legend"
        >
          <p className={cn(
            "text-xs font-medium mb-2",
            mapTheme === "dark" ? "text-white" : "text-text-primary"
          )}>Stylist Type</p>
          <div className="space-y-1.5">
            <LegendItem color={STYLIST_MODE_COLORS.FIXED} label="Fixed Location" isDark={mapTheme === "dark"} />
            <LegendItem color={STYLIST_MODE_COLORS.MOBILE} label="Mobile" isDark={mapTheme === "dark"} />
            <LegendItem color={STYLIST_MODE_COLORS.HYBRID} label="Both" isDark={mapTheme === "dark"} />
          </div>
        </div>
      )}
    </div>
  );
}

// Legend Item Component
function LegendItem({ color, label, isDark }: { color: string; label: string; isDark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className={cn("text-xs", isDark ? "text-gray-300" : "text-text-secondary")}>{label}</span>
    </div>
  );
}

// List View Components for accessibility fallback
interface StylistListItemProps {
  stylist: StylistMarker;
  userLocation?: { lat: number; lng: number } | null;
  isSelected?: boolean;
  onClick?: () => void;
}

function StylistListItem({
  stylist,
  userLocation,
  isSelected,
  onClick,
}: StylistListItemProps) {
  const distance = userLocation
    ? formatDistance(calculateDistance(userLocation, { lat: stylist.lat, lng: stylist.lng }))
    : null;

  const modeColor = STYLIST_MODE_COLORS[stylist.operatingMode];
  const modeLabel = stylist.operatingMode === "FIXED" ? "Fixed" :
                    stylist.operatingMode === "MOBILE" ? "Mobile" : "Hybrid";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
        "bg-background-primary hover:bg-background-secondary",
        "focus:outline-none focus:ring-2 focus:ring-brand-rose/50",
        isSelected && "ring-2 ring-brand-rose"
      )}
      aria-label={`${stylist.name}, ${modeLabel} stylist${distance ? `, ${distance} away` : ""}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {stylist.avatarUrl ? (
          <img
            src={stylist.avatarUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center">
            <span className="text-lg font-semibold text-text-secondary">
              {stylist.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Mode indicator */}
        <span
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background-primary"
          style={{ backgroundColor: modeColor }}
          aria-hidden="true"
        />
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text-primary truncate">
            {stylist.name}
          </p>
          {stylist.rating && (
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span className="text-xs font-medium">{stylist.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-text-secondary truncate">
          {modeLabel} • {stylist.specialties?.slice(0, 2).join(", ") || "Hair Stylist"}
        </p>
      </div>

      {/* Distance */}
      {distance && (
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-medium text-text-primary">{distance}</p>
          <p className="text-xs text-text-secondary">away</p>
        </div>
      )}
    </button>
  );
}

interface SalonListItemProps {
  salon: SalonMarker;
  userLocation?: { lat: number; lng: number } | null;
  onClick?: () => void;
}

function SalonListItem({
  salon,
  userLocation,
  onClick,
}: SalonListItemProps) {
  const distance = userLocation
    ? formatDistance(calculateDistance(userLocation, { lat: salon.lat, lng: salon.lng }))
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
        "bg-background-primary hover:bg-background-secondary border border-brand-rose/20",
        "focus:outline-none focus:ring-2 focus:ring-brand-rose/50"
      )}
      aria-label={`${salon.name} salon${distance ? `, ${distance} away` : ""}`}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-brand-rose/10 flex items-center justify-center flex-shrink-0">
        <MapPin className="w-6 h-6 text-brand-rose" aria-hidden="true" />
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text-primary truncate">
            {salon.name}
          </p>
          {salon.rating && (
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span className="text-xs font-medium">{salon.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Salon • {salon.chairCount} chair{salon.chairCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Distance */}
      {distance && (
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-medium text-text-primary">{distance}</p>
          <p className="text-xs text-text-secondary">away</p>
        </div>
      )}
    </button>
  );
}
