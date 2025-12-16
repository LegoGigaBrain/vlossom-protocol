"use client";

import { BookingCard } from "./booking-card";
import { Button } from "@/components/ui/button";
import {
  CalendarIllustration,
  CompletedIllustration,
  InboxIllustration,
} from "@/components/ui/illustrations";
import type { Booking } from "@/lib/booking-client";

interface BookingListProps {
  bookings: Booking[];
  isLoading?: boolean;
  onBookingClick: (bookingId: string) => void;
  emptyState?: "upcoming" | "completed" | "all";
}

export function BookingList({
  bookings,
  isLoading,
  onBookingClick,
  emptyState = "all",
}: BookingListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return <EmptyState type={emptyState} />;
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onClick={() => onBookingClick(booking.id)}
        />
      ))}
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="bg-surface rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-border rounded" />
          <div className="h-4 w-24 bg-border rounded" />
          <div className="h-4 w-40 bg-border rounded" />
          <div className="flex justify-between items-center mt-3">
            <div className="h-6 w-20 bg-border rounded-full" />
            <div className="h-5 w-16 bg-border rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: "upcoming" | "completed" | "all" }) {
  const config = {
    upcoming: {
      illustration: <CalendarIllustration className="w-24 h-24" />,
      title: "No upcoming bookings",
      description:
        "Find a stylist and book your first appointment!",
      action: "Browse Stylists",
      href: "/stylists",
    },
    completed: {
      illustration: <CompletedIllustration className="w-24 h-24" />,
      title: "No completed bookings yet",
      description: "Your completed appointments will appear here.",
      action: null,
      href: null,
    },
    all: {
      illustration: <InboxIllustration className="w-24 h-24" />,
      title: "No bookings yet",
      description: "Start by finding a stylist and booking your first appointment!",
      action: "Browse Stylists",
      href: "/stylists",
    },
  };

  const { illustration, title, description, action, href } = config[type];

  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4">
        {illustration}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-sm mx-auto mb-6">{description}</p>
      {action && href && (
        <Button onClick={() => (window.location.href = href)}>{action}</Button>
      )}
    </div>
  );
}
