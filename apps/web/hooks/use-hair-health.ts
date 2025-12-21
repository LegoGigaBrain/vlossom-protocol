/**
 * Hair Health Hooks (V6.9)
 * React Query hooks for hair health profile, learning progress, and calendar intelligence
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
  // V6.9 Calendar Intelligence
  getRitualPlan,
  getRitualTemplates,
  generateCalendar,
  getUpcomingRituals,
  getCalendarSummary,
  completeCalendarEvent,
  skipCalendarEvent,
  rescheduleCalendarEvent,
  type HairProfileCreateInput,
  type HairProfileUpdateInput,
  type HairProfileResponse,
  type LearningProgressResponse,
  type ProfileAnalysis,
  // V6.9 Calendar Types
  type RitualPlanResponse,
  type RitualRecommendation,
  type UpcomingRitualsResponse,
  type CalendarSummaryResponse,
  type CalendarGenerateResult,
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
  // V6.9 Calendar Types
  RitualPlanResponse,
  RitualRecommendation,
  UpcomingRitualsResponse,
  CalendarSummaryResponse,
  CalendarGenerateResult,
  UpcomingRitual,
  WeeklyRitualSlot,
  RitualStep,
} from "@/lib/hair-health-client";

// ============================================================================
// Query Keys
// ============================================================================

export const hairHealthKeys = {
  all: ["hair-health"] as const,
  profile: () => [...hairHealthKeys.all, "profile"] as const,
  profileWithAnalysis: () => [...hairHealthKeys.all, "profile-analysis"] as const,
  learning: () => [...hairHealthKeys.all, "learning"] as const,
  // V6.9 Calendar Intelligence
  ritualPlan: () => [...hairHealthKeys.all, "ritual-plan"] as const,
  ritualTemplates: () => [...hairHealthKeys.all, "ritual-templates"] as const,
  upcomingRituals: (days: number) => [...hairHealthKeys.all, "upcoming", days] as const,
  calendarSummary: () => [...hairHealthKeys.all, "calendar-summary"] as const,
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

// ============================================================================
// V6.9 Calendar Intelligence Hooks
// ============================================================================

/**
 * Hook to fetch personalized ritual plan based on profile
 */
export function useRitualPlan() {
  const { data: profile } = useHairProfile();

  return useQuery({
    queryKey: hairHealthKeys.ritualPlan(),
    queryFn: getRitualPlan,
    enabled: !!profile, // Only fetch if user has a profile
    staleTime: 10 * 60 * 1000, // 10 minutes - plan doesn't change often
  });
}

/**
 * Hook to fetch all available ritual templates
 */
export function useRitualTemplates() {
  return useQuery({
    queryKey: hairHealthKeys.ritualTemplates(),
    queryFn: getRitualTemplates,
    staleTime: 30 * 60 * 1000, // 30 minutes - templates are static
  });
}

/**
 * Hook to fetch upcoming rituals for the next N days
 */
export function useUpcomingRituals(days: number = 14) {
  return useQuery({
    queryKey: hairHealthKeys.upcomingRituals(days),
    queryFn: () => getUpcomingRituals(days),
    staleTime: 2 * 60 * 1000, // 2 minutes - more dynamic
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch calendar summary for widget display
 */
export function useCalendarSummary() {
  const { data: profile } = useHairProfile();

  return useQuery({
    queryKey: hairHealthKeys.calendarSummary(),
    queryFn: getCalendarSummary,
    enabled: !!profile,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to generate calendar events from ritual plan
 */
export function useGenerateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { weeksToGenerate?: number; replaceExisting?: boolean }) =>
      generateCalendar(options),
    onSuccess: () => {
      // Invalidate all calendar-related queries
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.upcomingRituals(7) });
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.upcomingRituals(14) });
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.upcomingRituals(30) });
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.calendarSummary() });
    },
  });
}

/**
 * Hook to mark a calendar event as completed
 */
export function useCompleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      quality,
    }: {
      eventId: string;
      quality?: "EXCELLENT" | "GOOD" | "ADEQUATE" | "POOR";
    }) => completeCalendarEvent(eventId, quality),
    onSuccess: () => {
      // Invalidate upcoming and summary to reflect completion
      queryClient.invalidateQueries({ queryKey: ["hair-health", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.calendarSummary() });
    },
  });
}

/**
 * Hook to skip a calendar event
 */
export function useSkipCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason?: string }) =>
      skipCalendarEvent(eventId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hair-health", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.calendarSummary() });
    },
  });
}

/**
 * Hook to reschedule a calendar event
 */
export function useRescheduleCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, newDate }: { eventId: string; newDate: Date }) =>
      rescheduleCalendarEvent(eventId, newDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hair-health", "upcoming"] });
      queryClient.invalidateQueries({ queryKey: hairHealthKeys.calendarSummary() });
    },
  });
}

/**
 * Hook to check if user has calendar events generated
 */
export function useHasCalendarEvents() {
  const { data, isLoading } = useUpcomingRituals(30);
  return {
    hasEvents: (data?.totalUpcoming ?? 0) > 0,
    eventCount: data?.totalUpcoming ?? 0,
    isLoading,
  };
}

/**
 * Hook to get next wash day info
 */
export function useNextWashDay() {
  const { data, isLoading } = useCalendarSummary();
  return {
    nextRitual: data?.nextRitual ?? null,
    overdueCount: data?.overdueCount ?? 0,
    streakDays: data?.streakDays ?? 0,
    isLoading,
  };
}

/**
 * Hook to get weekly load status
 */
export function useWeeklyLoadStatus() {
  const { data, isLoading } = useCalendarSummary();
  return {
    currentLoad: data?.thisWeekLoad ?? 0,
    maxLoad: data?.maxWeekLoad ?? 100,
    completedThisWeek: data?.completedThisWeek ?? 0,
    loadPercentage: data ? Math.round((data.thisWeekLoad / data.maxWeekLoad) * 100) : 0,
    isLoading,
  };
}
