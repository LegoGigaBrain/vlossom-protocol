/**
 * Paymaster API Client (V7.0.0)
 *
 * Admin paymaster monitoring and configuration.
 */

import { adminFetch } from "./admin-client";

export interface PaymasterStats {
  currentBalance: {
    wei: string;
    eth: string;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  gas: {
    totalSponsored: string;
    totalCostWei: string;
    totalCostEth: string;
    averagePerTx: string;
  };
  last24h: {
    transactions: number;
    costWei: string;
    costEth: string;
  };
  users: {
    total: number;
    last24h: number;
  };
}

export interface PaymasterTransaction {
  id: string;
  userOpHash: string;
  sender: string;
  gasUsed: string;
  gasPrice: string;
  totalCost: string;
  txHash: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  error: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface GasUsagePoint {
  date: string;
  totalTransactions: number;
  totalGasUsed: string;
  totalCostWei: string;
  successRate: number;
  uniqueUsers: number;
}

export interface AlertConfig {
  type: "LOW_BALANCE" | "HIGH_USAGE" | "ERROR_RATE";
  threshold: number;
  isActive: boolean;
  notifySlack: boolean;
  notifyEmail: boolean;
  emailRecipients?: string;
}

export interface TransactionsListParams {
  page?: number;
  pageSize?: number;
  status?: "PENDING" | "SUCCESS" | "FAILED";
  sender?: string;
}

/**
 * Fetch paymaster statistics
 */
export async function fetchPaymasterStats(): Promise<PaymasterStats> {
  const response = await adminFetch("/api/v1/admin/paymaster/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch paymaster stats");
  }

  return response.json();
}

/**
 * Fetch paymaster transactions
 */
export async function fetchPaymasterTransactions(
  params: TransactionsListParams = {}
): Promise<{
  items: PaymasterTransaction[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.status) searchParams.set("status", params.status);
  if (params.sender) searchParams.set("sender", params.sender);

  const queryString = searchParams.toString();
  const url = `/api/v1/admin/paymaster/transactions${queryString ? `?${queryString}` : ""}`;

  const response = await adminFetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
}

/**
 * Fetch gas usage history
 */
export async function fetchGasUsageHistory(days = 30): Promise<{ data: GasUsagePoint[] }> {
  const response = await adminFetch(`/api/v1/admin/paymaster/gas-usage?days=${days}`);

  if (!response.ok) {
    throw new Error("Failed to fetch gas usage history");
  }

  return response.json();
}

/**
 * Fetch alert configurations
 */
export async function fetchAlertConfigs(): Promise<{ alerts: AlertConfig[] }> {
  const response = await adminFetch("/api/v1/admin/paymaster/alerts");

  if (!response.ok) {
    throw new Error("Failed to fetch alert configs");
  }

  return response.json();
}

/**
 * Update alert configuration
 */
export async function updateAlertConfig(config: AlertConfig): Promise<void> {
  const response = await adminFetch("/api/v1/admin/paymaster/alerts/config", {
    method: "POST",
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error("Failed to update alert config");
  }
}

/**
 * Manually trigger alert check
 */
export async function checkAlerts(): Promise<{
  checked: boolean;
  triggeredAlerts: number;
  alerts: Array<{ type: string; message: string }>;
}> {
  const response = await adminFetch("/api/v1/admin/paymaster/alerts/check", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to check alerts");
  }

  return response.json();
}

/**
 * Refresh daily stats
 */
export async function refreshStats(): Promise<void> {
  const response = await adminFetch("/api/v1/admin/paymaster/stats/refresh", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to refresh stats");
  }
}

// Format helpers
export const formatWei = (wei: string): string => {
  const ethValue = parseFloat(wei) / 1e18;
  if (ethValue < 0.001) {
    return `${(parseFloat(wei) / 1e9).toFixed(4)} Gwei`;
  }
  return `${ethValue.toFixed(4)} ETH`;
};

export const formatSuccessRate = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`;
};
