/**
 * Yield Service
 *
 * Manages yield calculations, claims, and APY tracking.
 * Reference: docs/vlossom/11-defi-and-liquidity-architecture.md
 */

import { PrismaClient } from '@prisma/client';
import {
  YieldSummary,
  YieldPosition,
  ClaimResult,
  PoolStatsResponse,
  formatUSDC,
} from './types';

const prisma = new PrismaClient();

// ============================================================================
// Yield Queries
// ============================================================================

/**
 * Get yield summary for a user
 */
export async function getYieldSummary(userId: string): Promise<YieldSummary> {
  // Get all user deposits with pool info
  const deposits = await prisma.liquidityDeposit.findMany({
    where: { userId },
    include: { pool: true },
  });

  // Get total claimed yield
  const claimedAgg = await prisma.yieldClaim.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  const totalClaimed = claimedAgg._sum.amount?.toNumber() || 0;

  // Calculate pending yield for each position
  let totalPendingYield = 0;
  const positions: YieldPosition[] = [];

  for (const deposit of deposits) {
    const pool = deposit.pool;
    const sharesNum = deposit.shares.toNumber();
    const indexDelta = pool.supplyIndex.toNumber() - deposit.depositIndex.toNumber();

    // Pending yield = shares * (current index - deposit index)
    const pendingYield = indexDelta > 0 ? sharesNum * indexDelta : 0;
    totalPendingYield += pendingYield;

    positions.push({
      poolId: pool.id,
      poolName: pool.name,
      pendingYield: formatUSDC(Math.floor(pendingYield * 1_000_000).toString()),
      lastClaimAt: deposit.lastClaimAt,
    });
  }

  return {
    totalPendingYield: formatUSDC(Math.floor(totalPendingYield * 1_000_000).toString()),
    totalClaimedYield: formatUSDC(Math.floor(totalClaimed * 1_000_000).toString()),
    positions,
  };
}

/**
 * Claim yield from a specific pool
 */
export async function claimYield(
  userId: string,
  poolId: string
): Promise<ClaimResult> {
  const deposit = await prisma.liquidityDeposit.findUnique({
    where: { userId_poolId: { userId, poolId } },
    include: { pool: true },
  });

  if (!deposit) {
    throw new Error('No deposit found in this pool');
  }

  const pool = deposit.pool;
  const sharesNum = deposit.shares.toNumber();
  const indexDelta = pool.supplyIndex.toNumber() - deposit.depositIndex.toNumber();

  if (indexDelta <= 0) {
    throw new Error('No yield to claim');
  }

  const yieldAmount = sharesNum * indexDelta;

  // TODO: In production:
  // 1. Call pool.claimYield() on-chain via user's AA wallet
  // 2. Wait for confirmation

  // Record the claim
  await prisma.yieldClaim.create({
    data: {
      userId,
      poolId,
      amount: yieldAmount,
      txHash: undefined, // Would be set after on-chain confirmation
    },
  });

  // Update deposit index to current
  await prisma.liquidityDeposit.update({
    where: { id: deposit.id },
    data: {
      depositIndex: pool.supplyIndex,
      lastClaimAt: new Date(),
    },
  });

  return {
    success: true,
    amount: formatUSDC(Math.floor(yieldAmount * 1_000_000).toString()),
    txHash: undefined,
  };
}

/**
 * Claim yield from all pools
 */
export async function claimAllYield(userId: string): Promise<ClaimResult[]> {
  const deposits = await prisma.liquidityDeposit.findMany({
    where: { userId },
    include: { pool: true },
  });

  const results: ClaimResult[] = [];

  for (const deposit of deposits) {
    const pool = deposit.pool;
    const indexDelta = pool.supplyIndex.toNumber() - deposit.depositIndex.toNumber();

    if (indexDelta > 0) {
      try {
        const result = await claimYield(userId, pool.id);
        results.push(result);
      } catch (error) {
        // Skip pools with no yield
      }
    }
  }

  return results;
}

