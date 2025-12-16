"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Settings,
  TrendingUp,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  DollarSign,
  Users,
  Percent,
  Activity,
} from "lucide-react";

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

/**
 * Admin DeFi Console (V4.0)
 * Dashboard for managing DeFi parameters, pools, and emergency controls
 */
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
  const [activeTab, setActiveTab] = useState<"overview" | "pools" | "config" | "emergency">("overview");

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Fetch global stats
      const statsRes = await fetch("/api/v1/liquidity/stats", { headers });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data?.stats || {
          totalTVL: "0",
          totalPools: 0,
          totalDepositors: 0,
          totalYieldPaid: "0",
          avgAPY: "0",
        });
      }

      // Fetch pools
      const poolsRes = await fetch("/api/v1/liquidity/pools?limit=100", { headers });
      if (poolsRes.ok) {
        const data = await poolsRes.json();
        setPools(data.data?.pools || []);
      }
    } catch (error) {
      console.error("Failed to fetch DeFi data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

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
        alert("APY parameters saved successfully!");
      } else {
        alert("Failed to save APY parameters");
      }
    } catch (error) {
      console.error("Failed to save APY params:", error);
      alert("Failed to save APY parameters");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFeeSplit = async () => {
    const total = feeSplit.treasuryPercent + feeSplit.lpYieldPercent + feeSplit.bufferPercent;
    if (total !== 100) {
      alert("Fee split must total 100%");
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
        alert("Fee split saved successfully!");
      } else {
        alert("Failed to save fee split");
      }
    } catch (error) {
      console.error("Failed to save fee split:", error);
      alert("Failed to save fee split");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePausePool = async (poolId: string, pause: boolean) => {
    if (!confirm(`Are you sure you want to ${pause ? "pause" : "unpause"} this pool?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/v1/admin/defi/pools/${poolId}/${pause ? "pause" : "unpause"}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        fetchData();
      } else {
        alert(`Failed to ${pause ? "pause" : "unpause"} pool`);
      }
    } catch (error) {
      console.error("Failed to toggle pool:", error);
    }
  };

  const handleEmergencyPauseAll = async () => {
    if (!confirm("EMERGENCY: Are you sure you want to pause ALL pools? This will prevent all deposits and withdrawals.")) {
      return;
    }

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
        alert("All pools paused");
        fetchData();
      } else {
        alert("Failed to pause pools");
      }
    } catch (error) {
      console.error("Emergency pause failed:", error);
    }
  };

  const handleEmergencyUnpauseAll = async () => {
    if (!confirm("Are you sure you want to unpause ALL pools?")) {
      return;
    }

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
        alert("All pools unpaused");
        fetchData();
      } else {
        alert("Failed to unpause pools");
      }
    } catch (error) {
      console.error("Emergency unpause failed:", error);
    }
  };

  // Calculate estimated APY for a given utilization
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DeFi Admin Console</h1>
          <p className="text-gray-500">Manage liquidity pools, APY parameters, and fees</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "pools", label: "Pools", icon: Users },
            { id: "config", label: "Configuration", icon: Settings },
            { id: "emergency", label: "Emergency", icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
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
              value={stats ? `$${parseFloat(stats.totalTVL).toLocaleString()}` : "-"}
              icon={DollarSign}
              isLoading={isLoading}
            />
            <StatCard
              title="Total Pools"
              value={stats?.totalPools?.toString() || "0"}
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title="Depositors"
              value={stats?.totalDepositors?.toString() || "0"}
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title="Total Yield Paid"
              value={stats ? `$${parseFloat(stats.totalYieldPaid).toLocaleString()}` : "-"}
              icon={TrendingUp}
              isLoading={isLoading}
            />
            <StatCard
              title="Avg APY"
              value={stats ? `${(parseFloat(stats.avgAPY) / 100).toFixed(2)}%` : "-"}
              icon={Percent}
              isLoading={isLoading}
            />
          </div>

          {/* Quick Pool Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Active Pools</h2>
            <div className="space-y-3">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded" />
                  ))}
                </div>
              ) : pools.length === 0 ? (
                <p className="text-gray-500">No pools found</p>
              ) : (
                pools.slice(0, 5).map((pool) => (
                  <div
                    key={pool.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{pool.name}</p>
                      <p className="text-sm text-gray-500">
                        {pool.tier} - {pool.depositorCount} depositors
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {(parseFloat(pool.currentAPY) / 100).toFixed(2)}% APY
                      </p>
                      <p className="text-sm text-gray-500">
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Liquidity Pools</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TVL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    APY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depositors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : pools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No pools found
                    </td>
                  </tr>
                ) : (
                  pools.map((pool) => (
                    <tr key={pool.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium">{pool.name}</p>
                          <p className="text-xs text-gray-400 font-mono">
                            {pool.address?.slice(0, 10)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            pool.tier === "GENESIS"
                              ? "bg-purple-100 text-purple-800"
                              : pool.tier === "TIER_1"
                              ? "bg-yellow-100 text-yellow-800"
                              : pool.tier === "TIER_2"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {pool.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${parseFloat(pool.totalDeposits || "0").toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                        {(parseFloat(pool.currentAPY || "0") / 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pool.depositorCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            pool.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pool.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handlePausePool(pool.id, pool.isActive)}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded ${
                            pool.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {pool.isActive ? (
                            <>
                              <PauseCircle className="h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4" />
                              Unpause
                            </>
                          )}
                        </button>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">APY Parameters</h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure the Aave-style utilization curve for APY calculation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Rate (basis points)
                </label>
                <input
                  type="number"
                  value={apyParams.baseRate}
                  onChange={(e) =>
                    setApyParams({ ...apyParams, baseRate: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  400 = 4% base APY
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slope 1 (0 to optimal)
                </label>
                <input
                  type="number"
                  value={apyParams.slope1}
                  onChange={(e) =>
                    setApyParams({ ...apyParams, slope1: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slope 2 (optimal to 100%)
                </label>
                <input
                  type="number"
                  value={apyParams.slope2}
                  onChange={(e) =>
                    setApyParams({ ...apyParams, slope2: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  8000 = 80% optimal utilization
                </p>
              </div>

              {/* APY Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">APY Preview</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">0% util</p>
                    <p className="font-medium">{(calculateAPY(0) / 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">50% util</p>
                    <p className="font-medium">{(calculateAPY(5000) / 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">80% util</p>
                    <p className="font-medium">{(calculateAPY(8000) / 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">90% util</p>
                    <p className="font-medium">{(calculateAPY(9000) / 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">95% util</p>
                    <p className="font-medium">{(calculateAPY(9500) / 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">100% util</p>
                    <p className="font-medium">{(calculateAPY(10000) / 100).toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveAPYParams}
                disabled={isSaving}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save APY Parameters"}
              </button>
            </div>
          </div>

          {/* Fee Split */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Fee Split Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure how platform fees (10% of booking value) are distributed.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Treasury (Operations) %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeSplit.treasuryPercent}
                  onChange={(e) =>
                    setFeeSplit({ ...feeSplit, treasuryPercent: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  LP Yield %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeSplit.lpYieldPercent}
                  onChange={(e) =>
                    setFeeSplit({ ...feeSplit, lpYieldPercent: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Smoothing Buffer %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeSplit.bufferPercent}
                  onChange={(e) =>
                    setFeeSplit({ ...feeSplit, bufferPercent: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Total Check */}
              <div
                className={`p-3 rounded-lg ${
                  feeSplit.treasuryPercent + feeSplit.lpYieldPercent + feeSplit.bufferPercent === 100
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                Total: {feeSplit.treasuryPercent + feeSplit.lpYieldPercent + feeSplit.bufferPercent}%
                {feeSplit.treasuryPercent + feeSplit.lpYieldPercent + feeSplit.bufferPercent !== 100 &&
                  " (must equal 100%)"}
              </div>

              <button
                onClick={handleSaveFeeSplit}
                disabled={
                  isSaving ||
                  feeSplit.treasuryPercent + feeSplit.lpYieldPercent + feeSplit.bufferPercent !== 100
                }
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Fee Split"}
              </button>
            </div>
          </div>

          {/* Tier Configuration */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Tier Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">
              Pool creation requirements by referral tier. Changes require smart contract update.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Referral Requirement</th>
                    <th className="py-2 pr-4">Pool Cap</th>
                    <th className="py-2 pr-4">Creation Fee</th>
                    <th className="py-2 pr-4">Creator Yield Share</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="py-2 pr-4 font-medium">Tier 1</td>
                    <td className="py-2 pr-4">Top 5% referrers</td>
                    <td className="py-2 pr-4">No cap</td>
                    <td className="py-2 pr-4">$1,000</td>
                    <td className="py-2 pr-4">5%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Tier 2</td>
                    <td className="py-2 pr-4">Top 15% referrers</td>
                    <td className="py-2 pr-4">$100,000</td>
                    <td className="py-2 pr-4">$2,500</td>
                    <td className="py-2 pr-4">3%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Tier 3</td>
                    <td className="py-2 pr-4">Top 30% referrers</td>
                    <td className="py-2 pr-4">$20,000</td>
                    <td className="py-2 pr-4">$5,000</td>
                    <td className="py-2 pr-4">1%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-red-800 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Emergency Controls</h2>
            </div>
            <p className="text-sm text-red-700 mb-6">
              Use these controls only in case of emergency. They affect all users and pools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleEmergencyPauseAll}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                <PauseCircle className="h-5 w-5" />
                Pause All Pools
              </button>

              <button
                onClick={handleEmergencyUnpauseAll}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <PlayCircle className="h-5 w-5" />
                Unpause All Pools
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Actions Log</h3>
            <p className="text-gray-500 text-sm">
              No recent emergency actions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
        <Icon className="h-8 w-8 text-purple-600" />
      </div>
    </div>
  );
}
