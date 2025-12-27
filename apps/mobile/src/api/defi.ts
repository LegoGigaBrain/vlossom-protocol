/**
 * DeFi API Client (V7.1.1)
 *
 * Handles DeFi-related API calls via the /api/v1/liquidity backend routes:
 * - Get pools list
 * - Get user deposits/positions
 * - Deposit/withdraw operations (stake/unstake)
 * - Get yield/earnings history
 *
 * Backend Reference: services/api/src/routes/liquidity.ts
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type PoolTier = 'GENESIS' | 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface Pool {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: string;
  tvlUsd: number;
  userStake: string;
  userStakeUsd: number;
  minStake: string;
  maxStake: string;
  lockPeriodDays: number;
  isActive: boolean;
  tier: PoolTier;
}

export interface DefiEarnings {
  period: string;
  amount: string;
  amountUsd: number;
}

export interface DefiOverview {
  totalStaked: string;
  totalStakedUsd: number;
  totalEarnings: string;
  totalEarningsUsd: number;
  currentApy: number;
  pools: Pool[];
  recentEarnings: DefiEarnings[];
}

export interface StakeRequest {
  poolId: string;
  amount: string;
}

export interface StakeResponse {
  success: boolean;
  txHash?: string;
  newBalance?: string;
  message?: string;
}

export interface UnstakeRequest {
  poolId: string;
  amount: string; // shares to withdraw
}

export interface UnstakeResponse {
  success: boolean;
  txHash?: string;
  newBalance?: string;
  message?: string;
}

export interface UserPosition {
  poolId: string;
  poolName: string;
  stakedAmount: string;
  stakedAmountUsd: number;
  earnedAmount: string;
  earnedAmountUsd: number;
  currentApy: number;
  stakedAt: string;
  unlockDate: string | null;
  isLocked: boolean;
}

// Backend response types
interface PoolsResponse {
  success: boolean;
  data: {
    pools: Pool[];
    total: number;
    page: number;
    limit: number;
  };
}

interface PoolResponse {
  success: boolean;
  data: {
    pool: Pool;
  };
}

interface DepositsResponse {
  success: boolean;
  data: {
    deposits: UserPosition[];
  };
}

interface YieldResponse {
  success: boolean;
  data: {
    totalPending: string;
    totalClaimed: string;
    pools: {
      poolId: string;
      poolName: string;
      pending: string;
      apy: number;
    }[];
  };
}

interface GlobalStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalTvl: string;
      totalUsers: number;
      totalPools: number;
      averageApy: number;
    };
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get DeFi overview including pools, positions, and yield
 * Aggregates data from multiple endpoints
 */
export async function getDefiOverview(): Promise<DefiOverview> {
  // Fetch pools, deposits, and yield in parallel
  const [poolsRes, depositsRes, yieldRes, statsRes] = await Promise.all([
    apiRequest<PoolsResponse>('/api/v1/liquidity/pools'),
    apiRequest<DepositsResponse>('/api/v1/liquidity/deposits').catch(() => ({
      success: true,
      data: { deposits: [] },
    })),
    apiRequest<YieldResponse>('/api/v1/liquidity/yield').catch(() => ({
      success: true,
      data: { totalPending: '0', totalClaimed: '0', pools: [] },
    })),
    apiRequest<GlobalStatsResponse>('/api/v1/liquidity/stats').catch(() => ({
      success: true,
      data: { stats: { totalTvl: '0', totalUsers: 0, totalPools: 0, averageApy: 0 } },
    })),
  ]);

  const pools = poolsRes.data?.pools || [];
  const deposits = depositsRes.data?.deposits || [];
  const yieldData = yieldRes.data;

  // Calculate totals from deposits
  let totalStaked = 0;
  deposits.forEach((d) => {
    totalStaked += parseFloat(d.stakedAmount) || 0;
  });

  // Map pools with user stake info
  const enrichedPools: Pool[] = pools.map((pool) => {
    const userDeposit = deposits.find((d) => d.poolId === pool.id);
    return {
      ...pool,
      userStake: userDeposit?.stakedAmount || '0',
      userStakeUsd: userDeposit?.stakedAmountUsd || 0,
    };
  });

  return {
    totalStaked: totalStaked.toFixed(2),
    totalStakedUsd: totalStaked,
    totalEarnings: yieldData?.totalClaimed || '0',
    totalEarningsUsd: parseFloat(yieldData?.totalClaimed || '0'),
    currentApy: statsRes.data?.stats?.averageApy || 0,
    pools: enrichedPools,
    recentEarnings: [], // Would need an earnings history endpoint
  };
}

/**
 * Get all available pools
 */
export async function getPools(): Promise<Pool[]> {
  const response = await apiRequest<PoolsResponse>('/api/v1/liquidity/pools');
  return response.data?.pools || [];
}

/**
 * Get single pool details
 */
export async function getPool(poolId: string): Promise<Pool> {
  const response = await apiRequest<PoolResponse>(`/api/v1/liquidity/pools/${poolId}`);
  return response.data.pool;
}

/**
 * Get the genesis pool (VLP)
 */
