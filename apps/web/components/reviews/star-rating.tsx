"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

const sizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function StarRating({
  value = 0,
  onChange,
  size = "md",
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayValue;
          const isHalfFilled = rating - 0.5 <= displayValue && rating > displayValue;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={cn(
                "relative focus:outline-none transition-transform",
                !readonly && "hover:scale-110 cursor-pointer",
                readonly && "cursor-default"
              )}
              aria-label={`${rating} star${rating !== 1 ? "s" : ""}`}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizes[size],
                  "text-border-default",
                  !readonly && "transition-colors"
                )}
                fill="none"
                strokeWidth={1.5}
              />

              {/* Filled star overlay */}
              {(isFilled || isHalfFilled) && (
                <Star
                  className={cn(
                    sizes[size],
                    "absolute inset-0 text-status-warning",
                    !readonly && "transition-colors"
                  )}
                  fill="currentColor"
                  strokeWidth={0}
                  style={isHalfFilled ? { clipPath: "inset(0 50% 0 0)" } : undefined}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-text-secondary ml-1">
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}

interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDisplay({
  rating,
  count,
  size = "sm",
  className,
}: RatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Star
        className={cn(sizes[size], "text-status-warning")}
        fill="currentColor"
        strokeWidth={0}
      />
      <span className="text-sm font-medium text-text-primary">
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-sm text-text-secondary">
          ({count})
        </span>
      )}
    </div>
  );
}
