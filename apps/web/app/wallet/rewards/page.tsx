/**
 * Wallet Rewards Page - XP, badges, streaks, and tier progression
 * Shows user's rewards and achievements (placeholder until Sprint 3)
 */

"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import {
  ReputationBadge,
  getReputationLevel,
} from "../../../components/reviews/reputation-badge";
import { useAuth } from "../../../hooks/use-auth";

// Placeholder badge definitions (will be populated from backend in Sprint 3)
interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: IconName;
  earned: boolean;
  earnedAt?: string;
  requirement: string;
}

const allBadges: Badge[] = [
  {
    id: "first_booking",
    name: "First Steps",
    description: "Complete your first booking",
    iconName: "success",
    earned: false,
    requirement: "Complete 1 booking",
  },
  {
    id: "ten_bookings",
    name: "Getting Started",
    description: "Complete 10 bookings",
    iconName: "star",
    earned: false,
    requirement: "Complete 10 bookings",
  },
  {
    id: "fifty_bookings",
    name: "Regular",
    description: "Complete 50 bookings",
    iconName: "verified",
    earned: false,
    requirement: "Complete 50 bookings",
  },
  {
    id: "hundred_bookings",
    name: "Veteran",
    description: "Complete 100 bookings",
    iconName: "verified",
    earned: false,
    requirement: "Complete 100 bookings",
  },
  {
    id: "perfect_tps",
    name: "Punctuality Pro",
    description: "Maintain perfect TPS for a month",
    iconName: "clock",
    earned: false,
    requirement: "100% TPS for 30 days",
  },
  {
    id: "five_star_streak",
    name: "Five Star Streak",
    description: "Receive 5 five-star reviews in a row",
    iconName: "sparkle",
    earned: false,
    requirement: "5 consecutive 5-star reviews",
  },
  {
    id: "top_referrer",
    name: "Community Builder",
    description: "Refer 10 active users",
    iconName: "profile",
    earned: false,
    requirement: "10 successful referrals",
  },
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Join during beta period",
    iconName: "sparkle",
    earned: true,
    earnedAt: "2025-01-01",
    requirement: "Join before public launch",
  },
];

// Tier configuration
interface TierConfig {
  name: string;
  minXP: number;
  color: string;
  bgColor: string;
  benefits: string[];
}

const tiers: TierConfig[] = [
  {
    name: "Bronze",
    minXP: 0,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    benefits: ["Basic features", "Standard support"],
  },
  {
    name: "Silver",
    minXP: 500,
    color: "text-gray-500",
    bgColor: "bg-gray-200",
    benefits: ["Priority booking", "Extended cancellation window"],
  },
  {
    name: "Gold",
    minXP: 2000,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    benefits: ["Fee discount 5%", "Priority support", "Early access features"],
  },
  {
    name: "Platinum",
    minXP: 5000,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    benefits: ["Fee discount 10%", "VIP support", "Exclusive events"],
  },
  {
    name: "Diamond",
    minXP: 10000,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    benefits: [
      "Fee discount 15%",
      "Dedicated support",
      "DeFi pool access",
      "Create community pools",
    ],
  },
];

