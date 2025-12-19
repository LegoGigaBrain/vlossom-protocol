"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/icons";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow?: (coords: { latitude: number; longitude: number }) => void;
  onDeny?: () => void;
}

export function LocationPermissionDialog({
  open,
  onOpenChange,
  onAllow,
  onDeny,
}: LocationPermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestLocation = async () => {
    setIsRequesting(true);

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        toast.error(
          "Location blocked",
          "Please enable location access in your browser settings"
        );
        onDeny?.();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onAllow?.({ latitude, longitude });
          onOpenChange(false);
          toast.success(
            "Location enabled",
            "We'll show you stylists near you"
          );
        },
        (error) => {
          console.error("Geolocation error:", error);
          let message = "Unable to get your location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }

          toast.error("Location error", message);
          onDeny?.();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      toast.error("Location error", "Unable to request location access");
      onDeny?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    onDeny?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Enable Location
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <Icon name="close" size="sm" className="text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Illustration */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-brand-rose/10 flex items-center justify-center">
                  <Icon name="pin" size="2xl" className="text-brand-rose" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-status-success flex items-center justify-center">
                  <Icon name="navigation" size="sm" className="text-white" />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-text-primary">
                Find stylists near you
              </h3>
              <p className="text-sm text-text-secondary mt-2">
                Allow Vlossom to access your location to discover talented beauty
                professionals in your area.
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-background-tertiary rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="pin" size="sm" className="text-brand-rose shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Nearby stylists
                  </p>
                  <p className="text-xs text-text-secondary">
                    See stylists sorted by distance
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="navigation" size="sm" className="text-brand-rose shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Accurate directions
                  </p>
                  <p className="text-xs text-text-secondary">
                    Get directions to your appointments
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <Icon name="shield" size="sm" className="shrink-0 mt-0.5" />
              <p>
                Your location is only used to find nearby stylists and is never
                shared with third parties.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDeny} className="flex-1">
                Not Now
              </Button>
              <Button
                onClick={handleRequestLocation}
                loading={isRequesting}
                className="flex-1"
              >
                Enable Location
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