export async function getGenesisPool(): Promise<Pool | null> {
  try {
    const response = await apiRequest<PoolResponse>('/api/v1/liquidity/pools/genesis');
    return response.data?.pool || null;
  } catch {
    return null;
  }
}

/**
 * Get user's positions across all pools
 */
export async function getUserPositions(): Promise<UserPosition[]> {
  const response = await apiRequest<DepositsResponse>('/api/v1/liquidity/deposits');
  return response.data?.deposits || [];
}

/**
 * Deposit (stake) tokens in a pool
 */
export async function stake(data: StakeRequest): Promise<StakeResponse> {
  const response = await apiRequest<{ success: boolean; data: StakeResponse }>('/api/v1/liquidity/deposit', {
    method: 'POST',
    body: data,
  });
  return { success: response.success, ...response.data };
}

/**
 * Withdraw (unstake) tokens from a pool
 */
export async function unstake(data: UnstakeRequest): Promise<UnstakeResponse> {
  const response = await apiRequest<{ success: boolean; data: UnstakeResponse }>('/api/v1/liquidity/withdraw', {
    method: 'POST',
    body: { poolId: data.poolId, shares: data.amount },
  });
  return { success: response.success, ...response.data };
}

/**
 * Get yield summary
 */
export async function getYieldSummary(): Promise<{
  totalPending: string;
  totalClaimed: string;
  pools: { poolId: string; poolName: string; pending: string; apy: number }[];
}> {
  const response = await apiRequest<YieldResponse>('/api/v1/liquidity/yield');
  return response.data;
}

/**
 * Claim earnings from a specific pool
 */
export async function claimEarnings(poolId: string): Promise<{
  success: boolean;
  amount?: string;
  message?: string;
}> {
  const response = await apiRequest<{ success: boolean; data: { amount: string } }>('/api/v1/liquidity/yield/claim', {
    method: 'POST',
    body: { poolId },
  });
  return { success: response.success, amount: response.data?.amount };
}

/**
 * Claim all earnings from all pools
 */
export async function claimAllEarnings(): Promise<{
  success: boolean;
  totalClaimed: string;
  claims: { poolId: string; amount: string }[];
}> {
  const response = await apiRequest<{
    success: boolean;
    data: { claims: { poolId: string; amount: string }[]; totalClaimed: string };
  }>('/api/v1/liquidity/yield/claim-all', {
    method: 'POST',
  });
  return {
    success: response.success,
    totalClaimed: response.data?.totalClaimed || '0',
    claims: response.data?.claims || [],
  };
}

/**
 * Get user's referral tier status
 */
export async function getTierStatus(): Promise<{
  tier: PoolTier;
  referralCount: number;
  nextTierRequirement: number;
  benefits: string[];
}> {
  const response = await apiRequest<{
    success: boolean;
    data: {
      tier: PoolTier;
      referralCount: number;
      nextTierRequirement: number;
      benefits: string[];
    };
  }>('/api/v1/liquidity/tier');
  return response.data;
}

/**
 * Get global DeFi statistics
 */
export async function getGlobalStats(): Promise<{
  totalTvl: string;
  totalUsers: number;
  totalPools: number;
  averageApy: number;
}> {
  const response = await apiRequest<GlobalStatsResponse>('/api/v1/liquidity/stats');
  return response.data.stats;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format APY for display
 */
export function formatApy(apy: number): string {
  return `${apy.toFixed(1)}%`;
}

/**
 * Format TVL for display
 */
export function formatTvl(tvlUsd: number): string {
  if (tvlUsd >= 1000000) {
    return `$${(tvlUsd / 1000000).toFixed(2)}M`;
  }
  if (tvlUsd >= 1000) {
    return `$${(tvlUsd / 1000).toFixed(1)}K`;
  }
  return `$${tvlUsd.toFixed(2)}`;
}

/**
 * Get pool tier label
 */
export function getPoolTierLabel(tier: PoolTier): string {
  switch (tier) {
    case 'GENESIS':
      return 'Genesis';
    case 'TIER_1':
      return 'Tier 1';
    case 'TIER_2':
      return 'Tier 2';
    case 'TIER_3':
      return 'Tier 3';
    default:
      return tier;
  }
}

/**
 * Get pool tier color
 */
export function getPoolTierColor(tier: PoolTier): string {
  switch (tier) {
    case 'GENESIS':
      return '#311E6B'; // Primary purple
    case 'TIER_1':
      return '#22C55E'; // Green
    case 'TIER_2':
      return '#3B82F6'; // Blue
    case 'TIER_3':
      return '#FFD700'; // Gold
    default:
      return '#6B7280';
  }
}

/**
 * Calculate estimated annual earnings
 */
export function calculateEstimatedEarnings(stakeAmount: number, apy: number): number {
  return stakeAmount * (apy / 100);
}

/**
 * Format lock period
 */
export function formatLockPeriod(days: number): string {
  if (days === 0) return 'No lock';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days === 7) return '1 week';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days === 30) return '1 month';
  return `${Math.floor(days / 30)} months`;
}
