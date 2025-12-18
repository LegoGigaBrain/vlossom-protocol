"use client";

import { cn } from "../../lib/utils";
import { Icon, type IconName } from "@/components/icons";

export type ReputationLevel = "new" | "rising" | "trusted" | "verified" | "elite";

interface ReputationBadgeProps {
  level: ReputationLevel;
  score?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const levelConfig: Record<
  ReputationLevel,
  {
    label: string;
    iconName: IconName;
    color: string;
    bgColor: string;
    minScore: number;
  }
> = {
  new: {
    label: "New",
    iconName: "sparkles",
    color: "text-text-secondary",
    bgColor: "bg-background-tertiary",
    minScore: 0,
  },
  rising: {
    label: "Rising",
    iconName: "star",
    color: "text-status-info",
    bgColor: "bg-status-info/10",
    minScore: 25,
  },
  trusted: {
    label: "Trusted",
    iconName: "trusted",
    color: "text-status-success",
    bgColor: "bg-status-success/10",
    minScore: 50,
  },
  verified: {
    label: "Verified",
    iconName: "verified",
    color: "text-brand-rose",
    bgColor: "bg-brand-rose/10",
    minScore: 75,
  },
  elite: {
    label: "Elite",
    iconName: "crown",
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
    minScore: 95,
  },
};

type BadgeSize = "sm" | "md" | "lg";
type IconSize = "xs" | "sm" | "md";

const sizeMap: Record<BadgeSize, IconSize> = {
  sm: "xs",
  md: "sm",
  lg: "sm",
};

const sizes = {
  sm: {
    badge: "px-2 py-0.5",
    text: "text-xs",
  },
  md: {
    badge: "px-2.5 py-1",
    text: "text-sm",
  },
  lg: {
    badge: "px-3 py-1.5",
    text: "text-base",
  },
};

export function getReputationLevel(score: number): ReputationLevel {
  if (score >= 95) return "elite";
  if (score >= 75) return "verified";
  if (score >= 50) return "trusted";
  if (score >= 25) return "rising";
  return "new";
}

export function ReputationBadge({
  level,
  score,
  size = "md",
  showLabel = true,
  className,
}: ReputationBadgeProps) {
  const config = levelConfig[level];
  const sizeConfig = sizes[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bgColor,
        sizeConfig.badge,
        className
      )}
    >
      <Icon name={config.iconName} size={sizeMap[size]} className={config.color} />
      {showLabel && (
        <span className={cn(sizeConfig.text, config.color)}>
          {config.label}
        </span>
      )}
      {score !== undefined && (
        <span className={cn(sizeConfig.text, "text-text-secondary ml-0.5")}>
          ({score})
        </span>
      )}
    </div>
  );
}

interface ReputationScoreProps {
  score: number;
  totalReviews?: number;
  className?: string;
}

export function ReputationScore({
  score,
  totalReviews,
  className,
}: ReputationScoreProps) {
  const level = getReputationLevel(score);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ReputationBadge level={level} score={score} size="md" />
      {totalReviews !== undefined && (
        <span className="text-sm text-text-secondary">
          {totalReviews} review{totalReviews !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
