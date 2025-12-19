"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";
import { StarRating } from "./star-rating";
import { Icon } from "@/components/icons";
import Image from "next/image";

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  booking?: {
    id: string;
    services: Array<{ name: string }>;
  };
  helpful?: number;
  isHelpful?: boolean;
}

interface ReviewCardProps {
  review: Review;
  onMarkHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  showServices?: boolean;
  className?: string;
}

export function ReviewCard({
  review,
  onMarkHelpful,
  onReport,
  showServices = true,
  className,
}: ReviewCardProps) {
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  });

  const initials = review.reviewer.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-background-tertiary shrink-0">
          {review.reviewer.avatarUrl ? (
            <Image
              src={review.reviewer.avatarUrl}
              alt={review.reviewer.displayName}
              className="w-full h-full object-cover"
              width={40}
              height={40}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-text-secondary">
              {initials || <Icon name="profile" size="sm" />}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-text-primary">
                {review.reviewer.displayName}
              </p>
              <p className="text-xs text-text-muted">{timeAgo}</p>
            </div>
            <StarRating value={review.rating} readonly size="sm" />
          </div>

          {/* Services */}
          {showServices && review.booking?.services && review.booking.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {review.booking.services.map((service, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-background-tertiary text-text-secondary rounded-full"
                >
                  {service.name}
                </span>
              ))}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-text-secondary mt-2">{review.comment}</p>
          )}

          {/* Actions */}
          {(onMarkHelpful || onReport) && (
            <div className="flex items-center gap-4 mt-3">
              {onMarkHelpful && (
                <button
                  onClick={() => onMarkHelpful(review.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-gentle",
                    review.isHelpful
                      ? "text-brand-rose"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <Icon name="check" size="xs" />
                  Helpful
                  {review.helpful && review.helpful > 0 && (
                    <span>({review.helpful})</span>
                  )}
                </button>
              )}
              {onReport && (
                <button
                  onClick={() => onReport(review.id)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-status-error transition-gentle"
                >
                  <Icon name="error" size="xs" />
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewCardSkeletonProps {
  className?: string;
}

export function ReviewCardSkeleton({ className }: ReviewCardSkeletonProps) {
  return (
    <div className={cn("p-4 animate-pulse", className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-background-tertiary shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-24 bg-background-tertiary rounded" />
              <div className="h-3 w-16 bg-background-tertiary rounded" />
            </div>
            <div className="h-4 w-20 bg-background-tertiary rounded" />
          </div>
          <div className="h-4 w-full bg-background-tertiary rounded" />
          <div className="h-4 w-3/4 bg-background-tertiary rounded" />
        </div>
      </div>
    </div>
  );
}
