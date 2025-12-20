/**
 * Hair Health Store (V6.8.0)
 *
 * Zustand store for managing hair health profile state.
 * Handles profile CRUD and learning progress.
 */

import { create } from 'zustand';
import {
  getHairProfile,
  createHairProfile,
  updateHairProfile,
  getLearningProgress,
  unlockLearningNode,
  type HairProfile,
  type HairProfileCreateInput,
  type HairProfileUpdateInput,
  type LearningNodeId,
} from '../api/hair-health';

// ============================================================================
// Types
// ============================================================================

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