export default function WalletRewardsPage() {
  useAuth(); // Auth check
  const [activeTab, setActiveTab] = useState<"overview" | "badges" | "history">(
    "overview"
  );

  // Placeholder data (will come from backend in Sprint 3)
  const xp = {
    total: 125,
    stylistPoints: 0,
    customerPoints: 125,
    ownerPoints: 0,
  };

  const streak = {
    current: 0,
    longest: 0,
    type: "bookings",
  };

  // Calculate current tier
  const getCurrentTier = () => {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (xp.total >= tiers[i].minXP) return tiers[i];
    }
    return tiers[0];
  };

  const getNextTier = () => {
    const currentIndex = tiers.findIndex(
      (t) => t.name === getCurrentTier().name
    );
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progressToNextTier = nextTier
    ? ((xp.total - currentTier.minXP) / (nextTier.minXP - currentTier.minXP)) *
      100
    : 100;

  const earnedBadges = allBadges.filter((b) => b.earned);
  const unearnedBadges = allBadges.filter((b) => !b.earned);

  // Mock reputation score (will integrate with actual user data)
  const reputationScore = 75;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "badges", label: "Badges" },
          { id: "history", label: "History" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-brand-rose text-white"
                : "bg-background-primary text-text-secondary hover:bg-background-tertiary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* XP Summary Card */}
          <div className="bg-gradient-to-br from-brand-rose/10 to-brand-clay/10 rounded-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2 text-text-primary flex items-center gap-2">
                <Icon name="star" size="sm" className="text-brand-rose" />
                Experience Points
              </h2>
              <div className="text-right">
                <p className="text-3xl font-bold text-brand-rose">
                  {xp.total.toLocaleString()}
                </p>
                <p className="text-caption text-text-tertiary">Total XP</p>
              </div>
            </div>

            {/* XP Breakdown */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border-default">
              <div className="text-center">
                <p className="text-lg font-semibold text-text-primary">
                  {xp.customerPoints}
                </p>
                <p className="text-caption text-text-tertiary">Customer</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-text-primary">
                  {xp.stylistPoints}
                </p>
                <p className="text-caption text-text-tertiary">Stylist</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-text-primary">
                  {xp.ownerPoints}
                </p>
                <p className="text-caption text-text-tertiary">Owner</p>
              </div>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="bg-background-primary rounded-card shadow-vlossom p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-body font-semibold text-text-primary flex items-center gap-2">
                <Icon name="verified" size="sm" className="text-brand-rose" />
                Your Tier
              </h3>
              <span
                className={`px-3 py-1 ${currentTier.bgColor} ${currentTier.color} rounded-full text-sm font-medium`}
              >
                {currentTier.name}
              </span>
            </div>

            {nextTier && (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">
                    Progress to {nextTier.name}
                  </span>
                  <span className="text-text-primary font-medium">
                    {xp.total} / {nextTier.minXP} XP
                  </span>
                </div>
                <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-rose to-brand-clay rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                  />
                </div>
                <p className="text-caption text-text-tertiary mt-2">
                  {nextTier.minXP - xp.total} XP needed for {nextTier.name}
                </p>
              </>
            )}

            {!nextTier && (
              <p className="text-body text-text-secondary">
                You&apos;ve reached the highest tier!
              </p>
            )}

            {/* Current Tier Benefits */}
            <div className="mt-4 pt-4 border-t border-border-default">
              <p className="text-caption text-text-tertiary mb-2">
                Your benefits:
              </p>
              <div className="flex flex-wrap gap-2">
                {currentTier.benefits.map((benefit, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-background-secondary rounded text-caption text-text-secondary"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Streak & Reputation Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Streak Card */}
            <div className="bg-background-primary rounded-card shadow-vlossom p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="energy" size="sm" className="text-orange-500" />
                <h3 className="text-body font-semibold text-text-primary">
                  Streak
                </h3>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {streak.current}
              </p>
              <p className="text-caption text-text-tertiary">
                day{streak.current !== 1 ? "s" : ""}
              </p>
              <div className="mt-2 pt-2 border-t border-border-default">
                <p className="text-caption text-text-tertiary">
                  Longest: {streak.longest} days
                </p>
              </div>
            </div>

            {/* Reputation Card */}
            <div className="bg-background-primary rounded-card shadow-vlossom p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="trusted" size="sm" className="text-brand-rose" />
                <h3 className="text-body font-semibold text-text-primary">
                  Reputation
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-text-primary">
                  {reputationScore}%
                </p>
                <ReputationBadge
                  level={getReputationLevel(reputationScore)}
                  size="sm"
                  showLabel={false}
                />
              </div>
              <p className="text-caption text-text-tertiary">
                {getReputationLevel(reputationScore)} status
              </p>
            </div>
          </div>

          {/* Recent Badges */}
          <div className="bg-background-primary rounded-card shadow-vlossom p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-body font-semibold text-text-primary flex items-center gap-2">
                <Icon name="verified" size="sm" className="text-brand-rose" />
                Recent Badges
              </h3>
              <button
                onClick={() => setActiveTab("badges")}
                className="text-sm text-brand-rose hover:underline"
              >
                View all
              </button>
            </div>

            {earnedBadges.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {earnedBadges.slice(0, 4).map((badge) => {
                  return (
                    <div
                      key={badge.id}
                      className="flex-shrink-0 w-20 text-center"
                    >
                      <div className="w-16 h-16 mx-auto bg-brand-rose/10 rounded-full flex items-center justify-center mb-2">
                        <Icon name={badge.iconName} size="xl" className="text-brand-rose" />
                      </div>
                      <p className="text-caption text-text-primary font-medium truncate">
                        {badge.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-body text-text-secondary text-center py-4">
                Complete activities to earn badges!
              </p>
            )}
          </div>
        </>
      )}

      {activeTab === "badges" && (
        <>
          {/* Earned Badges */}
          <div className="bg-background-primary rounded-card shadow-vlossom p-6">
            <h3 className="text-body font-semibold text-text-primary mb-4">
              Earned Badges ({earnedBadges.length})
            </h3>
            {earnedBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {earnedBadges.map((badge) => {
                  return (
                    <div
                      key={badge.id}
                      className="p-4 bg-background-secondary rounded-lg text-center"
                    >
                      <div className="w-16 h-16 mx-auto bg-brand-rose/10 rounded-full flex items-center justify-center mb-2">
                        <Icon name={badge.iconName} size="xl" className="text-brand-rose" />
                      </div>
                      <p className="text-body font-medium text-text-primary">
                        {badge.name}
                      </p>
                      <p className="text-caption text-text-tertiary">
                        {badge.description}
                      </p>
                      {badge.earnedAt && (
                        <p className="text-caption text-brand-rose mt-1">
                          Earned{" "}
                          {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-body text-text-secondary text-center py-8">
                No badges earned yet. Keep using Vlossom to unlock badges!
              </p>
            )}
          </div>

          {/* Available Badges */}
          <div className="bg-background-primary rounded-card shadow-vlossom p-6">
            <h3 className="text-body font-semibold text-text-primary mb-4">
              Available Badges ({unearnedBadges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unearnedBadges.map((badge) => {
                return (
                  <div
                    key={badge.id}
                    className="p-4 bg-background-secondary rounded-lg text-center opacity-60"
                  >
                    <div className="w-16 h-16 mx-auto bg-background-tertiary rounded-full flex items-center justify-center mb-2">
                      <Icon name={badge.iconName} size="xl" className="text-text-tertiary" />
                    </div>
                    <p className="text-body font-medium text-text-primary">
                      {badge.name}
                    </p>
                    <p className="text-caption text-text-tertiary">
                      {badge.requirement}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="bg-background-primary rounded-card shadow-vlossom p-6">
          <h3 className="text-body font-semibold text-text-primary mb-4">
            Rewards History
          </h3>
          <div className="text-center py-12">
            <Icon name="empty" size="2xl" className="text-text-tertiary mx-auto mb-4" />
            <p className="text-body text-text-secondary mb-2">
              No rewards activity yet
            </p>
            <p className="text-caption text-text-tertiary">
              Complete bookings and activities to earn XP and badges
            </p>
          </div>
        </div>
      )}

      {/* How to Earn XP */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <h3 className="text-body font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Icon name="growing" size="sm" className="text-brand-rose" />
          How to Earn XP
        </h3>
        <div className="space-y-3">
          {[
            { action: "Complete a booking", xp: "+10 XP" },
            { action: "Maintain booking streak", xp: "+5-25 XP" },
            { action: "Leave a review", xp: "+2 XP" },
            { action: "Receive a review", xp: "+3 XP" },
            { action: "Complete special events", xp: "+20 XP" },
            { action: "Arrive on time", xp: "+3 XP" },
            { action: "Refer a friend", xp: "+10-100 XP" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border-default last:border-0"
            >
              <span className="text-body text-text-secondary">
                {item.action}
              </span>
              <span className="text-body font-medium text-brand-rose">
                {item.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
