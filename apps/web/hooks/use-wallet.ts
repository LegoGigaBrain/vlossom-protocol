/**
 * useWallet Hook
 * React Query hook for wallet state management
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { getWallet, getTransactions } from "../lib/wallet-client";

/**
 * Hook to fetch wallet info and balance
 */
export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
    refetchInterval: 10000, // Refetch every 10 seconds to keep balance updated
  });
}

/**
 * Hook to fetch wallet transaction history
 */
export function useTransactions(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["transactions", page, limit],
    queryFn: () => getTransactions(page, limit),
  });
}
