/**
 * Hair Health Hooks (V5.1)
 * React Query hooks for hair health profile and learning progress
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHairProfile,
  getHairProfileWithAnalysis,
  createHairProfile,
  updateHairProfile,
  deleteHairProfile,
  getLearningProgress,
  unlockLearningNode,
  type HairProfileCreateInput,
  type HairProfileUpdateInput,
  type HairProfileResponse,
  type LearningProgressResponse,
  type ProfileAnalysis,
} from "@/lib/hair-health-client";

// Re-export types for convenience
export type {
  HairProfileResponse,
  HairProfileCreateInput,
  HairProfileUpdateInput,
  LearningProgressResponse,
  ProfileAnalysis,
  ProfileWithAnalysis,
  TextureClass,
  PatternFamily,
  ThreeLevel,
  LoadFactor,
  RoutineType,
  HealthScore,
  LearningNode,
} from "@/lib/hair-health-client";

// ============================================================================
// Query Keys
// ============================================================================

export const hairHealthKeys = {
  all: ["hair-health"] as const,
  profile: () => [...hairHealthKeys.all, "profile"] as const,
  profileWithAnalysis: () => [...hairHealthKeys.all, "profile-analysis"] as const,
  learning: () => [...hairHealthKeys.all, "learning"] as const,
};

// ============================================================================
// Profile Hooks
// ============================================================================

/**
 * Hook to fetch the current user's hair health profile
 */
export function useHairProfile() {
  return useQuery({
    queryKey: hairHealthKeys.profile(),
    queryFn: getHairProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile doesn't change often
    retry: (failureCount, error) => {
      // Don't retry on 404 (no profile)
      if (error instanceof Error && error.message.includes("not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch profile with full analysis (health score, recommendations)
 */
export function useHairProfileWithAnalysis() {
  return useQuery({
    queryKey: hairHealthKeys.profileWithAnalysis(),
    queryFn: getHairProfileWithAnalysis,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to create a new hair health profile
 */
export function useCreateHairProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HairProfileCreateInput) => createHairProfile(input),
    onSuccess: (newProfile) => {
      // Update the profile cache
      queryClient.setQueryData(hairHealthKeys.profile(), newProfile);
      // Invalidate to refetch with analysis
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.profileWithAnalysis() });
      // Also invalidate learning since profile creation may unlock nodes
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.learning() });
    },
  });
}

/**
 * Hook to update the current user's hair health profile
 */
export function useUpdateHairProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HairProfileUpdateInput) => updateHairProfile(input),
    onSuccess: (updatedProfile) => {
      // Update the profile cache
      queryClient.setQueryData(hairHealthKeys.profile(), updatedProfile);
      // Invalidate analysis to refetch
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.profileWithAnalysis() });
    },
  });
}

/**
 * Hook to delete the current user's hair health profile
 */
export function useDeleteHairProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHairProfile,
    onSuccess: () => {
      // Clear profile from cache
      queryClient.setQueryData(hairHealthKeys.profile(), null);
      queryClient.setQueryData(hairHealthKeys.profileWithAnalysis(), null);
      // Reset learning progress
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.learning() });
    },
  });
}

// ============================================================================
// Learning Progress Hooks
// ============================================================================

/**
 * Hook to fetch learning progress
 */
export function useLearningProgress() {
  return useQuery({
    queryKey: hairHealthKeys.learning(),
    queryFn: getLearningProgress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to unlock a learning node
 */
export function useUnlockLearningNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => unlockLearningNode(nodeId),
    onSuccess: () => {
      // Invalidate learning progress to refetch
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.learning() });
      // Also invalidate profile as learningNodesUnlocked is updated
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.profile() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if user has a hair profile
 */
export function useHasHairProfile() {
  const { data: profile, isLoading } = useHairProfile();
  return {
    hasProfile: profile !== null && profile !== undefined,
    isLoading,
  };
}

/**
 * Hook to get the user's health grade
 */
export function useHealthGrade() {
  const { data, isLoading } = useHairProfileWithAnalysis();
  return {
    grade: data?.analysis?.healthScore?.grade ?? null,
    score: data?.analysis?.healthScore?.overall ?? null,
    isLoading,
  };
}
