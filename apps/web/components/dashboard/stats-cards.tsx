/**
 * Stats Cards Component
 * Reference: docs/specs/stylist-dashboard/F3.1-stylist-dashboard.md
 */

"use client";

import * as React from "react";
import { formatPrice } from "../../lib/utils";
import type { DashboardStats } from "../../lib/dashboard-client";
import {
  InboxDownloadIcon,
  CalendarIcon,
  TrendingUpIcon,
  WalletIcon,
} from "../ui/icons";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, subtext, icon }: StatCardProps) {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-caption text-text-secondary mb-1">{label}</p>
          <p className="text-h2 text-text-primary">{value}</p>
          {subtext && (
            <p className="text-caption text-text-tertiary mt-1">{subtext}</p>
          )}
        </div>
        <span className="text-text-secondary">{icon}</span>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="space-y-2">
        <div className="h-4 skeleton-shimmer rounded w-24"></div>
        <div className="h-8 skeleton-shimmer rounded w-20"></div>
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
        icon={<InboxDownloadIcon className="h-6 w-6" />}
      />
      <StatCard
        label="Upcoming Bookings"
        value={stats.upcomingBookings}
        subtext="next 7 days"
        icon={<CalendarIcon className="h-6 w-6" />}
      />
      <StatCard
        label="This Month"
        value={formatPrice(stats.thisMonthEarnings)}
        icon={<TrendingUpIcon className="h-6 w-6" />}
      />
      <StatCard
        label="Total Earnings"
        value={formatPrice(stats.totalEarnings)}
        icon={<WalletIcon className="h-6 w-6" />}
      />
    </div>
  );
}
