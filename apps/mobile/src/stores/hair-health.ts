/**
 * Hair Health Store (V6.9.0)
 *
 * Zustand store for managing hair health profile state.
 * Handles profile CRUD, learning progress, and V6.9 calendar intelligence.
 */

import { create } from 'zustand';
import {
  getHairProfile,
  createHairProfile,
  updateHairProfile,
  getLearningProgress,
  unlockLearningNode,
  // V6.9 Calendar Intelligence
  getRitualPlan,
  getUpcomingRituals,
  getCalendarSummary,
  generateCalendar,
  completeCalendarEvent,
  skipCalendarEvent,
  type HairProfile,
  type HairProfileCreateInput,
  type HairProfileUpdateInput,
  type LearningNodeId,
  type UpcomingRitual,
  type CalendarGenerateResult,
} from '../api/hair-health';

// ============================================================================
// Types
// ============================================================================

interface CalendarSummary {
  nextRitual: UpcomingRitual | null;
  thisWeekLoad: number;
  maxWeekLoad: number;
  overdueCount: number;
  completedThisWeek: number;
  streakDays: number;
}

interface HairHealthState {
  // Profile
  profile: HairProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  hasProfile: boolean;

  // Learning
  unlockedNodes: string[];
  totalNodes: number;
  learningLoading: boolean;

  // Onboarding state
  onboardingStep: number;
  onboardingData: Partial<HairProfileCreateInput>;

  // V6.9 Calendar Intelligence
  calendarSummary: CalendarSummary | null;
  upcomingRituals: UpcomingRitual[];
  calendarLoading: boolean;
  calendarError: string | null;
  hasCalendarEvents: boolean;

  // Actions - Profile
  fetchProfile: () => Promise<void>;
  createProfile: (input: HairProfileCreateInput) => Promise<HairProfile | null>;
  updateProfile: (input: HairProfileUpdateInput) => Promise<HairProfile | null>;

  // Actions - Learning
  fetchLearningProgress: () => Promise<void>;
  unlockNode: (nodeId: LearningNodeId) => Promise<void>;

  // Actions - Onboarding
  setOnboardingStep: (step: number) => void;
  setOnboardingData: (data: Partial<HairProfileCreateInput>) => void;
  resetOnboarding: () => void;
  completeOnboarding: () => Promise<HairProfile | null>;

  // V6.9 Actions - Calendar
  fetchCalendarSummary: () => Promise<void>;
  fetchUpcomingRituals: (days?: number) => Promise<void>;
  generateCalendarEvents: (weeks?: number) => Promise<CalendarGenerateResult | null>;
  completeRitual: (eventId: string, quality?: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR') => Promise<void>;
  skipRitual: (eventId: string, reason?: string) => Promise<void>;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  profile: null as HairProfile | null,
  profileLoading: false,
  profileError: null as string | null,
  hasProfile: false,

  unlockedNodes: [] as string[],
  totalNodes: 6,
  learningLoading: false,

  onboardingStep: 0,
  onboardingData: {} as Partial<HairProfileCreateInput>,

  // V6.9 Calendar Intelligence
  calendarSummary: null as CalendarSummary | null,
  upcomingRituals: [] as UpcomingRitual[],
  calendarLoading: false,
  calendarError: null as string | null,
  hasCalendarEvents: false,
};

// ============================================================================
// Store
// ============================================================================

export const useHairHealthStore = create<HairHealthState>((set, get) => ({
  ...initialState,

  /**
   * Fetch user's hair health profile
   */
  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });

    try {
      const profile = await getHairProfile();
      set({
        profile,
        profileLoading: false,
        hasProfile: profile !== null,
      });
    } catch (error) {
      set({
        profileLoading: false,
        profileError: error instanceof Error ? error.message : 'Failed to fetch profile',
      });
    }
  },

  /**
   * Create new hair health profile
   */
  createProfile: async (input: HairProfileCreateInput) => {
    set({ profileLoading: true, profileError: null });

    try {
      const profile = await createHairProfile(input);
      set({
        profile,
        profileLoading: false,
        hasProfile: true,
      });
      return profile;
    } catch (error) {
      set({
        profileLoading: false,
        profileError: error instanceof Error ? error.message : 'Failed to create profile',
      });
      return null;
    }
  },

  /**
   * Update existing hair health profile
   */
  updateProfile: async (input: HairProfileUpdateInput) => {
    set({ profileLoading: true, profileError: null });

    try {
      const profile = await updateHairProfile(input);
      set({
        profile,
        profileLoading: false,
      });
      return profile;
    } catch (error) {
      set({
        profileLoading: false,
        profileError: error instanceof Error ? error.message : 'Failed to update profile',
      });
      return null;
    }
  },

  /**
   * Fetch learning progress
   */
  fetchLearningProgress: async () => {
    set({ learningLoading: true });

    try {
      const progress = await getLearningProgress();
      set({
        unlockedNodes: progress.unlockedNodes,
        totalNodes: progress.totalAvailable,
        learningLoading: false,
      });
    } catch (error) {
      set({ learningLoading: false });
    }
  },

