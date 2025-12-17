"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleFavorite, useFavoriteStatus } from "@/hooks/use-favorites";

interface FavoriteButtonProps {
  stylistId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FavoriteButton({
  stylistId,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const { data: status, isLoading: statusLoading } = useFavoriteStatus(stylistId);
  const { toggle, isLoading: toggleLoading } = useToggleFavorite(stylistId);
  const [isAnimating, setIsAnimating] = useState(false);

  const isFavorited = status?.isFavorited ?? false;
  const isLoading = statusLoading || toggleLoading;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isLoading) return;

    setIsAnimating(true);
    try {
      await toggle();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: "w-6 h-6 p-1",
    md: "w-8 h-8 p-1.5",
    lg: "w-10 h-10 p-2",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "rounded-full transition-all duration-200",
        "hover:scale-110 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-brand-rose/50",
        isFavorited
          ? "bg-brand-rose/10 text-brand-rose"
          : "bg-background-secondary/80 text-text-secondary hover:text-brand-rose",
        isLoading && "opacity-50 cursor-not-allowed",
        isAnimating && "animate-pulse",
        sizeClasses[size],
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          "transition-all duration-200",
          isFavorited && "fill-current"
        )}
      />
    </button>
  );
}
