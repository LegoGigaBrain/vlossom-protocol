"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { ReviewCard, ReviewCardSkeleton, type Review } from "./review-card";
import { RatingDisplay } from "./star-rating";
import { EmptyState } from "../ui/empty-state";
import { Button } from "../ui/button";
import { Icon } from "@/components/icons";

interface ReviewListProps {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  className?: string;
}

type SortOption = "recent" | "highest" | "lowest" | "helpful";
type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

export function ReviewList({
  reviews,
  averageRating,
  totalReviews,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onMarkHelpful,
  onReport,
  className,
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredReviews = reviews.filter((review) => {
    if (filterBy === "all") return true;
    return review.rating === parseInt(filterBy);
  });

  // Apply sorting
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      case "helpful":
        return (b.helpful || 0) - (a.helpful || 0);
      default:
        return 0;
    }
  });

  // Rating breakdown
  const ratingCounts = reviews.reduce(
    (acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  if (isLoading && reviews.length === 0) {
    return (
      <div className={cn("space-y-0 divide-y divide-border-default", className)}>
        {[1, 2, 3].map((i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary Header */}
      {(averageRating !== undefined || totalReviews !== undefined) && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-default">
          <div className="flex items-center gap-4">
            {averageRating !== undefined && (
              <RatingDisplay
                rating={averageRating}
                count={totalReviews}
                size="md"
              />
            )}
          </div>

          {/* Filters Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-text-secondary"
          >
            <Icon name="search" size="sm" className="mr-1" />
            Filter
            <Icon
              name="chevronDown"
              size="sm"
              className={cn(
                "ml-1 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 pb-4 border-b border-border-default space-y-3">
          {/* Rating Filter */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">
              Filter by rating
            </p>
            <div className="flex flex-wrap gap-2">
              {(["all", "5", "4", "3", "2", "1"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilterBy(option)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-gentle flex items-center gap-1",
                    filterBy === option
                      ? "bg-brand-rose text-white"
                      : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
                  )}
                >
                  {option === "all" ? (
                    "All"
                  ) : (
                    <>
                      {option}
                      <Icon name="star" size="xs" />
                      {ratingCounts[parseInt(option)] && (
                        <span className="text-xs opacity-70">
                          ({ratingCounts[parseInt(option)]})
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-2">
              Sort by
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "recent", label: "Most Recent" },
                { value: "highest", label: "Highest Rated" },
                { value: "lowest", label: "Lowest Rated" },
                { value: "helpful", label: "Most Helpful" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-gentle",
                    sortBy === option.value
                      ? "bg-brand-rose text-white"
                      : "bg-background-tertiary text-text-secondary hover:bg-background-secondary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review List */}
      {sortedReviews.length === 0 ? (
        <EmptyState
          illustration="message"
          title={filterBy !== "all" ? "No reviews match this filter" : "No reviews yet"}
          description={
            filterBy !== "all"
              ? "Try selecting a different rating filter"
              : "Be the first to leave a review!"
          }
          action={
            filterBy !== "all"
              ? {
                  label: "Clear filter",
                  onClick: () => setFilterBy("all"),
                }
              : undefined
          }
          size="sm"
        />
      ) : (
        <div className="divide-y divide-border-default">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onMarkHelpful={onMarkHelpful}
              onReport={onReport}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="pt-4 text-center">
          <Button variant="outline" onClick={onLoadMore} loading={isLoading}>
            Load more reviews
          </Button>
        </div>
      )}
    </div>
  );
}
