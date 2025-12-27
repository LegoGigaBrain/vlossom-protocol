/**
 * Rewards API Client (V7.1.1)
 *
 * Handles rewards-related API calls via /api/v1/rewards backend routes:
 * - Get user rewards (XP, tier, badges)
 * - Get badges list
 * - Get streaks
 * - Get leaderboard
 * - Get referral info
 *
 * Backend Reference: services/api/src/routes/rewards.ts
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type RewardTier = 'SEED' | 'SPROUT' | 'BLOOM' | 'FLOURISH' | 'EVERGREEN';

export interface Badge {
  id: string;
  type: string;
  name: string;
  description: string;
  iconName: string;
  category: 'BOOKING' | 'LOYALTY' | 'QUALITY' | 'SPECIAL' | 'COMMUNITY';
  earnedAt: string | null;
  earned: boolean;
  progress?: number; // 0-100 for partially completed
  requirement?: string;
}

export interface Streak {
  id: string;
  name: string;
  description: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  isActive: boolean;
  expiresAt: string | null;
  reward?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  earnedAt: string;
  category: string;
}

export interface XPHistoryItem {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface TierInfo {
  tier: RewardTier;
  name: string;
  minXp: number;
  maxXp: number;
  benefits: string[];
  color: string;
}

export interface UserXPSummary {
  userId: string;
  totalXP: number;
  tier: RewardTier;
  tierProgress: number;
  xpToNextTier: number;
  bookingScore: number;
  qualityScore: number;
  referralScore: number;
}

export interface UserRewards {
  xp: number;
  tier: RewardTier;
  tierProgress: number;
  xpToNextTier: number;
  totalBadges: number;
  earnedBadges: number;
  activeStreaks: number;
  lifetimeAchievements: number;
  streak: Streak | null;
  badges: Badge[];
}

export interface RewardsOverview {
  user: UserRewards;
  badges: Badge[];
  streaks: Streak[];
  recentAchievements: Achievement[];
  tierInfo: TierInfo;
  nextTierInfo: TierInfo | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXP?: number;
  tier?: RewardTier;
  currentStreak?: number;
  longestStreak?: number;
}

export interface ReferralInfo {
  code: string;
  customCode: string | null;
  usageCount: number;
  referralCount: number;
  activeReferrals: number;
}

// ============================================================================
// Tier Configuration (matching backend TIER_THRESHOLDS)
// ============================================================================

export const TIER_CONFIG: Record<RewardTier, TierInfo> = {
  SEED: {
    tier: 'SEED',
    name: 'Seed',
    minXp: 0,
    maxXp: 99,
    benefits: ['Basic booking access', 'Standard support'],
    color: '#8B7355',
  },
  SPROUT: {
    tier: 'SPROUT',
    name: 'Sprout',
    minXp: 100,
    maxXp: 499,
    benefits: ['5% fee discount', 'Priority support'],
    color: '#90EE90',
  },
  BLOOM: {
    tier: 'BLOOM',
    name: 'Bloom',
    minXp: 500,
    maxXp: 1999,
    benefits: ['10% fee discount', 'VIP support', 'Early access features'],
    color: '#FFB6C1',
  },
  FLOURISH: {
    tier: 'FLOURISH',
    name: 'Flourish',
    minXp: 2000,
    maxXp: 4999,
    benefits: ['15% fee discount', 'Dedicated support', 'Beta features'],
    color: '#DDA0DD',
  },
  EVERGREEN: {
    tier: 'EVERGREEN',
    name: 'Evergreen',
    minXp: 5000,
    maxXp: Infinity,
    benefits: ['20% fee discount', 'Concierge support', 'All premium features', 'Community pool access'],
    color: '#228B22',
  },
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get user's complete rewards data
 */
export async function getRewardsOverview(): Promise<UserRewards> {
  return apiRequest<UserRewards>('/api/v1/rewards/me');
}

/**
 * Get user's XP summary
 */
export async function getXPSummary(): Promise<UserXPSummary> {
  return apiRequest<UserXPSummary>('/api/v1/rewards/xp');
}

/**
 * Get XP history
 */
export async function getXPHistory(limit: number = 20): Promise<{ history: XPHistoryItem[] }> {
  return apiRequest<{ history: XPHistoryItem[] }>(`/api/v1/rewards/xp/history?limit=${limit}`);
}

/**
 * Get all badges with earned status
 */
export async function getBadges(): Promise<{
  badges: Badge[];
  totalEarned: number;
  totalAvailable: number;
}> {
  return apiRequest<{ badges: Badge[]; totalEarned: number; totalAvailable: number }>('/api/v1/rewards/badges');
}

/**
 * Get all badge definitions (public)
 */
export async function getBadgeDefinitions(): Promise<{ badges: Badge[] }> {
  return apiRequest<{ badges: Badge[] }>('/api/v1/rewards/badges/all');
}

