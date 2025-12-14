/**
 * Stylist API Client
 * Handles stylist discovery, profiles, and services
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Types
export type OperatingMode = "FIXED" | "MOBILE" | "HYBRID";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  priceAmountCents: string;
  estimatedDurationMin: number;
}

export interface BaseLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface StylistSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verificationStatus: VerificationStatus;
  bio: string | null;
  specialties: string[];
  serviceCategories: string[];
  operatingMode: OperatingMode;
  baseLocation: BaseLocation | null;
  isAcceptingBookings: boolean;
  startingPrice: number | null;
}

export interface Stylist extends StylistSummary {
  memberSince: string;
  portfolioImages: string[];
  serviceRadius: number | null;
  services: Service[];
}

export interface StylistFilters {
  category?: string;
  operatingMode?: OperatingMode;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StylistPage {
  stylists: StylistSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Get list of stylists with optional filters
 */
export async function getStylists(filters?: StylistFilters): Promise<StylistPage> {
  const params = new URLSearchParams();

  if (filters?.category) params.set("category", filters.category);
  if (filters?.operatingMode) params.set("operatingMode", filters.operatingMode);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", filters.page.toString());
  if (filters?.limit) params.set("limit", filters.limit.toString());

  const url = `${API_URL}/api/stylists${params.toString() ? `?${params.toString()}` : ""}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch stylists");
  }

  return response.json();
}

/**
 * Get single stylist by ID with full details
 */
export async function getStylist(id: string): Promise<Stylist> {
  const response = await fetch(`${API_URL}/api/stylists/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Stylist not found");
    }
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch stylist");
  }

  return response.json();
}

/**
 * Get available categories from stylists
 */
export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/stylists/categories`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Return default categories on error
    return ["Hair", "Nails", "Makeup", "Skincare"];
  }

  return response.json();
}

/**
 * Get location display text based on operating mode
 */
export function getOperatingModeText(mode: OperatingMode): string {
  switch (mode) {
    case "FIXED":
      return "Salon-based";
    case "MOBILE":
      return "Mobile stylist";
    case "HYBRID":
      return "Salon & Mobile";
  }
}

/**
 * Get available location types based on operating mode
 */
export function getAvailableLocationTypes(
  operatingMode: OperatingMode
): ("STYLIST_BASE" | "CUSTOMER_HOME")[] {
  switch (operatingMode) {
    case "FIXED":
      return ["STYLIST_BASE"];
    case "MOBILE":
      return ["CUSTOMER_HOME"];
    case "HYBRID":
      return ["STYLIST_BASE", "CUSTOMER_HOME"];
  }
}
