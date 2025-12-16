/**
 * DeFi Module
 *
 * Liquidity pool and yield functions for Vlossom SDK.
 * Reference: docs/vlossom/12-liquidity-pool-architecture.md
 */

import { VlossomClient } from './client';

// ============================================================================
// Types
// ============================================================================

export type PoolTier = 'GENESIS' | 'TIER_1' | 'TIER_2' | 'TIER_3';
export type PoolStatus = 'ACTIVE' | 'PAUSED' | 'DEPRECATED';

export interface PoolInfo {
  id: string;
  address: string;
  name: string;
  tier: PoolTier;
  status: PoolStatus;
  creatorId: string | null;
  isGenesis: boolean;
  totalDeposits: string;
  totalShares: string;
  currentAPY: string;
  cap: string | null;
  depositorCount: number;
  totalYieldDistributed: string;
  createdAt: string;
  lastSyncAt: string;
}

export interface PoolDetails extends PoolInfo {
  supplyIndex: string;
  creatorFeeBps: number;
  remainingCapacity: string | null;
}

export interface UserDeposit {
  id: string;
  poolId: string;
  poolName: string;
  poolTier: PoolTier;
  shares: string;
  depositAmount: string;
  currentValue: string;
  pendingYield: string;
  totalClaimed: string;
  lastClaimAt: string | null;
  createdAt: string;
}

export interface YieldSummary {
  totalPendingYield: string;
  totalClaimedYield: string;
  positions: YieldPosition[];
}

export interface YieldPosition {
  poolId: string;
  poolName: string;
  pendingYield: string;
  lastClaimAt: string | null;
}

export interface TierInfo {
  userId: string;
  referralPercentile: number;
  tier: PoolTier | null;
  canCreatePool: boolean;
  poolCapLimit: string | null;
  creatorFeeRate: number;
  poolCreationFee: string;
}

export interface PoolStats {
  tvl: string;
  apy: string;
  depositorCount: number;
  totalYield: string;
  last7dYield: string;
}

export interface GlobalStats {
  totalTVL: string;
  totalPools: number;
  totalDepositors: number;
  avgAPY: string;
  last24hYield: string;
}

export interface CreatePoolParams {
  name: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
}

export interface DepositResult {
  success: boolean;
  depositId: string;
  shares: string;
  txHash?: string;
}

export interface WithdrawResult {
  success: boolean;
  amount: string;
  txHash?: string;
}

export interface ClaimResult {
  success: boolean;
  amount: string;
  txHash?: string;
}

// ============================================================================
// Module Interface
// ============================================================================

export interface DefiModule {
  // ============ Pool Queries ============

  /** List all active liquidity pools */
  listPools(params?: {
    tier?: PoolTier;
    includeGenesis?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    pools: PoolInfo[];
    total: number;
    page: number;
    limit: number;
  }>;

  /** Get the genesis pool (VLP) */
  getGenesisPool(): Promise<{ pool: PoolDetails }>;

  /** Get pool details by ID */
  getPool(poolId: string): Promise<{ pool: PoolDetails }>;

  /** Get pool statistics */
  getPoolStats(poolId: string): Promise<{ stats: PoolStats }>;

  /** Get global DeFi statistics */
  getGlobalStats(): Promise<{ stats: GlobalStats }>;

  // ============ Pool Mutations ============

  /** Create a new community pool (tier-gated) */
  createPool(params: CreatePoolParams): Promise<{ pool: PoolDetails }>;

  // ============ Deposit Operations ============

  /** Get user's deposits across all pools */
  getDeposits(): Promise<{ deposits: UserDeposit[] }>;

  /** Deposit USDC into a pool */
  deposit(poolId: string, amount: string): Promise<DepositResult>;

  /** Withdraw USDC from a pool */
  withdraw(poolId: string, shares: string): Promise<WithdrawResult>;

  // ============ Yield Operations ============

  /** Get user's yield summary */
  getYieldSummary(): Promise<YieldSummary>;

  /** Claim yield from a specific pool */
  claimYield(poolId: string): Promise<ClaimResult>;

  /** Claim yield from all pools */
  claimAllYield(): Promise<{
    claims: ClaimResult[];
    totalClaimed: string;
  }>;

  // ============ Tier Operations ============

  /** Get user's referral tier status */
  getTier(): Promise<TierInfo>;
}

// ============================================================================
// Module Implementation
// ============================================================================

/**
 * Create DeFi module bound to a client instance
 */
export function createDefiModule(client: VlossomClient): DefiModule {
  return {
    // ============ Pool Queries ============

    async listPools(params = {}) {
      const searchParams = new URLSearchParams();
      if (params.tier) searchParams.append('tier', params.tier);
      if (params.includeGenesis !== undefined) {
        searchParams.append('includeGenesis', String(params.includeGenesis));
      }
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const query = searchParams.toString();
      const path = `/liquidity/pools${query ? `?${query}` : ''}`;

      const response = await client.get<{
        success: boolean;
        data: { pools: PoolInfo[]; total: number; page: number; limit: number };
      }>(path);

      return response.data.data;
    },

    async getGenesisPool() {
      const response = await client.get<{
        success: boolean;
        data: { pool: PoolDetails };
      }>('/liquidity/pools/genesis');

      return response.data.data;
    },

    async getPool(poolId: string) {
      const response = await client.get<{
        success: boolean;
        data: { pool: PoolDetails };
      }>(`/liquidity/pools/${poolId}`);

      return response.data.data;
    },

    async getPoolStats(poolId: string) {
      const response = await client.get<{
        success: boolean;
        data: { stats: PoolStats };
      }>(`/liquidity/pools/${poolId}/stats`);

      return response.data.data;
    },

    async getGlobalStats() {
      const response = await client.get<{
        success: boolean;
        data: { stats: GlobalStats };
      }>('/liquidity/stats');

      return response.data.data;
    },

    // ============ Pool Mutations ============

    async createPool(params: CreatePoolParams) {
      const response = await client.post<{
        success: boolean;
        data: { pool: PoolDetails };
      }>('/liquidity/pools', params);

      return response.data.data;
    },

    // ============ Deposit Operations ============

    async getDeposits() {
      const response = await client.get<{
        success: boolean;
        data: { deposits: UserDeposit[] };
      }>('/liquidity/deposits');

      return response.data.data;
    },

    async deposit(poolId: string, amount: string) {
      const response = await client.post<{
        success: boolean;
        data: DepositResult;
      }>('/liquidity/deposit', { poolId, amount });

      return response.data.data;
    },

    async withdraw(poolId: string, shares: string) {
      const response = await client.post<{
        success: boolean;
        data: WithdrawResult;
      }>('/liquidity/withdraw', { poolId, shares });

      return response.data.data;
    },

    // ============ Yield Operations ============

    async getYieldSummary() {
      const response = await client.get<{
        success: boolean;
        data: YieldSummary;
      }>('/liquidity/yield');

      return response.data.data;
    },

    async claimYield(poolId: string) {
      const response = await client.post<{
        success: boolean;
        data: ClaimResult;
      }>('/liquidity/yield/claim', { poolId });

      return response.data.data;
    },

    async claimAllYield() {
      const response = await client.post<{
        success: boolean;
        data: { claims: ClaimResult[]; totalClaimed: string };
      }>('/liquidity/yield/claim-all');

      return response.data.data;
    },

    // ============ Tier Operations ============

    async getTier() {
      const response = await client.get<{
        success: boolean;
        data: TierInfo;
      }>('/liquidity/tier');

      return response.data.data;
    },
  };
}