  /**
   * Unlock a learning node
   */
  unlockNode: async (nodeId: LearningNodeId) => {
    try {
      const result = await unlockLearningNode(nodeId);
      set({ unlockedNodes: result.unlockedNodes });
    } catch (error) {
      // Silent failure for learning unlock
    }
  },

  /**
   * Set onboarding step
   */
  setOnboardingStep: (step: number) => {
    set({ onboardingStep: step });
  },

  /**
   * Set onboarding data (partial updates)
   */
  setOnboardingData: (data: Partial<HairProfileCreateInput>) => {
    const { onboardingData } = get();
    set({
      onboardingData: { ...onboardingData, ...data },
    });
  },

  /**
   * Reset onboarding state
   */
  resetOnboarding: () => {
    set({
      onboardingStep: 0,
      onboardingData: {},
    });
  },

  /**
   * Complete onboarding and create profile
   */
  completeOnboarding: async () => {
    const { onboardingData, createProfile } = get();

    // Set defaults for required fields
    const input: HairProfileCreateInput = {
      routineType: 'MODERATE',
      ...onboardingData,
    };

    const profile = await createProfile(input);

    if (profile) {
      set({
        onboardingStep: 0,
        onboardingData: {},
      });
    }

    return profile;
  },

  // ==========================================================================
  // V6.9 Calendar Intelligence Actions
  // ==========================================================================

  /**
   * Fetch calendar summary for widget display
   */
  fetchCalendarSummary: async () => {
    set({ calendarLoading: true, calendarError: null });

    try {
      const summary = await getCalendarSummary();
      set({
        calendarSummary: summary,
        calendarLoading: false,
        hasCalendarEvents: summary.nextRitual !== null || summary.completedThisWeek > 0,
      });
    } catch (error) {
      set({
        calendarLoading: false,
        calendarError: error instanceof Error ? error.message : 'Failed to fetch calendar',
      });
    }
  },

  /**
   * Fetch upcoming rituals for the next N days
   */
  fetchUpcomingRituals: async (days: number = 14) => {
    set({ calendarLoading: true });

    try {
      const data = await getUpcomingRituals(days);
      set({
        upcomingRituals: data.rituals,
        calendarLoading: false,
        hasCalendarEvents: data.totalUpcoming > 0,
      });
    } catch (error) {
      set({ calendarLoading: false });
    }
  },

  /**
   * Generate calendar events from ritual plan
   */
  generateCalendarEvents: async (weeks: number = 2) => {
    set({ calendarLoading: true, calendarError: null });

    try {
      const result = await generateCalendar({ weeksToGenerate: weeks });

      // Refetch calendar data after generation
      const { fetchCalendarSummary, fetchUpcomingRituals } = get();
      await Promise.all([fetchCalendarSummary(), fetchUpcomingRituals()]);

      set({ calendarLoading: false });
      return result;
    } catch (error) {
      set({
        calendarLoading: false,
        calendarError: error instanceof Error ? error.message : 'Failed to generate calendar',
      });
      return null;
    }
  },

  /**
   * Mark a ritual as completed
   */
  completeRitual: async (eventId: string, quality: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR' = 'GOOD') => {
    try {
      await completeCalendarEvent(eventId, quality);

      // Refetch to update state
      const { fetchCalendarSummary, fetchUpcomingRituals } = get();
      await Promise.all([fetchCalendarSummary(), fetchUpcomingRituals()]);
    } catch (error) {
      // Silent failure, user can retry
    }
  },

  /**
   * Skip a ritual
   */
  skipRitual: async (eventId: string, reason?: string) => {
    try {
      await skipCalendarEvent(eventId, reason);

      // Refetch to update state
      const { fetchCalendarSummary, fetchUpcomingRituals } = get();
      await Promise.all([fetchCalendarSummary(), fetchUpcomingRituals()]);
    } catch (error) {
      // Silent failure, user can retry
    }
  },

  /**
   * Reset store
   */
  reset: () => {
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectHairProfile = (state: HairHealthState) => state.profile;
export const selectHasProfile = (state: HairHealthState) => state.hasProfile;
export const selectUnlockedNodes = (state: HairHealthState) => state.unlockedNodes;
export const selectOnboardingStep = (state: HairHealthState) => state.onboardingStep;
export const selectOnboardingData = (state: HairHealthState) => state.onboardingData;

// V6.9 Calendar Selectors
export const selectCalendarSummary = (state: HairHealthState) => state.calendarSummary;
export const selectUpcomingRituals = (state: HairHealthState) => state.upcomingRituals;
export const selectCalendarLoading = (state: HairHealthState) => state.calendarLoading;
export const selectHasCalendarEvents = (state: HairHealthState) => state.hasCalendarEvents;
export const selectNextRitual = (state: HairHealthState) => state.calendarSummary?.nextRitual ?? null;
export const selectOverdueCount = (state: HairHealthState) => state.calendarSummary?.overdueCount ?? 0;
export const selectStreakDays = (state: HairHealthState) => state.calendarSummary?.streakDays ?? 0;
