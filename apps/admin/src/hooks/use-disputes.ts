/**
 * Disputes React Query Hooks (V7.0.0)
 *
 * Data fetching hooks for admin dispute management.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDisputes,
  fetchDispute,
  fetchDisputeStats,
  assignDispute,
  startReview,
  resolveDispute,
  escalateDispute,
  closeDispute,
  addDisputeMessage,
  type DisputesListParams,
  type DisputeResolution,
} from "../lib/disputes-client";

/**
 * Query keys for disputes
 */
export const disputeKeys = {
  all: ["disputes"] as const,
  lists: () => [...disputeKeys.all, "list"] as const,
  list: (params: DisputesListParams) => [...disputeKeys.lists(), params] as const,
  details: () => [...disputeKeys.all, "detail"] as const,
  detail: (id: string) => [...disputeKeys.details(), id] as const,
  stats: () => [...disputeKeys.all, "stats"] as const,
};

/**
 * Fetch paginated disputes list
 */
export function useDisputes(params: DisputesListParams = {}) {
  return useQuery({
    queryKey: disputeKeys.list(params),
    queryFn: () => fetchDisputes(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch single dispute details
 */
export function useDispute(id: string | null) {
  return useQuery({
    queryKey: disputeKeys.detail(id || ""),
    queryFn: () => fetchDispute(id!),
    enabled: Boolean(id),
  });
}

/**
 * Fetch dispute statistics
 */
export function useDisputeStats() {
  return useQuery({
    queryKey: disputeKeys.stats(),
    queryFn: fetchDisputeStats,
    staleTime: 60_000,
  });
}

/**
 * Assign dispute mutation
 */
export function useAssignDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      assignDispute(id, assignedToId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    },
  });
}

/**
 * Start review mutation
 */
export function useStartReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => startReview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    },
  });
}

/**
 * Resolve dispute mutation
 */
export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { resolution: DisputeResolution; resolutionNotes: string; refundPercent?: number };
    }) => resolveDispute(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    },
  });
}

/**
 * Escalate dispute mutation
 */
export function useEscalateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      escalateDispute(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    },
  });
}

/**
 * Close dispute mutation
 */
export function useCloseDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => closeDispute(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    },
  });
}

/**
 * Add message mutation
 */
export function useAddDisputeMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { content: string; isInternal?: boolean; attachmentUrls?: string[] };
    }) => addDisputeMessage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.detail(variables.id) });
    },
  });
}
