"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { ServiceSelector } from "./service-selector";
import { DateTimePicker } from "./datetime-picker";
import { LocationSelector } from "./location-selector";
import { BookingSummary } from "./booking-summary";
import { PaymentStep } from "./payment-step";
import { useCreateBooking } from "@/hooks/use-bookings";
import { calculatePriceBreakdown } from "@/lib/booking-client";
import type { Stylist, Service } from "@/lib/stylist-client";
import type { LocationType } from "@/lib/booking-client";

type BookingStep =
  | "service"
  | "datetime"
  | "location"
  | "summary"
  | "payment"
  | "success";

interface BookingState {
  service: Service | null;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  locationType: LocationType;
  locationAddress: string;
  notes: string;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylist: Stylist;
  initialService?: Service | null;
}

export function BookingDialog({
  open,
  onOpenChange,
  stylist,
  initialService,
}: BookingDialogProps) {
  const router = useRouter();
  const createBooking = useCreateBooking();

  const [step, setStep] = useState<BookingStep>("service");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [state, setState] = useState<BookingState>({
    service: initialService || null,
    scheduledDate: null,
    scheduledTime: null,
    locationType: "STYLIST_BASE",
    locationAddress: stylist.baseLocation?.address || "",
    notes: "",
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("service");
      setBookingId(null);
      setState({
        service: initialService || null,
        scheduledDate: null,
        scheduledTime: null,
        locationType: "STYLIST_BASE",
        locationAddress: stylist.baseLocation?.address || "",
        notes: "",
      });
    }
  }, [open, initialService, stylist.baseLocation?.address]);

  // Calculate price breakdown
  const priceBreakdown = state.service
    ? calculatePriceBreakdown(
        parseInt(state.service.priceAmountCents),
        state.locationType === "CUSTOMER_HOME"
      )
    : null;

  // Create scheduled datetime
  const getScheduledDateTime = (): Date | null => {
    if (!state.scheduledDate || !state.scheduledTime) return null;
    const [hours, minutes] = state.scheduledTime.split(":").map(Number);
    const dateTime = new Date(state.scheduledDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setState((prev) => ({ ...prev, service }));
  };

  // Handle datetime selection
  const handleDateSelect = (date: Date) => {
    setState((prev) => ({ ...prev, scheduledDate: date }));
  };

  const handleTimeSelect = (time: string) => {
    setState((prev) => ({ ...prev, scheduledTime: time }));
  };

  // Handle location selection
  const handleLocationSelect = (
    type: LocationType,
    address: string
  ) => {
    setState((prev) => ({
      ...prev,
      locationType: type,
      locationAddress: address,
    }));
  };

  // Handle notes change
  const handleNotesChange = (notes: string) => {
    setState((prev) => ({ ...prev, notes }));
  };

  // Navigation
  const handleContinue = () => {
    switch (step) {
      case "service":
        setStep("datetime");
        break;
      case "datetime":
        setStep("location");
        break;
      case "location":
        setStep("summary");
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "datetime":
        setStep("service");
        break;
      case "location":
        setStep("datetime");
        break;
      case "summary":
        setStep("location");
        break;
      case "payment":
        setStep("summary");
        break;
    }
  };

  const handleEdit = (editStep: BookingStep) => {
    setStep(editStep);
  };

  // Create booking and go to payment
  const handleConfirm = async () => {
    if (!state.service) return;

    const scheduledDateTime = getScheduledDateTime();
    if (!scheduledDateTime) return;

    try {
      const booking = await createBooking.mutateAsync({
        stylistId: stylist.id,
        serviceId: state.service.id,
        scheduledStartTime: scheduledDateTime.toISOString(),
        locationType: state.locationType,
        locationAddress: state.locationAddress,
        notes: state.notes || undefined,
      });

      setBookingId(booking.id);
      setStep("payment");
    } catch (error) {
      console.error("Failed to create booking:", error);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setStep("success");
  };

  // Handle view booking
  const handleViewBooking = () => {
    onOpenChange(false);
    if (bookingId) {
      router.push(`/bookings/${bookingId}`);
    } else {
      router.push("/bookings");
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case "service":
        return "Select a Service";
      case "datetime":
        return "Select Date & Time";
      case "location":
        return "Choose Location";
      case "summary":
        return "Review Booking";
      case "payment":
        return "Payment";
      case "success":
        return "Booking Confirmed!";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {step !== "service" && step !== "success" && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-surface rounded transition-colors"
              aria-label="Go back to previous step"
            >
              <svg
                className="w-5 h-5 text-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-display font-semibold text-text-primary">
            {getStepTitle()}
          </h2>
        </div>

        {/* Progress indicator */}
        {step !== "success" && (
          <>
            {/* Screen reader announcement for step changes */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              Step {["service", "datetime", "location", "summary", "payment"].indexOf(step) + 1} of 5: {getStepTitle()}
            </div>
            <div
              className="flex gap-1"
              role="progressbar"
              aria-valuenow={["service", "datetime", "location", "summary", "payment"].indexOf(step) + 1}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-label={`Booking progress: Step ${["service", "datetime", "location", "summary", "payment"].indexOf(step) + 1} of 5`}
            >
              {(["service", "datetime", "location", "summary", "payment"] as const).map(
                (s, i) => {
                  const stepLabels = ["Select service", "Choose date and time", "Select location", "Review booking", "Payment"];
                  const currentIndex = ["service", "datetime", "location", "summary", "payment"].indexOf(step);
                  return (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= currentIndex ? "bg-primary" : "bg-border"
                      }`}
                      aria-label={`Step ${i + 1}: ${stepLabels[i]} - ${i < currentIndex ? "completed" : i === currentIndex ? "current" : "upcoming"}`}
                    />
                  );
                }
              )}
            </div>
          </>
        )}

        {/* Step Content */}
        {step === "service" && (
          <ServiceSelector
            services={stylist.services}
            selectedService={state.service}
            onSelect={handleServiceSelect}
            onContinue={handleContinue}
          />
        )}

        {step === "datetime" && state.service && (
          <DateTimePicker
            serviceDurationMin={state.service.estimatedDurationMin}
            selectedDate={state.scheduledDate}
            selectedTime={state.scheduledTime}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
            onContinue={handleContinue}
          />
        )}

        {step === "location" && (
          <LocationSelector
            stylist={stylist}
            selectedType={state.locationType}
            selectedAddress={state.locationAddress}
            onSelect={handleLocationSelect}
            onContinue={handleContinue}
          />
        )}

        {step === "summary" && state.service && priceBreakdown && (
          <BookingSummary
            stylist={stylist}
            service={state.service}
            scheduledDate={state.scheduledDate!}
            scheduledTime={state.scheduledTime!}
            locationType={state.locationType}
            locationAddress={state.locationAddress}
            notes={state.notes}
            priceBreakdown={priceBreakdown}
            onEdit={handleEdit}
            onNotesChange={handleNotesChange}
            onConfirm={handleConfirm}
            isLoading={createBooking.isPending}
          />
        )}

        {step === "payment" && bookingId && priceBreakdown && (
          <PaymentStep
            bookingId={bookingId}
            amount={priceBreakdown.totalAmount}
            stylistAddress={stylist.id} // Will need actual wallet address
            onSuccess={handlePaymentSuccess}
          />
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-text-secondary mb-6">
              Your appointment has been booked successfully.
            </p>
            <button
              onClick={handleViewBooking}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              View Booking Details
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