/**
 * Get user's streak data
 */
export async function getStreak(): Promise<Streak> {
  return apiRequest<Streak>('/api/v1/rewards/streak');
}

/**
 * Get tier information
 */
export async function getTiers(): Promise<{ tiers: TierInfo[] }> {
  return apiRequest<{ tiers: TierInfo[] }>('/api/v1/rewards/tiers');
}

/**
 * Get leaderboard (XP or streaks)
 */
export async function getLeaderboard(
  type: 'xp' | 'streak' = 'xp',
  limit: number = 50
): Promise<{
  type: string;
  leaderboard: LeaderboardEntry[];
}> {
  return apiRequest<{ type: string; leaderboard: LeaderboardEntry[] }>(
    `/api/v1/rewards/leaderboard?type=${type}&limit=${limit}`
  );
}

/**
 * Get public rewards for a specific user
 */
export async function getUserPublicRewards(userId: string): Promise<{
  userId: string;
  tier: RewardTier;
  badges: { type: string; name: string; earnedAt: string }[];
  totalBadges: number;
}> {
  return apiRequest(`/api/v1/rewards/${userId}`);
}

/**
 * Get or create referral code
 */
export async function getReferralCode(): Promise<ReferralInfo> {
  return apiRequest<ReferralInfo>('/api/v1/rewards/referral/code');
}

/**
 * Get detailed referral statistics
 */
export async function getReferralStats(): Promise<{
  totalReferrals: number;
  activeReferrals: number;
  totalXPEarned: number;
  referralScore: number;
  percentile: number;
  referrals: { createdAt: string; isActive: boolean; xpAwarded: number }[];
}> {
  return apiRequest('/api/v1/rewards/referral/stats');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get tier from XP amount
 */
export function getTierFromXp(xp: number): RewardTier {
  if (xp >= 5000) return 'EVERGREEN';
  if (xp >= 2000) return 'FLOURISH';
  if (xp >= 500) return 'BLOOM';
  if (xp >= 100) return 'SPROUT';
  return 'SEED';
}

/**
 * Calculate progress to next tier
 */
export function calculateTierProgress(xp: number): { progress: number; xpToNext: number } {
  const currentTier = getTierFromXp(xp);
  const currentConfig = TIER_CONFIG[currentTier];

  if (currentTier === 'EVERGREEN') {
    return { progress: 100, xpToNext: 0 };
  }

  const tiers: RewardTier[] = ['SEED', 'SPROUT', 'BLOOM', 'FLOURISH', 'EVERGREEN'];
  const nextTierIndex = tiers.indexOf(currentTier) + 1;
  const nextTier = tiers[nextTierIndex];
  const nextConfig = TIER_CONFIG[nextTier];

  const xpInTier = xp - currentConfig.minXp;
  const xpNeededForTier = nextConfig.minXp - currentConfig.minXp;
  const progress = Math.min(100, (xpInTier / xpNeededForTier) * 100);
  const xpToNext = nextConfig.minXp - xp;

  return { progress, xpToNext };
}

/**
 * Get tier color
 */
export function getTierColor(tier: RewardTier): string {
  return TIER_CONFIG[tier]?.color || '#6B7280';
}

/**
 * Get tier icon name
 */
export function getTierIconName(tier: RewardTier): string {
  switch (tier) {
    case 'SEED':
      return 'seed';
    case 'SPROUT':
      return 'sprout';
    case 'BLOOM':
      return 'bloom';
    case 'FLOURISH':
      return 'flourish';
    case 'EVERGREEN':
      return 'evergreen';
    default:
      return 'seed';
  }
}

/**
 * Format XP display
 */
export function formatXp(xp: number): string {
  if (xp >= 10000) {
    return `${(xp / 1000).toFixed(0)}k`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
}

/**
 * Get badge category label
 */
export function getBadgeCategoryLabel(category: Badge['category']): string {
  switch (category) {
    case 'BOOKING':
      return 'Booking';
    case 'LOYALTY':
      return 'Loyalty';
    case 'QUALITY':
      return 'Quality';
    case 'SPECIAL':
      return 'Special';
    case 'COMMUNITY':
      return 'Community';
    default:
      return category;
  }
}

/**
 * Get streak status label
 */
export function getStreakStatusLabel(streak: Streak): string {
  if (!streak.isActive) return 'Inactive';
  if (streak.currentStreak === 0) return 'Start your streak!';
  if (streak.currentStreak === 1) return '1 day streak';
  return `${streak.currentStreak} day streak`;
}

/**
 * Check if streak is about to expire
 */
export function isStreakExpiring(streak: Streak): boolean {
  if (!streak.expiresAt) return false;
  const expiresAt = new Date(streak.expiresAt);
  const now = new Date();
  const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilExpiry > 0 && hoursUntilExpiry < 24;
}
