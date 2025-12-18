/**
 * Pool Service
 *
 * Manages liquidity pool CRUD operations and user deposits.
 * Reference: docs/vlossom/12-liquidity-pool-architecture.md
 */

import { PrismaClient, PoolTier, Prisma } from '@prisma/client';
import {
  PoolInfo,
  PoolDetails,
  UserDeposit,
  DepositParams,
  DepositResult,
  WithdrawParams,
  WithdrawResult,
  CreatePoolParams,
  PoolListResponse,
  formatUSDC,
  parseUSDC,
  TIER_CONFIGS,
} from './types';
import { canCreatePool } from './referral-engine';

const prisma = new PrismaClient();

// ============================================================================
// Pool Queries
// ============================================================================

/**
 * List all active pools
 */
export async function listPools(params: {
  tier?: PoolTier;
  includeGenesis?: boolean;
  page?: number;
  limit?: number;
}): Promise<PoolListResponse> {
  const { tier, includeGenesis = true, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.LiquidityPoolWhereInput = {
    status: 'ACTIVE',
    ...(tier && { tier }),
    ...(!includeGenesis && { isGenesis: false }),
  };

  const [pools, total] = await Promise.all([
    prisma.liquidityPool.findMany({
      where,
      orderBy: [{ isGenesis: 'desc' }, { totalDeposits: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.liquidityPool.count({ where }),
  ]);

  return {
    pools: pools.map(mapPoolToInfo),
    total,
    page,
    limit,
  };
}

/**
 * Get pool by ID with full details
 */
export async function getPoolById(poolId: string): Promise<PoolDetails | null> {
  const pool = await prisma.liquidityPool.findUnique({
    where: { id: poolId },
  });

  if (!pool) return null;

  return mapPoolToDetails(pool);
}

/**
 * Get genesis pool (VLP)
 */
export async function getGenesisPool(): Promise<PoolDetails | null> {
  const pool = await prisma.liquidityPool.findFirst({
    where: { isGenesis: true },
  });

  if (!pool) return null;

  return mapPoolToDetails(pool);
}

// ============================================================================
// Pool Mutations
// ============================================================================

/**
 * Create a new community pool
 */
export async function createPool(
  userId: string,
  params: CreatePoolParams
): Promise<{ success: boolean; pool?: PoolDetails; error?: string }> {
  // Check tier eligibility
  const { canCreate, reason, tier } = await canCreatePool(userId, params.tier);

  if (!canCreate || !tier) {
    return { success: false, error: reason };
  }

  // Get tier config
  const tierConfig = TIER_CONFIGS[tier];

  // TODO: In production, this would:
  // 1. Check user has sufficient USDC for creation fee
  // 2. Call PoolFactory.createPool() on-chain
  // 3. Store the new pool address

  // For now, create a placeholder entry
  const pool = await prisma.liquidityPool.create({
    data: {
      address: `0x${Date.now().toString(16)}`, // Placeholder - will be real address after deployment
      name: params.name,
      tier,
      creatorId: userId,
      status: 'ACTIVE',
      cap: tierConfig.cap ? new Prisma.Decimal(tierConfig.cap) : null,
      creatorFeeBps: tierConfig.creatorFeeBps,
      isGenesis: false,
    },
  });

  return {
    success: true,
    pool: mapPoolToDetails(pool),
  };
}

/**
 * Pause a pool (admin/creator only)
 */
export async function pausePool(
  poolId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const pool = await prisma.liquidityPool.findUnique({
    where: { id: poolId },
  });

  if (!pool) {
    return { success: false, error: 'Pool not found' };
  }

  // Only creator or admin can pause (admin check would use role verification)
  if (pool.creatorId !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.liquidityPool.update({
    where: { id: poolId },
    data: { status: 'PAUSED' },
  });

  return { success: true };
}

// ============================================================================
// Deposit Operations
// ============================================================================

/**
 * Get user's deposits across all pools
 */
export async function getUserDeposits(userId: string): Promise<UserDeposit[]> {
  const deposits = await prisma.liquidityDeposit.findMany({
    where: { userId },
    include: { pool: true },
  });

  // Calculate current values and pending yields
  return deposits.map((deposit) => {
    const pool = deposit.pool;
    const sharesNum = deposit.shares.toNumber();
    const poolValue = pool.totalDeposits.toNumber();
    const totalShares = pool.totalShares.toNumber();

    // Calculate current value
    const currentValue = totalShares > 0
      ? (sharesNum * poolValue) / totalShares
      : deposit.depositAmount.toNumber();

    // Calculate pending yield (simplified)
    const indexDelta = pool.supplyIndex.toNumber() - deposit.depositIndex.toNumber();
    const pendingYield = indexDelta > 0 ? sharesNum * indexDelta : 0;

    return {
      id: deposit.id,
      poolId: pool.id,
      poolName: pool.name,
      poolTier: pool.tier,
      shares: deposit.shares.toString(),
      depositAmount: formatUSDC(deposit.depositAmount.toString()),
      currentValue: formatUSDC(Math.floor(currentValue * 1_000_000).toString()),
      pendingYield: formatUSDC(Math.floor(pendingYield * 1_000_000).toString()),
      totalClaimed: '0', // Would need to sum from YieldClaim
      lastClaimAt: deposit.lastClaimAt,
      createdAt: deposit.createdAt,
    };
  });
}

/**
 * Deposit USDC into a pool
 */
export async function deposit(
  userId: string,
  params: DepositParams
): Promise<DepositResult> {
  const pool = await prisma.liquidityPool.findUnique({
    where: { id: params.poolId },
  });

  if (!pool) {
    throw new Error('Pool not found');
  }

  if (pool.status !== 'ACTIVE') {
    throw new Error('Pool is not active');
  }

  const amountRaw = parseUSDC(params.amount);

  // Check cap
  if (pool.cap) {
    const remaining = pool.cap.toNumber() - pool.totalDeposits.toNumber();
    if (Number(amountRaw) / 1_000_000 > remaining) {
      throw new Error(`Amount exceeds pool capacity. Remaining: ${formatUSDC(Math.floor(remaining * 1_000_000).toString())} USDC`);
    }
  }

  // TODO: In production:
  // 1. Call pool.deposit() on-chain via user's AA wallet
  // 2. Wait for confirmation
  // 3. Get actual shares minted

  // Calculate shares (simplified)
  const totalShares = pool.totalShares.toNumber() || 1;
  const poolValue = pool.totalDeposits.toNumber() || Number(amountRaw) / 1_000_000;
  const sharesToMint = (Number(amountRaw) / 1_000_000) * (totalShares / poolValue);

  // Update or create deposit
  const existingDeposit = await prisma.liquidityDeposit.findUnique({
    where: { userId_poolId: { userId, poolId: params.poolId } },
  });

  let depositId: string;

  if (existingDeposit) {
    const updated = await prisma.liquidityDeposit.update({
      where: { id: existingDeposit.id },
      data: {
        shares: { increment: sharesToMint },
        depositAmount: { increment: Number(amountRaw) / 1_000_000 },
      },
    });
    depositId = updated.id;
  } else {
    const created = await prisma.liquidityDeposit.create({
      data: {
        userId,
        poolId: params.poolId,
        shares: sharesToMint,
        depositAmount: Number(amountRaw) / 1_000_000,
        depositIndex: pool.supplyIndex,
      },
    });
    depositId = created.id;

    // Increment depositor count
    await prisma.liquidityPool.update({
      where: { id: params.poolId },
      data: { depositorCount: { increment: 1 } },
    });
  }

  // Update pool totals
  await prisma.liquidityPool.update({
    where: { id: params.poolId },
    data: {
      totalDeposits: { increment: Number(amountRaw) / 1_000_000 },
      totalShares: { increment: sharesToMint },
    },
  });

  return {
    success: true,
    depositId,
    shares: sharesToMint.toFixed(18),
    txHash: undefined, // Would be set after on-chain confirmation
  };
}

/**
 * Withdraw USDC from a pool
 */
export async function withdraw(
  userId: string,
  params: WithdrawParams
): Promise<WithdrawResult> {
  const userDeposit = await prisma.liquidityDeposit.findUnique({
    where: { userId_poolId: { userId, poolId: params.poolId } },
    include: { pool: true },
  });

  if (!userDeposit) {
    throw new Error('No deposit found in this pool');
  }

  const sharesToWithdraw = parseFloat(params.shares);
  if (sharesToWithdraw > userDeposit.shares.toNumber()) {
    throw new Error('Insufficient shares');
  }

  const pool = userDeposit.pool;

  // Calculate USDC to return
  const poolValue = pool.totalDeposits.toNumber();
  const totalShares = pool.totalShares.toNumber();
  const amountToReturn = (sharesToWithdraw * poolValue) / totalShares;

  // TODO: In production:
  // 1. Call pool.withdraw() on-chain via user's AA wallet
  // 2. Wait for confirmation

  // Update deposit
  const newShares = userDeposit.shares.toNumber() - sharesToWithdraw;
  if (newShares <= 0) {
    // Remove deposit entirely
    await prisma.liquidityDeposit.delete({
      where: { id: userDeposit.id },
    });

    // Decrement depositor count
    await prisma.liquidityPool.update({
      where: { id: params.poolId },
      data: { depositorCount: { decrement: 1 } },
    });
  } else {
    await prisma.liquidityDeposit.update({
      where: { id: userDeposit.id },
      data: {
        shares: newShares,
        depositAmount: { decrement: amountToReturn },
      },
    });
  }

  // Update pool totals
  await prisma.liquidityPool.update({
    where: { id: params.poolId },
    data: {
      totalDeposits: { decrement: amountToReturn },
      totalShares: { decrement: sharesToWithdraw },
    },
  });

  return {
    success: true,
    amount: formatUSDC(Math.floor(amountToReturn * 1_000_000).toString()),
    txHash: undefined, // Would be set after on-chain confirmation
  };
}

// ============================================================================
// Helpers
// ============================================================================

function mapPoolToInfo(pool: Prisma.LiquidityPoolGetPayload<object>): PoolInfo {
  return {
    id: pool.id,
    address: pool.address,
    name: pool.name,
    tier: pool.tier,
    status: pool.status,
    creatorId: pool.creatorId,
    isGenesis: pool.isGenesis,
    totalDeposits: formatUSDC(pool.totalDeposits.toString()),
    totalShares: pool.totalShares.toString(),
    currentAPY: pool.currentAPY.toFixed(2),
    cap: pool.cap ? formatUSDC(pool.cap.toString()) : null,
    depositorCount: pool.depositorCount,
    totalYieldDistributed: formatUSDC(pool.totalYieldDistributed.toString()),
    createdAt: pool.createdAt,
    lastSyncAt: pool.lastSyncAt,
  };
}

function mapPoolToDetails(pool: Prisma.LiquidityPoolGetPayload<object>): PoolDetails {
  const info = mapPoolToInfo(pool);

  let remainingCapacity: string | null = null;
  if (pool.cap) {
    const remaining = pool.cap.toNumber() - pool.totalDeposits.toNumber();
    remainingCapacity = formatUSDC(Math.floor(remaining * 1_000_000).toString());
  }

  return {
    ...info,
    supplyIndex: pool.supplyIndex.toString(),
    creatorFeeBps: pool.creatorFeeBps,
    remainingCapacity,
  };
}
