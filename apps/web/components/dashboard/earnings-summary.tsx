/**
 * Earnings Summary Component
 * Reference: docs/specs/stylist-dashboard/F3.6-earnings-dashboard.md
 */

"use client";

import { formatPrice } from "../../lib/utils";
import type { EarningsSummary } from "../../lib/dashboard-client";

interface EarningsSummaryProps {
  earnings: EarningsSummary;
  isLoading?: boolean;
}

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "warning";
}

function SummaryCard({ label, value, subtext, trend, variant = "default" }: SummaryCardProps) {
  const bgClass = {
    default: "bg-background-primary",
    primary: "bg-brand-rose/5",
    warning: "bg-status-warning/5",
  }[variant];

  return (
    <div className={`${bgClass} rounded-card shadow-vlossom p-4 sm:p-6`}>
      <p className="text-caption text-text-secondary mb-1">{label}</p>
      <p className="text-h2 text-text-primary">{value}</p>
      {trend && (
        <p
          className={`text-caption mt-1 ${
            trend.positive ? "text-status-success" : "text-status-error"
          }`}
        >
          {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs last month
        </p>
      )}
      {subtext && !trend && (
        <p className="text-caption text-text-tertiary mt-1">{subtext}</p>
      )}
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-background-secondary rounded w-24 mb-2"></div>
        <div className="h-8 bg-background-secondary rounded w-32"></div>
      </div>
    </div>
  );
}

export function EarningsSummaryCards({ earnings, isLoading }: EarningsSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
    );
  }

  // Calculate month-over-month change
  const monthChange = earnings.lastMonthEarnings > 0
    ? Math.round(
        ((earnings.thisMonthEarnings - earnings.lastMonthEarnings) /
          earnings.lastMonthEarnings) *
          100
      )
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard
        label="Total Earnings"
        value={formatPrice(earnings.totalEarnings)}
        subtext={`${earnings.completedBookingsCount} completed bookings`}
        variant="primary"
      />
      <SummaryCard
        label="This Month"
        value={formatPrice(earnings.thisMonthEarnings)}
        trend={monthChange !== 0 ? { value: monthChange, positive: monthChange > 0 } : undefined}
      />
      <SummaryCard
        label="Pending"
        value={formatPrice(earnings.pendingEarnings)}
        subtext={`${earnings.pendingBookingsCount} booking${
          earnings.pendingBookingsCount !== 1 ? "s" : ""
        } in progress`}
        variant="warning"
      />
    </div>
  );
}
