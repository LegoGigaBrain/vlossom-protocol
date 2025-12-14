import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "../lib/wallet-client";

export function useTransactions(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["transactions", page, limit],
    queryFn: () => getTransactions(page, limit),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