// ============================================================================
// APY Calculations
// ============================================================================

/**
 * Calculate APY for a pool based on utilization
 * Uses Aave-style curve from VlossomYieldEngine
 */
export function calculateAPY(utilization: number): number {
  // Parameters from VlossomYieldEngine
  const baseRate = 400; // 4%
  const slope1 = 1000; // 10%
  const slope2 = 10000; // 100%
  const optimalUtilization = 8000; // 80%
  const BASIS_POINTS = 10000;

  let apy: number;

  if (utilization <= optimalUtilization) {
    apy = baseRate + (utilization * slope1) / BASIS_POINTS;
  } else {
    const optimalPortion = (optimalUtilization * slope1) / BASIS_POINTS;
    const excessUtilization = utilization - optimalUtilization;
    const excessPortion = (excessUtilization * slope2) / BASIS_POINTS;
    apy = baseRate + optimalPortion + excessPortion;
  }

  return apy / 100; // Convert basis points to percentage
}

/**
 * Update APY for all pools
 * Called periodically to refresh displayed APY
 */
export async function updatePoolAPYs(): Promise<void> {
  const pools = await prisma.liquidityPool.findMany({
    where: { status: 'ACTIVE' },
  });

  for (const pool of pools) {
    // Calculate utilization (deposits used in escrows / total deposits)
    // For now, assume 50% average utilization
    const utilization = 5000; // 50% in basis points

    const apy = calculateAPY(utilization);

    await prisma.liquidityPool.update({
      where: { id: pool.id },
      data: { currentAPY: apy },
    });
  }
}

// ============================================================================
// Pool Stats
// ============================================================================

/**
 * Get global DeFi stats
 */
export async function getGlobalStats(): Promise<PoolStatsResponse> {
  const pools = await prisma.liquidityPool.findMany({
    where: { status: 'ACTIVE' },
  });

  let totalTVL = 0;
  let totalDepositors = 0;
  let apySum = 0;

  for (const pool of pools) {
    totalTVL += pool.totalDeposits.toNumber();
    totalDepositors += pool.depositorCount;
    apySum += pool.currentAPY.toNumber();
  }

  const avgAPY = pools.length > 0 ? apySum / pools.length : 0;

  // Get last 24h yield (sum of yield claims)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentClaims = await prisma.yieldClaim.aggregate({
    where: { createdAt: { gte: oneDayAgo } },
    _sum: { amount: true },
  });

  const last24hYield = recentClaims._sum.amount?.toNumber() || 0;

  return {
    totalTVL: formatUSDC(Math.floor(totalTVL * 1_000_000).toString()),
    totalPools: pools.length,
    totalDepositors,
    avgAPY: avgAPY.toFixed(2),
    last24hYield: formatUSDC(Math.floor(last24hYield * 1_000_000).toString()),
  };
}

/**
 * Get pool-specific stats
 */
export async function getPoolStats(poolId: string): Promise<{
  tvl: string;
  apy: string;
  depositorCount: number;
  totalYield: string;
  last7dYield: string;
}> {
  const pool = await prisma.liquidityPool.findUnique({
    where: { id: poolId },
  });

  if (!pool) {
    throw new Error('Pool not found');
  }

  // Get last 7d yield
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentClaims = await prisma.yieldClaim.aggregate({
    where: {
      poolId,
      createdAt: { gte: sevenDaysAgo },
    },
    _sum: { amount: true },
  });

  const last7dYield = recentClaims._sum.amount?.toNumber() || 0;

  return {
    tvl: formatUSDC(pool.totalDeposits.toString()),
    apy: pool.currentAPY.toFixed(2),
    depositorCount: pool.depositorCount,
    totalYield: formatUSDC(pool.totalYieldDistributed.toString()),
    last7dYield: formatUSDC(Math.floor(last7dYield * 1_000_000).toString()),
  };
}
