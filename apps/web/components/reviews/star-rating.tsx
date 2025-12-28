"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "../../lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

type StarSize = "sm" | "md" | "lg";
type IconSize = "sm" | "md" | "md";

const sizeMap: Record<StarSize, IconSize> = {
  sm: "sm",
  md: "sm",
  lg: "md",
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
              {/* Star icon with conditional fill */}
              <span style={isHalfFilled ? { clipPath: "inset(0 50% 0 0)" } : undefined}>
                <Icon
                  name="star"
                  size={sizeMap[size]}
                  weight={isFilled || isHalfFilled ? "fill" : "regular"}
                  className={cn(
                    isFilled || isHalfFilled ? "text-status-warning" : "text-border-default",
                    !readonly && "transition-colors"
                  )}
                />
              </span>
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
      <Icon
        name="star"
        size={sizeMap[size]}
        weight="fill"
        className="text-status-warning"
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
