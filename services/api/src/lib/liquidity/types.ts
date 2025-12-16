/**
 * Liquidity Module Types
 *
 * Type definitions for DeFi liquidity pools and operations.
 * Reference: docs/vlossom/11-defi-and-liquidity-architecture.md
 */

import { PoolTier, PoolStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Use Prisma.Decimal type for decimal operations
type Decimal = Prisma.Decimal;

// ============================================================================
// Pool Types
// ============================================================================

export interface PoolInfo {
  id: string;
  address: string;
  name: string;
  tier: PoolTier;
  status: PoolStatus;
  creatorId: string | null;
  isGenesis: boolean;

  // Financials
  totalDeposits: string; // USDC formatted
  totalShares: string;
  currentAPY: string; // Percentage
  cap: string | null;

  // Stats
  depositorCount: number;
  totalYieldDistributed: string;

  // Timestamps
  createdAt: Date;
  lastSyncAt: Date;
}

export interface PoolDetails extends PoolInfo {
  supplyIndex: string;
  creatorFeeBps: number;
  remainingCapacity: string | null;
}

export interface CreatePoolParams {
  name: string;
  tier: PoolTier;
}

// ============================================================================
// Deposit Types
// ============================================================================

export interface UserDeposit {
  id: string;
  poolId: string;
  poolName: string;
  poolTier: PoolTier;

  // Position
  shares: string;
  depositAmount: string;
  currentValue: string;
  pendingYield: string;

  // Stats
  totalClaimed: string;
  lastClaimAt: Date | null;

  // Timestamps
  createdAt: Date;
}

export interface DepositParams {
  poolId: string;
  amount: string; // USDC amount (e.g., "100.00")
}

export interface DepositResult {
  success: boolean;
  depositId: string;
  shares: string;
  txHash?: string;
}

export interface WithdrawParams {
  poolId: string;
  shares: string;
}

export interface WithdrawResult {
  success: boolean;
  amount: string; // USDC received
  txHash?: string;
}

// ============================================================================
// Yield Types
// ============================================================================

export interface YieldSummary {
  totalPendingYield: string;
  totalClaimedYield: string;
  positions: YieldPosition[];
}

export interface YieldPosition {
  poolId: string;
  poolName: string;
  pendingYield: string;
  lastClaimAt: Date | null;
}

export interface ClaimResult {
  success: boolean;
  amount: string;
  txHash?: string;
}

// ============================================================================
// Tier Types
// ============================================================================

export interface TierInfo {
  userId: string;
  referralPercentile: number; // 0-100 (0 = top referrer)
  tier: PoolTier | null; // null if below Tier 3
  canCreatePool: boolean;

  // Tier benefits
  poolCapLimit: string | null; // Max pool size
  creatorFeeRate: number; // Basis points
  poolCreationFee: string; // USDC
}

export const TIER_CONFIGS: Record<PoolTier, {
  percentileCutoff: number;
  cap: string | null;
  creationFee: string;
  creatorFeeBps: number;
}> = {
  GENESIS: {
    percentileCutoff: 0, // Protocol only
    cap: null, // No cap
    creationFee: '0', // No fee for genesis
    creatorFeeBps: 0, // No creator fee
  },
  TIER_1: {
    percentileCutoff: 5, // Top 5%
    cap: null, // No cap
    creationFee: '1000', // $1,000
    creatorFeeBps: 500, // 5%
  },
  TIER_2: {
    percentileCutoff: 15, // Top 15%
    cap: '100000', // $100k
    creationFee: '2500', // $2,500
    creatorFeeBps: 300, // 3%
  },
  TIER_3: {
    percentileCutoff: 30, // Top 30%
    cap: '20000', // $20k
    creationFee: '5000', // $5,000
    creatorFeeBps: 100, // 1%
  },
};

// ============================================================================
// API Response Types
// ============================================================================

export interface PoolListResponse {
  pools: PoolInfo[];
  total: number;
  page: number;
  limit: number;
}

export interface PoolStatsResponse {
  totalTVL: string;
  totalPools: number;
  totalDepositors: number;
  avgAPY: string;
  last24hYield: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format USDC from raw amount (6 decimals) to display string
 */
export function formatUSDC(amount: bigint | string | Decimal): string {
  const amountBigInt = typeof amount === 'bigint' ? amount : BigInt(amount.toString().split('.')[0]);
  const whole = amountBigInt / 1_000_000n;
  const fraction = amountBigInt % 1_000_000n;
  return `${whole}.${fraction.toString().padStart(6, '0')}`;
}

/**
 * Parse USDC from display string to raw amount (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(6, '0').slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(paddedFraction);
}

/**
 * Get tier from referral percentile
 */
export function getTierFromPercentile(percentile: number): PoolTier | null {
  if (percentile <= TIER_CONFIGS.TIER_1.percentileCutoff) return 'TIER_1';
  if (percentile <= TIER_CONFIGS.TIER_2.percentileCutoff) return 'TIER_2';
  if (percentile <= TIER_CONFIGS.TIER_3.percentileCutoff) return 'TIER_3';
  return null;
}
