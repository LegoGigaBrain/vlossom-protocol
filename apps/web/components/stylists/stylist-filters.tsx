"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OperatingMode, StylistFilters } from "@/lib/stylist-client";

interface StylistFiltersProps {
  filters: StylistFilters;
  onFiltersChange: (filters: StylistFilters) => void;
  categories: string[];
}

export function StylistFilters({
  filters,
  onFiltersChange,
  categories,
}: StylistFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput || undefined, page: 1 });
  };

  const handleCategoryChange = (category: string | undefined) => {
    onFiltersChange({ ...filters, category, page: 1 });
  };

  const handleModeChange = (mode: OperatingMode | undefined) => {
    onFiltersChange({ ...filters, operatingMode: mode, page: 1 });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.search || filters.category || filters.operatingMode;

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search stylists..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary" size="default">
          Search
        </Button>
      </form>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange(undefined)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !filters.category
              ? "bg-primary text-white"
              : "bg-surface text-text-secondary hover:bg-secondary"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filters.category === category
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-secondary"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Operating Mode Filter */}
      <div className="flex gap-2">
        <span className="text-sm text-text-secondary self-center">Type:</span>
        <button
          onClick={() => handleModeChange(undefined)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            !filters.operatingMode
              ? "bg-primary/10 text-primary font-medium"
              : "text-text-secondary hover:bg-surface"
          }`}
        >
          Any
        </button>
        <button
          onClick={() => handleModeChange("FIXED")}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            filters.operatingMode === "FIXED"
              ? "bg-primary/10 text-primary font-medium"
              : "text-text-secondary hover:bg-surface"
          }`}
        >
          Salon
        </button>
        <button
          onClick={() => handleModeChange("MOBILE")}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            filters.operatingMode === "MOBILE"
              ? "bg-primary/10 text-primary font-medium"
              : "text-text-secondary hover:bg-surface"
          }`}
        >
          Mobile
        </button>
        <button
          onClick={() => handleModeChange("HYBRID")}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            filters.operatingMode === "HYBRID"
              ? "bg-primary/10 text-primary font-medium"
              : "text-text-secondary hover:bg-surface"
          }`}
        >
          Both
        </button>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-accent hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
