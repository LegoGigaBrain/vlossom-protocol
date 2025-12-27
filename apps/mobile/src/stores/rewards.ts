/**
 * Rewards Store (V7.1.1)
 *
 * Zustand store for managing rewards state.
 * Handles XP, tiers, badges, streaks, and achievements.
 *
 * V7.1.1: Updated to use real API endpoints
 */

import { create } from 'zustand';
import {
  getRewardsOverview,
  getBadges,
  getStreak,
  getXPHistory,
  getLeaderboard,
  getReferralCode,
  getReferralStats,
  getTierFromXp,
  calculateTierProgress,
  TIER_CONFIG,
  type UserRewards,
  type Badge,
  type Streak,
  type Achievement,
  type TierInfo,
  type XPHistoryItem,
  type LeaderboardEntry,
  type ReferralInfo,
} from '../api/rewards';
import { getIsDemoMode } from './demo-mode';
import {
  MOCK_REWARDS_OVERVIEW,
  MOCK_BADGES,
  MOCK_STREAKS,
  MOCK_ACHIEVEMENTS,
} from '../data/mock-data';

// ============================================================================
// Types
// ============================================================================

interface RewardsState {
  // User rewards
  userRewards: UserRewards | null;
  tierInfo: TierInfo | null;
  nextTierInfo: TierInfo | null;

  // Collections
  badges: Badge[];
  streak: Streak | null;
  xpHistory: XPHistoryItem[];
  leaderboard: LeaderboardEntry[];
  referralInfo: ReferralInfo | null;

  // Legacy for compatibility
  streaks: Streak[];
  achievements: Achievement[];

  // Loading states
  overviewLoading: boolean;
  overviewError: string | null;
  badgesLoading: boolean;
  streakLoading: boolean;
  xpHistoryLoading: boolean;
  leaderboardLoading: boolean;
  referralLoading: boolean;

  // Pagination for XP history
  xpHistoryHasMore: boolean;

  // Actions
  fetchOverview: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchXPHistory: (limit?: number) => Promise<void>;
  fetchLeaderboard: (type?: 'xp' | 'streak') => Promise<void>;
  fetchReferralInfo: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  userRewards: null,
  tierInfo: null,
  nextTierInfo: null,
  badges: [],
  streak: null,
  xpHistory: [],
  leaderboard: [],
  referralInfo: null,
  streaks: [],
  achievements: [],
  overviewLoading: false,
  overviewError: null,
  badgesLoading: false,
  streakLoading: false,
  xpHistoryLoading: false,
  leaderboardLoading: false,
  referralLoading: false,
  xpHistoryHasMore: false,
};

