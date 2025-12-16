"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStylists, useCategories } from "@/hooks/use-stylists";
import { StylistGrid } from "@/components/stylists/stylist-grid";
import { StylistFilters } from "@/components/stylists/stylist-filters";
import { Button } from "@/components/ui/button";
import type { StylistFilters as FiltersType } from "@/lib/stylist-client";

export default function StylistsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersType>({});

  const { data: stylistsData, isLoading, error } = useStylists(filters);
  const { data: categories = ["Hair", "Nails", "Makeup", "Skincare"] } =
    useCategories();

  const handleStylistClick = (stylistId: string) => {
    router.push(`/stylists/${stylistId}`);
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      page: (prev.page || 1) + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-primary">
                Find Your Stylist
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Discover talented beauty professionals near you
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/wallet")}
              aria-label="Open wallet"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="ml-2 hidden sm:inline">Wallet</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6">
          <StylistFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />
        </div>

        {/* Results count */}
        {stylistsData && (
          <p className="text-sm text-text-secondary mb-4">
            {stylistsData.total} stylist{stylistsData.total !== 1 ? "s" : ""}{" "}
            found
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-text-secondary mb-4">
              {error instanceof Error ? error.message : "Failed to load stylists"}
            </p>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Stylists Grid */}
        {!error && (
          <>
            <StylistGrid
              stylists={stylistsData?.stylists || []}
              onStylistClick={handleStylistClick}
              isLoading={isLoading}
            />

            {/* Load More */}
            {stylistsData?.hasMore && (
              <div className="text-center mt-8">
                <Button variant="secondary" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border md:hidden pb-safe" aria-label="Main navigation">
        <div className="flex justify-around py-2">
          <button
            className="flex flex-col items-center py-3 px-4 min-h-[44px] text-primary"
            aria-label="Browse stylists"
            aria-current="page"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs mt-1">Discover</span>
          </button>
          <button
            className="flex flex-col items-center py-3 px-4 min-h-[44px] text-text-secondary"
            onClick={() => router.push("/bookings")}
            aria-label="View bookings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs mt-1">Bookings</span>
          </button>
          <button
            className="flex flex-col items-center py-3 px-4 min-h-[44px] text-text-secondary"
            onClick={() => router.push("/wallet")}
            aria-label="Open wallet"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <span className="text-xs mt-1">Wallet</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
