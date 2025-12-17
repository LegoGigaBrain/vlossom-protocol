"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStylist } from "@/hooks/use-stylists";
import { StylistProfile } from "@/components/stylists/stylist-profile";
import { ServiceList } from "@/components/stylists/service-list";
import { PortfolioGallery } from "@/components/stylists/portfolio-gallery";
import { BookingDialog } from "@/components/booking/booking-dialog";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/stylist-client";

export default function StylistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const stylistId = params.id as string;

  const { data: stylist, isLoading, error } = useStylist(stylistId);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [initialService, setInitialService] = useState<Service | null>(null);

  const handleBack = () => {
    router.push("/stylists");
  };

  const handleBookNow = () => {
    setInitialService(null);
    setBookingOpen(true);
  };

  const handleSelectService = (service: Service) => {
    setInitialService(service);
    setBookingOpen(true);
  };

  // Loading state
  if (isLoading) {
    return <StylistProfileSkeleton />;
  }

  // Error state
  if (error || !stylist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-status-error/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-status-error"
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
            Stylist Not Found
          </h1>
          <p className="text-text-secondary mb-6">
            {error instanceof Error
              ? error.message
              : "The stylist you're looking for doesn't exist."}
          </p>
          <Button onClick={handleBack}>Browse Stylists</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-8">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <StylistProfile
          stylist={stylist}
          onBookNow={handleBookNow}
          onBack={handleBack}
        />

        {/* Portfolio */}
        {stylist.portfolioImages.length > 0 && (
          <div className="mt-8">
            <PortfolioGallery images={stylist.portfolioImages} />
          </div>
        )}

        {/* Services */}
        <div className="mt-8">
          <ServiceList
            services={stylist.services}
            onSelectService={handleSelectService}
          />
        </div>
      </main>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        stylist={stylist}
        initialService={initialService}
      />
    </div>
  );
}

function StylistProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <div className="h-6 w-32 bg-border rounded animate-pulse mb-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-pulse">
          <div className="w-28 h-28 rounded-full bg-border" />
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="h-8 w-48 bg-border rounded mx-auto sm:mx-0" />
            <div className="h-4 w-32 bg-border rounded mx-auto sm:mx-0" />
            <div className="h-4 w-40 bg-border rounded mx-auto sm:mx-0" />
          </div>
          <div className="hidden sm:block w-32 h-12 bg-border rounded" />
        </div>

        {/* Bio */}
        <div className="mt-8 bg-surface rounded-lg p-4 animate-pulse">
          <div className="h-5 w-20 bg-border rounded mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-border rounded" />
            <div className="h-4 w-3/4 bg-border rounded" />
          </div>
        </div>

        {/* Services */}
        <div className="mt-8 animate-pulse">
          <div className="h-6 w-24 bg-border rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-lg p-4">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-32 bg-border rounded" />
                    <div className="h-4 w-48 bg-border rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-20 bg-border rounded" />
                    <div className="h-8 w-16 bg-border rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
