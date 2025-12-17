/**
 * Stylist Map - Full-Screen Map Component (V5.2)
 *
 * Main map component for discovering stylists and salons.
 * Features:
 * - Static tile rendering for performance
 * - List view fallback for accessibility
 * - Clustering for dense areas
 * - Empty state handling
 * - Low-end device optimizations (reduced motion, lazy loading)
 * - Keyboard navigation support
 * - User preference persistence
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import {
  MAP_DEFAULTS,
  STYLIST_MODE_COLORS,
  type StylistMarker,
  type SalonMarker,
  formatDistance,
  calculateDistance,
} from "../../lib/mapbox";
import { StylistPin, SalonPin, ClusterPin, UserPin } from "./stylist-pin";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
  Locate,
  List,
  Map as MapIcon,
  MapPinOff,
  Star,
  Settings2,
} from "lucide-react";
import { Button } from "../ui/button";

// View modes for accessibility and performance
type ViewMode = "map" | "list";

// Storage key for user view preference
const VIEW_PREFERENCE_KEY = "vlossom-map-view-preference";

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
  // Performance & accessibility hooks
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLowEndDevice = useIsLowEndDevice();

  // Use list view by default on low-end devices for better performance
  const effectiveDefaultView = isLowEndDevice ? "list" : defaultView;
  const [viewMode, setViewMode] = useViewPreference(effectiveDefaultView);

  const [zoom, setZoom] = useState(MAP_DEFAULTS.zoom);
  const [center, setCenter] = useState(MAP_DEFAULTS.center);
  const [showSalons, setShowSalons] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // Ref for keyboard navigation
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [focusedPinIndex, setFocusedPinIndex] = useState(-1);

  // Sort stylists by distance if user location is available
  const sortedStylists = useMemo(() => {
    if (!userLocation) return stylists;
    return [...stylists].sort((a, b) => {
      const distA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
      const distB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
      return distA - distB;
    });
  }, [stylists, userLocation]);

  // Cluster nearby stylists for better performance
  const { displayedStylists, clusters } = useMemo(() => {
    if (zoom >= 14 || stylists.length <= 10) {
      // Show all pins at high zoom or with few stylists
      return { displayedStylists: sortedStylists.slice(0, 20), clusters: [] };
    }

    // Simple clustering: group by grid cells
    const clusterMap: Map<string, StylistMarker[]> = new Map();
    const gridSize = 0.01 * (18 - zoom); // Larger cells at lower zoom

    sortedStylists.forEach((stylist) => {
      const cellX = Math.floor(stylist.lng / gridSize);
      const cellY = Math.floor(stylist.lat / gridSize);
      const key = `${cellX},${cellY}`;

      if (!clusterMap.has(key)) {
        clusterMap.set(key, []);
      }
      clusterMap.get(key)!.push(stylist);
    });

    const displayed: StylistMarker[] = [];
    const clustered: { lat: number; lng: number; count: number }[] = [];

    clusterMap.forEach((group: StylistMarker[]) => {
      if (group.length === 1) {
        displayed.push(group[0]);
      } else {
        // Show first stylist as representative, rest as cluster
        displayed.push(group[0]);
        if (group.length > 2) {
          const avgLat = group.reduce((sum: number, s: StylistMarker) => sum + s.lat, 0) / group.length;
          const avgLng = group.reduce((sum: number, s: StylistMarker) => sum + s.lng, 0) / group.length;
          clustered.push({ lat: avgLat, lng: avgLng, count: group.length - 1 });
        }
      }
    });

    return { displayedStylists: displayed.slice(0, 12), clusters: clustered };
  }, [sortedStylists, zoom]);

  // Handle user location request
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
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
  const handleZoomIn = () => setZoom((z) => Math.min(z + 1, MAP_DEFAULTS.maxZoom));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 1, MAP_DEFAULTS.minZoom));

  // Toggle view mode (persists preference)
  const toggleViewMode = () => setViewMode(viewMode === "map" ? "list" : "map");

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (viewMode !== "map") return;

    const pinCount = displayedStylists.length;
    if (pinCount === 0) return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        setFocusedPinIndex((prev) => (prev + 1) % pinCount);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        setFocusedPinIndex((prev) => (prev - 1 + pinCount) % pinCount);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedPinIndex >= 0 && focusedPinIndex < pinCount) {
          onStylistSelect?.(displayedStylists[focusedPinIndex]);
        }
        break;
      case "+":
      case "=":
        e.preventDefault();
        handleZoomIn();
        break;
      case "-":
        e.preventDefault();
        handleZoomOut();
        break;
      case "l":
      case "L":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleViewMode();
        }
        break;
    }
  }, [viewMode, displayedStylists, focusedPinIndex, onStylistSelect]);

  // Empty state check
  const isEmpty = stylists.length === 0 && salons.length === 0;

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn("relative w-full h-full bg-background-tertiary", className)}
        role="status"
        aria-label="Loading map"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-brand-rose/20 border-t-brand-rose rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Finding stylists near you...</p>
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
        // Disable animations on reduced motion preference
        prefersReducedMotion && "[&_*]:!transition-none [&_*]:!animate-none",
        className
      )}
      role="region"
      aria-label={`Stylist map showing ${stylists.length} stylists. Use arrow keys to navigate pins, Enter to select.`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
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
          aria-label={viewMode === "map" ? "Switch to list view (Ctrl+L)" : "Switch to map view (Ctrl+L)"}
          aria-pressed={viewMode === "list"}
          title={viewMode === "map" ? "Switch to list view (Ctrl+L)" : "Switch to map view (Ctrl+L)"}
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
        /* Map View */
        <div className="absolute inset-0 bg-gradient-to-br from-background-secondary to-background-tertiary">
          {/* Grid pattern to simulate map */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--border-default) 1px, transparent 1px),
                linear-gradient(to bottom, var(--border-default) 1px, transparent 1px)
              `,
              backgroundSize: `${40 * (zoom / 12)}px ${40 * (zoom / 12)}px`,
            }}
            aria-hidden="true"
          />

          {/* Simulated map content area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full max-w-2xl max-h-2xl p-8">
              {/* User location */}
              {userLocation && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                  role="img"
                  aria-label="Your location"
                >
                  <UserPin />
                </div>
              )}

              {/* Stylist pins - arranged in a pattern */}
              {displayedStylists.map((stylist, index) => {
                const angle = (index / Math.max(displayedStylists.length, 8)) * 2 * Math.PI;
                const radius = 25 + (index % 3) * 12;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const isFocused = focusedPinIndex === index;

                return (
                  <div
                    key={stylist.id}
                    className={cn(
                      "absolute transform -translate-x-1/2 -translate-y-full z-10",
                      // Keyboard focus ring
                      isFocused && "ring-2 ring-brand-rose ring-offset-2 rounded-full"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    role="button"
                    tabIndex={-1}
                    aria-label={`${stylist.name}, ${stylist.operatingMode.toLowerCase()} stylist`}
                  >
                    <StylistPin
                      stylist={stylist}
                      isSelected={selectedStylistId === stylist.id || isFocused}
                      onClick={() => onStylistSelect?.(stylist)}
                    />
                  </div>
                );
              })}

              {/* Salon pins */}
              {showSalons &&
                salons.slice(0, 3).map((salon, index) => {
                  const angle = ((index + displayedStylists.length) / (displayedStylists.length + 4)) * 2 * Math.PI;
                  const radius = 35;
                  const x = 50 + Math.cos(angle) * radius;
                  const y = 50 + Math.sin(angle) * radius;

                  return (
                    <div
                      key={salon.id}
                      className="absolute transform -translate-x-1/2 -translate-y-full z-10"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                      }}
                    >
                      <SalonPin
                        salon={salon}
                        onClick={() => onSalonSelect?.(salon)}
                      />
                    </div>
                  );
                })}

              {/* Cluster indicators */}
              {clusters.map((cluster, index) => (
                <div
                  key={`cluster-${index}`}
                  className="absolute bottom-[20%] right-[20%] z-10"
                  style={{
                    right: `${15 + index * 10}%`,
                    bottom: `${20 + index * 5}%`,
                  }}
                >
                  <ClusterPin count={cluster.count} />
                </div>
              ))}

              {/* Additional cluster if more stylists exist */}
              {stylists.length > displayedStylists.length + clusters.reduce((sum, c) => sum + c.count, 0) && (
                <div className="absolute bottom-[15%] right-[15%] z-10">
                  <ClusterPin count={stylists.length - displayedStylists.length} />
                </div>
              )}
            </div>
          </div>

          {/* Map unavailable notice */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-background-primary/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
            <p className="text-xs text-text-secondary flex items-center gap-2">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              Interactive map coming soon
            </p>
          </div>
        </div>
      )}

      {/* Map Controls (only show in map view) */}
      {viewMode === "map" && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
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

          {/* Zoom Controls */}
          <div
            className="flex flex-col bg-background-primary rounded-lg shadow-md overflow-hidden"
            role="group"
            aria-label="Zoom controls"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="w-10 h-10 p-0 rounded-none border-b border-border-default"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="w-10 h-10 p-0 rounded-none"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>

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
          className="absolute bottom-4 left-4 bg-background-primary/90 backdrop-blur-sm rounded-lg p-3 shadow-md z-30"
          role="region"
          aria-label="Map legend"
        >
          <p className="text-xs font-medium text-text-primary mb-2">Stylist Type</p>
          <div className="space-y-1.5">
            <LegendItem color={STYLIST_MODE_COLORS.FIXED} label="Fixed Location" />
            <LegendItem color={STYLIST_MODE_COLORS.MOBILE} label="Mobile" />
            <LegendItem color={STYLIST_MODE_COLORS.HYBRID} label="Both" />
          </div>
        </div>
      )}
    </div>
  );
}

// Legend Item Component
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-xs text-text-secondary">{label}</span>
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
