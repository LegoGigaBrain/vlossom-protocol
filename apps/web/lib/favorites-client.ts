/**
 * Favorites API Client (V5.2)
 *
 * Client for managing user's favorite stylists.
 *
 * V8.0.0 Security Update: Migrated from Bearer tokens to httpOnly cookies
 */

import { authFetch } from "./auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ============================================================================
// Types
// ============================================================================

export interface FavoriteStylistService {
  id: string;
  name: string;
  category: string;
  priceAmountCents: number;
  estimatedDurationMin: number;
}

export interface FavoriteStylistProfile {
  bio: string | null;
  specialties: string[];
  portfolioImages: string[];
  operatingMode: "FIXED" | "MOBILE" | "HYBRID";
  isAcceptingBookings: boolean;
  services: FavoriteStylistService[];
}

export interface FavoriteStylist {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  favoritedAt: string;
  profile: FavoriteStylistProfile | null;
}

export interface FavoritesListResponse {
  favorites: FavoriteStylist[];
  total: number;
  hasMore: boolean;
}

export interface FavoriteStatusResponse {
  isFavorited: boolean;
  favoritedAt: string | null;
}

export interface FavoriteCountResponse {
  count: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get list of user's favorite stylists
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function getFavorites(params?: {
  limit?: number;
  offset?: number;
}): Promise<FavoritesListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const url = `${API_URL}/api/v1/favorites?${searchParams.toString()}`;

  const response = await authFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch favorites");
  }

  return response.json();
}

/**
 * Add a stylist to favorites
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function addFavorite(stylistId: string): Promise<{
  success: boolean;
  favorite: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    favoritedAt: string;
  };
}> {
  const response = await authFetch(`${API_URL}/api/v1/favorites`, {
    method: "POST",
    body: JSON.stringify({ stylistId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to add favorite");
  }

  return response.json();
}

/**
 * Remove a stylist from favorites
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function removeFavorite(
  stylistId: string
): Promise<{ success: boolean }> {
  const response = await authFetch(`${API_URL}/api/v1/favorites/${stylistId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to remove favorite");
  }

  return response.json();
}

/**
 * Check if a stylist is favorited
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function checkFavoriteStatus(
  stylistId: string
): Promise<FavoriteStatusResponse> {
  const response = await authFetch(`${API_URL}/api/v1/favorites/${stylistId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to check favorite status");
  }

  return response.json();
}

/**
 * Get count of user's favorites
 * V8.0.0: Uses httpOnly cookie auth via authFetch
 */
export async function getFavoritesCount(): Promise<FavoriteCountResponse> {
  const response = await authFetch(`${API_URL}/api/v1/favorites/count`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch favorites count");
  }

  return response.json();
}
