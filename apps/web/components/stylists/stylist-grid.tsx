"use client";

import { StylistCard } from "./stylist-card";
import { SearchIllustration } from "@/components/ui/illustrations";
import type { StylistSummary } from "@/lib/stylist-client";

interface StylistGridProps {
  stylists: StylistSummary[];
  onStylistClick: (stylistId: string) => void;
  isLoading?: boolean;
}

export function StylistGrid({
  stylists,
  onStylistClick,
  isLoading,
}: StylistGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StylistCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (stylists.length === 0) {
    return <StylistEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stylists.map((stylist) => (
        <StylistCard
          key={stylist.id}
          stylist={stylist}
          onClick={() => onStylistClick(stylist.id)}
        />
      ))}
    </div>
  );
}

function StylistCardSkeleton() {
  return (
    <div className="bg-surface rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-full bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-border rounded w-3/4" />
          <div className="h-4 bg-border rounded w-1/2" />
          <div className="flex gap-1">
            <div className="h-5 bg-border rounded-full w-16" />
            <div className="h-5 bg-border rounded-full w-14" />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-border rounded w-full" />
        <div className="h-4 bg-border rounded w-2/3" />
      </div>
      <div className="flex justify-between mt-4 pt-3 border-t border-border">
        <div className="h-5 bg-border rounded w-20" />
        <div className="h-4 bg-border rounded w-16" />
      </div>
    </div>
  );
}

function StylistEmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4">
        <SearchIllustration className="w-24 h-24 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No stylists found
      </h3>
      <p className="text-text-secondary max-w-sm mx-auto">
        Try adjusting your filters or search terms to find the perfect stylist for you.
      </p>
    </div>
  );
}
