/**
 * Stylist Map - Full-Screen Map Component (V5.0)
 *
 * Main map component for discovering stylists and salons.
 * Uses static implementation for now (Mapbox integration later).
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

"use client";

import { useState, useCallback, useEffect } from "react";
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
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
  Locate,
  Filter,
} from "lucide-react";
import { Button } from "../ui/button";

interface StylistMapProps {
  stylists: StylistMarker[];
  salons?: SalonMarker[];
  selectedStylistId?: string | null;
  onStylistSelect?: (stylist: StylistMarker) => void;
  onSalonSelect?: (salon: SalonMarker) => void;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export function StylistMap({
  stylists,
  salons = [],
  selectedStylistId,
  onStylistSelect,
  onSalonSelect,
  userLocation,
  className,
}: StylistMapProps) {
  const [zoom, setZoom] = useState(MAP_DEFAULTS.zoom);
  const [center, setCenter] = useState(MAP_DEFAULTS.center);
  const [showSalons, setShowSalons] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // Sort stylists by distance if user location is available
  const sortedStylists = userLocation
    ? [...stylists].sort((a, b) => {
        const distA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
        const distB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
        return distA - distB;
      })
    : stylists;

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

  return (
    <div className={cn("relative w-full h-full bg-background-tertiary", className)}>
      {/* Map Placeholder - Replace with actual Mapbox when token is available */}
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
        />

        {/* Simulated map content area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-2xl max-h-2xl p-8">
            {/* User location */}
            {userLocation && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <UserPin />
              </div>
            )}

            {/* Stylist pins - arranged in a pattern */}
            {sortedStylists.slice(0, 8).map((stylist, index) => {
              const angle = (index / 8) * 2 * Math.PI;
              const radius = 30 + (index % 3) * 15; // Vary distance
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;

              return (
                <div
                  key={stylist.id}
                  className="absolute transform -translate-x-1/2 -translate-y-full z-10"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                >
                  <StylistPin
                    stylist={stylist}
                    isSelected={selectedStylistId === stylist.id}
                    onClick={() => onStylistSelect?.(stylist)}
                  />
                </div>
              );
            })}

            {/* Salon pins */}
            {showSalons &&
              salons.slice(0, 3).map((salon, index) => {
                const angle = ((index + 4) / 8) * 2 * Math.PI;
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

            {/* Cluster indicator if many stylists */}
            {stylists.length > 8 && (
              <div className="absolute bottom-[20%] right-[20%] z-10">
                <ClusterPin count={stylists.length - 8} />
              </div>
            )}
          </div>
        </div>

        {/* Map unavailable notice */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-background-primary/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md">
          <p className="text-xs text-text-secondary flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Interactive map coming soon
          </p>
        </div>
      </div>

      {/* Map Controls */}
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
          <Locate className={cn("w-5 h-5", isLocating && "animate-pulse")} />
        </Button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-background-primary rounded-lg shadow-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="w-10 h-10 p-0 rounded-none border-b border-border-default"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="w-10 h-10 p-0 rounded-none"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Layer Toggle */}
        <Button
          variant={showSalons ? "primary" : "outline"}
          size="sm"
          onClick={() => setShowSalons(!showSalons)}
          className="w-10 h-10 p-0 shadow-md"
          aria-label={showSalons ? "Hide salons" : "Show salons"}
        >
          <Layers className="w-5 h-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background-primary/90 backdrop-blur-sm rounded-lg p-3 shadow-md z-30">
        <p className="text-xs font-medium text-text-primary mb-2">Stylist Type</p>
        <div className="space-y-1.5">
          <LegendItem color={STYLIST_MODE_COLORS.FIXED} label="Fixed Location" />
          <LegendItem color={STYLIST_MODE_COLORS.MOBILE} label="Mobile" />
          <LegendItem color={STYLIST_MODE_COLORS.HYBRID} label="Both" />
        </div>
      </div>

      {/* Stylist count badge */}
      <div className="absolute top-4 left-4 bg-background-primary rounded-full px-3 py-1.5 shadow-md z-30">
        <p className="text-sm font-medium text-text-primary">
          {stylists.length} stylist{stylists.length !== 1 ? "s" : ""} nearby
        </p>
      </div>
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
      />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
