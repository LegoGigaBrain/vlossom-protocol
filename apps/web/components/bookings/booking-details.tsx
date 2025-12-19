"use client";

import Image from "next/image";
import { formatPrice, formatDuration, formatDate, formatTimeFromDate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { canCancelBooking, type Booking } from "@/lib/booking-client";

interface BookingDetailsProps {
  booking: Booking;
  onCancel: () => void;
  onBack: () => void;
}

export function BookingDetails({ booking, onCancel, onBack }: BookingDetailsProps) {
  const canCancel = canCancelBooking(booking);

  // Generate booking reference
  const bookingRef = `VLS-${new Date(booking.createdAt).getFullYear()}-${booking.id
    .slice(0, 6)
    .toUpperCase()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
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
          <span>Back to Bookings</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">
              Booking Details
            </h1>
            <p className="text-sm text-text-secondary mt-1">{bookingRef}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Stylist Section */}
      <DetailSection title="Stylist">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {booking.stylist.avatarUrl ? (
              <Image
                src={booking.stylist.avatarUrl}
                alt={booking.stylist.displayName}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-primary">
                {booking.stylist.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              {booking.stylist.displayName}
            </p>
            {booking.stylist.verificationStatus === "VERIFIED" && (
              <p className="text-sm text-tertiary flex items-center gap-1">
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
                Verified
              </p>
            )}
          </div>
        </div>
      </DetailSection>

      {/* Service Section */}
      <DetailSection title="Service">
        <p className="font-medium text-text-primary">{booking.service.name}</p>
        <p className="text-sm text-text-secondary">
          Duration: {formatDuration(booking.service.estimatedDurationMin)}
        </p>
      </DetailSection>

      {/* Date & Time Section */}
      <DetailSection title="Date & Time">
        <p className="font-medium text-text-primary">
          {formatDate(booking.scheduledStartTime)}
        </p>
        <p className="text-sm text-text-secondary">
          {formatTimeFromDate(booking.scheduledStartTime)}
        </p>
      </DetailSection>

      {/* Location Section */}
      <DetailSection title="Location">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-text-primary">
              {booking.locationType === "STYLIST_BASE"
                ? "Stylist's Location"
                : "Your Location"}
            </p>
            <p className="text-sm text-text-secondary">
              {booking.locationAddress}
            </p>
          </div>
          {booking.locationLat && booking.locationLng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${booking.locationLat},${booking.locationLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open in Maps
            </a>
          )}
        </div>
      </DetailSection>

      {/* Payment Section */}
      <DetailSection title="Payment">
        <div className="space-y-2">
          <div className="flex justify-between text-text-primary">
            <span>Service</span>
            <span>{formatPrice(booking.service.priceAmountCents)}</span>
          </div>
          <div className="flex justify-between text-text-secondary text-sm">
            <span>Platform Fee</span>
            <span>{formatPrice(booking.platformFeeCents)}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-text-primary">Total</span>
              <span className="font-semibold text-primary">
                {formatPrice(booking.totalAmountCents)}
              </span>
            </div>
          </div>
          {booking.status === "CONFIRMED" && (
            <div className="flex items-center gap-2 mt-2 text-sm text-tertiary">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Funds secured in escrow</span>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Notes Section */}
      {booking.notes && (
        <DetailSection title="Notes">
          <p className="text-text-secondary">{booking.notes}</p>
        </DetailSection>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full text-status-error border-status-error hover:bg-status-error hover:text-white"
          >
            Cancel Booking
          </Button>
        </div>
      )}

      {/* Cancelled Info */}
      {booking.status === "CANCELLED" && booking.cancelledAt && (
        <div className="bg-status-error/10 rounded-lg p-4">
          <p className="text-sm text-status-error">
            Cancelled on {formatDate(booking.cancelledAt)}
          </p>
        </div>
      )}

      {/* Completed Info */}
      {booking.status === "COMPLETED" && booking.completedAt && (
        <div className="bg-tertiary/10 rounded-lg p-4">
          <p className="text-sm text-tertiary">
            Completed on {formatDate(booking.completedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-lg p-4">
      <h2 className="text-sm font-medium text-text-secondary mb-2">{title}</h2>
      {children}
    </div>
  );
}
