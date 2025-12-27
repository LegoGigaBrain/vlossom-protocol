/**
 * DeFi Store (V7.1.1)
 *
 * Zustand store for managing DeFi state.
 * Handles pools, positions, staking, and earnings.
 *
 * V7.1.1: Updated to use /api/v1/liquidity/* endpoints
 */

import { create } from 'zustand';
import {
  getDefiOverview,
  getPools,
  getUserPositions,
  stake,
  unstake,
  claimEarnings,
  claimAllEarnings,
  getYieldSummary,
  getGlobalStats,
  type Pool,
  type UserPosition,
  type DefiEarnings,
  type DefiOverview,
} from '../api/defi';
import { getIsDemoMode } from './demo-mode';
import { MOCK_DEFI_STATE, MOCK_DEFI_POOLS, MOCK_DEFI_EARNINGS } from '../data/mock-data';

// ============================================================================
// Types
// ============================================================================

interface DefiState {
  // Overview
  totalStaked: string;
  totalStakedUsd: number;
  totalEarnings: string;
  totalEarningsUsd: number;
  currentApy: number;

  // Collections
  pools: Pool[];
  positions: UserPosition[];
  recentEarnings: DefiEarnings[];

  // Loading states
  overviewLoading: boolean;
  overviewError: string | null;
  poolsLoading: boolean;
  positionsLoading: boolean;
  stakeLoading: boolean;
  unstakeLoading: boolean;
  claimLoading: boolean;

  // Operation results
  stakeError: string | null;
  unstakeError: string | null;

  // Global stats
  globalTvl: string;
  globalTvlUsd: number;
  globalUsers: number;
  globalAverageApy: number;

