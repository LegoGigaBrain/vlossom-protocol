/**
 * Earnings Dashboard Page
 * Reference: docs/specs/stylist-dashboard/F3.6-earnings-dashboard.md
 */

"use client";

import { useState } from "react";
import { EarningsSummaryCards } from "../../../../components/dashboard/earnings-summary";
import { EarningsChart } from "../../../../components/dashboard/earnings-chart";
import { PayoutHistory } from "../../../../components/dashboard/payout-history";
import {
  useEarnings,
  useEarningsTrend,
  usePayoutHistory,
} from "../../../../hooks/use-dashboard";

export default function EarningsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [payoutPage, setPayoutPage] = useState(1);

  const {
    data: earnings,
    isLoading: earningsLoading,
    error: earningsError,
  } = useEarnings();

  const {
    data: trendData,
    isLoading: trendLoading,
  } = useEarningsTrend(period);

  const {
    data: payoutData,
    isLoading: payoutsLoading,
  } = usePayoutHistory(payoutPage, 10);

  const handleLoadMore = () => {
    setPayoutPage((prev) => prev + 1);
  };

  if (earningsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">Earnings</h1>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <p className="text-body text-status-error">Failed to load earnings</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-text-primary">Earnings</h1>
        <p className="text-body text-text-secondary">
          Track your income and view payout history
        </p>
      </div>

      {/* Summary Cards */}
      <EarningsSummaryCards
        earnings={
          earnings || {
            totalEarnings: 0,
            thisMonthEarnings: 0,
            lastMonthEarnings: 0,
            pendingEarnings: 0,
            pendingBookingsCount: 0,
            completedBookingsCount: 0,
          }
        }
        isLoading={earningsLoading}
      />

      {/* Earnings Chart */}
      <EarningsChart
        data={trendData?.data || []}
        period={period}
        onPeriodChange={setPeriod}
        isLoading={trendLoading}
      />

      {/* Payout History */}
      <PayoutHistory
        payouts={payoutData?.payouts || []}
        pagination={
          payoutData?.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            hasMore: false,
          }
        }
        isLoading={payoutsLoading}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
