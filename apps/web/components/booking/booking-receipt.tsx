"use client";

import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Icon } from "@/components/icons";

interface BookingService {
  name: string;
  price: string;
  duration: number;
}

interface BookingReceiptProps {
  booking: {
    id: string;
    confirmationNumber?: string;
    stylist: {
      displayName: string;
      avatarUrl?: string | null;
    };
    services: BookingService[];
    scheduledStartTime: string;
    scheduledEndTime: string;
    location?: string;
    totalAmount: string;
    tip?: string;
    paymentStatus: string;
    transactionHash?: string;
  };
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export function BookingReceipt({
  booking,
  onDownload,
  onShare,
  className,
}: BookingReceiptProps) {
  const date = new Date(booking.scheduledStartTime);
  const endDate = new Date(booking.scheduledEndTime);

  const subtotal = parseFloat(booking.totalAmount);
  const tip = booking.tip ? parseFloat(booking.tip) : 0;
  const total = subtotal + tip;

  const initials = booking.stylist.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "bg-background-primary rounded-card shadow-elevated overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="bg-status-success/10 px-6 py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success/20 flex items-center justify-center">
          <Icon name="check" size="lg" className="text-status-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          Booking Confirmed!
        </h2>
        {booking.confirmationNumber && (
          <p className="text-sm text-text-secondary mt-1">
            Confirmation #{booking.confirmationNumber}
          </p>
        )}
      </div>

      {/* Stylist Info */}
      <div className="px-6 py-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-background-tertiary shrink-0">
            {booking.stylist.avatarUrl ? (
              <img
                src={booking.stylist.avatarUrl}
                alt={booking.stylist.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-medium text-text-secondary">
                {initials || <Icon name="profile" size="md" />}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {booking.stylist.displayName}
            </p>
            <p className="text-sm text-text-secondary">Your stylist</p>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="px-6 py-4 space-y-4 border-b border-border-default">
        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <Icon name="calendar" size="sm" className="text-text-secondary mt-0.5" />
          <div>
            <p className="font-medium text-text-primary">
              {format(date, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-sm text-text-secondary">
              {format(date, "h:mm a")} - {format(endDate, "h:mm a")}
            </p>
          </div>
        </div>

        {/* Location */}
        {booking.location && (
          <div className="flex items-start gap-3">
            <Icon name="pin" size="sm" className="text-text-secondary mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Location</p>
              <p className="text-sm text-text-secondary">{booking.location}</p>
            </div>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="px-6 py-4 border-b border-border-default">
        <h3 className="font-medium text-text-primary mb-3">Services</h3>
        <div className="space-y-2">
          {booking.services.map((service, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <div>
                <p className="text-text-primary">{service.name}</p>
                <p className="text-xs text-text-muted">
                  {service.duration} min
                </p>
              </div>
              <p className="font-medium text-text-primary">${service.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="px-6 py-4 border-b border-border-default">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="receipt" size="sm" className="text-text-secondary" />
          <h3 className="font-medium text-text-primary">Payment Summary</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-text-primary">${subtotal.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Tip</span>
              <span className="text-brand-rose">${tip.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-border-default">
            <span className="font-medium text-text-primary">Total</span>
            <span className="font-bold text-lg text-text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mt-4 flex items-center gap-2">
          <Icon name="check" size="sm" className="text-status-success" />
          <span className="text-sm text-status-success font-medium">
            {booking.paymentStatus === "COMPLETED"
              ? "Payment Complete"
              : "Payment in Escrow"}
          </span>
        </div>

        {/* Transaction Hash */}
        {booking.transactionHash && (
          <div className="mt-2">
            <a
              href={`https://sepolia.basescan.org/tx/${booking.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-rose hover:underline"
            >
              View on BaseScan
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex gap-3">
        {onDownload && (
          <Button variant="outline" onClick={onDownload} className="flex-1">
            <Icon name="download" size="sm" className="mr-2" />
            Download
          </Button>
        )}
        {onShare && (
          <Button variant="outline" onClick={onShare} className="flex-1">
            <Icon name="share" size="sm" className="mr-2" />
            Share
          </Button>
        )}
      </div>

      {/* Footer Note */}
      <div className="px-6 py-4 bg-background-tertiary">
        <p className="text-xs text-text-muted text-center">
          A copy of this receipt has been sent to your email.
          Questions? Contact support@vlossom.io
        </p>
      </div>
    </div>
  );
}
