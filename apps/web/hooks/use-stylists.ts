/**
 * Stylist Hooks
 * React Query hooks for stylist data fetching
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getStylists,
  getStylist,
  getCategories,
  type StylistFilters,
} from "@/lib/stylist-client";

/**
 * Hook to fetch list of stylists with filters
 */
export function useStylists(filters?: StylistFilters) {
  return useQuery({
    queryKey: ["stylists", filters],
    queryFn: () => getStylists(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch single stylist by ID
 */
export function useStylist(id: string) {
  return useQuery({
    queryKey: ["stylist", id],
    queryFn: () => getStylist(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch service categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
