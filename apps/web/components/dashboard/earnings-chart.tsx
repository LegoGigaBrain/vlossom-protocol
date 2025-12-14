/**
 * Earnings Chart Component
 * Reference: docs/specs/stylist-dashboard/F3.6-earnings-dashboard.md
 *
 * Note: Uses simple CSS-based chart for MVP. Can upgrade to Recharts for production.
 */

"use client";

import { useState } from "react";
import { formatPrice } from "../../lib/utils";
import type { EarningsTrendData } from "../../lib/dashboard-client";

interface EarningsChartProps {
  data: EarningsTrendData[];
  period: "week" | "month" | "year";
  onPeriodChange: (period: "week" | "month" | "year") => void;
  isLoading?: boolean;
}

const PERIOD_LABELS = {
  week: "Week",
  month: "Month",
  year: "Year",
};

function formatXAxisLabel(date: string, period: "week" | "month" | "year"): string {
  const d = new Date(date);

  if (period === "week") {
    return d.toLocaleDateString("en-ZA", { weekday: "short" });
  }

  if (period === "month") {
    return d.getDate().toString();
  }

  // year
  return d.toLocaleDateString("en-ZA", { month: "short" });
}

export function EarningsChart({
  data,
  period,
  onPeriodChange,
  isLoading,
}: EarningsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxEarnings = Math.max(...data.map((d) => d.earnings), 1);
  const totalEarnings = data.reduce((sum, d) => sum + d.earnings, 0);

  if (isLoading) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-h4 text-text-primary">Earnings Trend</h3>
          <div className="flex gap-2">
            {(["week", "month", "year"] as const).map((p) => (
              <div
                key={p}
                className="h-8 w-16 bg-background-secondary rounded animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="h-48 bg-background-secondary rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-h4 text-text-primary">Earnings Trend</h3>
          <p className="text-caption text-text-secondary">
            Total: {formatPrice(totalEarnings)}
          </p>
        </div>
        <div className="flex gap-1 bg-background-secondary rounded-lg p-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 text-body-small rounded-md transition-colors ${
                period === p
                  ? "bg-background-primary text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {data.length === 0 || totalEarnings === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-body text-text-secondary">No earnings for this period</p>
        </div>
      ) : (
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-right pr-2">
            <span className="text-caption text-text-tertiary">
              {formatPrice(maxEarnings)}
            </span>
            <span className="text-caption text-text-tertiary">
              {formatPrice(maxEarnings / 2)}
            </span>
            <span className="text-caption text-text-tertiary">R0</span>
          </div>

          {/* Chart area */}
          <div className="ml-16 h-full flex items-end gap-1">
            {data.map((point, index) => {
              const heightPercent = (point.earnings / maxEarnings) * 100;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar */}
                  <div className="relative w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        isHovered ? "bg-brand-rose" : "bg-brand-rose/60"
                      }`}
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    />

                    {/* Tooltip */}
                    {isHovered && point.earnings > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-text-primary text-background-primary text-caption rounded whitespace-nowrap z-10">
                        {formatPrice(point.earnings)}
                      </div>
                    )}
                  </div>

                  {/* X-axis label */}
                  <span className="text-caption text-text-tertiary mt-2 truncate w-full text-center">
                    {formatXAxisLabel(point.date, period)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
