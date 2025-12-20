/**
 * Filter Bar Component (V7.0.0)
 *
 * Search and filter controls for data tables.
 */

"use client";

import { useState, useEffect } from "react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  key: string;
  label: string;
  type: "select" | "date";
  options?: FilterOption[];
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  filters?: Filter[];
  values: Record<string, string>;
  onSearchChange: (search: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onReset?: () => void;
}

export function FilterBar({
  searchPlaceholder = "Search...",
  filters = [],
  values,
  onSearchChange,
  onFilterChange,
  onReset,
}: FilterBarProps) {
  const [search, setSearch] = useState(values.search || "");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== values.search) {
        onSearchChange(search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, values.search, onSearchChange]);

  const hasActiveFilters =
    search ||
    filters.some((f) => values[f.key] && values[f.key] !== "all");

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[150px]">
          {filter.type === "select" && filter.options && (
            <select
              value={values[filter.key] || "all"}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
            >
              <option value="all">{filter.label}: All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {filter.type === "date" && (
            <input
              type="date"
              value={values[filter.key] || ""}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          )}
        </div>
      ))}

      {/* Reset Button */}
      {hasActiveFilters && onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
