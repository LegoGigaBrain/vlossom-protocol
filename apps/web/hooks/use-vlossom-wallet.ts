/**
 * useVlossomWallet Hook
 *
 * Provides wallet address, client, and transaction history for Web3 interactions.
 * Uses wagmi for wallet connection state and React Query for data fetching.
 */

"use client";

import { useAccount, useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getTransactions, type WalletTransaction } from "../lib/wallet-client";

export interface VlossomWalletReturn {
  walletAddress: string | undefined;
  walletClient: ReturnType<typeof useWalletClient>["data"];
  isConnected: boolean;
  isConnecting: boolean;
  transactions: WalletTransaction[];
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook to access connected wallet information and transactions
 */
export function useVlossomWallet(): VlossomWalletReturn {
  const { address, isConnected, isConnecting } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["wallet-transactions", address],
    queryFn: () => getTransactions(1, 100),
    enabled: !!address,
    staleTime: 30000, // 30 seconds
  });

  return {
    walletAddress: address,
    walletClient,
    isConnected,
    isConnecting,
    transactions: transactionsData?.transactions ?? [],
    isLoading,
    refetch,
  };
}