export const useRewardsStore = create<RewardsState>((set, get) => ({
  ...initialState,

  /**
   * Fetch complete rewards overview (user rewards)
   */
  fetchOverview: async () => {
    set({ overviewLoading: true, overviewError: null });

    try {
      // Check demo mode
      if (getIsDemoMode()) {
        const tier = getTierFromXp(MOCK_REWARDS_OVERVIEW.user.xp);
        const { progress, xpToNext } = calculateTierProgress(MOCK_REWARDS_OVERVIEW.user.xp);
        const tiers: Array<'SEED' | 'SPROUT' | 'BLOOM' | 'FLOURISH' | 'EVERGREEN'> = ['SEED', 'SPROUT', 'BLOOM', 'FLOURISH', 'EVERGREEN'];
        const tierIndex = tiers.indexOf(tier);
        const nextTier = tierIndex < tiers.length - 1 ? tiers[tierIndex + 1] : null;

        set({
          userRewards: {
            ...MOCK_REWARDS_OVERVIEW.user,
            tier,
            tierProgress: progress,
            xpToNextTier: xpToNext,
          },
          tierInfo: TIER_CONFIG[tier],
          nextTierInfo: nextTier ? TIER_CONFIG[nextTier] : null,
          badges: MOCK_REWARDS_OVERVIEW.badges,
          streak: MOCK_REWARDS_OVERVIEW.user.streak,
          streaks: MOCK_STREAKS,
          achievements: MOCK_REWARDS_OVERVIEW.recentAchievements,
          overviewLoading: false,
        });
        return;
      }

      // Fetch user rewards from API
      const userRewards = await getRewardsOverview();

      // Calculate tier info from XP
      const tier = getTierFromXp(userRewards.xp);
      const { progress, xpToNext } = calculateTierProgress(userRewards.xp);
      const tiers: Array<'SEED' | 'SPROUT' | 'BLOOM' | 'FLOURISH' | 'EVERGREEN'> = ['SEED', 'SPROUT', 'BLOOM', 'FLOURISH', 'EVERGREEN'];
      const tierIndex = tiers.indexOf(tier);
      const nextTier = tierIndex < tiers.length - 1 ? tiers[tierIndex + 1] : null;

      set({
        userRewards: {
          ...userRewards,
          tier,
          tierProgress: progress,
          xpToNextTier: xpToNext,
        },
        tierInfo: TIER_CONFIG[tier],
        nextTierInfo: nextTier ? TIER_CONFIG[nextTier] : null,
        badges: userRewards.badges || [],
        streak: userRewards.streak || null,
        streaks: userRewards.streak ? [userRewards.streak] : [],
        overviewLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rewards';
      set({ overviewLoading: false, overviewError: message });
    }
  },

  /**
   * Fetch all badges with earned status
   */
  fetchBadges: async () => {
    set({ badgesLoading: true });

    try {
      if (getIsDemoMode()) {
        set({ badges: MOCK_BADGES, badgesLoading: false });
        return;
      }

      const { badges } = await getBadges();
      set({ badges, badgesLoading: false });
    } catch (error) {
      set({ badgesLoading: false });
    }
  },

  /**
   * Fetch user's current streak
   */
  fetchStreak: async () => {
    set({ streakLoading: true });

    try {
      if (getIsDemoMode()) {
        set({
          streak: MOCK_STREAKS[0] || null,
          streaks: MOCK_STREAKS,
          streakLoading: false,
        });
        return;
      }

      const streak = await getStreak();
      set({
        streak,
        streaks: streak ? [streak] : [],
        streakLoading: false,
      });
    } catch (error) {
      set({ streakLoading: false });
    }
  },

  /**
   * Fetch XP history
   */
  fetchXPHistory: async (limit = 20) => {
    set({ xpHistoryLoading: true });

    try {
      if (getIsDemoMode()) {
        // Generate mock XP history
        const mockHistory: XPHistoryItem[] = [
          { id: '1', amount: 50, reason: 'Completed booking', createdAt: new Date().toISOString() },
          { id: '2', amount: 25, reason: 'Left a review', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', amount: 100, reason: 'First booking bonus', createdAt: new Date(Date.now() - 172800000).toISOString() },
        ];
        set({ xpHistory: mockHistory, xpHistoryHasMore: false, xpHistoryLoading: false });
        return;
      }

      const { history } = await getXPHistory(limit);
      set({
        xpHistory: history,
        xpHistoryHasMore: history.length >= limit,
        xpHistoryLoading: false,
      });
    } catch (error) {
      set({ xpHistoryLoading: false });
    }
  },

  /**
   * Fetch leaderboard
   */
  fetchLeaderboard: async (type = 'xp') => {
    set({ leaderboardLoading: true });

    try {
      if (getIsDemoMode()) {
        // Generate mock leaderboard
        const mockLeaderboard: LeaderboardEntry[] = [
          { rank: 1, userId: '1', displayName: 'Sarah M.', avatarUrl: null, totalXP: 2500, tier: 'FLOURISH' },
          { rank: 2, userId: '2', displayName: 'Thandi K.', avatarUrl: null, totalXP: 2100, tier: 'FLOURISH' },
          { rank: 3, userId: '3', displayName: 'Precious N.', avatarUrl: null, totalXP: 1850, tier: 'BLOOM' },
        ];
        set({ leaderboard: mockLeaderboard, leaderboardLoading: false });
        return;
      }

      const { leaderboard } = await getLeaderboard(type, 50);
      set({ leaderboard, leaderboardLoading: false });
    } catch (error) {
      set({ leaderboardLoading: false });
    }
  },

  /**
   * Fetch referral information
   */
  fetchReferralInfo: async () => {
    set({ referralLoading: true });

    try {
      if (getIsDemoMode()) {
        const mockReferral: ReferralInfo = {
          code: 'VLOSSOM123',
          customCode: null,
          usageCount: 3,
          referralCount: 3,
          activeReferrals: 2,
        };
        set({ referralInfo: mockReferral, referralLoading: false });
        return;
      }

      const referralInfo = await getReferralCode();
      set({ referralInfo, referralLoading: false });
    } catch (error) {
      set({ referralLoading: false });
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectUserRewards = (state: RewardsState) => state.userRewards;
export const selectTierInfo = (state: RewardsState) => state.tierInfo;
export const selectNextTierInfo = (state: RewardsState) => state.nextTierInfo;
export const selectBadges = (state: RewardsState) => state.badges;
export const selectEarnedBadges = (state: RewardsState) => state.badges.filter((b) => b.earned);
export const selectLockedBadges = (state: RewardsState) => state.badges.filter((b) => !b.earned);
export const selectStreak = (state: RewardsState) => state.streak;
export const selectStreaks = (state: RewardsState) => state.streaks;
export const selectActiveStreaks = (state: RewardsState) => state.streaks.filter((s) => s.isActive);
export const selectXPHistory = (state: RewardsState) => state.xpHistory;
export const selectLeaderboard = (state: RewardsState) => state.leaderboard;
export const selectReferralInfo = (state: RewardsState) => state.referralInfo;
export const selectAchievements = (state: RewardsState) => state.achievements;
export const selectOverviewLoading = (state: RewardsState) => state.overviewLoading;
export const selectOverviewError = (state: RewardsState) => state.overviewError;
export const selectBadgesLoading = (state: RewardsState) => state.badgesLoading;
export const selectStreakLoading = (state: RewardsState) => state.streakLoading;
export const selectXPHistoryLoading = (state: RewardsState) => state.xpHistoryLoading;
export const selectLeaderboardLoading = (state: RewardsState) => state.leaderboardLoading;
export const selectReferralLoading = (state: RewardsState) => state.referralLoading;
