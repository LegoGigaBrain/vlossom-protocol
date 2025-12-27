"use client";

/**
 * BookingSuccess - Confirmation screen after successful booking
 * Motion: Uses "unfold" for success checkmark and "settle" for content sections
 */

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Icon } from "@/components/icons";

interface BookingSuccessProps {
  booking: {
    id: string;
    confirmationNumber?: string;
    stylist: {
      displayName: string;
    };
    scheduledStartTime: string;
    scheduledEndTime: string;
    location?: string;
  };
  onAddToCalendar?: () => void;
  className?: string;
}

export function BookingSuccess({
  booking,
  onAddToCalendar,
  className,
}: BookingSuccessProps) {
  const router = useRouter();
  const date = new Date(booking.scheduledStartTime);
  const endDate = new Date(booking.scheduledEndTime);

  return (
    <div
      className={cn(
        "text-center max-w-md mx-auto py-8 px-4 space-y-6",
        className
      )}
    >
      {/* Success Animation - uses unfold for organic petal-opening reveal */}
      <div className="relative">
        <div className="w-24 h-24 mx-auto rounded-full bg-status-success/10 flex items-center justify-center animate-unfold motion-reduce:animate-settleFade">
          <Icon name="check" size="xl" className="text-status-success animate-petalOpen motion-reduce:animate-none" />
        </div>
        <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-status-success/20 animate-breatheOnce motion-reduce:animate-none" />
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Booking Confirmed!
        </h1>
        {booking.confirmationNumber && (
          <p className="text-sm text-text-secondary mt-1">
            Confirmation #{booking.confirmationNumber}
          </p>
        )}
      </div>

      {/* Booking Details Card - settles into view */}
      <div className="bg-background-secondary rounded-card p-4 text-left space-y-4 animate-settle motion-reduce:animate-settleFade" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <Icon name="calendar" size="sm" className="text-brand-rose" />
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {format(date, "EEEE, MMMM d")}
            </p>
            <p className="text-sm text-text-secondary">
              {format(date, "h:mm a")} - {format(endDate, "h:mm a")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <Icon name="clock" size="sm" className="text-brand-rose" />
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {booking.stylist.displayName}
            </p>
            <p className="text-sm text-text-secondary">Your stylist</p>
          </div>
        </div>

        {booking.location && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
              <Icon name="pin" size="sm" className="text-brand-rose" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Location</p>
              <p className="text-sm text-text-secondary">{booking.location}</p>
            </div>
          </div>
        )}
      </div>

      {/* What's Next - settles into view with stagger */}
      <div className="bg-background-tertiary rounded-lg p-4 text-left animate-settle motion-reduce:animate-settleFade" style={{ animationDelay: "200ms" }}>
        <h3 className="font-medium text-text-primary mb-3">What&apos;s next?</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
              1
            </span>
            <span>
              You&apos;ll receive a confirmation email with booking details
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
              2
            </span>
            <span>
              We&apos;ll send you a reminder 24 hours before your appointment
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-rose/10 flex items-center justify-center text-xs font-medium text-brand-rose shrink-0 mt-0.5">
              3
            </span>
            <span>
              Your payment is held securely until the service is complete
            </span>
          </li>
        </ul>
      </div>

      {/* Actions - settles into view last */}
      <div className="space-y-3 animate-settle motion-reduce:animate-settleFade" style={{ animationDelay: "300ms" }}>
        {onAddToCalendar && (
          <Button variant="outline" onClick={onAddToCalendar} className="w-full">
            <Icon name="add" size="sm" className="mr-2" />
            Add to Calendar
          </Button>
        )}

        <Button
          onClick={() => router.push(`/bookings/${booking.id}`)}
          className="w-full"
        >
          View Booking Details
          <Icon name="chevronRight" size="sm" className="ml-2" />
        </Button>

        <button
          onClick={() => router.push("/stylists")}
          className="text-sm text-brand-rose hover:text-brand-clay transition-gentle"
        >
          Book another service
        </button>
      </div>
    </div>
  );
}
