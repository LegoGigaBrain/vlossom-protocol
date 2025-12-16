/**
 * Profile Preview Component
 * Reference: docs/specs/stylist-dashboard/F3.5-profile-management.md
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { LocationIcon, StarFilledIcon, AlertIcon } from "../ui/icons";
import type { StylistProfile } from "../../lib/dashboard-client";

interface ProfilePreviewProps {
  profile: StylistProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfilePreview({ profile, open, onOpenChange }: ProfilePreviewProps) {
  if (!profile) return null;

  const locationText = (() => {
    switch (profile.operatingMode) {
      case "FIXED":
        return profile.baseLocationAddress ? profile.baseLocationAddress.split(",")[0] : "";
      case "MOBILE":
        return profile.serviceRadius ? `Mobile · ${profile.serviceRadius}km radius` : "Mobile";
      case "HYBRID":
        return profile.baseLocationAddress
          ? `${profile.baseLocationAddress.split(",")[0]} · Also mobile`
          : "Hybrid";
      default:
        return "";
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preview: How Customers See You</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Header */}
          <div className="text-center">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto bg-brand-rose/10 flex items-center justify-center">
                <span className="text-3xl text-brand-rose">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <h3 className="text-h3 text-text-primary mt-4">{profile.displayName}</h3>

            {/* Rating placeholder */}
            <p className="text-body-small text-text-secondary mt-1 flex items-center justify-center gap-1">
              <StarFilledIcon className="h-4 w-4 text-status-warning" />
              4.9 (47 reviews)
            </p>

            {locationText && (
              <p className="text-body-small text-text-secondary mt-1 flex items-center justify-center gap-1">
                <LocationIcon className="h-4 w-4" />
                {locationText}
              </p>
            )}
          </div>

          <hr className="border-border-default" />

          {/* About Section */}
          <div>
            <h4 className="text-body font-semibold text-text-primary mb-2">About</h4>
            <p className="text-body-small text-text-secondary">
              {profile.bio || "No bio yet"}
            </p>
          </div>

          {/* Specialties */}
          {profile.specialties.length > 0 && (
            <div>
              <h4 className="text-body font-semibold text-text-primary mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-background-secondary text-text-secondary rounded-full text-caption"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Preview */}
          {profile.portfolioImages.length > 0 && (
            <div>
              <h4 className="text-body font-semibold text-text-primary mb-2">Portfolio</h4>
              <div className="grid grid-cols-4 gap-2">
                {profile.portfolioImages.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {profile.portfolioImages.length > 4 && (
                <p className="text-caption text-text-tertiary mt-2">
                  +{profile.portfolioImages.length - 4} more photos
                </p>
              )}
            </div>
          )}

          {/* Status */}
          {!profile.isAcceptingBookings && (
            <div className="p-3 bg-status-warning/10 rounded-lg">
              <p className="text-body-small text-status-warning text-center flex items-center justify-center gap-1.5">
                <AlertIcon className="h-4 w-4 shrink-0" />
                Your profile is hidden because you're not accepting bookings
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
