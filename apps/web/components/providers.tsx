/**
 * Client-side providers for React Query, Theme, Wagmi, and Toast notifications
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { BrandThemeProvider } from "@/lib/theme";
import { Toaster, toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi-config";

/**
 * Provider that activates offline detection and shows toast notifications
 */
function OnlineStatusProvider({ children }: { children: ReactNode }) {
  useOnlineStatus();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (error instanceof Error && error.message.includes("401")) {
                return false;
              }
              // Don't retry on not found errors
              if (error instanceof Error && error.message.includes("404")) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            onError: (error) => {
              // Global mutation error toast (components can still handle their own errors)
              const message =
                error instanceof Error ? error.message : "Operation failed";
              toast.error("Error", { description: message });
            },
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrandThemeProvider defaultMode="light" useSystemPreference={true}>
          <OnlineStatusProvider>
            {children}
          </OnlineStatusProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "font-sans",
              style: {
                background: "var(--background-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              },
            }}
            closeButton
            richColors
          />
        </BrandThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
