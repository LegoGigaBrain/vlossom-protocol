/**
 * Home Page - Map-First Discovery (V8.0)
 *
 * Full-screen map experience with stylist pins and quick booking.
 * - Map with color-coded stylist markers (from API with mock fallback)
 * - Bottom sheet for quick booking
 * - Quick filters (availability, service type, distance)
 * - Search overlay
 * - Feature flag: NEXT_PUBLIC_USE_MOCK_DATA=true for demo mode
 *
 * V8.0: Updated to work within AppShell layout (sidebar + header)
 *
 * Reference: docs/vlossom/15-frontend-ux-flows.md Section 13
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useStylistMarkers, filterMarkers } from "@/hooks/use-stylist-markers";
import { StylistMap, BookingSheet } from "@/components/map";
import { type StylistMarker, type SalonMarker } from "@/lib/mapbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { MOCK_SALONS } from "@/lib/mock-data";

// Filter options
const filterOptions = [
  { id: "available", label: "Available Now", icon: "clock" as const },
  { id: "top-rated", label: "Top Rated", icon: "star" as const },
  { id: "nearby", label: "Nearby", icon: "location" as const },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch stylists from API (with mock data fallback)
  const { markers, isLoading, error, refetch, isUsingMockData } = useStylistMarkers();

  // Map state
  const [selectedStylist, setSelectedStylist] = useState<StylistMarker | null>(null);
  const [userLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Filter stylists based on active filters and search
  const filteredStylists = useMemo(() => {
    return filterMarkers(markers, {
      availableOnly: activeFilters.includes("available"),
      topRatedOnly: activeFilters.includes("top-rated"),
      searchQuery: searchQuery || undefined,
    });
  }, [markers, activeFilters, searchQuery]);

  // Handle stylist selection
  const handleStylistSelect = useCallback((stylist: StylistMarker) => {
    setSelectedStylist(stylist);
    setIsBookingOpen(true);
  }, []);

  // Handle salon selection
  const handleSalonSelect = useCallback((salon: SalonMarker) => {
    router.push(`/salons/${salon.id}`);
  }, [router]);

  // Close booking sheet
  const handleCloseBooking = useCallback(() => {
    setIsBookingOpen(false);
    // Delay clearing selected stylist for animation
    setTimeout(() => setSelectedStylist(null), 300);
  }, []);

  // Toggle filter
  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col bg-background-primary">
        <div className="p-4">
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon name="unfold" size="lg" className="animate-spin text-brand-rose mx-auto mb-4" />
            <p className="text-sm text-text-secondary">Finding stylists near you...</p>
          </div>
        </div>

      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full w-full flex flex-col bg-background-primary">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <Icon name="calmError" size="2xl" className="text-status-error mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Unable to Load Stylists
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              We couldn&apos;t fetch stylists at this time. Please try again.
            </p>
            <Button variant="primary" onClick={() => refetch()}>
              <Icon name="unfold" size="sm" className="mr-2" />
              Retry
            </Button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background-primary relative">
      {/* Search Bar - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="pointer-events-auto">
          {showSearch ? (
            // Expanded search
            <div className="bg-background-primary rounded-2xl shadow-lg p-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <Icon name="search" size="md" className="text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search stylists, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="p-1.5 rounded-full hover:bg-background-tertiary transition-colors"
                >
                  <Icon name="close" size="md" className="text-text-secondary" />
                </button>
              </div>
              {searchQuery && (
                <div className="mt-3 pt-3 border-t border-border-default">
                  <p className="text-xs text-text-muted mb-2">
                    {filteredStylists.length} results
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredStylists.slice(0, 5).map((stylist) => (
                      <button
                        key={stylist.id}
                        onClick={() => {
                          handleStylistSelect(stylist);
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background-tertiary transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-rose/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-brand-rose">
                            {stylist.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {stylist.name}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {stylist.specialties.slice(0, 2).join(", ") || "Hair Stylist"}
                          </p>
                        </div>
                        {stylist.isAvailableNow && (
                          <Badge variant="success" className="text-xs">
                            Now
                          </Badge>
                        )}
                      </button>
                    ))}
                    {filteredStylists.length === 0 && (
                      <p className="text-sm text-text-muted text-center py-4">
                        No stylists found matching &quot;{searchQuery}&quot;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Collapsed search bar
            <button
              onClick={() => setShowSearch(true)}
              className="w-full bg-background-primary rounded-2xl shadow-lg p-4 flex items-center gap-3 hover:shadow-xl transition-shadow"
            >
              <Icon name="search" size="md" className="text-text-muted" />
              <span className="text-text-secondary text-sm flex-1 text-left">
                Search stylists, services...
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilters(!showFilters);
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showFilters
                    ? "bg-brand-rose/10 text-brand-rose"
                    : "hover:bg-background-tertiary text-text-secondary"
                )}
              >
                <Icon name="settings" size="md" />
              </button>
            </button>
          )}
        </div>

        {/* Quick Filters */}
        {showFilters && !showSearch && (
          <div className="pointer-events-auto mt-3 flex gap-2 overflow-x-auto pb-1 animate-in slide-in-from-top-2 duration-200">
            {filterOptions.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-brand-rose text-white shadow-md"
                      : "bg-background-primary text-text-secondary shadow hover:shadow-md"
                  )}
                >
                  <Icon name={filter.icon} size="sm" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Map */}
      <div className="flex-1 relative">
        <StylistMap
          stylists={filteredStylists}
          salons={MOCK_SALONS}
          selectedStylistId={selectedStylist?.id}
          onStylistSelect={handleStylistSelect}
          onSalonSelect={handleSalonSelect}
          userLocation={userLocation}
          className="w-full h-full"
        />
      </div>

      {/* Mock Data Indicator (dev only) */}
      {isUsingMockData && process.env.NODE_ENV === "development" && (
        <div className="absolute top-20 right-4 z-50">
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
            <Icon name="info" className="w-3 h-3 mr-1" />
            Demo Data
          </Badge>
        </div>
      )}

      {/* Greeting Card (shown when no stylist selected) */}
      {!isBookingOpen && user && (
        <div className="absolute bottom-24 left-4 right-4 z-30 pointer-events-none">
          <div className="pointer-events-auto bg-background-primary/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-rose to-brand-purple flex items-center justify-center">
                <Icon name="sparkle" size="md" className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  Welcome back{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
                </p>
                <p className="text-xs text-text-secondary">
                  {filteredStylists.filter((s) => s.isAvailableNow).length} of {markers.length} stylists available now
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/schedule")}
              >
                My Schedule
              </Button>
            </div>
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-border-default">
              <button
                onClick={() => router.push("/special-events")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-orange/10 hover:bg-accent-orange/20 transition-colors"
              >
                <Icon name="growing" size="sm" className="text-accent-orange" />
                <span className="text-xs font-medium text-accent-orange">Special Events</span>
              </button>
              <button
                onClick={() => router.push("/search")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors"
              >
                <Icon name="search" size="sm" className="text-text-secondary" />
                <span className="text-xs font-medium text-text-secondary">Find Stylists</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Sheet */}
      <BookingSheet
        stylist={selectedStylist}
        userLocation={userLocation}
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
      />

      {/* Bottom Navigation */}
      
    </div>
  );
}
