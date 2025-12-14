"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GasUsageDataPoint {
  date: string;
  totalTransactions: number;
  totalGasUsed: string;
  totalCostWei: string;
  successRate: number;
  uniqueUsers: number;
}

interface GasUsageChartProps {
  data: GasUsageDataPoint[] | null;
  isLoading: boolean;
}

/**
 * Gas Usage Chart Component (F5.1)
 * Visualizes gas usage over time
 */
export function GasUsageChart({ data, isLoading }: GasUsageChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gas Usage</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    transactions: point.totalTransactions,
    costEth: parseFloat(point.totalCostWei) / 1e18,
    successRate: point.successRate,
    users: point.uniqueUsers,
  }));

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Gas Usage Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "costEth") {
                  return [`${value.toFixed(6)} ETH`, "Cost"];
                }
                if (name === "successRate") {
                  return [`${value.toFixed(1)}%`, "Success Rate"];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="transactions"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Transactions"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="costEth"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Cost (ETH)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
