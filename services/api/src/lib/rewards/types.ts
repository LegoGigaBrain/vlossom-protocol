/**
 * Rewards System Type Definitions
 * Reference: docs/vlossom/09-rewards-and-incentives-engine.md
 */

export type UserTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export type BadgeType =
  // Booking milestones
  | "FIRST_BOOKING"
  | "TEN_BOOKINGS"
  | "FIFTY_BOOKINGS"
  | "HUNDRED_BOOKINGS"
  // Performance badges
  | "PERFECT_TPS_MONTH"
  | "FIVE_STAR_STREAK"
  | "PUNCTUALITY_PRO"
  // Community badges
  | "TOP_REFERRER"
  | "COMMUNITY_BUILDER"
  // Special badges
  | "EARLY_ADOPTER"
  | "VERIFIED_STYLIST"
  | "PREMIUM_HOST"
  | "MASTER_BRAIDER"
  // Seasonal badges
  | "HOLIDAY_HERO"
  | "SUMMER_STAR";

export type XPEventType =
  | "BOOKING_COMPLETED"
  | "BOOKING_STREAK"
  | "REVIEW_LEFT"
  | "REVIEW_RECEIVED"
  | "SPECIAL_EVENT"
  | "PUNCTUALITY_BONUS"
  | "DISPUTE_RESOLVED"
  | "REFERRAL_SIGNUP"
  | "REFERRAL_ACTIVATED"
  | "BADGE_EARNED"
  | "TIER_UPGRADED";

export type XPCategory =
  | "booking"
  | "review"
  | "referral"
  | "streak"
  | "special";

/**
 * XP award amounts per event type
 */
export const XP_AWARDS: Record<XPEventType, number> = {
  BOOKING_COMPLETED: 10,
  BOOKING_STREAK: 5,      // +5-25 based on streak length
  REVIEW_LEFT: 2,
  REVIEW_RECEIVED: 3,
  SPECIAL_EVENT: 20,
  PUNCTUALITY_BONUS: 3,
  DISPUTE_RESOLVED: 5,
  REFERRAL_SIGNUP: 10,
  REFERRAL_ACTIVATED: 50, // When referee completes first booking
  BADGE_EARNED: 5,
  TIER_UPGRADED: 25,
};

/**
 * Tier thresholds (minimum XP for each tier)
 */
export const TIER_THRESHOLDS: Record<UserTier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
  DIAMOND: 10000,
};

/**
 * Tier benefits
 */
export interface TierBenefits {
  feeDiscount: number;      // Percentage discount on platform fees
  priorityBooking: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
  poolAccess: boolean;      // DeFi pool access
  canCreatePool: boolean;   // Can create community pools
}

export const TIER_BENEFITS: Record<UserTier, TierBenefits> = {
  BRONZE: {
    feeDiscount: 0,
    priorityBooking: false,
    prioritySupport: false,
    earlyAccess: false,
    poolAccess: false,
    canCreatePool: false,
  },
  SILVER: {
    feeDiscount: 0,
    priorityBooking: true,
    prioritySupport: false,
    earlyAccess: false,
    poolAccess: false,
    canCreatePool: false,
  },
  GOLD: {
    feeDiscount: 5,
    priorityBooking: true,
    prioritySupport: true,
    earlyAccess: true,
    poolAccess: false,
    canCreatePool: false,
  },
  PLATINUM: {
    feeDiscount: 10,
    priorityBooking: true,
    prioritySupport: true,
    earlyAccess: true,
    poolAccess: true,
    canCreatePool: false,
  },
  DIAMOND: {
    feeDiscount: 15,
    priorityBooking: true,
    prioritySupport: true,
    earlyAccess: true,
    poolAccess: true,
    canCreatePool: true,
  },
};

/**
 * Badge definitions
 */
export interface BadgeDefinition {
  id: BadgeType;
  name: string;
  description: string;
  requirement: string;
  xpReward: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Booking milestones
  {
    id: "FIRST_BOOKING",
    name: "First Steps",
    description: "Complete your first booking",
    requirement: "Complete 1 booking",
    xpReward: 10,
  },
  {
    id: "TEN_BOOKINGS",
    name: "Getting Started",
    description: "Complete 10 bookings",
    requirement: "Complete 10 bookings",
    xpReward: 25,
  },
  {
    id: "FIFTY_BOOKINGS",
    name: "Regular",
    description: "Complete 50 bookings",
    requirement: "Complete 50 bookings",
    xpReward: 50,
  },
  {
    id: "HUNDRED_BOOKINGS",
    name: "Veteran",
    description: "Complete 100 bookings",
    requirement: "Complete 100 bookings",
    xpReward: 100,
  },
  // Performance badges
  {
    id: "PERFECT_TPS_MONTH",
    name: "Punctuality Pro",
    description: "Maintain perfect TPS for a month",
    requirement: "100% TPS for 30 days",
    xpReward: 50,
  },
  {
    id: "FIVE_STAR_STREAK",
    name: "Five Star Streak",
    description: "Receive 5 five-star reviews in a row",
    requirement: "5 consecutive 5-star reviews",
    xpReward: 30,
  },
  {
    id: "PUNCTUALITY_PRO",
    name: "Always On Time",
    description: "Be on time for 20 consecutive bookings",
    requirement: "20 on-time arrivals",
    xpReward: 40,
  },
  // Community badges
  {
    id: "TOP_REFERRER",
    name: "Top Referrer",
    description: "Be in the top 5% of referrers",
    requirement: "Top 5% referral score",
    xpReward: 100,
  },
  {
    id: "COMMUNITY_BUILDER",
    name: "Community Builder",
    description: "Refer 10 active users",
    requirement: "10 successful referrals",
    xpReward: 75,
  },
  // Special badges
  {
    id: "EARLY_ADOPTER",
    name: "Early Adopter",
    description: "Join during beta period",
    requirement: "Join before public launch",
    xpReward: 50,
  },
  {
    id: "VERIFIED_STYLIST",
    name: "Verified Stylist",
    description: "Complete identity verification",
    requirement: "Pass verification process",
    xpReward: 25,
  },
  {
    id: "PREMIUM_HOST",
    name: "Premium Host",
    description: "Achieve premium property status",
    requirement: "4.8+ rating as property owner",
    xpReward: 50,
  },
  {
    id: "MASTER_BRAIDER",
    name: "Master Braider",
    description: "Complete 50 braiding services with 4.5+ rating",
    requirement: "50 braiding bookings at 4.5+ rating",
    xpReward: 75,
  },
  // Seasonal badges
  {
    id: "HOLIDAY_HERO",
    name: "Holiday Hero",
    description: "Complete bookings during holiday season",
    requirement: "Complete bookings Dec 20-Jan 5",
    xpReward: 20,
  },
  {
    id: "SUMMER_STAR",
    name: "Summer Star",
    description: "Be a top performer during summer",
    requirement: "Top 10% during summer months",
    xpReward: 30,
  },
];

/**
 * User rewards data structure
 */
export interface UserRewards {
  userId: string;
  xp: {
    total: number;
    stylistPoints: number;
    customerPoints: number;
    ownerPoints: number;
  };
  tier: UserTier;
  tierProgress: number; // 0-100 progress to next tier
  streak: {
    current: number;
    longest: number;
    type: string;
  };
  badges: Array<{
    type: BadgeType;
    earnedAt: string;
  }>;
  referral: {
    score: number;
    count: number;
    code: string | null;
  };
  benefits: TierBenefits;
}
