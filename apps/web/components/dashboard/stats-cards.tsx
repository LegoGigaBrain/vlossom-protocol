/**
 * Stats Cards Component
 * Reference: docs/specs/stylist-dashboard/F3.1-stylist-dashboard.md
 */

"use client";

import { formatPrice } from "../../lib/utils";
import type { DashboardStats } from "../../lib/dashboard-client";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: string;
}

function StatCard({ label, value, subtext, icon }: StatCardProps) {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-caption text-text-secondary mb-1">{label}</p>
          <p className="text-h2 text-text-primary">{value}</p>
          {subtext && (
            <p className="text-caption text-text-tertiary mt-1">{subtext}</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-background-secondary rounded w-24 mb-2"></div>
        <div className="h-8 bg-background-secondary rounded w-20"></div>
      </div>
    </div>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Pending Requests"
        value={stats.pendingRequests}
        subtext={stats.pendingRequests === 1 ? "request" : "requests"}
        icon="📥"
      />
      <StatCard
        label="Upcoming Bookings"
        value={stats.upcomingBookings}
        subtext="next 7 days"
        icon="📅"
      />
      <StatCard
        label="This Month"
        value={formatPrice(stats.thisMonthEarnings)}
        icon="📈"
      />
      <StatCard
        label="Total Earnings"
        value={formatPrice(stats.totalEarnings)}
        icon="💰"
      />
    </div>
  );
}
