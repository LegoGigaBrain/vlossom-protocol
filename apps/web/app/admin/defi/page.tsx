"use client";

/**
 * Admin DeFi Console (V4.0)
 * Dashboard for managing DeFi parameters, pools, and emergency controls
 *
 * Design System Compliance:
 * - Uses design tokens from tailwind.config.js
 * - Toast notifications instead of native alerts
 * - Confirmation dialogs instead of native confirm()
 * - Skeleton loading states
 * - Smooth transition animations
 */

import { useState, useEffect } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../hooks/use-toast";
import {
  ConfirmationDialog,
  useConfirmation,
} from "../../../components/ui/confirmation-dialog";

// ============================================================================
// Types
// ============================================================================

interface GlobalStats {
  totalTVL: string;
  totalPools: number;
  totalDepositors: number;
  totalYieldPaid: string;
  avgAPY: string;
}

interface PoolInfo {
  id: string;
  name: string;
  address: string;
  tier: string;
  totalDeposits: string;
  currentAPY: string;
  depositorCount: number;
  isActive: boolean;
  createdAt: string;
}

interface APYParams {
  baseRate: number;
  slope1: number;
  slope2: number;
  optimalUtilization: number;
}

interface FeeSplit {
  treasuryPercent: number;
  lpYieldPercent: number;
  bufferPercent: number;
}

// ============================================================================
// Skeleton Components
// ============================================================================

function StatCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-card p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-background-tertiary rounded" />
          <div className="h-8 w-24 bg-background-tertiary rounded" />
        </div>
        <div className="h-8 w-8 bg-background-tertiary rounded-lg" />
      </div>
    </div>
  );
}

function PoolRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-background-tertiary rounded" />
          <div className="h-3 w-20 bg-background-tertiary rounded" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 bg-background-tertiary rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-background-tertiary rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-background-tertiary rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-8 bg-background-tertiary rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 w-16 bg-background-tertiary rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-8 w-20 bg-background-tertiary rounded" />
      </td>
    </tr>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string;
  value: string;
  icon: IconName;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="bg-background-primary rounded-card shadow-card p-6 transition-all duration-medium hover:shadow-elevated">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption text-text-tertiary">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className="p-2 bg-brand-purple/10 rounded-lg">
          <Icon name={icon} size="lg" className="text-brand-purple" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminDefiPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [apyParams, setApyParams] = useState<APYParams>({
    baseRate: 400,
    slope1: 1000,
    slope2: 10000,
    optimalUtilization: 8000,
  });
  const [feeSplit, setFeeSplit] = useState<FeeSplit>({
    treasuryPercent: 50,
    lpYieldPercent: 40,
    bufferPercent: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "pools" | "config" | "emergency"
  >("overview");

  const { toast } = useToast();
  const confirmation = useConfirmation();

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const statsRes = await fetch("/api/v1/liquidity/stats", { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(
          data.data?.stats || {
            totalTVL: "0",
            totalPools: 0,
            totalDepositors: 0,
            totalYieldPaid: "0",
            avgAPY: "0",
          }
        );
      }

      const poolsRes = await fetch("/api/v1/liquidity/pools?limit=100", {
        headers,
      });
      if (poolsRes.ok) {
        const data = await poolsRes.json();
        setPools(data.data?.pools || []);
      }
    } catch (error) {
      console.error("Failed to fetch DeFi data:", error);
      toast({
        title: "Failed to load data",
        description: "Please try refreshing the page",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // ============================================================================
  // Configuration Handlers
  // ============================================================================

  const handleSaveAPYParams = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/admin/defi/apy-params", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apyParams),
      });

      if (response.ok) {
        toast({
          title: "APY parameters saved",
          description: "The new parameters are now active",
          variant: "success",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save APY params:", error);
      toast({
        title: "Failed to save APY parameters",
        description: "Please try again",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFeeSplit = async () => {
    const total =
      feeSplit.treasuryPercent +
      feeSplit.lpYieldPercent +
      feeSplit.bufferPercent;
    if (total !== 100) {
      toast({
        title: "Invalid fee split",
        description: "Percentages must total 100%",
        variant: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/admin/defi/fee-split", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feeSplit),
      });

      if (response.ok) {
        toast({
          title: "Fee split saved",
          description: "The new distribution is now active",
          variant: "success",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save fee split:", error);
      toast({
        title: "Failed to save fee split",
        description: "Please try again",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Pool Management Handlers
  // ============================================================================

  const handlePausePool = async (poolId: string, pause: boolean) => {
    const confirmed = await confirmation.confirm({
      title: pause ? "Pause Pool" : "Unpause Pool",
      description: pause
        ? "This will prevent all deposits and withdrawals for this pool. Are you sure?"
        : "This will allow deposits and withdrawals to resume. Are you sure?",
      confirmLabel: pause ? "Pause Pool" : "Unpause Pool",
      variant: pause ? "warning" : "default",
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/v1/admin/defi/pools/${poolId}/${pause ? "pause" : "unpause"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast({
          title: pause ? "Pool paused" : "Pool unpaused",
          description: "Changes are now active",
          variant: "success",
        });
        fetchData();
      } else {
        throw new Error("Failed to update pool");
      }
    } catch (error) {
      console.error("Failed to toggle pool:", error);
      toast({
        title: `Failed to ${pause ? "pause" : "unpause"} pool`,
        description: "Please try again",
        variant: "error",
      });
    }
  };

  // ============================================================================
  // Emergency Handlers
  // ============================================================================

  const handleEmergencyPauseAll = async () => {
    const confirmed = await confirmation.confirm({
      title: "Emergency Pause All Pools",
      description:
        "This will immediately pause ALL liquidity pools, preventing all deposits and withdrawals. This is a critical action that affects all users. Are you absolutely sure?",
      confirmLabel: "Pause All Pools",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/admin/defi/emergency/pause-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Emergency pause activated",
          description: "All pools have been paused",
          variant: "warning",
        });
        fetchData();
      } else {
        throw new Error("Failed to pause pools");
      }
    } catch (error) {
      console.error("Emergency pause failed:", error);
      toast({
        title: "Emergency pause failed",
        description: "Please try again or contact support",
        variant: "error",
      });
    }
  };

  const handleEmergencyUnpauseAll = async () => {
    const confirmed = await confirmation.confirm({
      title: "Unpause All Pools",
      description:
        "This will unpause all paused liquidity pools, allowing deposits and withdrawals to resume. Are you sure?",
      confirmLabel: "Unpause All",
      variant: "default",
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/admin/defi/emergency/unpause-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "All pools unpaused",
          description: "Normal operations have resumed",
          variant: "success",
        });
        fetchData();
      } else {
        throw new Error("Failed to unpause pools");
      }
    } catch (error) {
      console.error("Emergency unpause failed:", error);
      toast({
        title: "Failed to unpause pools",
        description: "Please try again",
        variant: "error",
      });
    }
  };

  // ============================================================================
  // APY Calculator
  // ============================================================================

  const calculateAPY = (utilization: number) => {
    const { baseRate, slope1, slope2, optimalUtilization } = apyParams;
    if (utilization <= optimalUtilization) {
      return baseRate + (utilization * slope1) / 10000;
    } else {
      const optimalPortion = (optimalUtilization * slope1) / 10000;
      const excessUtilization = utilization - optimalUtilization;
      const excessPortion = (excessUtilization * slope2) / 10000;
      return baseRate + optimalPortion + excessPortion;
    }
  };

  // ============================================================================
  // Tier Badge Component
  // ============================================================================

  const getTierBadge = (tier: string) => {
    const tierStyles: Record<string, string> = {
      GENESIS: "bg-brand-purple/10 text-brand-purple",
      TIER_1: "bg-status-warning/10 text-status-warning",
      TIER_2: "bg-status-info/10 text-brand-purple",
      TIER_3: "bg-background-tertiary text-text-secondary",
    };
    return tierStyles[tier] || tierStyles.TIER_3;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h2 font-bold text-text-primary">
            DeFi Admin Console
          </h1>
          <p className="text-body text-text-tertiary">
            Manage liquidity pools, APY parameters, and fees
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <Icon
            name="settings"
            size="sm"
            className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-default">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: "chart" as IconName },
            { id: "pools", label: "Pools", icon: "profile" as IconName },
            { id: "config", label: "Configuration", icon: "settings" as IconName },
            { id: "emergency", label: "Emergency", icon: "calmError" as IconName },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-fast ${
                activeTab === tab.id
                  ? "border-brand-purple text-brand-purple"
                  : "border-transparent text-text-tertiary hover:text-text-primary hover:border-border-default"
              }`}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total TVL"
              value={
                stats ? `$${parseFloat(stats.totalTVL).toLocaleString()}` : "-"
              }
              icon="currency"
              isLoading={isLoading}
            />
            <StatCard
              title="Total Pools"
              value={stats?.totalPools?.toString() || "0"}
              icon="profile"
              isLoading={isLoading}
            />
            <StatCard
              title="Depositors"
              value={stats?.totalDepositors?.toString() || "0"}
              icon="profile"
              isLoading={isLoading}
            />
            <StatCard
              title="Total Yield Paid"
              value={
                stats
                  ? `$${parseFloat(stats.totalYieldPaid).toLocaleString()}`
                  : "-"
              }
              icon="growing"
              isLoading={isLoading}
            />
            <StatCard
              title="Avg APY"
              value={
                stats
                  ? `${(parseFloat(stats.avgAPY) / 100).toFixed(2)}%`
                  : "-"
              }
              icon="chart"
              isLoading={isLoading}
            />
          </div>

          {/* Quick Pool Summary */}
          <div className="bg-background-primary rounded-card shadow-card p-6">
            <h2 className="text-body font-semibold text-text-primary mb-4">
              Active Pools
            </h2>
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-background-tertiary rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : pools.length === 0 ? (
                <p className="text-text-tertiary text-body">No pools found</p>
              ) : (
                pools.slice(0, 5).map((pool) => (
                  <div
                    key={pool.id}
                    className="flex items-center justify-between p-4 bg-background-secondary rounded-lg transition-colors duration-fast hover:bg-background-tertiary"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {pool.name}
                      </p>
                      <p className="text-caption text-text-tertiary">
                        {pool.tier} - {pool.depositorCount} depositors
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-status-success">
                        {(parseFloat(pool.currentAPY) / 100).toFixed(2)}% APY
                      </p>
                      <p className="text-caption text-text-tertiary">
                        ${parseFloat(pool.totalDeposits).toLocaleString()} TVL
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "pools" && (
        <div className="bg-background-primary rounded-card shadow-card overflow-hidden">
          <div className="p-6 border-b border-border-default">
            <h2 className="text-body font-semibold text-text-primary">
              All Liquidity Pools
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-background-secondary">
                <tr>
                  {["Pool", "Tier", "TVL", "APY", "Depositors", "Status", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-background-primary divide-y divide-border-default">
                {isLoading ? (
                  <>
                    <PoolRowSkeleton />
                    <PoolRowSkeleton />
                    <PoolRowSkeleton />
                  </>
                ) : pools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-text-tertiary"
                    >
                      No pools found
                    </td>
                  </tr>
                ) : (
                  pools.map((pool) => (
                    <tr
                      key={pool.id}
                      className="transition-colors duration-fast hover:bg-background-secondary"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-text-primary">
                            {pool.name}
                          </p>
                          <p className="text-xs text-text-tertiary font-mono">
                            {pool.address?.slice(0, 10)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getTierBadge(
                            pool.tier
                          )}`}
                        >
                          {pool.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                        ${parseFloat(pool.totalDeposits || "0").toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-status-success font-medium">
                        {(parseFloat(pool.currentAPY || "0") / 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-text-primary">
                        {pool.depositorCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            pool.isActive
                              ? "bg-status-success/10 text-status-success"
                              : "bg-status-error/10 text-status-error"
                          }`}
                        >
                          {pool.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handlePausePool(pool.id, pool.isActive)
                          }
                          className={
                            pool.isActive
                              ? "text-status-error hover:bg-status-error/10"
                              : "text-status-success hover:bg-status-success/10"
                          }
                        >
                          {pool.isActive ? (
                            <>
                              <Icon name="clock" size="sm" className="mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Icon name="play" size="sm" className="mr-1" />
                              Unpause
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* APY Parameters */}
          <div className="bg-background-primary rounded-card shadow-card p-6">
            <h2 className="text-body font-semibold text-text-primary mb-2">
              APY Parameters
            </h2>
            <p className="text-caption text-text-tertiary mb-4">
              Configure the Aave-style utilization curve for APY calculation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  Base Rate (basis points)
                </label>
                <input
                  type="number"
                  value={apyParams.baseRate}
                  onChange={(e) =>
                    setApyParams({
                      ...apyParams,
                      baseRate: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  400 = 4% base APY
                </p>
              </div>

              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  Slope 1 (0 to optimal)
                </label>
                <input
                  type="number"
                  value={apyParams.slope1}
                  onChange={(e) =>
                    setApyParams({
                      ...apyParams,
                      slope1: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  Slope 2 (optimal to 100%)
                </label>
                <input
                  type="number"
                  value={apyParams.slope2}
                  onChange={(e) =>
                    setApyParams({
                      ...apyParams,
                      slope2: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  Optimal Utilization (basis points)
                </label>
                <input
                  type="number"
                  value={apyParams.optimalUtilization}
                  onChange={(e) =>
                    setApyParams({
                      ...apyParams,
                      optimalUtilization: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  8000 = 80% optimal utilization
                </p>
              </div>

              {/* APY Preview */}
              <div className="bg-background-secondary rounded-lg p-4">
                <h3 className="text-caption font-medium text-text-primary mb-3">
                  APY Preview
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "0% util", value: calculateAPY(0) },
                    { label: "50% util", value: calculateAPY(5000) },
                    { label: "80% util", value: calculateAPY(8000) },
                    { label: "90% util", value: calculateAPY(9000) },
                    { label: "95% util", value: calculateAPY(9500) },
                    { label: "100% util", value: calculateAPY(10000) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-text-tertiary">{item.label}</p>
                      <p className="font-medium text-text-primary">
                        {(item.value / 100).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSaveAPYParams}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving && <Icon name="timer" size="sm" className="mr-2 animate-spin" />}
                Save APY Parameters
              </Button>
            </div>
          </div>

          {/* Fee Split */}
          <div className="bg-background-primary rounded-card shadow-card p-6">
            <h2 className="text-body font-semibold text-text-primary mb-2">
              Fee Split Configuration
            </h2>
            <p className="text-caption text-text-tertiary mb-4">
              Configure how platform fees (10% of booking value) are distributed.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  Treasury (Operations) %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeSplit.treasuryPercent}
                  onChange={(e) =>
                    setFeeSplit({
                      ...feeSplit,
                      treasuryPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  LP Yield %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeSplit.lpYieldPercent}
                  onChange={(e) =>
                    setFeeSplit({
                      ...feeSplit,
                      lpYieldPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
              </div>

              <div>
                <label className="block text-caption font-medium text-text-primary mb-1">
                  Smoothing Buffer %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeSplit.bufferPercent}
                  onChange={(e) =>
                    setFeeSplit({
                      ...feeSplit,
                      bufferPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-background-secondary border border-border-default rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-colors duration-fast"
                />
              </div>

              {/* Total Check */}
              <div
                className={`p-3 rounded-lg ${
                  feeSplit.treasuryPercent +
                    feeSplit.lpYieldPercent +
                    feeSplit.bufferPercent ===
                  100
                    ? "bg-status-success/10 text-status-success"
                    : "bg-status-error/10 text-status-error"
                }`}
              >
                Total:{" "}
                {feeSplit.treasuryPercent +
                  feeSplit.lpYieldPercent +
                  feeSplit.bufferPercent}
                %
                {feeSplit.treasuryPercent +
                  feeSplit.lpYieldPercent +
                  feeSplit.bufferPercent !==
                  100 && " (must equal 100%)"}
              </div>

              <Button
                onClick={handleSaveFeeSplit}
                disabled={
                  isSaving ||
                  feeSplit.treasuryPercent +
                    feeSplit.lpYieldPercent +
                    feeSplit.bufferPercent !==
                    100
                }
                className="w-full"
              >
                {isSaving && <Icon name="timer" size="sm" className="mr-2 animate-spin" />}
                Save Fee Split
              </Button>
            </div>
          </div>

          {/* Tier Configuration */}
          <div className="bg-background-primary rounded-card shadow-card p-6 lg:col-span-2">
            <h2 className="text-body font-semibold text-text-primary mb-2">
              Tier Configuration
            </h2>
            <p className="text-caption text-text-tertiary mb-4">
              Pool creation requirements by referral tier. Changes require smart
              contract update.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-caption text-text-tertiary">
                    <th className="py-3 pr-4 font-medium">Tier</th>
                    <th className="py-3 pr-4 font-medium">
                      Referral Requirement
                    </th>
                    <th className="py-3 pr-4 font-medium">Pool Cap</th>
                    <th className="py-3 pr-4 font-medium">Creation Fee</th>
                    <th className="py-3 pr-4 font-medium">Creator Yield Share</th>
                  </tr>
                </thead>
                <tbody className="text-body text-text-primary">
                  <tr className="border-t border-border-default">
                    <td className="py-3 pr-4 font-medium">Tier 1</td>
                    <td className="py-3 pr-4">Top 5% referrers</td>
                    <td className="py-3 pr-4">No cap</td>
                    <td className="py-3 pr-4">$1,000</td>
                    <td className="py-3 pr-4">5%</td>
                  </tr>
                  <tr className="border-t border-border-default">
                    <td className="py-3 pr-4 font-medium">Tier 2</td>
                    <td className="py-3 pr-4">Top 15% referrers</td>
                    <td className="py-3 pr-4">$100,000</td>
                    <td className="py-3 pr-4">$2,500</td>
                    <td className="py-3 pr-4">3%</td>
                  </tr>
                  <tr className="border-t border-border-default">
                    <td className="py-3 pr-4 font-medium">Tier 3</td>
                    <td className="py-3 pr-4">Top 30% referrers</td>
                    <td className="py-3 pr-4">$20,000</td>
                    <td className="py-3 pr-4">$5,000</td>
                    <td className="py-3 pr-4">1%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-status-error/5 border border-status-error/20 rounded-card p-6">
            <div className="flex items-center gap-2 text-status-error mb-4">
              <Icon name="calmError" size="md" />
              <h2 className="text-body font-semibold">Emergency Controls</h2>
            </div>
            <p className="text-caption text-status-error/80 mb-6">
              Use these controls only in case of emergency. They affect all users
              and pools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEmergencyPauseAll}
                className="flex items-center justify-center gap-2"
              >
                <Icon name="clock" size="md" />
                Pause All Pools
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleEmergencyUnpauseAll}
                className="flex items-center justify-center gap-2 bg-status-success hover:bg-status-success/90"
              >
                <Icon name="play" size="md" />
                Unpause All Pools
              </Button>
            </div>
          </div>

          <div className="bg-background-primary rounded-card shadow-card p-6">
            <h3 className="text-body font-semibold text-text-primary mb-4">
              Emergency Actions Log
            </h3>
            <p className="text-text-tertiary text-caption">
              No recent emergency actions.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmation.open}
        onOpenChange={confirmation.setOpen}
        title={confirmation.title}
        description={confirmation.description}
        confirmLabel={confirmation.confirmLabel}
        cancelLabel={confirmation.cancelLabel}
        variant={confirmation.variant}
        onConfirm={confirmation.onConfirm}
        onCancel={confirmation.onCancel}
      />
    </div>
  );
}
