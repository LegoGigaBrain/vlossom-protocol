/**
 * Mock Data Constants (V5.3)
 *
 * Centralized mock data for UI testing and demos.
 * Used when NEXT_PUBLIC_USE_MOCK_DATA=true or when API returns empty.
 *
 * Usage:
 * - Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local for demo mode
 * - Hooks will show mock data instantly, then replace with real data when available
 */

import type { StylistMarker, SalonMarker } from "./mapbox";

// Feature flag check
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ============================================================================
// Stylist Mock Data
// ============================================================================

export const MOCK_STYLISTS: StylistMarker[] = [
  {
    id: "stylist-1",
    name: "Naledi M.",
    avatarUrl: "/avatars/stylist-1.jpg",
    lat: -26.2041,
    lng: 28.0473,
    operatingMode: "MOBILE",
    rating: 4.9,
    reviewCount: 127,
    specialties: ["Braids", "Locs", "Natural Hair"],
    isAvailableNow: true,
    priceRange: { min: 15000, max: 45000 },
  },
  {
    id: "stylist-2",
    name: "Thandi K.",
    avatarUrl: "/avatars/stylist-2.jpg",
    lat: -26.1952,
    lng: 28.0341,
    operatingMode: "FIXED",
    rating: 4.8,
    reviewCount: 89,
    specialties: ["Silk Press", "Color", "Treatments"],
    isAvailableNow: false,
    nextAvailable: "Tomorrow 10:00",
    priceRange: { min: 20000, max: 60000 },
  },
  {
    id: "stylist-3",
    name: "Lerato N.",
    avatarUrl: "/avatars/stylist-3.jpg",
    lat: -26.2123,
    lng: 28.0589,
    operatingMode: "HYBRID",
    rating: 4.7,
    reviewCount: 64,
    specialties: ["Cornrows", "Twists", "Kids Hair"],
    isAvailableNow: true,
    priceRange: { min: 12000, max: 35000 },
  },
  {
    id: "stylist-4",
    name: "Mpho S.",
    avatarUrl: "/avatars/stylist-4.jpg",
    lat: -26.1878,
    lng: 28.0412,
    operatingMode: "MOBILE",
    rating: 5.0,
    reviewCount: 42,
    specialties: ["Faux Locs", "Crochet", "Weaves"],
    isAvailableNow: true,
    priceRange: { min: 25000, max: 80000 },
  },
  {
    id: "stylist-5",
    name: "Zinhle D.",
    avatarUrl: "/avatars/stylist-5.jpg",
    lat: -26.2234,
    lng: 28.0298,
    operatingMode: "FIXED",
    rating: 4.6,
    reviewCount: 156,
    specialties: ["Relaxers", "Cuts", "Styling"],
    isAvailableNow: false,
    nextAvailable: "Today 15:00",
    priceRange: { min: 18000, max: 55000 },
  },
];

// ============================================================================
// Salon Mock Data
// ============================================================================

export const MOCK_SALONS: SalonMarker[] = [
  {
    id: "salon-1",
    name: "Blossom Beauty Lounge",
    imageUrl: "/salons/salon-1.jpg",
    lat: -26.2001,
    lng: 28.0401,
    chairCount: 6,
    availableChairs: 2,
    rating: 4.8,
    amenities: ["WiFi", "Parking", "Refreshments"],
  },
  {
    id: "salon-2",
    name: "Crown & Glory Studio",
    imageUrl: "/salons/salon-2.jpg",
    lat: -26.1923,
    lng: 28.0512,
    chairCount: 4,
    availableChairs: 1,
    rating: 4.9,
    amenities: ["WiFi", "Air Conditioning", "Kids Area"],
  },
];

// ============================================================================
// Profile Stats Mock Data
// ============================================================================

export interface ProfileStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number; // in cents
  averageRating: number;
  reviewsGiven: number;
  memberSince: string;
}

export const MOCK_PROFILE_STATS: ProfileStats = {
  totalBookings: 24,
  completedBookings: 21,
  cancelledBookings: 2,
  totalSpent: 1250000, // R12,500
  averageRating: 4.8,
  reviewsGiven: 18,
  memberSince: "2024-06-15",
};

// ============================================================================
// Stylist Dashboard Stats Mock Data
// ============================================================================

export interface StylistStats {
  totalEarnings: number; // in cents
  thisMonthEarnings: number;
  pendingPayouts: number;
  totalBookings: number;
  completedBookings: number;
  averageRating: number;
  totalReviews: number;
  repeatClientRate: number; // percentage
}

export const MOCK_STYLIST_STATS: StylistStats = {
  totalEarnings: 8500000, // R85,000
  thisMonthEarnings: 1200000, // R12,000
  pendingPayouts: 350000, // R3,500
  totalBookings: 156,
  completedBookings: 148,
  averageRating: 4.9,
  totalReviews: 127,
  repeatClientRate: 68,
};

// ============================================================================
// Property Owner Stats Mock Data
// ============================================================================

export interface PropertyStats {
  totalProperties: number;
  totalChairs: number;
  occupiedChairs: number;
  monthlyRevenue: number; // in cents
  pendingRequests: number;
  averageOccupancy: number; // percentage
}

export const MOCK_PROPERTY_STATS: PropertyStats = {
  totalProperties: 2,
  totalChairs: 10,
  occupiedChairs: 7,
  monthlyRevenue: 4500000, // R45,000
  pendingRequests: 3,
  averageOccupancy: 70,
};

// ============================================================================
// Social Stats Mock Data (Followers/Following)
// ============================================================================

export interface SocialStats {
  followers: number;
  following: number;
  isFollowing?: boolean;
}

export const MOCK_SOCIAL_STATS: SocialStats = {
  followers: 234,
  following: 89,
  isFollowing: false,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get data with mock fallback
 * Returns real data if available, otherwise returns mock data
 */
export function withMockFallback<T>(
  realData: T | null | undefined,
  mockData: T,
  options?: { forceMock?: boolean }
): T {
  if (options?.forceMock || USE_MOCK_DATA) {
    // In mock mode, prefer mock data but allow real data to override if present
    return realData ?? mockData;
  }
  return realData ?? mockData;
}

/**
 * Check if we should show mock data
 */
export function shouldUseMockData(realData: unknown): boolean {
  if (USE_MOCK_DATA) return true;
  if (realData === null || realData === undefined) return true;
  if (Array.isArray(realData) && realData.length === 0) return true;
  return false;
}
