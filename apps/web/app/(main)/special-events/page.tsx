/**
 * Special Events Landing Page (V6.6.0)
 *
 * Entry point for special event booking requests
 * Features:
 * - Event category selection grid
 * - Featured event stylists
 * - How it works guide
 * - CTA to start request
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Event categories
const EVENT_CATEGORIES = [
  {
    id: "bridal",
    label: "Bridal",
    description: "Wedding day hair styling for bride & party",
    icon: "favorite" as const,
    popular: true,
    color: "rose",
  },
  {
    id: "photoshoot",
    label: "Photoshoot",
    description: "Editorial & portrait styling",
    icon: "sparkle" as const,
    popular: true,
    color: "purple",
  },
  {
    id: "corporate",
    label: "Corporate Event",
    description: "Professional styling for teams",
    icon: "profile" as const,
    popular: false,
    color: "blue",
  },
  {
    id: "party",
    label: "Party",
    description: "Special occasion styling",
    icon: "calendar" as const,
    popular: false,
    color: "amber",
  },
  {
    id: "matric",
    label: "Matric Dance",
    description: "Prom & graduation styling",
    icon: "growing" as const,
    popular: true,
    color: "orange",
  },
  {
    id: "other",
    label: "Other Event",
    description: "Custom event requests",
    icon: "add" as const,
    popular: false,
    color: "gray",
  },
];

// Mock featured stylists
const FEATURED_STYLISTS = [
  {
    id: "1",
    name: "Thandi Mbeki",
    specialty: "Bridal Specialist",
    rating: 4.9,
    completedEvents: 48,
    imageUrl: null,
    verified: true,
  },
  {
    id: "2",
    name: "Precious Dlamini",
    specialty: "Editorial Stylist",
    rating: 4.8,
    completedEvents: 32,
    imageUrl: null,
    verified: true,
  },
  {
    id: "3",
    name: "Zanele Nkosi",
    specialty: "Event Specialist",
    rating: 4.7,
    completedEvents: 25,
    imageUrl: null,
    verified: false,
  },
  {
    id: "4",
    name: "Lindiwe Moyo",
    specialty: "Corporate Styling",
    rating: 4.8,
    completedEvents: 36,
    imageUrl: null,
    verified: true,
  },
];

// How it works steps
const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Describe Your Event",
    description: "Tell us about your occasion, date, location, and styling needs",
    icon: "edit" as const,
  },
  {
    step: 2,
    title: "Get Custom Quotes",
    description: "Stylists review your request and send personalized proposals within 24-48 hours",
    icon: "wallet" as const,
  },
  {
    step: 3,
    title: "Book & Pay Deposit",
    description: "Choose your stylist and secure your booking with a 30% deposit",
    icon: "check" as const,
  },
  {
    step: 4,
    title: "Enjoy Your Event",
    description: "Professional styling for your special day with remaining payment on completion",
    icon: "sparkle" as const,
  },
];

export default function SpecialEventsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleStartRequest = (categoryId?: string) => {
    const url = categoryId
      ? `/special-events/request?category=${categoryId}`
      : "/special-events/request";
    router.push(url);
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-accent-orange/10 via-accent-orange/5 to-transparent px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-orange/20 mb-6">
            <Icon name="growing" size="2xl" className="text-accent-orange" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-4">
            Special Events
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Custom styling for weddings, photoshoots, and special occasions. Get personalized quotes
            from top stylists.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleStartRequest()}
            className="bg-accent-orange hover:bg-accent-orange/90"
          >
            <Icon name="add" size="md" className="mr-2" />
            Request a Quote
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Popular Categories */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Popular Categories</h2>
            <Link
              href="#all-categories"
              className="text-sm text-brand-rose hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EVENT_CATEGORIES.filter((c) => c.popular).map((category) => (
              <Card
                key={category.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:border-accent-orange/50",
                  selectedCategory === category.id && "border-accent-orange ring-2 ring-accent-orange/20"
                )}
                onClick={() => {
                  setSelectedCategory(category.id);
                  handleStartRequest(category.id);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-orange/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={category.icon} size="lg" className="text-accent-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary">{category.label}</h3>
                        {category.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">{category.description}</p>
                    </div>
                    <Icon name="chevronRight" size="md" className="text-text-muted flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* All Categories */}
        <section id="all-categories" className="mb-16">
          <h2 className="text-xl font-semibold text-text-primary mb-6">All Event Types</h2>

          <Card>
            <CardContent className="p-0 divide-y divide-border-default">
              {EVENT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleStartRequest(category.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-background-tertiary transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-background-tertiary flex items-center justify-center flex-shrink-0">
                    <Icon name={category.icon} size="md" className="text-brand-rose" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">{category.label}</p>
                    <p className="text-sm text-text-secondary">{category.description}</p>
                  </div>
                  <Icon name="chevronRight" size="md" className="text-text-muted flex-shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Featured Stylists */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Top Event Stylists</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_STYLISTS.map((stylist) => (
              <Card key={stylist.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-rose to-brand-purple flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-semibold text-white">
                      {stylist.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h3 className="font-semibold text-text-primary">{stylist.name}</h3>
                    {stylist.verified && (
                      <Icon name="verified" size="sm" className="text-brand-rose" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{stylist.specialty}</p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-accent-orange font-medium">
                      <Icon name="star" size="sm" className="inline mr-0.5" />
                      {stylist.rating}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-tertiary">{stylist.completedEvents} events</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-text-primary mb-6">How It Works</h2>

          <Card>
            <CardContent className="p-0 divide-y divide-border-default">
              {HOW_IT_WORKS.map((item, index) => (
                <div key={item.step} className="flex items-start gap-4 p-6">
                  <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-accent-orange">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-background-tertiary flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} size="md" className="text-brand-rose" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center py-8">
          <Card className="bg-gradient-to-br from-accent-orange/10 to-accent-orange/5 border-accent-orange/20">
            <CardContent className="py-10 px-6">
              <h2 className="text-2xl font-display font-bold text-text-primary mb-4">
                Ready to Book Your Event?
              </h2>
              <p className="text-text-secondary mb-6 max-w-lg mx-auto">
                Get personalized quotes from top stylists. No commitment until you find the perfect
                match.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleStartRequest()}
                className="bg-accent-orange hover:bg-accent-orange/90"
              >
                Start Your Request
                <Icon name="chevronRight" size="md" className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
