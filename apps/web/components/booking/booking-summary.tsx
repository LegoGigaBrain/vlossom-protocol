"use client";

import Image from "next/image";
import { formatPrice, formatDuration, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Stylist, Service } from "@/lib/stylist-client";
import type { PriceBreakdown, LocationType } from "@/lib/booking-client";

interface BookingSummaryProps {
  stylist: Stylist;
  service: Service;
  scheduledDate: Date;
  scheduledTime: string;
  locationType: LocationType;
  locationAddress: string;
  notes: string;
  priceBreakdown: PriceBreakdown;
  onEdit: (step: "service" | "datetime" | "location") => void;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BookingSummary({
  stylist,
  service,
  scheduledDate,
  scheduledTime,
  locationType,
  locationAddress,
  notes,
  priceBreakdown,
  onEdit,
  onNotesChange,
  onConfirm,
  isLoading,
}: BookingSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Stylist Section */}
      <SummarySection
        title="Stylist"
        onEdit={() => {}} // Can't change stylist from here
        showEdit={false}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {stylist.avatarUrl ? (
              <Image
                src={stylist.avatarUrl}
                alt={stylist.displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {stylist.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-text-primary">{stylist.displayName}</p>
            {stylist.verificationStatus === "VERIFIED" && (
              <p className="text-xs text-tertiary flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Stylist
              </p>
            )}
          </div>
        </div>
      </SummarySection>

      {/* Service Section */}
      <SummarySection title="Service" onEdit={() => onEdit("service")}>
        <p className="font-medium text-text-primary">{service.name}</p>
        <p className="text-sm text-text-secondary">
          Duration: {formatDuration(service.estimatedDurationMin)}
        </p>
      </SummarySection>

      {/* Date & Time Section */}
      <SummarySection title="Date & Time" onEdit={() => onEdit("datetime")}>
        <p className="font-medium text-text-primary">{formatDate(scheduledDate)}</p>
        <p className="text-sm text-text-secondary">{formatTime(scheduledTime)}</p>
      </SummarySection>

      {/* Location Section */}
      <SummarySection title="Location" onEdit={() => onEdit("location")}>
        <p className="font-medium text-text-primary">
          {locationType === "STYLIST_BASE"
            ? "Stylist's Location"
            : "Your Location"}
        </p>
        <p className="text-sm text-text-secondary">{locationAddress}</p>
      </SummarySection>

      {/* Notes Section */}
      <div className="bg-surface rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-secondary">
            Notes (optional)
          </h3>
        </div>
        <Input
          placeholder="Any special requests or notes for the stylist..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>

      {/* Price Breakdown */}
      <div className="bg-surface rounded-lg p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Price Breakdown
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-text-primary">
            <span>{service.name}</span>
            <span>{formatPrice(priceBreakdown.serviceAmount)}</span>
          </div>
          {priceBreakdown.travelFee > 0 && (
            <div className="flex justify-between text-text-primary">
              <span>Travel Fee</span>
              <span>{formatPrice(priceBreakdown.travelFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-secondary text-sm">
            <span>Platform Fee (10%)</span>
            <span>{formatPrice(priceBreakdown.platformFee)}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-text-primary">Total</span>
              <span className="font-semibold text-primary text-lg">
                {formatPrice(priceBreakdown.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <Button
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating Booking...
          </span>
        ) : (
          "Confirm & Pay"
        )}
      </Button>
    </div>
  );
}

interface SummarySectionProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  showEdit?: boolean;
}

function SummarySection({
  title,
  children,
  onEdit,
  showEdit = true,
}: SummarySectionProps) {
  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {showEdit && onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
