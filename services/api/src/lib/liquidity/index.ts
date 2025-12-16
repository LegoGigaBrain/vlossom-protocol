/**
 * Liquidity Module
 *
 * Exports for DeFi liquidity pool functionality.
 */

// Types
export * from './types';

// Pool operations
export {
  listPools,
  getPoolById,
  getGenesisPool,
  createPool,
  pausePool,
  getUserDeposits,
  deposit,
  withdraw,
} from './pool-service';

// Yield operations
export {
  getYieldSummary,
  claimYield,
  claimAllYield,
  calculateAPY,
  updatePoolAPYs,
  getGlobalStats,
  getPoolStats,
} from './yield-service';

// Referral/tier operations
export {
  getReferrerPercentile,
  getTierFromReferralPercentile,
  canCreatePool,
  getUserTierInfo,
  updateUserTierStatus,
  getCachedTierStatus,
  batchUpdateTierStatus,
} from './referral-engine';
