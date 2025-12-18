"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon, type IconName } from "@/components/icons";
import { StatsCards } from "../../../components/admin/paymaster/stats-cards";
import { AlertsPanel } from "../../../components/admin/paymaster/alerts-panel";

// Lazy load heavy chart and table components
const GasUsageChart = dynamic(
  () => import("../../../components/admin/paymaster/gas-usage-chart").then(mod => ({ default: mod.GasUsageChart })),
  {
    loading: () => <div className="h-[300px] skeleton-shimmer rounded-card" />,
    ssr: false
  }
);

const TransactionsTable = dynamic(
  () => import("../../../components/admin/paymaster/transactions-table").then(mod => ({ default: mod.TransactionsTable })),
  {
    loading: () => <div className="h-[400px] skeleton-shimmer rounded-card" />,
    ssr: false
  }
);

/**
 * Paymaster Dashboard Page (F5.1)
 * Admin dashboard for monitoring gas sponsorship
 */
export default function PaymasterDashboardPage() {
  const [stats, setStats] = useState(null);
  const [gasUsage, setGasUsage] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [statsRes, gasRes, txRes, alertsRes] = await Promise.all([
        fetch("/api/v1/admin/paymaster/stats", { headers }),
        fetch("/api/v1/admin/paymaster/gas-usage?days=30", { headers }),
        fetch(`/api/v1/admin/paymaster/transactions?page=${page}&pageSize=10`, {
          headers,
        }),
        fetch("/api/v1/admin/paymaster/alerts", { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (gasRes.ok) {
        const gasData = await gasRes.json();
        setGasUsage(gasData.data);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.items);
        setPagination(txData.pagination);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts);
      }
    } catch (error) {
      console.error("Failed to fetch paymaster data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(currentPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUpdateAlert = async (config: {
    type: string;
    threshold: number;
    isActive: boolean;
    notifySlack: boolean;
    notifyEmail: boolean;
    emailRecipients?: string;
  }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/admin/paymaster/alerts/config", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        // Refresh alerts
        const alertsRes = await fetch("/api/v1/admin/paymaster/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData.alerts);
        }
      }
    } catch (error) {
      console.error("Failed to update alert:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Paymaster Dashboard
          </h1>
          <p className="text-gray-500">
            Monitor gas sponsorship for Account Abstraction
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <Icon
            name="settings"
            size="sm"
            className={isRefreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Charts and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GasUsageChart data={gasUsage} isLoading={isLoading} />
        </div>
        <div>
          <AlertsPanel
            alerts={alerts}
            isLoading={isLoading}
            onUpdateAlert={handleUpdateAlert}
          />
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions}
        isLoading={isLoading}
        pagination={pagination ?? undefined}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
