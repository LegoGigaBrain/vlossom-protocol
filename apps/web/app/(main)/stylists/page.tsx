"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStylists, useCategories } from "@/hooks/use-stylists";
import { StylistGrid } from "@/components/stylists/stylist-grid";
import { StylistFilters } from "@/components/stylists/stylist-filters";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";

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
      <AppHeader
        title="Find Your Stylist"
        subtitle="Discover talented beauty professionals near you"
        showNotifications
        showProfile
      />

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-status-error"
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
      
    </div>
  );
}
