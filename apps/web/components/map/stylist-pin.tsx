/**
 * Stylist Pin - Map Marker for Stylists (V5.0)
 *
 * Color-coded by operating mode:
 * - Green: Fixed location
 * - Amber: Mobile/traveling
 * - Red: Home calls only
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

"use client";

import Image from "next/image";
import { cn } from "../../lib/utils";
import { STYLIST_MODE_COLORS, type StylistMarker } from "../../lib/mapbox";
import { Icon } from "@/components/icons";

type IconName = string;

interface StylistPinProps {
  stylist: StylistMarker;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StylistPin({
  stylist,
  isSelected = false,
  onClick,
  className,
}: StylistPinProps) {
  const modeColor = STYLIST_MODE_COLORS[stylist.operatingMode] || STYLIST_MODE_COLORS.FIXED;

  const modeIconName: IconName = {
    FIXED: "location",
    MOBILE: "location",
    HYBRID: "scissors",
  }[stylist.operatingMode] || "location";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center transition-all duration-200",
        isSelected ? "scale-110 z-10" : "hover:scale-105",
        className
      )}
      aria-label={`${stylist.name} - ${stylist.operatingMode.toLowerCase()} stylist`}
    >
      {/* Pin Container */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200",
          isSelected ? "w-14 h-14" : "w-10 h-10"
        )}
        style={{ backgroundColor: modeColor }}
      >
        {/* Avatar or Icon */}
        {stylist.avatarUrl ? (
          <Image
            src={stylist.avatarUrl}
            alt={stylist.name}
            width={isSelected ? 48 : 32}
            height={isSelected ? 48 : 32}
            className={cn(
              "rounded-full object-cover border-2 border-white",
              isSelected ? "w-12 h-12" : "w-8 h-8"
            )}
          />
        ) : (
          <Icon
            name={modeIconName}
            size={isSelected ? "lg" : "sm"}
            className="text-white"
            aria-hidden="true"
          />
        )}

        {/* Available Now Indicator */}
        {stylist.isAvailableNow && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-status-success rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Pin Tail */}
      <div
        className={cn(
          "w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent -mt-0.5",
          isSelected ? "border-l-[8px] border-r-[8px] border-t-[10px]" : ""
        )}
        style={{ borderTopColor: modeColor }}
      />

      {/* Rating Badge (shown when selected) */}
      {isSelected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-2 py-0.5 shadow-md flex items-center gap-1">
          <Icon name="star" size="xs" weight="fill" className="text-accent-gold fill-accent-gold" aria-hidden="true" />
          <span className="text-xs font-medium text-text-primary">
            {stylist.rating.toFixed(1)}
          </span>
        </div>
      )}
    </button>
  );
}

/**
 * Salon Pin - Map Marker for Salons/Properties
 */
interface SalonPinProps {
  salon: {
    id: string;
    name: string;
    imageUrl?: string;
    availableChairs: number;
    rating: number;
  };
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SalonPin({
  salon,
  isSelected = false,
  onClick,
  className,
}: SalonPinProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center transition-all duration-200",
        isSelected ? "scale-110 z-10" : "hover:scale-105",
        className
      )}
      aria-label={`${salon.name} - ${salon.availableChairs} chairs available`}
    >
      {/* Pin Container */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-lg shadow-lg bg-brand-purple transition-all duration-200",
          isSelected ? "w-14 h-14" : "w-10 h-10"
        )}
      >
        {salon.imageUrl ? (
          <Image
            src={salon.imageUrl}
            alt={salon.name}
            width={isSelected ? 48 : 32}
            height={isSelected ? 48 : 32}
            className={cn(
              "rounded-md object-cover",
              isSelected ? "w-12 h-12" : "w-8 h-8"
            )}
          />
        ) : (
          <Icon
            name="location"
            size={isSelected ? "lg" : "sm"}
            className="text-white"
            aria-hidden="true"
          />
        )}

        {/* Chair Count Badge */}
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-white rounded-full border border-brand-purple text-[10px] font-bold text-brand-purple flex items-center justify-center px-1">
          {salon.availableChairs}
        </span>
      </div>

      {/* Pin Tail */}
      <div
        className={cn(
          "w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-brand-purple -mt-0.5",
          isSelected ? "border-l-[8px] border-r-[8px] border-t-[10px]" : ""
        )}
      />
    </button>
  );
}

/**
 * Cluster Pin - Grouped markers
 */
interface ClusterPinProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export function ClusterPin({ count, onClick, className }: ClusterPinProps) {
  // Size based on count
  const size = count > 50 ? "w-14 h-14" : count > 20 ? "w-12 h-12" : "w-10 h-10";
  const textSize = count > 50 ? "text-lg" : count > 20 ? "text-base" : "text-sm";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-full bg-brand-rose shadow-lg transition-all duration-200 hover:scale-105",
        size,
        className
      )}
      aria-label={`${count} stylists in this area`}
    >
      <span className={cn("font-bold text-white", textSize)}>{count}</span>
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-brand-rose/30 animate-ping" />
    </button>
  );
}

/**
 * User Location Pin
 */
interface UserPinProps {
  className?: string;
}

export function UserPin({ className }: UserPinProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Accuracy circle */}
      <div className="absolute inset-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 bg-brand-rose/10 rounded-full animate-pulse" />
      {/* Pin */}
      <div className="w-4 h-4 bg-brand-rose rounded-full border-3 border-white shadow-lg" />
    </div>
  );
}
