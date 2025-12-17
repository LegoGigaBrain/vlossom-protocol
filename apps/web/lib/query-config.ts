/**
 * React Query Configuration for Vlossom Web App
 *
 * MAJOR-4: Standardized query configurations with proper error handling
 * Reference: Code Review - Inconsistent retry/error handling in useQuery hooks
 *
 * Features:
 * - Standardized retry logic with smart backoff
 * - Auth-aware retry (don't retry 401s)
 * - Toast notifications for query failures
 * - Configurable stale times for different data types
 *
 * Usage:
 * import { queryConfigs } from '@/lib/query-config';
 * useQuery({ ...queryConfigs.standard, queryKey: ['data'], queryFn: fetchData });
 */

import { QueryClient, type QueryClientConfig, type UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "./logger";

/**
 * Check if error is an authentication error (401)
 */
function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("401") || error.message.includes("Unauthorized");
  }
  return false;
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    );
  }
  return false;
}

/**
 * Default retry logic for queries
 * - Don't retry auth errors (401)
 * - Retry network errors up to 3 times
 * - Retry other errors up to 2 times
 */
function defaultRetry(failureCount: number, error: unknown): boolean {
  // Never retry auth errors
  if (isAuthError(error)) {
    logger.debug("Not retrying auth error", { failureCount });
    return false;
  }

  // Retry network errors more aggressively
  if (isNetworkError(error)) {
    return failureCount < 3;
  }

  // Default: retry twice
  return failureCount < 2;
}

/**
 * Retry delay with exponential backoff
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Global error handler for queries
 */
function handleQueryError(error: unknown): void {
  logger.error("Query error", {
    error: error instanceof Error ? error.message : String(error),
  });

  // Show user-friendly toast for certain errors
  if (isNetworkError(error)) {
    toast.error("Connection error", {
      description: "Please check your internet connection and try again.",
    });
  }
}

/**
 * Query client configuration
 */
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: defaultRetry,
      retryDelay,
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't auto-retry mutations
      onError: handleQueryError,
    },
  },
};

/**
 * Create a configured query client
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}

/**
 * Stale time presets for different data types
 */
export const staleTimes = {
  /** Data that rarely changes (user profile, settings) */
  static: 30 * 60 * 1000, // 30 minutes

  /** Data that changes occasionally (stylists, services) */
  standard: 5 * 60 * 1000, // 5 minutes

  /** Data that changes frequently (bookings, availability) */
  dynamic: 1 * 60 * 1000, // 1 minute

  /** Real-time data (wallet balance, notifications) */
  realtime: 10 * 1000, // 10 seconds

  /** Never stale - always refetch */
  none: 0,
};

/**
 * Refetch interval presets
 */
export const refetchIntervals = {
  /** Polling for real-time updates */
  realtime: 10 * 1000, // 10 seconds

  /** Moderate polling (wallet balance) */
  frequent: 30 * 1000, // 30 seconds

  /** Infrequent polling (notifications) */
  infrequent: 60 * 1000, // 1 minute

  /** No polling */
  none: false as const,
};

/**
 * Pre-configured query options for common use cases
 */
export const queryConfigs = {
  /**
   * Standard query - good defaults for most data
   */
  standard: {
    retry: defaultRetry,
    staleTime: staleTimes.standard,
    refetchOnWindowFocus: false,
  } satisfies Partial<UseQueryOptions>,

  /**
   * Static data - rarely changes (user profile, app config)
   */
  static: {
    retry: defaultRetry,
    staleTime: staleTimes.static,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  } satisfies Partial<UseQueryOptions>,

  /**
   * Dynamic data - changes frequently (bookings, availability)
   */
  dynamic: {
    retry: defaultRetry,
    staleTime: staleTimes.dynamic,
    refetchOnWindowFocus: true,
  } satisfies Partial<UseQueryOptions>,

  /**
   * Real-time data - always fresh (wallet balance, tx status)
   */
  realtime: {
    retry: defaultRetry,
    staleTime: staleTimes.realtime,
    refetchInterval: refetchIntervals.frequent,
    refetchIntervalInBackground: false,
  } satisfies Partial<UseQueryOptions>,

  /**
   * Critical data - auth-related, no retry on failure
   */
  critical: {
    retry: false,
    staleTime: staleTimes.none,
    refetchOnWindowFocus: true,
  } satisfies Partial<UseQueryOptions>,

  /**
   * Wallet/blockchain data - with polling
   */
  wallet: {
    retry: (failureCount: number, error: unknown) => {
      if (isAuthError(error)) return false;
      return failureCount < 2;
    },
    staleTime: staleTimes.realtime,
    refetchInterval: refetchIntervals.frequent,
    refetchIntervalInBackground: false,
  } satisfies Partial<UseQueryOptions>,
};

export default queryConfigs;
