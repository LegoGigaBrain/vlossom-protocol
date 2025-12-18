"use client";

import Image from "next/image";
import { formatPrice, formatDate, formatTimeFromDate } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import type { Booking } from "@/lib/booking-client";

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface rounded-lg p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
          {booking.stylist.avatarUrl ? (
            <Image
              src={booking.stylist.avatarUrl}
              alt={booking.stylist.displayName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-primary">
              {booking.stylist.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary truncate">
              {booking.stylist.displayName}
            </h3>
            <svg
              className="w-5 h-5 text-text-secondary flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">{booking.service.name}</p>

          {/* Date & Time */}
          <div className="flex items-center gap-1 mt-2 text-sm text-text-secondary">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {formatDate(booking.scheduledStartTime)} ·{" "}
              {formatTimeFromDate(booking.scheduledStartTime)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mt-1 text-sm text-text-secondary">
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
            <span className="truncate">{booking.locationAddress}</span>
          </div>

          {/* Status & Price */}
          <div className="flex items-center justify-between mt-3">
            <StatusBadge status={booking.status} size="sm" />
            <span className="font-semibold text-primary">
              {formatPrice(booking.totalAmountCents)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
