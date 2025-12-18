/**
 * Booking Sheet - Bottom Sheet for Quick Booking (V5.0)
 *
 * Allows booking without leaving the map context.
 * - Stylist preview card
 * - Service selection
 * - Quick date/time picker
 * - Book now action
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "../../lib/utils";
import { type StylistMarker, formatDistance, calculateDistance } from "../../lib/mapbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Icon } from "@/components/icons";

type IconName = string;

interface BookingSheetProps {
  stylist: StylistMarker | null;
  userLocation?: { lat: number; lng: number } | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Mock services for demonstration
const mockServices = [
  { id: "1", name: "Box Braids", duration: 180, price: 450 },
  { id: "2", name: "Knotless Braids", duration: 240, price: 600 },
  { id: "3", name: "Cornrows", duration: 90, price: 250 },
  { id: "4", name: "Twist Out", duration: 60, price: 150 },
];

export function BookingSheet({
  stylist,
  userLocation,
  isOpen,
  onClose,
  className,
}: BookingSheetProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen || !stylist) return null;

  // Calculate distance if user location available
  const distance = userLocation
    ? calculateDistance(userLocation, { lat: stylist.lat, lng: stylist.lng })
    : null;

  // Operating mode config
  const modeConfig = {
    FIXED: { iconName: "location" as IconName, label: "Fixed Location", color: "text-status-success" },
    MOBILE: { iconName: "location" as IconName, label: "Mobile Stylist", color: "text-accent-gold" },
    HYBRID: { iconName: "location" as IconName, label: "Flexible", color: "text-brand-purple" },
  }[stylist.operatingMode];

  const modeIconName = modeConfig?.iconName || "location";

  const handleViewProfile = () => {
    router.push(`/stylists/${stylist.id}`);
  };

  const handleBookNow = () => {
    if (selectedService) {
      router.push(`/book/${stylist.id}?service=${selectedService}`);
    }
  };

  return (
    <>
      {/* Backdrop - tappable to close */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background-primary rounded-t-3xl z-50 max-h-[80vh] overflow-hidden",
          "animate-in slide-in-from-bottom duration-300",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border-default" />
        </div>

        {/* Stylist Header */}
        <div className="px-4 pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {stylist.avatarUrl ? (
                <Image
                  src={stylist.avatarUrl}
                  alt={stylist.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-brand-rose/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-brand-rose">
                    {stylist.name.charAt(0)}
                  </span>
                </div>
              )}
              {stylist.isAvailableNow && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-status-success rounded-full border-2 border-background-primary flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-display font-semibold text-text-primary">
                    {stylist.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Icon name="star" size="sm" weight="fill" className="text-accent-gold fill-accent-gold" aria-hidden="true" />
                      <span className="text-sm font-medium text-text-primary">
                        {stylist.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({stylist.reviewCount})
                      </span>
                    </div>
                    {distance && (
                      <>
                        <span className="text-text-muted">•</span>
                        <span className="text-xs text-text-secondary">
                          {formatDistance(distance)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-1 rounded-full hover:bg-background-tertiary transition-colors"
                  aria-label="Close"
                >
                  <Icon name="close" size="md" className="text-text-secondary" aria-hidden="true" />
                </button>
              </div>

              {/* Mode & Status */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Icon name={modeIconName} size="xs" className={cn(modeConfig?.color)} aria-hidden="true" />
                  {modeConfig?.label}
                </Badge>
                {stylist.isAvailableNow ? (
                  <Badge variant="success" className="text-xs">
                    Available Now
                  </Badge>
                ) : stylist.nextAvailable ? (
                  <Badge variant="default" className="text-xs">
                    Next: {stylist.nextAvailable}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Specialties */}
          {stylist.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {stylist.specialties.slice(0, 4).map((specialty) => (
                <span
                  key={specialty}
                  className="text-xs text-text-secondary bg-background-secondary px-2 py-1 rounded-full"
                >
                  {specialty}
                </span>
              ))}
              {stylist.specialties.length > 4 && (
                <span className="text-xs text-text-muted">
                  +{stylist.specialties.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex-1"
          >
            <Icon
              name="favorite"
              size="sm"
              weight={isFavorite ? "fill" : "light"}
              className={cn(
                "mr-1",
                isFavorite && "fill-brand-rose text-brand-rose"
              )}
              aria-hidden="true"
            />
            {isFavorite ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Icon name="chat" size="sm" className="mr-1" aria-hidden="true" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Icon name="share" size="sm" className="mr-1" aria-hidden="true" />
            Share
          </Button>
        </div>

        {/* Services */}
        <div className="px-4 pb-4 border-t border-border-default pt-4">
          <h3 className="text-sm font-medium text-text-primary mb-3">
            Quick Book
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mockServices.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                  selectedService === service.id
                    ? "bg-brand-rose/10 border border-brand-rose"
                    : "bg-background-secondary hover:bg-background-tertiary border border-transparent"
                )}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">
                    {service.name}
                  </p>
                  <p className="text-xs text-text-muted flex items-center gap-1">
                    <Icon name="clock" size="xs" aria-hidden="true" />
                    {Math.floor(service.duration / 60)}h{" "}
                    {service.duration % 60 > 0 && `${service.duration % 60}m`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">
                    R{service.price}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-border-default bg-background-primary flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleViewProfile}
          >
            View Profile
            <Icon name="chevronRight" size="sm" className="ml-1" aria-hidden="true" />
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleBookNow}
            disabled={!selectedService}
          >
            <Icon name="calendar" size="sm" className="mr-1" aria-hidden="true" />
            Book Now
          </Button>
        </div>
      </div>
    </>
  );
}
