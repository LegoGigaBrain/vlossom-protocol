/**
 * Home Page - Map-First Discovery (V5.0)
 *
 * Full-screen map experience with stylist pins and quick booking.
 * - Map with color-coded stylist markers
 * - Bottom sheet for quick booking
 * - Quick filters (availability, service type, distance)
 * - Search overlay
 *
 * Reference: docs/vlossom/15-frontend-ux-flows.md Section 13
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import { BottomNav } from "../../components/layout/bottom-nav";
import { StylistMap, BookingSheet } from "../../components/map";
import { type StylistMarker, type SalonMarker } from "../../lib/mapbox";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import {
  Search,
  SlidersHorizontal,
  X,
  Clock,
  Star,
  Sparkles,
  MapPin,
} from "lucide-react";

// Mock stylist data for demonstration
const mockStylists: StylistMarker[] = [
  {
    id: "1",
    name: "Thandi M.",
    avatarUrl: undefined,
    lat: -26.1952,
    lng: 28.0340,
    operatingMode: "FIXED",
    rating: 4.9,
    reviewCount: 127,
    specialties: ["Box Braids", "Knotless", "Cornrows"],
    isAvailableNow: true,
    priceRange: { min: 250, max: 800 },
  },
  {
    id: "2",
    name: "Nomvula K.",
    avatarUrl: undefined,
    lat: -26.2100,
    lng: 28.0500,
    operatingMode: "MOBILE",
    rating: 4.7,
    reviewCount: 89,
    specialties: ["Natural Styling", "Twist Outs", "Locs"],
    isAvailableNow: false,
    nextAvailable: "Tomorrow 10am",
    priceRange: { min: 150, max: 500 },
  },
  {
    id: "3",
    name: "Ayanda T.",
    avatarUrl: undefined,
    lat: -26.1850,
    lng: 28.0600,
    operatingMode: "HYBRID",
    rating: 5.0,
    reviewCount: 203,
    specialties: ["Silk Press", "Treatments", "Color"],
    isAvailableNow: true,
    priceRange: { min: 300, max: 1200 },
  },
  {
    id: "4",
    name: "Zinhle D.",
    avatarUrl: undefined,
    lat: -26.2200,
    lng: 28.0200,
    operatingMode: "FIXED",
    rating: 4.8,
    reviewCount: 156,
    specialties: ["Weaves", "Wigs", "Extensions"],
    isAvailableNow: false,
    nextAvailable: "Today 3pm",
    priceRange: { min: 400, max: 1500 },
  },
  {
    id: "5",
    name: "Lerato M.",
    avatarUrl: undefined,
    lat: -26.1900,
    lng: 28.0150,
    operatingMode: "MOBILE",
    rating: 4.6,
    reviewCount: 74,
    specialties: ["Kids Hair", "Protective Styles"],
    isAvailableNow: true,
    priceRange: { min: 100, max: 400 },
  },
];

const mockSalons: SalonMarker[] = [
  {
    id: "salon-1",
    name: "Blossom Studio",
    imageUrl: undefined,
    lat: -26.2000,
    lng: 28.0450,
    chairCount: 6,
    availableChairs: 2,
    rating: 4.8,
    amenities: ["WiFi", "Parking", "Refreshments"],
  },
  {
    id: "salon-2",
    name: "Crown & Glory",
    imageUrl: undefined,
    lat: -26.2150,
    lng: 28.0300,
    chairCount: 4,
    availableChairs: 1,
    rating: 4.9,
    amenities: ["WiFi", "Kids Area"],
  },
];

// Filter options
const filterOptions = [
  { id: "available", label: "Available Now", icon: Clock },
  { id: "top-rated", label: "Top Rated", icon: Star },
  { id: "nearby", label: "Nearby", icon: MapPin },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Map state
  const [selectedStylist, setSelectedStylist] = useState<StylistMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(["available"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  // Filter stylists based on active filters
  const filteredStylists = mockStylists.filter((stylist) => {
    if (activeFilters.includes("available") && !stylist.isAvailableNow) {
      return false;
    }
    if (activeFilters.includes("top-rated") && stylist.rating < 4.8) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        stylist.name.toLowerCase().includes(query) ||
        stylist.specialties.some((s) => s.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 flex flex-col bg-background-primary">
      {/* Search Bar - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
        <div className="pointer-events-auto">
          {showSearch ? (
            // Expanded search
            <div className="bg-background-primary rounded-2xl shadow-lg p-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
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
                  <X className="w-5 h-5 text-text-secondary" />
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
                            {stylist.specialties.slice(0, 2).join(", ")}
                          </p>
                        </div>
                        {stylist.isAvailableNow && (
                          <Badge variant="success" className="text-xs">
                            Now
                          </Badge>
                        )}
                      </button>
                    ))}
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
              <Search className="w-5 h-5 text-text-muted" />
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
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </button>
          )}
        </div>

        {/* Quick Filters */}
        {showFilters && !showSearch && (
          <div className="pointer-events-auto mt-3 flex gap-2 overflow-x-auto pb-1 animate-in slide-in-from-top-2 duration-200">
            {filterOptions.map((filter) => {
              const Icon = filter.icon;
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
                  <Icon className="w-4 h-4" />
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
          salons={mockSalons}
          selectedStylistId={selectedStylist?.id}
          onStylistSelect={handleStylistSelect}
          onSalonSelect={handleSalonSelect}
          userLocation={userLocation}
          className="w-full h-full"
        />
      </div>

      {/* Greeting Card (shown when no stylist selected) */}
      {!isBookingOpen && user && (
        <div className="absolute bottom-24 left-4 right-4 z-30 pointer-events-none">
          <div className="pointer-events-auto bg-background-primary/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-rose to-brand-purple flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  Welcome back{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
                </p>
                <p className="text-xs text-text-secondary">
                  {filteredStylists.filter((s) => s.isAvailableNow).length} stylists available now
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
      <BottomNav />
    </div>
  );
}
