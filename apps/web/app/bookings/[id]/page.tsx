"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-bookings";
import { BookingDetails } from "@/components/bookings/booking-details";
import { CancelBookingDialog } from "@/components/bookings/cancel-dialog";
import { Button } from "@/components/ui/button";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { data: booking, isLoading, error } = useBooking(bookingId);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleBack = () => {
    router.push("/bookings");
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelSuccess = () => {
    setCancelDialogOpen(false);
    // Booking will be refetched automatically via React Query invalidation
  };

  // Loading state
  if (isLoading) {
    return <BookingDetailsSkeleton />;
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Booking Not Found
          </h1>
          <p className="text-text-secondary mb-6">
            {error instanceof Error
              ? error.message
              : "The booking you're looking for doesn't exist."}
          </p>
          <Button onClick={handleBack}>Back to Bookings</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-6">
        <BookingDetails
          booking={booking}
          onCancel={handleCancel}
          onBack={handleBack}
        />
      </main>

      {/* Cancel Dialog */}
      <CancelBookingDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        booking={booking}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
}

function BookingDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          {/* Back button */}
          <div className="h-6 w-32 bg-border rounded" />

          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-border rounded" />
              <div className="h-4 w-32 bg-border rounded" />
            </div>
            <div className="h-6 w-24 bg-border rounded-full" />
          </div>

          {/* Sections */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface rounded-lg p-4">
              <div className="h-4 w-20 bg-border rounded mb-3" />
              <div className="h-5 w-40 bg-border rounded mb-2" />
              <div className="h-4 w-32 bg-border rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
