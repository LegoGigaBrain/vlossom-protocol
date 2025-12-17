/**
 * Favorites Hooks (V5.2)
 *
 * React Query hooks for managing favorite stylists.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavoriteStatus,
  getFavoritesCount,
  type FavoriteStylist,
  type FavoritesListResponse,
} from "@/lib/favorites-client";

// ============================================================================
// Query Keys
// ============================================================================

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  count: () => [...favoriteKeys.all, "count"] as const,
  status: (stylistId: string) =>
    [...favoriteKeys.all, "status", stylistId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get list of user's favorite stylists
 */
export function useFavorites(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: () => getFavorites(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get count of user's favorites
 */
export function useFavoritesCount() {
  return useQuery({
    queryKey: favoriteKeys.count(),
    queryFn: () => getFavoritesCount(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to check if a specific stylist is favorited
 */
export function useFavoriteStatus(stylistId: string) {
  return useQuery({
    queryKey: favoriteKeys.status(stylistId),
    queryFn: () => checkFavoriteStatus(stylistId),
    enabled: !!stylistId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to add a stylist to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stylistId: string) => addFavorite(stylistId),
    onSuccess: (data, stylistId) => {
      // Update the status for this stylist
      queryClient.setQueryData(favoriteKeys.status(stylistId), {
        isFavorited: true,
        favoritedAt: data.favorite.favoritedAt,
      });

      // Invalidate the list and count to refetch
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.count() });
    },
  });
}

/**
 * Hook to remove a stylist from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stylistId: string) => removeFavorite(stylistId),
    onSuccess: (_, stylistId) => {
      // Update the status for this stylist
      queryClient.setQueryData(favoriteKeys.status(stylistId), {
        isFavorited: false,
        favoritedAt: null,
      });

      // Invalidate the list and count to refetch
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.count() });
    },
  });
}

/**
 * Hook to toggle favorite status
 * Convenience hook that handles both add and remove
 */
export function useToggleFavorite(stylistId: string) {
  const { data: status } = useFavoriteStatus(stylistId);
  const addMutation = useAddFavorite();
  const removeMutation = useRemoveFavorite();

  const toggle = () => {
    if (status?.isFavorited) {
      return removeMutation.mutateAsync(stylistId);
    } else {
      return addMutation.mutateAsync(stylistId);
    }
  };

  return {
    isFavorited: status?.isFavorited ?? false,
    toggle,
    isLoading: addMutation.isPending || removeMutation.isPending,
    error: addMutation.error || removeMutation.error,
  };
}

// Re-export types
export type { FavoriteStylist, FavoritesListResponse };
