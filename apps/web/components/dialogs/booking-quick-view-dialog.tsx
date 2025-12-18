"use client";

import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { Icon } from "@/components/icons";
import { Button } from "../ui/button";

type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface BookingQuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    status: BookingStatus;
    stylist: {
      id: string;
      displayName: string;
      avatarUrl?: string | null;
    };
    services: Array<{ name: string; price: string }>;
    scheduledStartTime: string;
    scheduledEndTime: string;
    totalAmount: string;
    location?: string;
  };
}

const statusConfig: Record<
  BookingStatus,
  { label: string; color: string; bgColor: string }
> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-status-success",
    bgColor: "bg-status-success/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-status-info",
    bgColor: "bg-status-info/10",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-text-secondary",
    bgColor: "bg-background-tertiary",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-status-error",
    bgColor: "bg-status-error/10",
  },
};

export function BookingQuickViewDialog({
  open,
  onOpenChange,
  booking,
}: BookingQuickViewDialogProps) {
  const router = useRouter();
  const date = new Date(booking.scheduledStartTime);
  const endDate = new Date(booking.scheduledEndTime);
  const status = statusConfig[booking.status];

  const initials = booking.stylist.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleViewDetails = () => {
    router.push(`/bookings/${booking.id}`);
    onOpenChange(false);
  };

  const handleViewStylist = () => {
    router.push(`/stylists/${booking.stylist.id}`);
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
              Booking Details
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
          <div className="p-4 space-y-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  status.bgColor,
                  status.color
                )}
              >
                {status.label}
              </span>
            </div>

            {/* Stylist */}
            <button
              onClick={handleViewStylist}
              className="w-full flex items-center gap-3 p-3 bg-background-tertiary rounded-lg hover:bg-background-secondary transition-gentle"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-background-secondary shrink-0">
                {booking.stylist.avatarUrl ? (
                  <img
                    src={booking.stylist.avatarUrl}
                    alt={booking.stylist.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-text-secondary">
                    {initials || <Icon name="profile" size="md" />}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-text-primary">
                  {booking.stylist.displayName}
                </p>
                <p className="text-sm text-text-secondary">Stylist</p>
              </div>
              <Icon name="chevronRight" size="sm" className="text-text-muted" />
            </button>

            {/* Date & Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center shrink-0">
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

              {booking.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center shrink-0">
                    <Icon name="pin" size="sm" className="text-brand-rose" />
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{booking.location}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="bg-background-tertiary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="clock" size="sm" className="text-text-muted" />
                <span className="text-sm text-text-secondary">Services</span>
              </div>
              <ul className="space-y-1">
                {booking.services.map((service, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-text-primary">{service.name}</span>
                    <span className="text-text-secondary">${service.price}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between pt-2 mt-2 border-t border-border-default">
                <span className="font-medium text-text-primary">Total</span>
                <span className="font-bold text-text-primary">
                  ${booking.totalAmount}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button onClick={handleViewDetails} className="flex-1">
                View Full Details
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
