/**
 * Paymaster React Query Hooks (V7.0.0)
 *
 * Data fetching hooks for admin paymaster monitoring.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPaymasterStats,
  fetchPaymasterTransactions,
  fetchGasUsageHistory,
  fetchAlertConfigs,
  updateAlertConfig,
  checkAlerts,
  refreshStats,
  type TransactionsListParams,
  type AlertConfig,
} from "../lib/paymaster-client";

/**
 * Query keys for paymaster
 */
export const paymasterKeys = {
  all: ["paymaster"] as const,
  stats: () => [...paymasterKeys.all, "stats"] as const,
  transactions: () => [...paymasterKeys.all, "transactions"] as const,
  transactionList: (params: TransactionsListParams) =>
    [...paymasterKeys.transactions(), params] as const,
  gasUsage: (days: number) => [...paymasterKeys.all, "gasUsage", days] as const,
  alerts: () => [...paymasterKeys.all, "alerts"] as const,
};

/**
 * Fetch paymaster statistics
 */
export function usePaymasterStats() {
  return useQuery({
    queryKey: paymasterKeys.stats(),
    queryFn: fetchPaymasterStats,
    refetchInterval: 60_000, // Refresh every minute
    staleTime: 30_000,
  });
}

/**
 * Fetch paymaster transactions
 */
export function usePaymasterTransactions(params: TransactionsListParams = {}) {
  return useQuery({
    queryKey: paymasterKeys.transactionList(params),
    queryFn: () => fetchPaymasterTransactions(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch gas usage history
 */
export function useGasUsageHistory(days = 30) {
  return useQuery({
    queryKey: paymasterKeys.gasUsage(days),
    queryFn: () => fetchGasUsageHistory(days),
    staleTime: 300_000, // 5 minutes
  });
}

/**
 * Fetch alert configurations
 */
export function useAlertConfigs() {
  return useQuery({
    queryKey: paymasterKeys.alerts(),
    queryFn: fetchAlertConfigs,
    staleTime: 60_000,
  });
}

/**
 * Update alert config mutation
 */
export function useUpdateAlertConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AlertConfig) => updateAlertConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymasterKeys.alerts() });
    },
  });
}

/**
 * Check alerts mutation
 */
export function useCheckAlerts() {
  return useMutation({
    mutationFn: checkAlerts,
  });
}

/**
 * Refresh stats mutation
 */
export function useRefreshStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshStats,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymasterKeys.stats() });
    },
  });
}
