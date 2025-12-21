/**
 * React Query Provider for Admin Panel (V7.0.0)
 *
 * Configured with sensible defaults for admin operations.
 */

"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Admin panel typically needs fresh data
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on 401/403 errors
          if (error instanceof Error && "status" in error) {
            const status = (error as { status: number }).status;
            if (status === 401 || status === 403) {
              return false;
            }
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create client once per session
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
