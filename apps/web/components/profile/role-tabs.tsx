/**
 * Role Tabs - Dynamic Profile Tabs (V5.0)
 *
 * Tab Structure:
 * - Overview: Always visible, shows hair health, stats, favorites
 * - Stylist: Only if user has STYLIST role - business dashboard
 * - Salon: Only if user has SALON_OWNER/PROPERTY_OWNER role
 */

"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import {
  User,
  Scissors,
  Building2,
  Sparkles,
  Calendar,
  Star,
  TrendingUp,
} from "lucide-react";

export type ProfileTabId = "overview" | "stylist" | "salon";

interface ProfileTab {
  id: ProfileTabId;
  label: string;
  icon: typeof User;
  requiredRole?: string;
}

const allTabs: ProfileTab[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "stylist", label: "Stylist", icon: Scissors, requiredRole: "STYLIST" },
  { id: "salon", label: "Salon", icon: Building2, requiredRole: "PROPERTY_OWNER" },
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
          const Icon = tab.icon;
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
              <Icon className="w-4 h-4" />
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
 * TODO: Wire to stylist dashboard API when available
 */
interface StylistTabProps {
  className?: string;
}

export function StylistTab({ className }: StylistTabProps) {
  // Mock data - needs stylist dashboard API endpoint
  const stats = {
    totalBookings: 47,
    thisMonth: 12,
    rating: 4.9,
    reviewCount: 38,
    earnings: "R12,450",
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Bookings"
          value={stats.totalBookings.toString()}
          color="text-brand-rose"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={stats.thisMonth.toString()}
          color="text-status-success"
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={stats.rating.toString()}
          subtext={`${stats.reviewCount} reviews`}
          color="text-accent-gold"
        />
        <StatCard
          icon={Sparkles}
          label="Earnings"
          value={stats.earnings}
          color="text-brand-purple"
        />
      </div>

      {/* Coming Soon Placeholder */}
      <div className="text-center py-12 bg-background-secondary rounded-xl">
        <Scissors className="w-12 h-12 mx-auto text-text-muted mb-3" />
        <h3 className="font-medium text-text-primary mb-1">Stylist Dashboard</h3>
        <p className="text-sm text-text-secondary">
          Full business analytics coming in V5.1
        </p>
      </div>
    </div>
  );
}

/**
 * Salon Tab Content - Property Dashboard
 * TODO: Wire to salon/property dashboard API when available
 */
interface SalonTabProps {
  className?: string;
}

export function SalonTab({ className }: SalonTabProps) {
  // Mock data - needs salon dashboard API endpoint
  const stats = {
    totalChairs: 4,
    activeRentals: 3,
    occupancyRate: "75%",
    monthlyRevenue: "R8,200",
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Chairs"
          value={stats.totalChairs.toString()}
          color="text-brand-purple"
        />
        <StatCard
          icon={Calendar}
          label="Active Rentals"
          value={stats.activeRentals.toString()}
          color="text-brand-rose"
        />
        <StatCard
          icon={TrendingUp}
          label="Occupancy"
          value={stats.occupancyRate}
          color="text-status-success"
        />
        <StatCard
          icon={Sparkles}
          label="Revenue"
          value={stats.monthlyRevenue}
          color="text-accent-gold"
        />
      </div>

      {/* Coming Soon Placeholder */}
      <div className="text-center py-12 bg-background-secondary rounded-xl">
        <Building2 className="w-12 h-12 mx-auto text-text-muted mb-3" />
        <h3 className="font-medium text-text-primary mb-1">Salon Dashboard</h3>
        <p className="text-sm text-text-secondary">
          Property management features coming in V5.1
        </p>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: typeof Calendar;
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

function StatCard({ icon: Icon, label, value, subtext, color = "text-brand-rose" }: StatCardProps) {
  return (
    <div className="bg-background-primary border border-border-default rounded-xl p-4">
      <Icon className={cn("w-5 h-5 mb-2", color)} />
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </div>
  );
}
