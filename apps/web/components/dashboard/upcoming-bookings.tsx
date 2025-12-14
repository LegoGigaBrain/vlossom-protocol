/**
 * Upcoming Bookings Component
 * Reference: docs/specs/stylist-dashboard/F3.1-stylist-dashboard.md
 */

"use client";

import Link from "next/link";
import { formatDuration, isToday } from "../../lib/utils";
import type { UpcomingBooking } from "../../lib/dashboard-client";

interface UpcomingBookingsProps {
  bookings: UpcomingBooking[];
  isLoading?: boolean;
}

function formatBookingDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isToday(date)) {
    return `Today, ${date.toLocaleTimeString("en-ZA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `Tomorrow, ${date.toLocaleTimeString("en-ZA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }

  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function BookingItem({ booking }: { booking: UpcomingBooking }) {
  const isActive = booking.status === "IN_PROGRESS";

  return (
    <div className="flex items-center justify-between p-4 border-b border-border-default last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium text-text-primary truncate">
          {booking.customerName}
        </p>
        <p className="text-body-small text-text-secondary truncate">
          {booking.serviceName}
        </p>
        <p className="text-caption text-text-tertiary">
          {formatBookingDate(booking.scheduledAt)} · {formatDuration(booking.durationMinutes)}
        </p>
      </div>
      {isActive && (
        <span className="ml-3 px-2 py-1 bg-status-success/10 text-status-success text-caption rounded-full">
          In Progress
        </span>
      )}
    </div>
  );
}

function BookingItemSkeleton() {
  return (
    <div className="p-4 border-b border-border-default last:border-0">
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-background-secondary rounded w-32"></div>
        <div className="h-3 bg-background-secondary rounded w-24"></div>
        <div className="h-3 bg-background-secondary rounded w-40"></div>
      </div>
    </div>
  );
}

export function UpcomingBookings({ bookings, isLoading }: UpcomingBookingsProps) {
  if (isLoading) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom">
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <h3 className="text-h4 text-text-primary">Upcoming Bookings</h3>
        </div>
        <BookingItemSkeleton />
        <BookingItemSkeleton />
        <BookingItemSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h3 className="text-h4 text-text-primary">Upcoming Bookings</h3>
        <Link
          href="/bookings"
          className="text-body-small text-brand-rose hover:underline"
        >
          View All
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-body text-text-secondary">No upcoming bookings</p>
          <p className="text-caption text-text-tertiary mt-1">
            Approved bookings will appear here
          </p>
        </div>
      ) : (
        <div>
          {bookings.map((booking) => (
            <BookingItem key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
