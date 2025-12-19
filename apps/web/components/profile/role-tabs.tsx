/**
 * Role Tabs - Dynamic Profile Tabs (V5.3)
 *
 * Tab Structure:
 * - Overview: Always visible, shows hair health, stats, favorites
 * - Stylist: Only if user has STYLIST role - business dashboard
 * - Salon: Only if user has SALON_OWNER/PROPERTY_OWNER role
 *
 * Feature flag: NEXT_PUBLIC_USE_MOCK_DATA=true for demo mode
 */

"use client";

import { cn } from "../../lib/utils";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  useStylistDashboardStats,
  usePropertyDashboardStats,
  formatCurrency,
  formatPercentage,
} from "../../hooks/use-profile-stats";

export type ProfileTabId = "overview" | "stylist" | "salon";

interface ProfileTab {
  id: ProfileTabId;
  label: string;
  iconName: IconName;
  requiredRole?: string;
}

const allTabs: ProfileTab[] = [
  { id: "overview", label: "Overview", iconName: "profile" },
  { id: "stylist", label: "Stylist", iconName: "care", requiredRole: "STYLIST" },
  { id: "salon", label: "Salon", iconName: "pin", requiredRole: "PROPERTY_OWNER" },
];

interface RoleTabsProps {
  userRoles: string[];
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  className?: string;
}

export function RoleTabs({
  userRoles,
  activeTab,
  onTabChange,
  className,
}: RoleTabsProps) {
  // Filter tabs based on user roles
  const availableTabs = allTabs.filter((tab) => {
    if (!tab.requiredRole) return true;
    return userRoles.includes(tab.requiredRole) ||
           (tab.requiredRole === "PROPERTY_OWNER" && userRoles.includes("SALON_OWNER"));
  });

  return (
    <div className={cn("border-b border-border-default bg-background-primary", className)}>
      <div className="flex">
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200 border-b-2",
                isActive
                  ? "text-brand-rose border-brand-rose"
                  : "text-text-secondary border-transparent hover:text-text-primary hover:bg-background-secondary"
              )}
              aria-selected={isActive}
              role="tab"
            >
              <Icon name={tab.iconName} size="sm" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Overview Tab Content
 */
interface OverviewTabProps {
  className?: string;
  children?: React.ReactNode;
}

export function OverviewTab({ className, children }: OverviewTabProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

/**
 * Stylist Tab Content - Business Dashboard
 * Wired to real API with mock data fallback
 */
interface StylistTabProps {
  className?: string;
}

export function StylistTab({ className }: StylistTabProps) {
  const { stats, isLoading, error, isUsingMockData } = useStylistDashboardStats();

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center gap-2 py-12 text-status-error">
          <Icon name="error" size="sm" />
          <p>Unable to load dashboard stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mock Data Indicator */}
      {isUsingMockData && process.env.NODE_ENV === "development" && (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
          <Icon name="info" size="xs" className="mr-1" />
          Demo Data
        </Badge>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          iconName="calendar"
          label="Total Bookings"
          value={stats.totalBookings.toString()}
          color="text-brand-rose"
        />
        <StatCard
          iconName="growing"
          label="Completed"
          value={stats.completedBookings.toString()}
          color="text-status-success"
        />
        <StatCard
          iconName="star"
          label="Rating"
          value={stats.averageRating.toFixed(1)}
          subtext={`${stats.totalReviews} reviews`}
          color="text-accent-gold"
        />
        <StatCard
          iconName="sparkle"
          label="This Month"
          value={formatCurrency(stats.thisMonthEarnings)}
          color="text-brand-purple"
        />
      </div>

      {/* Earnings Summary */}
      <div className="bg-background-primary border border-border-default rounded-xl p-4">
        <h4 className="font-medium text-text-primary mb-3">Earnings Overview</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-text-primary">
              {formatCurrency(stats.totalEarnings)}
            </p>
            <p className="text-xs text-text-secondary">Total Earned</p>
          </div>
          <div>
            <p className="text-lg font-bold text-brand-rose">
              {formatCurrency(stats.pendingPayouts)}
            </p>
            <p className="text-xs text-text-secondary">Pending</p>
          </div>
          <div>
            <p className="text-lg font-bold text-status-success">
              {formatPercentage(stats.repeatClientRate)}
            </p>
            <p className="text-xs text-text-secondary">Repeat Clients</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Salon Tab Content - Property Dashboard
 * Wired to real API with mock data fallback
 */
interface SalonTabProps {
  className?: string;
}

export function SalonTab({ className }: SalonTabProps) {
  const { stats, isLoading, error, isUsingMockData } = usePropertyDashboardStats();

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center gap-2 py-12 text-status-error">
          <Icon name="error" size="sm" />
          <p>Unable to load dashboard stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mock Data Indicator */}
      {isUsingMockData && process.env.NODE_ENV === "development" && (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
          <Icon name="info" size="xs" className="mr-1" />
          Demo Data
        </Badge>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          iconName="pin"
          label="Properties"
          value={stats.totalProperties.toString()}
          color="text-brand-purple"
        />
        <StatCard
          iconName="calendar"
          label="Total Chairs"
          value={stats.totalChairs.toString()}
          subtext={`${stats.occupiedChairs} occupied`}
          color="text-brand-rose"
        />
        <StatCard
          iconName="growing"
          label="Occupancy"
          value={formatPercentage(stats.averageOccupancy)}
          color="text-status-success"
        />
        <StatCard
          iconName="sparkle"
          label="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          color="text-accent-gold"
        />
      </div>

      {/* Property Summary */}
      <div className="bg-background-primary border border-border-default rounded-xl p-4">
        <h4 className="font-medium text-text-primary mb-3">Property Overview</h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-text-primary">
              {stats.occupiedChairs} / {stats.totalChairs}
            </p>
            <p className="text-xs text-text-secondary">Chairs Occupied</p>
          </div>
          <div>
            <p className="text-lg font-bold text-brand-rose">
              {stats.pendingRequests}
            </p>
            <p className="text-xs text-text-secondary">Pending Requests</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  iconName: IconName;
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

function StatCard({ iconName, label, value, subtext, color = "text-brand-rose" }: StatCardProps) {
  return (
    <div className="bg-background-primary border border-border-default rounded-xl p-4">
      <Icon name={iconName} size="sm" className={cn("mb-2", color)} />
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </div>
  );
}
