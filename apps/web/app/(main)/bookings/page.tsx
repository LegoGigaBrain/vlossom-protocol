"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookings } from "@/hooks/use-bookings";
import { BookingList } from "@/components/bookings/booking-list";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/app-header";

import { Plus } from "lucide-react";

type FilterTab = "upcoming" | "completed" | "all";

export default function BookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");

  const { data: bookingsData, isLoading, error } = useBookings();

  // Filter bookings based on active tab
  const filteredBookings = bookingsData?.bookings.filter((booking) => {
    const isUpcoming =
      ["PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"].includes(booking.status) &&
      new Date(booking.scheduledStartTime) > new Date();

    switch (activeTab) {
      case "upcoming":
        return isUpcoming;
      case "completed":
        return booking.status === "COMPLETED";
      case "all":
        return true;
      default:
        return true;
    }
  });

  // Sort: upcoming by date (soonest first), completed by date (most recent first)
  const sortedBookings = filteredBookings?.sort((a, b) => {
    const dateA = new Date(a.scheduledStartTime).getTime();
    const dateB = new Date(b.scheduledStartTime).getTime();
    return activeTab === "completed" ? dateB - dateA : dateA - dateB;
  });

  const handleBookingClick = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <AppHeader
        title="My Bookings"
        showNotifications
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/stylists")}
            aria-label="Create new booking"
          >
            <Plus className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">New Booking</span>
          </Button>
        }
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["upcoming", "completed", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:bg-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h3>
            <p className="text-text-secondary mb-4">
              {error instanceof Error
                ? error.message
                : "Failed to load bookings"}
            </p>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Bookings List */}
        {!error && (
          <BookingList
            bookings={sortedBookings || []}
            isLoading={isLoading}
            onBookingClick={handleBookingClick}
            emptyState={activeTab}
          />
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      
    </div>
  );
}
