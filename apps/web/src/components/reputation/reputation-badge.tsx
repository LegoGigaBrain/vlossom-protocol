"use client";

import { cn } from "@vlossom/ui";

interface ReputationBadgeProps {
  score: number; // 0-100 scale
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  isVerified?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 bg-green-100";
  if (score >= 80) return "text-green-500 bg-green-50";
  if (score >= 70) return "text-yellow-600 bg-yellow-100";
  if (score >= 60) return "text-yellow-500 bg-yellow-50";
  if (score >= 50) return "text-orange-500 bg-orange-50";
  return "text-red-500 bg-red-50";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Average";
  return "Needs Improvement";
}

export function ReputationBadge({
  score,
  size = "md",
  showLabel = false,
  isVerified = false,
}: ReputationBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold relative",
          sizeClasses[size],
          getScoreColor(score)
        )}
      >
        {score}
        {isVerified && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-vlossom-primary rounded-full flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-vlossom-neutral-900">
            {getScoreLabel(score)}
          </span>
          {isVerified && (
            <span className="text-xs text-vlossom-primary">Verified</span>
          )}
        </div>
      )}
    </div>
  );
}
