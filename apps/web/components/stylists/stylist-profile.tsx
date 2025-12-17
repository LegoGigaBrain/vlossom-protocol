"use client";

import { Button } from "@/components/ui/button";
import { getOperatingModeText, type Stylist } from "@/lib/stylist-client";
import { FavoriteButton } from "./favorite-button";

interface StylistProfileProps {
  stylist: Stylist;
  onBookNow: () => void;
  onBack: () => void;
}

export function StylistProfile({ stylist, onBookNow, onBack }: StylistProfileProps) {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Back to Stylists</span>
      </button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
          {stylist.avatarUrl ? (
            <img
              src={stylist.avatarUrl}
              alt={stylist.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-primary font-semibold">
              {stylist.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-display font-bold text-text-primary">
              {stylist.displayName}
            </h1>
            {stylist.verificationStatus === "VERIFIED" && (
              <span className="text-tertiary" title="Verified Stylist">
                <svg
                  className="w-6 h-6"
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

          <p className="text-sm text-text-secondary mt-1">
            Member since{" "}
            {new Date(stylist.memberSince).toLocaleDateString("en-ZA", {
              month: "short",
              year: "numeric",
            })}
          </p>

          {/* Operating Mode & Location */}
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
            <div className="flex items-center gap-1 text-sm text-text-secondary">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{getOperatingModeText(stylist.operatingMode)}</span>
            </div>

            {stylist.serviceRadius && (
              <span className="text-sm text-text-secondary">
                {stylist.serviceRadius}km radius
              </span>
            )}
          </div>

          {/* Base Location */}
          {stylist.baseLocation && (
            <p className="text-sm text-text-secondary mt-2">
              {stylist.baseLocation.address}
            </p>
          )}
        </div>

        {/* Actions - Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <FavoriteButton stylistId={stylist.id} size="lg" />
          <Button
            onClick={onBookNow}
            disabled={!stylist.isAcceptingBookings}
            size="lg"
          >
            {stylist.isAcceptingBookings ? "Book Now" : "Not Available"}
          </Button>
        </div>
      </div>

      {/* Bio */}
      {stylist.bio && (
        <div className="bg-surface rounded-lg p-4">
          <h2 className="font-semibold text-text-primary mb-2">About</h2>
          <p className="text-text-secondary whitespace-pre-wrap">{stylist.bio}</p>
        </div>
      )}

      {/* Specialties */}
      {stylist.specialties.length > 0 && (
        <div>
          <h2 className="font-semibold text-text-primary mb-3">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {stylist.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions - Mobile (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border sm:hidden">
        <div className="flex items-center gap-3">
          <FavoriteButton stylistId={stylist.id} size="md" />
          <Button
            onClick={onBookNow}
            disabled={!stylist.isAcceptingBookings}
            className="flex-1"
            size="lg"
          >
            {stylist.isAcceptingBookings ? "Book Now" : "Not Available"}
          </Button>
        </div>
      </div>
    </div>
  );
}
