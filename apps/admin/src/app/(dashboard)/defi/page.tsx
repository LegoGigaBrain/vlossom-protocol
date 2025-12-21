/**
 * Admin DeFi Configuration Page (V7.0.0)
 *
 * Manage DeFi pools, APY parameters, and fee splits.
 */

"use client";

import { useState } from "react";
import { StatCard } from "../../../components/ui/stat-card";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import {
  useDefiStats,
  useDefiConfig,
  useUpdateAPYParams,
  useUpdateFeeSplit,
  useEmergencyPauseAll,
  useEmergencyUnpauseAll,
} from "../../../hooks/use-defi";
import { type APYParams, type FeeSplit } from "../../../lib/defi-client";

export default function DefiPage() {
  const { data: statsData, isLoading: statsLoading } = useDefiStats();
  const { data: configData, isLoading: configLoading } = useDefiConfig();
  const stats = statsData?.stats;

  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyAction, setEmergencyAction] = useState<"pause" | "unpause">("pause");

  const [apyForm, setApyForm] = useState<APYParams | null>(null);
  const [feeSplitForm, setFeeSplitForm] = useState<FeeSplit | null>(null);

  const updateAPY = useUpdateAPYParams();
  const updateFees = useUpdateFeeSplit();
  const pauseAll = useEmergencyPauseAll();
  const unpauseAll = useEmergencyUnpauseAll();

  // Initialize forms when config loads
  if (configData && !apyForm) {
    setApyForm(configData.apyParams);
  }
  if (configData && !feeSplitForm) {
    setFeeSplitForm(configData.feeSplit);
  }

  const handleAPYSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apyForm) {
      updateAPY.mutate(apyForm);
    }
  };

  const handleFeeSplitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feeSplitForm) {
      updateFees.mutate(feeSplitForm);
    }
  };

  const handleEmergencyAction = () => {
    if (emergencyAction === "pause") {
      pauseAll.mutate();
    } else {
      unpauseAll.mutate();
    }
    setShowEmergencyDialog(false);
  };

  const formatTVL = (tvl: string) => {
    const value = parseFloat(tvl);
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DeFi Configuration</h1>
          <p className="text-gray-500 mt-1">
            Manage yield pools, APY parameters, and fee distribution.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEmergencyAction("unpause");
              setShowEmergencyDialog(true);
            }}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
          >
            Unpause All
          </button>
          <button
            onClick={() => {
              setEmergencyAction("pause");
              setShowEmergencyDialog(true);
            }}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            Emergency Pause
          </button>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total TVL"
            value={formatTVL(stats.totalTVL)}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Active Pools"
            value={`${stats.activePools} / ${stats.totalPools}`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Total Depositors"
            value={stats.totalDepositors.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="Average APY"
            value={`${parseFloat(stats.avgAPY).toFixed(2)}%`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="orange"
          />
        </div>
      ) : null}

      {/* Yield Paid & Pool Tiers */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Yield Paid */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Yield Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Yield Paid</span>
                <span className="text-2xl font-semibold text-green-600">
                  {formatTVL(stats.totalYieldPaid)}
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="text-xs text-gray-500">
                Lifetime yield distributed to liquidity providers
              </div>
            </div>
          </div>

          {/* Pool Tiers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Pools by Tier</h3>
            <div className="space-y-3">
              {stats.poolsByTier.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {tier.tier}
                    </span>
                    <span className="text-sm text-gray-600">{tier.count} pools</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatTVL(tier.tvl)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuration Forms */}
      {configLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* APY Parameters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">APY Parameters</h3>
            <form onSubmit={handleAPYSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Base Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={apyForm?.baseRate ?? 0}
                  onChange={(e) =>
                    setApyForm((prev) =>
                      prev ? { ...prev, baseRate: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Slope 1 (below optimal)</label>
                <input
                  type="number"
                  step="0.01"
                  value={apyForm?.slope1 ?? 0}
                  onChange={(e) =>
                    setApyForm((prev) =>
                      prev ? { ...prev, slope1: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Slope 2 (above optimal)</label>
                <input
                  type="number"
                  step="0.01"
                  value={apyForm?.slope2 ?? 0}
                  onChange={(e) =>
                    setApyForm((prev) =>
                      prev ? { ...prev, slope2: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Optimal Utilization (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={apyForm?.optimalUtilization ?? 0}
                  onChange={(e) =>
                    setApyForm((prev) =>
                      prev ? { ...prev, optimalUtilization: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={updateAPY.isPending}
                className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateAPY.isPending ? "Saving..." : "Save APY Parameters"}
              </button>
              {updateAPY.isSuccess && (
                <p className="text-sm text-green-600">APY parameters updated successfully</p>
              )}
              {updateAPY.isError && (
                <p className="text-sm text-red-600">Failed to update APY parameters</p>
              )}
            </form>
          </div>

          {/* Fee Split */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Fee Split Configuration</h3>
            <form onSubmit={handleFeeSplitSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Treasury (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={feeSplitForm?.treasuryPercent ?? 0}
                  onChange={(e) =>
                    setFeeSplitForm((prev) =>
                      prev ? { ...prev, treasuryPercent: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Protocol treasury allocation</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">LP Yield (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={feeSplitForm?.lpYieldPercent ?? 0}
                  onChange={(e) =>
                    setFeeSplitForm((prev) =>
                      prev ? { ...prev, lpYieldPercent: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Distributed to liquidity providers</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Buffer (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={feeSplitForm?.bufferPercent ?? 0}
                  onChange={(e) =>
                    setFeeSplitForm((prev) =>
                      prev ? { ...prev, bufferPercent: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Reserve buffer for risk management</p>
              </div>
              {feeSplitForm && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Total:{" "}
                    <span
                      className={
                        feeSplitForm.treasuryPercent +
                          feeSplitForm.lpYieldPercent +
                          feeSplitForm.bufferPercent ===
                        100
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {feeSplitForm.treasuryPercent +
                        feeSplitForm.lpYieldPercent +
                        feeSplitForm.bufferPercent}
                      %
                    </span>
                    {feeSplitForm.treasuryPercent +
                      feeSplitForm.lpYieldPercent +
                      feeSplitForm.bufferPercent !==
                      100 && <span className="text-red-600 ml-2">(must equal 100%)</span>}
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={
                  updateFees.isPending ||
                  (feeSplitForm &&
                    feeSplitForm.treasuryPercent +
                      feeSplitForm.lpYieldPercent +
                      feeSplitForm.bufferPercent !==
                      100)
                }
                className="w-full px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateFees.isPending ? "Saving..." : "Save Fee Split"}
              </button>
              {updateFees.isSuccess && (
                <p className="text-sm text-green-600">Fee split updated successfully</p>
              )}
              {updateFees.isError && (
                <p className="text-sm text-red-600">Failed to update fee split</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Emergency Dialog */}
      <ConfirmDialog
        open={showEmergencyDialog}
        onOpenChange={setShowEmergencyDialog}
        title={emergencyAction === "pause" ? "Emergency Pause All Pools" : "Unpause All Pools"}
        description={
          emergencyAction === "pause"
            ? "This will immediately pause ALL yield pools. No deposits or withdrawals will be possible until unpaused. Use only in emergency situations."
            : "This will unpause all pools and resume normal operations. Make sure any security issues have been resolved."
        }
        confirmLabel={emergencyAction === "pause" ? "Pause All Pools" : "Unpause All Pools"}
        onConfirm={handleEmergencyAction}
        isLoading={pauseAll.isPending || unpauseAll.isPending}
        variant={emergencyAction === "pause" ? "destructive" : "default"}
      />
    </div>
  );
}
