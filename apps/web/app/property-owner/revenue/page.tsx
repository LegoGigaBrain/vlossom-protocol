/**
 * Property Owner Revenue Page
 * Reference: docs/vlossom/17-property-owner-module.md
 */

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "../../../lib/auth-client";
import { useMyProperties } from "../../../hooks/use-properties";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";
import { cn } from "../../../lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Types
interface RevenueStats {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
}

interface RevenueTransaction {
  id: string;
  propertyId: string;
  chairId: string;
  stylistId: string;
  amount: number;
  type: "RENTAL_FEE" | "BOOKING_FEE" | "PAYOUT";
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  property: {
    name: string;
  };
  chair: {
    name: string;
  };
  stylist: {
    displayName: string;
  };
}

// Fetch revenue stats
async function fetchRevenueStats(): Promise<RevenueStats> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}/api/v1/properties/revenue/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Return mock data for now if endpoint doesn't exist
    return {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
    };
  }

  return response.json();
}

// Fetch recent transactions
async function fetchRevenueTransactions(): Promise<{ transactions: RevenueTransaction[] }> {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}/api/v1/properties/revenue/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Return empty array for now if endpoint doesn't exist
    return { transactions: [] };
  }

  return response.json();
}

// Format cents to ZAR
function formatPrice(cents: number): string {
  return `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Stats card component
interface StatCardProps {
  label: string;
  value: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
}

function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-caption text-text-secondary mb-1">{label}</p>
          <p className="text-h2 text-text-primary">{value}</p>
          {change && (
            <p
              className={cn(
                "text-caption mt-1 flex items-center gap-1",
                change.isPositive ? "text-status-success" : "text-status-error"
              )}
            >
              <Icon
                name={change.isPositive ? "growing" : "growing"}
                size="sm"
                className={!change.isPositive ? "rotate-180" : ""}
              />
              {change.isPositive ? "+" : ""}{change.value}% vs last month
            </p>
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
        <div className="h-4 skeleton-shimmer rounded w-24" />
        <div className="h-8 skeleton-shimmer rounded w-32" />
        <div className="h-4 skeleton-shimmer rounded w-20" />
      </div>
    </div>
  );
}

// Transaction row component
interface TransactionRowProps {
  transaction: RevenueTransaction;
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type !== "PAYOUT";

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isIncome ? "bg-status-success/10" : "bg-brand-rose/10"
          )}
        >
          <Icon
            name={isIncome ? "growing" : "wallet"}
            size="md"
            className={isIncome ? "text-status-success" : "text-brand-rose"}
          />
        </div>
        <div>
          <p className="text-body text-text-primary">
            {transaction.type === "PAYOUT"
              ? "Payout"
              : `${transaction.chair.name} - ${transaction.stylist.displayName}`}
          </p>
          <p className="text-caption text-text-tertiary">
            {transaction.property.name} • {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "text-body font-medium",
            isIncome ? "text-status-success" : "text-text-primary"
          )}
        >
          {isIncome ? "+" : "-"}{formatPrice(transaction.amount)}
        </p>
        <p
          className={cn(
            "text-caption",
            transaction.status === "COMPLETED"
              ? "text-status-success"
              : transaction.status === "PENDING"
                ? "text-status-warning"
                : "text-status-error"
          )}
        >
          {transaction.status.toLowerCase()}
        </p>
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 skeleton-shimmer rounded-full" />
        <div>
          <div className="h-5 skeleton-shimmer rounded w-40 mb-1" />
          <div className="h-4 skeleton-shimmer rounded w-24" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-5 skeleton-shimmer rounded w-20 mb-1 ml-auto" />
        <div className="h-4 skeleton-shimmer rounded w-16 ml-auto" />
      </div>
    </div>
  );
}

export default function PropertyOwnerRevenuePage() {
  const [period, setPeriod] = React.useState<"week" | "month" | "year">("month");

  // Fetch data
  const { data: properties } = useMyProperties();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: fetchRevenueStats,
  });
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["revenue-transactions"],
    queryFn: fetchRevenueTransactions,
  });

  const hasProperties = (properties?.properties?.length || 0) > 0;
  const transactions = transactionsData?.transactions || [];

  // Calculate month-over-month change
  const monthChange = React.useMemo(() => {
    if (!stats || stats.lastMonthEarnings === 0) return null;
    const change = ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Revenue</h1>
          <p className="text-body text-text-secondary">
            Track your earnings from chair rentals
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Icon name="currency" size="sm" className="mr-1.5" />
          Request Payout
        </Button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : !hasProperties ? (
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center">
            <Icon name="currency" size="2xl" className="text-text-muted" />
          </div>
          <h3 className="text-body font-medium text-text-primary mb-2">
            No revenue yet
          </h3>
          <p className="text-caption text-text-secondary mb-4 max-w-md mx-auto">
            Add properties and chairs to start earning from chair rentals.
          </p>
          <a href="/property-owner">
            <Button>Go to Overview</Button>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Earnings"
            value={formatPrice(stats?.totalEarnings || 0)}
            icon={<Icon name="wallet" size="lg" />}
          />
          <StatCard
            label="This Month"
            value={formatPrice(stats?.thisMonthEarnings || 0)}
            change={monthChange || undefined}
            icon={<Icon name="growing" size="lg" />}
          />
          <StatCard
            label="Pending Payouts"
            value={formatPrice(stats?.pendingPayouts || 0)}
            icon={<Icon name="clock" size="lg" />}
          />
          <StatCard
            label="Completed Payouts"
            value={formatPrice(stats?.completedPayouts || 0)}
            icon={<Icon name="check" size="lg" />}
          />
        </div>
      )}

      {/* Period Toggle */}
      {hasProperties && (
        <div className="flex items-center gap-2">
          {[
            { value: "week", label: "This Week" },
            { value: "month", label: "This Month" },
            { value: "year", label: "This Year" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as typeof period)}
              className={cn(
                "px-4 py-2 text-body font-medium rounded-full transition-colors",
                period === p.value
                  ? "bg-brand-rose text-white"
                  : "bg-background-tertiary text-text-secondary hover:bg-background-primary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Transactions */}
      {hasProperties && (
        <div className="bg-background-primary rounded-card shadow-vlossom">
          <div className="p-4 border-b border-border-default">
            <h2 className="text-h3 text-text-primary">Recent Transactions</h2>
          </div>
          <div className="p-4">
            {transactionsLoading ? (
              <div>
                <TransactionRowSkeleton />
                <TransactionRowSkeleton />
                <TransactionRowSkeleton />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center">
                <Icon name="empty" size="2xl" className="text-text-muted mx-auto mb-2" />
                <p className="text-body text-text-secondary">No transactions yet</p>
                <p className="text-caption text-text-tertiary">
                  Your earnings will appear here when stylists book your chairs
                </p>
              </div>
            ) : (
              <div>
                {transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            )}
          </div>
          {transactions.length > 0 && (
            <div className="p-4 border-t border-border-default text-center">
              <Button variant="ghost" size="sm">
                View All Transactions
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Payout Info */}
      {hasProperties && (stats?.pendingPayouts || 0) > 0 && (
        <div className="bg-brand-rose/10 border border-brand-rose/20 rounded-card p-4">
          <div className="flex items-start gap-3">
            <Icon name="wallet" size="md" className="text-brand-rose mt-0.5" />
            <div className="flex-1">
              <p className="text-body font-medium text-text-primary">
                Pending Payout: {formatPrice(stats?.pendingPayouts || 0)}
              </p>
              <p className="text-caption text-text-secondary mt-1">
                Payouts are processed automatically every Friday. You can also request an
                immediate payout using the button above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
