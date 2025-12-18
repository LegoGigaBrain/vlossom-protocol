/**
 * Admin Finance Dashboard Page
 * V3.4: Escrow and payment oversight
 */

"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Icon } from "@/components/icons";

interface FinanceStats {
  totalEscrowed: number;
  pendingSettlements: number;
  todayPayouts: number;
  platformRevenue7d: number;
  platformRevenue30d: number;
  refundRate: number;
  avgSettlementTime: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: {
    displayName: string;
  };
  booking?: {
    id: string;
  };
}

// Mock data for demonstration
const mockStats: FinanceStats = {
  totalEscrowed: 125000,
  pendingSettlements: 45,
  todayPayouts: 23500,
  platformRevenue7d: 8750,
  platformRevenue30d: 32500,
  refundRate: 2.3,
  avgSettlementTime: 24,
};

const mockPendingSettlements: Transaction[] = [
  {
    id: "1",
    type: "ESCROW_RELEASE",
    amount: 1500,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    user: { displayName: "Sarah Johnson" },
    booking: { id: "bk-001" },
  },
  {
    id: "2",
    type: "ESCROW_RELEASE",
    amount: 2200,
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { displayName: "Mike Peters" },
    booking: { id: "bk-002" },
  },
  {
    id: "3",
    type: "ESCROW_RELEASE",
    amount: 850,
    status: "PENDING",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    user: { displayName: "Lisa Chen" },
    booking: { id: "bk-003" },
  },
];

const mockRecentPayouts: Transaction[] = [
  {
    id: "p1",
    type: "ESCROW_RELEASE",
    amount: 1800,
    status: "CONFIRMED",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    user: { displayName: "Emma Wilson" },
    booking: { id: "bk-010" },
  },
  {
    id: "p2",
    type: "ESCROW_RELEASE",
    amount: 3200,
    status: "CONFIRMED",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { displayName: "David Brown" },
    booking: { id: "bk-011" },
  },
  {
    id: "p3",
    type: "ESCROW_REFUND",
    amount: 1200,
    status: "CONFIRMED",
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    user: { displayName: "Amy Taylor" },
    booking: { id: "bk-012" },
  },
];

const mockRefundQueue: Transaction[] = [
  {
    id: "r1",
    type: "ESCROW_REFUND",
    amount: 950,
    status: "PENDING",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    user: { displayName: "John Davis" },
    booking: { id: "bk-020" },
  },
];

export default function AdminFinancePage() {
  const [stats] = useState<FinanceStats>(mockStats);
  const [pendingSettlements] = useState<Transaction[]>(mockPendingSettlements);
  const [recentPayouts] = useState<Transaction[]>(mockRecentPayouts);
  const [refundQueue] = useState<Transaction[]>(mockRefundQueue);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // In a real app, fetch from API
  const refresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          <p className="text-gray-500">Monitor escrow, settlements, and platform revenue</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refresh} disabled={isLoading}>
            <Icon name="settings" size="sm" className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Escrowed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalEscrowed)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon name="wallet" size="lg" className="text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.pendingSettlements} pending settlements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today&apos;s Payouts</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.todayPayouts)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Icon name="growing" size="lg" className="text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <Icon name="growing" className="w-3 h-3" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Platform Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(timeRange === "30d" ? stats.platformRevenue30d : stats.platformRevenue7d)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Icon name="currency" size="lg" className="text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {timeRange === "30d" ? "Last 30 days" : "Last 7 days"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Refund Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.refundRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Icon name="chevronDown" size="lg" className="text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg settlement: {stats.avgSettlementTime}h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Settlements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="clock" size="md" className="text-yellow-600" />
              Pending Settlements
            </CardTitle>
            <CardDescription>
              Awaiting release after confirmation period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSettlements.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No pending settlements
              </p>
            ) : (
              <div className="space-y-4">
                {pendingSettlements.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Icon name="wallet" size="md" className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.user?.displayName}</p>
                        <p className="text-xs text-gray-500">
                          Booking #{tx.booking?.id.slice(0, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="calmError" size="md" className="text-red-600" />
              Refund Queue
            </CardTitle>
            <CardDescription>
              Pending refunds requiring processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refundQueue.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="success" size="2xl" className="mx-auto text-green-400" />
                <p className="text-gray-500 mt-2">No pending refunds</p>
              </div>
            ) : (
              <div className="space-y-4">
                {refundQueue.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Icon name="cancelled" size="md" className="text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.user?.displayName}</p>
                        <p className="text-xs text-gray-500">
                          Booking #{tx.booking?.id.slice(0, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {formatCurrency(tx.amount)}
                      </p>
                      <Button size="sm" variant="outline" className="mt-1">
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="wallet" size="md" />
              Recent Payouts
            </CardTitle>
            <CardDescription>
              Successfully processed payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Recipient</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayouts.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <span className="font-medium">{tx.user?.displayName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            tx.type === "ESCROW_REFUND"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }
                        >
                          {tx.type === "ESCROW_REFUND" ? "Refund" : "Payout"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-700">
                          <Icon name="success" className="w-3 h-3 mr-1" />
                          Confirmed
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="growing" size="md" />
            Revenue Over Time
          </CardTitle>
          <CardDescription>
            Platform fees collected from completed bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center">
              <Icon name="growing" size="2xl" className="mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">Revenue chart visualization</p>
              <p className="text-xs text-gray-400">
                Connect analytics provider for full reporting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">127</p>
              <p className="text-sm text-gray-500 mt-1">Total Transactions Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">98.7%</p>
              <p className="text-sm text-gray-500 mt-1">Settlement Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">R4.50</p>
              <p className="text-sm text-gray-500 mt-1">Avg Transaction Fee</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
