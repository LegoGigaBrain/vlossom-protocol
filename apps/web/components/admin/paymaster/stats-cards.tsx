"use client";

import { Activity, DollarSign, Users, Zap } from "lucide-react";

interface PaymasterStats {
  currentBalance: { wei: string; eth: number };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  gas: {
    totalSponsored: string;
    totalCostWei: string;
    totalCostEth: number;
    averagePerTx: string;
  };
  last24h: {
    transactions: number;
    costWei: string;
    costEth: number;
  };
  users: { total: number; last24h: number };
}

interface StatsCardsProps {
  stats: PaymasterStats | null;
  isLoading: boolean;
}

/**
 * Stats Cards Component (F5.1)
 * Displays key paymaster metrics
 */
export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white overflow-hidden shadow rounded-lg animate-pulse"
          >
            <div className="p-5">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load stats</p>
      </div>
    );
  }

  const cards = [
    {
      name: "Paymaster Balance",
      value: `${stats.currentBalance.eth.toFixed(4)} ETH`,
      subtext: "Available for sponsorship",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Total Transactions",
      value: stats.transactions.total.toLocaleString(),
      subtext: `${stats.transactions.successRate.toFixed(1)}% success rate`,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Gas Cost (24h)",
      value: `${stats.last24h.costEth.toFixed(4)} ETH`,
      subtext: `${stats.last24h.transactions} transactions`,
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      name: "Unique Users",
      value: stats.users.total.toLocaleString(),
      subtext: `${stats.users.last24h} new in 24h`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.name}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </div>
                  </dd>
                  <dd className="text-sm text-gray-500">{card.subtext}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
