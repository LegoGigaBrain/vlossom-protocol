/**
 * Users React Query Hooks (V7.0.0)
 *
 * Data fetching hooks for admin user management.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers,
  fetchUser,
  updateUser,
  fetchUserStats,
  type UsersListParams,
} from "../lib/users-client";

/**
 * Query keys for users
 */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UsersListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, "stats"] as const,
};

/**
 * Fetch paginated users list
 */
export function useUsers(params: UsersListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetch single user details
 */
export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id || ""),
    queryFn: () => fetchUser(id!),
    enabled: Boolean(id),
  });
}

/**
 * Fetch user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: fetchUserStats,
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { roles?: string[]; verificationStatus?: string } }) =>
      updateUser(id, data),
    onSuccess: (_, variables) => {
      // Invalidate list and specific user queries
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}
