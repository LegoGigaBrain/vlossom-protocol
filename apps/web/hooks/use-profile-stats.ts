/**
 * Profile Stats Hooks (V5.3)
 *
 * Fetches profile statistics with mock data fallback.
 * Uses feature flag NEXT_PUBLIC_USE_MOCK_DATA for demo mode.
 *
 * Hooks:
 * - useStylistDashboardStats: Stylist business metrics
 * - usePropertyDashboardStats: Property owner metrics
 * - useSocialStats: Follower/following counts
 * - useRewardsStats: Gamification/XP stats
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  MOCK_STYLIST_STATS,
  MOCK_PROPERTY_STATS,
  MOCK_SOCIAL_STATS,
  shouldUseMockData,
  type StylistStats,
  type PropertyStats,
  type SocialStats,
} from "@/lib/mock-data";

// ============================================================================
// Types
// ============================================================================

export interface RewardsStats {
  xp: number;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond";
  tierColor: string;
  streak: number;
  badges: number;
  nextTierXp?: number;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchStylistDashboardStats(): Promise<StylistStats> {
  const response = await api.get("/stylists/me/dashboard");
  return {
    totalEarnings: response.data?.totalEarnings ?? 0,
    thisMonthEarnings: response.data?.thisMonthEarnings ?? 0,
    pendingPayouts: response.data?.pendingPayouts ?? 0,
    totalBookings: response.data?.totalBookings ?? 0,
    completedBookings: response.data?.completedBookings ?? 0,
    averageRating: response.data?.averageRating ?? 0,
    totalReviews: response.data?.totalReviews ?? 0,
    repeatClientRate: response.data?.repeatClientRate ?? 0,
  };
}

async function fetchPropertyDashboardStats(): Promise<PropertyStats> {
  const response = await api.get("/properties/me/dashboard");
  return {
    totalProperties: response.data?.totalProperties ?? 0,
    totalChairs: response.data?.totalChairs ?? 0,
    occupiedChairs: response.data?.occupiedChairs ?? 0,
    monthlyRevenue: response.data?.monthlyRevenue ?? 0,
    pendingRequests: response.data?.pendingRequests ?? 0,
    averageOccupancy: response.data?.averageOccupancy ?? 0,
  };
}

async function fetchSocialStats(userId: string): Promise<SocialStats> {
  const response = await api.get(`/users/${userId}/social`);
  return {
    followers: response.data?.followers ?? 0,
    following: response.data?.following ?? 0,
    isFollowing: response.data?.isFollowing ?? false,
  };
}

async function fetchRewardsStats(): Promise<RewardsStats> {
  const response = await api.get("/rewards/me");
  const xp = response.data?.xp ?? 0;

  // Calculate tier based on XP
  const getTier = (xp: number): { tier: RewardsStats["tier"]; color: string; nextXp?: number } => {
    if (xp >= 10000) return { tier: "Diamond", color: "text-cyan-600 bg-cyan-100" };
    if (xp >= 5000) return { tier: "Gold", color: "text-yellow-600 bg-yellow-100", nextXp: 10000 };
    if (xp >= 1000) return { tier: "Silver", color: "text-slate-600 bg-slate-100", nextXp: 5000 };
    return { tier: "Bronze", color: "text-amber-700 bg-amber-100", nextXp: 1000 };
  };

  const tierInfo = getTier(xp);

  return {
    xp,
    tier: tierInfo.tier,
    tierColor: tierInfo.color,
    streak: response.data?.streak ?? 0,
    badges: response.data?.badges ?? 0,
    nextTierXp: tierInfo.nextXp,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for stylist dashboard statistics
 * Falls back to mock data when API returns empty or in demo mode
 */
export function useStylistDashboardStats() {
  const query = useQuery({
    queryKey: ["stylist-dashboard-stats"],
    queryFn: fetchStylistDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: MOCK_STYLIST_STATS,
    retry: 2,
  });

  const displayStats = shouldUseMockData(query.data)
    ? MOCK_STYLIST_STATS
    : query.data ?? MOCK_STYLIST_STATS;

  return {
    ...query,
    stats: displayStats,
    isUsingMockData: shouldUseMockData(query.data),
  };
}

/**
 * Hook for property owner dashboard statistics
 * Falls back to mock data when API returns empty or in demo mode
 */
export function usePropertyDashboardStats() {
  const query = useQuery({
    queryKey: ["property-dashboard-stats"],
    queryFn: fetchPropertyDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: MOCK_PROPERTY_STATS,
    retry: 2,
  });

  const displayStats = shouldUseMockData(query.data)
    ? MOCK_PROPERTY_STATS
    : query.data ?? MOCK_PROPERTY_STATS;

  return {
    ...query,
    stats: displayStats,
    isUsingMockData: shouldUseMockData(query.data),
  };
}

/**
 * Hook for social stats (followers/following)
 * Falls back to mock data when API returns empty or in demo mode
 */
export function useSocialStats(userId?: string) {
  const query = useQuery({
    queryKey: ["social-stats", userId],
    queryFn: () => fetchSocialStats(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: MOCK_SOCIAL_STATS,
    retry: 2,
  });

  const displayStats = shouldUseMockData(query.data)
    ? MOCK_SOCIAL_STATS
    : query.data ?? MOCK_SOCIAL_STATS;

  return {
    ...query,
    stats: displayStats,
    isUsingMockData: shouldUseMockData(query.data),
  };
}

/**
 * Hook for rewards/gamification stats
 * Falls back to mock data when API returns empty or in demo mode
 */
const MOCK_REWARDS_STATS: RewardsStats = {
  xp: 125,
  tier: "Bronze",
  tierColor: "text-amber-700 bg-amber-100",
  streak: 0,
  badges: 1,
  nextTierXp: 1000,
};

export function useRewardsStats() {
  const query = useQuery({
    queryKey: ["rewards-stats"],
    queryFn: fetchRewardsStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: MOCK_REWARDS_STATS,
    retry: 2,
  });

  const displayStats = shouldUseMockData(query.data)
    ? MOCK_REWARDS_STATS
    : query.data ?? MOCK_REWARDS_STATS;

  return {
    ...query,
    stats: displayStats,
    isUsingMockData: shouldUseMockData(query.data),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format cents to currency string (ZAR)
 */
export function formatCurrency(cents: number): string {
  const rands = cents / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rands);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}
