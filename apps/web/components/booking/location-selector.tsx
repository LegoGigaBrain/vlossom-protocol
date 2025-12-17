"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAvailableLocationTypes, type Stylist } from "@/lib/stylist-client";
import type { LocationType } from "@/lib/booking-client";

interface LocationSelectorProps {
  stylist: Stylist;
  selectedType: LocationType;
  selectedAddress: string;
  onSelect: (type: LocationType, address: string) => void;
  onContinue: () => void;
}

export function LocationSelector({
  stylist,
  selectedType,
  selectedAddress,
  onSelect,
  onContinue,
}: LocationSelectorProps) {
  const availableTypes = getAvailableLocationTypes(stylist.operatingMode);
  const [customerAddress, setCustomerAddress] = useState(
    selectedType === "CUSTOMER_HOME" ? selectedAddress : ""
  );

  // Auto-select if only one option
  useEffect(() => {
    if (availableTypes.length === 1) {
      const type = availableTypes[0];
      if (type === "STYLIST_BASE" && stylist.baseLocation) {
        onSelect("STYLIST_BASE", stylist.baseLocation.address);
      }
    }
  }, [availableTypes, stylist.baseLocation, onSelect]);

  const handleTypeChange = (type: LocationType) => {
    if (type === "STYLIST_BASE" && stylist.baseLocation) {
      onSelect("STYLIST_BASE", stylist.baseLocation.address);
    } else {
      onSelect("CUSTOMER_HOME", customerAddress);
    }
  };

  const handleAddressChange = (address: string) => {
    setCustomerAddress(address);
    if (selectedType === "CUSTOMER_HOME") {
      onSelect("CUSTOMER_HOME", address);
    }
  };

  const isValid =
    selectedType === "STYLIST_BASE"
      ? !!stylist.baseLocation?.address
      : customerAddress.length >= 10;

  // FIXED mode - only show stylist location
  if (stylist.operatingMode === "FIXED") {
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
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
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Stylist&apos;s Location
              </h3>
              <p className="text-text-secondary mt-1">
                {stylist.baseLocation?.address || "Address not available"}
              </p>
              <p className="text-sm text-text-secondary mt-2">
                This stylist works at a fixed location.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onContinue} disabled={!isValid} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  // MOBILE mode - only show customer address input
  if (stylist.operatingMode === "MOBILE") {
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary">Your Location</h3>
              <p className="text-sm text-text-secondary mb-3">
                This stylist travels to you.
                {stylist.serviceRadius && ` Service radius: ${stylist.serviceRadius}km`}
              </p>
              <Input
                placeholder="Enter your full address"
                value={customerAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
              />
              {customerAddress.length > 0 && customerAddress.length < 10 && (
                <p className="text-sm text-status-warning mt-1">
                  Please enter a complete address
                </p>
              )}
            </div>
          </div>
        </div>

        <Button onClick={onContinue} disabled={!isValid} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  // HYBRID mode - show both options
  return (
    <div className="space-y-4">
      {/* Stylist's Location Option */}
      <button
        onClick={() => handleTypeChange("STYLIST_BASE")}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
          selectedType === "STYLIST_BASE"
            ? "border-primary bg-primary/5"
            : "border-transparent bg-surface hover:border-border"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              selectedType === "STYLIST_BASE"
                ? "border-primary"
                : "border-text-secondary"
            }`}
          >
            {selectedType === "STYLIST_BASE" && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Stylist&apos;s Location
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              {stylist.baseLocation?.address || "Address not available"}
            </p>
          </div>
        </div>
      </button>

      {/* Customer's Location Option */}
      <button
        onClick={() => handleTypeChange("CUSTOMER_HOME")}
        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
          selectedType === "CUSTOMER_HOME"
            ? "border-primary bg-primary/5"
            : "border-transparent bg-surface hover:border-border"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
              selectedType === "CUSTOMER_HOME"
                ? "border-primary"
                : "border-text-secondary"
            }`}
          >
            {selectedType === "CUSTOMER_HOME" && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Your Location</h3>
            {selectedType === "CUSTOMER_HOME" ? (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  placeholder="Enter your full address"
                  value={customerAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                />
                {customerAddress.length > 0 && customerAddress.length < 10 && (
                  <p className="text-sm text-status-warning mt-1">
                    Please enter a complete address
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-secondary text-sm mt-1">
                Stylist travels to you
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Travel fee note */}
      <p className="text-sm text-text-secondary">
        Note: Travel fee may apply for home visits
      </p>

      <Button onClick={onContinue} disabled={!isValid} className="w-full">
        Continue
      </Button>
    </div>
  );
}
