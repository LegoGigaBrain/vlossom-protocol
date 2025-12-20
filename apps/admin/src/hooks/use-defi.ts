/**
 * DeFi React Query Hooks (V7.0.0)
 *
 * Data fetching hooks for admin DeFi management.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDefiStats,
  fetchDefiConfig,
  updateAPYParams,
  updateFeeSplit,
  pausePool,
  unpausePool,
  emergencyPauseAll,
  emergencyUnpauseAll,
  type APYParams,
  type FeeSplit,
} from "../lib/defi-client";

/**
 * Query keys for DeFi
 */
export const defiKeys = {
  all: ["defi"] as const,
  stats: () => [...defiKeys.all, "stats"] as const,
  config: () => [...defiKeys.all, "config"] as const,
};

/**
 * Fetch DeFi statistics
 */
export function useDefiStats() {
  return useQuery({
    queryKey: defiKeys.stats(),
    queryFn: fetchDefiStats,
    staleTime: 30_000,
  });
}

/**
 * Fetch DeFi configuration
 */
export function useDefiConfig() {
  return useQuery({
    queryKey: defiKeys.config(),
    queryFn: fetchDefiConfig,
    staleTime: 60_000,
  });
}

/**
 * Update APY parameters mutation
 */
export function useUpdateAPYParams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: APYParams) => updateAPYParams(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defiKeys.config() });
      queryClient.invalidateQueries({ queryKey: defiKeys.stats() });
    },
  });
}

/**
 * Update fee split mutation
 */
export function useUpdateFeeSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (split: FeeSplit) => updateFeeSplit(split),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defiKeys.config() });
    },
  });
}

/**
 * Pause pool mutation
 */
export function usePausePool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (poolId: string) => pausePool(poolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defiKeys.stats() });
    },
  });
}

/**
 * Unpause pool mutation
 */
export function useUnpausePool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (poolId: string) => unpausePool(poolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defiKeys.stats() });
    },
  });
}

/**
 * Emergency pause all mutation
 */
export function useEmergencyPauseAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emergencyPauseAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defiKeys.stats() });
    },
  });
}

/**
 * Emergency unpause all mutation
 */
export function useEmergencyUnpauseAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: emergencyUnpauseAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: defiKeys.stats() });
    },
  });
}
