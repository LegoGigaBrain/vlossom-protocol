/**
 * Stat Card Component (V7.0.0)
 *
 * Card for displaying key metrics on dashboard.
 */

import { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  color?: "purple" | "green" | "blue" | "orange" | "red";
}

const colorClasses = {
  purple: "bg-purple-50 text-purple-600",
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
};

export function StatCard({
  title,
  value,
  change,
  icon,
  color = "purple",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>

          {change && (
            <p
              className={`mt-2 text-sm ${
                change.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <span>
                {change.isPositive ? "↑" : "↓"} {Math.abs(change.value)}%
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </p>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}
