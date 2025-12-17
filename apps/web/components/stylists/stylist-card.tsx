"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { getOperatingModeText, type StylistSummary } from "@/lib/stylist-client";
import { FavoriteButton } from "./favorite-button";

interface StylistCardProps {
  stylist: StylistSummary;
  onClick: () => void;
  showFavorite?: boolean;
}

export function StylistCard({ stylist, onClick, showFavorite = true }: StylistCardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-lg p-4 cursor-pointer transition-all relative",
        "hover:shadow-lg hover:-translate-y-1",
        "border border-transparent hover:border-primary/20"
      )}
      onClick={onClick}
    >
      {/* Favorite button - top right */}
      {showFavorite && (
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton stylistId={stylist.id} size="sm" />
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
          {stylist.avatarUrl ? (
            <img
              src={stylist.avatarUrl}
              alt={stylist.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-primary font-semibold">
              {stylist.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-8">
          {/* Name and verification */}
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">
              {stylist.displayName}
            </h3>
            {stylist.verificationStatus === "VERIFIED" && (
              <span className="text-tertiary flex-shrink-0" title="Verified">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>

          {/* Operating mode */}
          <p className="text-sm text-text-secondary">
            {getOperatingModeText(stylist.operatingMode)}
          </p>

          {/* Specialties */}
          {stylist.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {stylist.specialties.slice(0, 3).map((specialty) => (
                <span
                  key={specialty}
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                >
                  {specialty}
                </span>
              ))}
              {stylist.specialties.length > 3 && (
                <span className="text-xs text-text-secondary">
                  +{stylist.specialties.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio excerpt */}
      {stylist.bio && (
        <p className="text-sm text-text-secondary mt-3 line-clamp-2">
          {stylist.bio}
        </p>
      )}

      {/* Footer: Starting price and availability */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        {stylist.startingPrice ? (
          <div>
            <span className="text-xs text-text-secondary">From</span>
            <span className="ml-1 font-semibold text-primary">
              {formatPrice(stylist.startingPrice)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-text-secondary">Contact for pricing</span>
        )}

        {stylist.isAcceptingBookings ? (
          <span className="text-xs text-tertiary font-medium">
            Available
          </span>
        ) : (
          <span className="text-xs text-text-secondary">
            Not accepting bookings
          </span>
        )}
      </div>
    </div>
  );
}
