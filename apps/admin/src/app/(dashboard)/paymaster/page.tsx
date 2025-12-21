/**
 * Admin Paymaster Monitoring Page (V7.0.0)
 *
 * Monitor paymaster balance, gas usage, and configure alerts.
 */

"use client";

import { useState, useMemo } from "react";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Pagination } from "../../../components/ui/pagination";
import { StatCard } from "../../../components/ui/stat-card";
import {
  usePaymasterStats,
  usePaymasterTransactions,
  useGasUsageHistory,
  useAlertConfigs,
  useUpdateAlertConfig,
  useCheckAlerts,
  useRefreshStats,
} from "../../../hooks/use-paymaster";
import {
  type PaymasterTransaction,
  type AlertConfig,
  formatWei,
  formatSuccessRate,
} from "../../../lib/paymaster-client";

export default function PaymasterPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "PENDING" | "SUCCESS" | "FAILED">("");
  const [showAlertConfig, setShowAlertConfig] = useState(false);

  const { data: stats, isLoading: statsLoading } = usePaymasterStats();
  const { data: transactions, isLoading: txLoading } = usePaymasterTransactions({
    page,
    pageSize: 20,
    status: statusFilter || undefined,
  });
  const { data: gasHistory } = useGasUsageHistory(7);
  const { data: alertsData } = useAlertConfigs();
  const alerts = alertsData?.alerts || [];

  const updateAlert = useUpdateAlertConfig();
  const checkAlerts = useCheckAlerts();
  const refreshStats = useRefreshStats();

  const columns: Column<PaymasterTransaction>[] = useMemo(
    () => [
      {
        key: "time",
        header: "Time",
        render: (tx) => (
          <div className="text-sm">
            <div className="text-gray-900">
              {new Date(tx.createdAt).toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(tx.createdAt).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        key: "sender",
        header: "Sender",
        render: (tx) => (
          <span className="text-sm font-mono text-gray-700 truncate max-w-[120px] block">
            {tx.sender.slice(0, 8)}...{tx.sender.slice(-6)}
          </span>
        ),
      },
      {
        key: "gasUsed",
        header: "Gas Used",
        render: (tx) => (
          <span className="text-sm text-gray-700">
            {parseInt(tx.gasUsed).toLocaleString()}
          </span>
        ),
      },
      {
        key: "cost",
        header: "Cost",
        render: (tx) => (
          <span className="text-sm font-medium text-gray-900">
            {formatWei(tx.totalCost)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (tx) => {
          const colors = {
            PENDING: "bg-yellow-100 text-yellow-700",
            SUCCESS: "bg-green-100 text-green-700",
            FAILED: "bg-red-100 text-red-700",
          };
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors[tx.status]}`}>
              {tx.status}
            </span>
          );
        },
      },
      {
        key: "txHash",
        header: "Tx Hash",
        render: (tx) =>
          tx.txHash ? (
            <a
              href={`https://basescan.org/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:underline font-mono"
            >
              {tx.txHash.slice(0, 10)}...
            </a>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
    ],
    []
  );

  const getBalanceStatus = () => {
    if (!stats) return { color: "gray", label: "Unknown" };
    const ethBalance = parseFloat(stats.currentBalance.eth);
    if (ethBalance < 0.1) return { color: "red", label: "Critical" };
    if (ethBalance < 0.5) return { color: "yellow", label: "Low" };
    return { color: "green", label: "Healthy" };
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paymaster Monitor</h1>
          <p className="text-gray-500 mt-1">
            Track gas sponsorship, balance, and transaction history.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => checkAlerts.mutate()}
            disabled={checkAlerts.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {checkAlerts.isPending ? "Checking..." : "Check Alerts"}
          </button>
          <button
            onClick={() => refreshStats.mutate()}
            disabled={refreshStats.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {refreshStats.isPending ? "Refreshing..." : "Refresh Stats"}
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
            title="Current Balance"
            value={`${parseFloat(stats.currentBalance.eth).toFixed(4)} ETH`}
            icon={
              <div
                className={`w-3 h-3 rounded-full ${
                  balanceStatus.color === "red"
                    ? "bg-red-500"
                    : balanceStatus.color === "yellow"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              />
            }
            color={balanceStatus.color === "red" ? "red" : balanceStatus.color === "yellow" ? "orange" : "green"}
            subtitle={balanceStatus.label}
          />
          <StatCard
            title="Total Sponsored"
            value={formatWei(stats.gas.totalCostWei)}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            }
            color="orange"
          />
          <StatCard
            title="Total Transactions"
            value={stats.transactions.total.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={formatSuccessRate(stats.transactions.successRate)}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
        </div>
      ) : null}

      {/* 24h Stats & Gas Chart */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Last 24 Hours */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Last 24 Hours</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transactions</span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.last24h.transactions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cost</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatWei(stats.last24h.costWei)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Users</span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.users.last24h.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Gas/Tx</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatWei(stats.gas.averagePerTx)}
                </span>
              </div>
            </div>
          </div>

          {/* Gas Usage Chart (7 days) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Daily Gas Usage (7 days)</h3>
            {gasHistory?.data && gasHistory.data.length > 0 ? (
              <div className="space-y-2">
                {gasHistory.data.map((point) => {
                  const maxTx = Math.max(...gasHistory.data.map((p) => p.totalTransactions));
                  const width = (point.totalTransactions / maxTx) * 100;
                  return (
                    <div key={point.date} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-16">
                        {new Date(point.date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">
                        {point.totalTransactions}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>
        </div>
      )}

      {/* Alerts Configuration */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setShowAlertConfig(!showAlertConfig)}
        >
          <h3 className="text-sm font-medium text-gray-900">Alert Configuration</h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showAlertConfig ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {showAlertConfig && (
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <AlertConfigRow
                    key={alert.type}
                    alert={alert}
                    onUpdate={(updated) => updateAlert.mutate(updated)}
                    isUpdating={updateAlert.isPending}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500">No alerts configured</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Recent Transactions</h3>
          <div className="flex gap-2">
            {(["", "SUCCESS", "FAILED", "PENDING"] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === status
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status || "All"}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={transactions?.items || []}
          isLoading={txLoading}
          emptyMessage="No transactions found"
        />

        {transactions && transactions.pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={transactions.pagination.page}
              totalPages={transactions.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Check Alerts Result */}
      {checkAlerts.isSuccess && checkAlerts.data && (
        <div
          className={`p-4 rounded-lg ${
            checkAlerts.data.triggeredAlerts > 0
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              checkAlerts.data.triggeredAlerts > 0 ? "text-red-700" : "text-green-700"
            }`}
          >
            {checkAlerts.data.triggeredAlerts > 0
              ? `${checkAlerts.data.triggeredAlerts} alert(s) triggered`
              : "All checks passed - no alerts triggered"}
          </p>
          {checkAlerts.data.alerts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {checkAlerts.data.alerts.map((a, i) => (
                <li key={i} className="text-sm text-red-600">
                  {a.type}: {a.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AlertConfigRow({
  alert,
  onUpdate,
  isUpdating,
}: {
  alert: AlertConfig;
  onUpdate: (alert: AlertConfig) => void;
  isUpdating: boolean;
}) {
  const [threshold, setThreshold] = useState(alert.threshold);
  const [isActive, setIsActive] = useState(alert.isActive);

  const labels: Record<AlertConfig["type"], string> = {
    LOW_BALANCE: "Low Balance Alert",
    HIGH_USAGE: "High Usage Alert",
    ERROR_RATE: "Error Rate Alert",
  };

  const descriptions: Record<AlertConfig["type"], string> = {
    LOW_BALANCE: "Alert when balance falls below threshold (ETH)",
    HIGH_USAGE: "Alert when daily gas usage exceeds threshold (Gwei)",
    ERROR_RATE: "Alert when error rate exceeds threshold (%)",
  };

  const handleSave = () => {
    onUpdate({
      ...alert,
      threshold,
      isActive,
    });
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{labels[alert.type]}</span>
          <span
            className={`px-2 py-0.5 text-xs rounded ${
              isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
            }`}
          >
            {isActive ? "Active" : "Disabled"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{descriptions[alert.type]}</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={alert.type === "LOW_BALANCE" ? "0.01" : "1"}
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={() => setIsActive(!isActive)}
          className={`p-2 rounded transition-colors ${
            isActive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isActive ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </button>
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
