/**
 * Amenity Picker Component
 *
 * Multi-select amenity picker for chair rental listings.
 * Used by property owners to specify which amenities are available.
 *
 * Features:
 * - Grid layout (2 cols mobile, 3 cols desktop)
 * - Checkbox selection with brand-rose accent
 * - Icon + label for each amenity
 * - Accessible with proper ARIA labels
 */

"use client";

import * as React from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// =============================================================================
// AMENITY DEFINITIONS
// =============================================================================

export const CHAIR_AMENITIES = [
  { id: "wash_basin", label: "Wash Basin", icon: "droplet" as IconName },
  { id: "adjustable_seat", label: "Adjustable Seat", icon: "settings" as IconName },
  { id: "mirror", label: "Mirror", icon: "eye" as IconName },
  { id: "lighting", label: "Professional Lighting", icon: "sparkle" as IconName },
  { id: "plug_points", label: "Plug Points", icon: "lightning" as IconName },
  { id: "premium_tools", label: "Premium Tools Included", icon: "scissors" as IconName },
  { id: "air_circulation", label: "Air Circulation", icon: "wind" as IconName },
  { id: "privacy_divider", label: "Privacy Divider", icon: "lock" as IconName },
  { id: "storage", label: "Personal Storage", icon: "archive" as IconName },
  { id: "wifi", label: "WiFi Access", icon: "wifi" as IconName },
] as const;

export type AmenityId = (typeof CHAIR_AMENITIES)[number]["id"];

// =============================================================================
// COMPONENT
// =============================================================================

interface AmenityPickerProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
  className?: string;
}

export function AmenityPicker({
  selectedAmenities,
  onChange,
  className,
}: AmenityPickerProps) {
  const handleToggle = (amenityId: string) => {
    const isSelected = selectedAmenities.includes(amenityId);
    const newSelection = isSelected
      ? selectedAmenities.filter((id) => id !== amenityId)
      : [...selectedAmenities, amenityId];
    onChange(newSelection);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CHAIR_AMENITIES.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity.id);

          return (
            <label
              key={amenity.id}
              htmlFor={`amenity-${amenity.id}`}
              className={cn(
                // Base styles
                "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200",
                // Default state
                "border-border-default bg-surface-default",
                // Hover state
                "hover:border-primary-soft hover:bg-surface-elevated",
                // Selected state
                isSelected && "border-primary bg-surface-elevated ring-2 ring-primary/10",
                // Focus-within for accessibility
                "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              )}
            >
              {/* Checkbox */}
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={isSelected}
                onCheckedChange={() => handleToggle(amenity.id)}
                aria-label={amenity.label}
              />

              {/* Icon + Label */}
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Icon
                  name={amenity.icon}
                  size="md"
                  className={cn(
                    "mt-0.5 shrink-0 transition-colors duration-200",
                    isSelected ? "text-primary" : "text-text-secondary"
                  )}
                  aria-hidden={true}
                />
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isSelected ? "text-text-primary" : "text-text-secondary"
                  )}
                >
                  {amenity.label}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selection count */}
      <p className="text-sm text-text-secondary">
        {selectedAmenities.length === 0 && "No amenities selected"}
        {selectedAmenities.length === 1 && "1 amenity selected"}
        {selectedAmenities.length > 1 && `${selectedAmenities.length} amenities selected`}
      </p>
    </div>
  );
}