  // Actions
  fetchOverview: () => Promise<void>;
  fetchPools: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchGlobalStats: () => Promise<void>;
  stakeTokens: (poolId: string, amount: string) => Promise<boolean>;
  unstakeTokens: (poolId: string, amount: string) => Promise<boolean>;
  claimPoolEarnings: (poolId: string) => Promise<boolean>;
  claimAllPoolEarnings: () => Promise<boolean>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

const initialState = {
  totalStaked: '0.00',
  totalStakedUsd: 0,
  totalEarnings: '0.00',
  totalEarningsUsd: 0,
  currentApy: 0,
  pools: [],
  positions: [],
  recentEarnings: [],
  overviewLoading: false,
  overviewError: null,
  poolsLoading: false,
  positionsLoading: false,
  stakeLoading: false,
  unstakeLoading: false,
  claimLoading: false,
  stakeError: null,
  unstakeError: null,
  globalTvl: '0',
  globalTvlUsd: 0,
  globalUsers: 0,
  globalAverageApy: 0,
};

export const useDefiStore = create<DefiState>((set, get) => ({
  ...initialState,

  /**
   * Fetch complete DeFi overview
   */
  fetchOverview: async () => {
    set({ overviewLoading: true, overviewError: null });

    try {
      // Check demo mode
      if (getIsDemoMode()) {
        set({
          totalStaked: MOCK_DEFI_STATE.totalStaked,
          totalStakedUsd: MOCK_DEFI_STATE.totalStakedUsd,
          totalEarnings: MOCK_DEFI_STATE.totalEarnings,
          totalEarningsUsd: MOCK_DEFI_STATE.totalEarningsUsd,
          currentApy: MOCK_DEFI_STATE.currentApy,
          pools: MOCK_DEFI_POOLS as Pool[],
          recentEarnings: MOCK_DEFI_EARNINGS,
          overviewLoading: false,
        });
        return;
      }

      const overview = await getDefiOverview();

      set({
        totalStaked: overview.totalStaked,
        totalStakedUsd: overview.totalStakedUsd,
        totalEarnings: overview.totalEarnings,
        totalEarningsUsd: overview.totalEarningsUsd,
        currentApy: overview.currentApy,
        pools: overview.pools,
        recentEarnings: overview.recentEarnings,
        overviewLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch DeFi data';
      set({ overviewLoading: false, overviewError: message });
    }
  },

  /**
   * Fetch all available pools
   */
  fetchPools: async () => {
    set({ poolsLoading: true });

    try {
      if (getIsDemoMode()) {
        set({ pools: MOCK_DEFI_POOLS as Pool[], poolsLoading: false });
        return;
      }

      const pools = await getPools();
      set({ pools, poolsLoading: false });
    } catch (error) {
      set({ poolsLoading: false });
    }
  },

  /**
   * Fetch user positions
   */
  fetchPositions: async () => {
    set({ positionsLoading: true });

    try {
      if (getIsDemoMode()) {
        // Convert mock pools to positions
        const positions: UserPosition[] = MOCK_DEFI_POOLS
          .filter((p) => parseFloat(p.userStake) > 0)
          .map((p) => ({
            poolId: p.id,
            poolName: p.name,
            stakedAmount: p.userStake,
            stakedAmountUsd: p.userStakeUsd,
            earnedAmount: '15.49', // Mock earnings
            earnedAmountUsd: 15.49,
            currentApy: p.apy,
            stakedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            unlockDate: null,
            isLocked: false,
          }));
        set({ positions, positionsLoading: false });
        return;
      }

      const positions = await getUserPositions();
      set({ positions, positionsLoading: false });
    } catch (error) {
      set({ positionsLoading: false });
    }
  },

  /**
   * Stake tokens in a pool
   */
  stakeTokens: async (poolId: string, amount: string) => {
    set({ stakeLoading: true, stakeError: null });

    try {
      if (getIsDemoMode()) {
        // Simulate staking in demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update the pool's user stake
        set((state) => ({
          pools: state.pools.map((p) =>
            p.id === poolId
              ? {
                  ...p,
                  userStake: (parseFloat(p.userStake) + parseFloat(amount)).toFixed(2),
                  userStakeUsd: p.userStakeUsd + parseFloat(amount),
                }
              : p
          ),
          totalStaked: (parseFloat(state.totalStaked) + parseFloat(amount)).toFixed(2),
          totalStakedUsd: state.totalStakedUsd + parseFloat(amount),
          stakeLoading: false,
        }));
        return true;
      }

      await stake({ poolId, amount });

      // Refresh data after successful stake
      await get().fetchOverview();

      set({ stakeLoading: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stake';
      set({ stakeLoading: false, stakeError: message });
      return false;
    }
  },

  /**
   * Unstake tokens from a pool
   */
  unstakeTokens: async (poolId: string, amount: string) => {
    set({ unstakeLoading: true, unstakeError: null });

    try {
      if (getIsDemoMode()) {
        // Simulate unstaking in demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update the pool's user stake
        set((state) => ({
          pools: state.pools.map((p) =>
            p.id === poolId
              ? {
                  ...p,
                  userStake: Math.max(0, parseFloat(p.userStake) - parseFloat(amount)).toFixed(2),
                  userStakeUsd: Math.max(0, p.userStakeUsd - parseFloat(amount)),
                }
              : p
          ),
          totalStaked: Math.max(0, parseFloat(state.totalStaked) - parseFloat(amount)).toFixed(2),
          totalStakedUsd: Math.max(0, state.totalStakedUsd - parseFloat(amount)),
          unstakeLoading: false,
        }));
        return true;
      }

      await unstake({ poolId, amount });

      // Refresh data after successful unstake
      await get().fetchOverview();

      set({ unstakeLoading: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unstake';
      set({ unstakeLoading: false, unstakeError: message });
      return false;
    }
  },

  /**
   * Claim earnings from a pool
   */
  claimPoolEarnings: async (poolId: string) => {
    set({ claimLoading: true });

    try {
      if (getIsDemoMode()) {
        // Simulate claiming in demo mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({ claimLoading: false });
        return true;
      }

      await claimEarnings(poolId);

      // Refresh data after successful claim
      await get().fetchOverview();

      set({ claimLoading: false });
      return true;
    } catch (error) {
      set({ claimLoading: false });
      return false;
    }
  },

  /**
   * Claim all earnings from all pools
   */
  claimAllPoolEarnings: async () => {
    set({ claimLoading: true });

    try {
      if (getIsDemoMode()) {
        // Simulate claiming all in demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
        set({ claimLoading: false });
        return true;
      }

      await claimAllEarnings();

      // Refresh data after successful claim
      await get().fetchOverview();

      set({ claimLoading: false });
      return true;
    } catch (error) {
      set({ claimLoading: false });
      return false;
    }
  },

  /**
   * Fetch global DeFi statistics
   */
  fetchGlobalStats: async () => {
    try {
      if (getIsDemoMode()) {
        set({
          globalTvl: '125000',
          globalTvlUsd: 125000,
          globalUsers: 342,
          globalAverageApy: 8.5,
        });
        return;
      }

      const stats = await getGlobalStats();
      set({
        globalTvl: stats.totalTvl,
        globalTvlUsd: parseFloat(stats.totalTvl),
        globalUsers: stats.totalUsers,
        globalAverageApy: stats.averageApy,
      });
    } catch (error) {
      // Silently fail for global stats
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

export const selectTotalStaked = (state: DefiState) => state.totalStaked;
export const selectTotalStakedUsd = (state: DefiState) => state.totalStakedUsd;
export const selectTotalEarnings = (state: DefiState) => state.totalEarnings;
export const selectTotalEarningsUsd = (state: DefiState) => state.totalEarningsUsd;
export const selectCurrentApy = (state: DefiState) => state.currentApy;
export const selectPools = (state: DefiState) => state.pools;
export const selectActivePools = (state: DefiState) => state.pools.filter((p) => p.isActive);
export const selectPositions = (state: DefiState) => state.positions;
export const selectRecentEarnings = (state: DefiState) => state.recentEarnings;
export const selectOverviewLoading = (state: DefiState) => state.overviewLoading;
export const selectOverviewError = (state: DefiState) => state.overviewError;
export const selectStakeLoading = (state: DefiState) => state.stakeLoading;
export const selectUnstakeLoading = (state: DefiState) => state.unstakeLoading;
export const selectClaimLoading = (state: DefiState) => state.claimLoading;
export const selectGlobalTvl = (state: DefiState) => state.globalTvl;
export const selectGlobalTvlUsd = (state: DefiState) => state.globalTvlUsd;
export const selectGlobalUsers = (state: DefiState) => state.globalUsers;
export const selectGlobalAverageApy = (state: DefiState) => state.globalAverageApy;
