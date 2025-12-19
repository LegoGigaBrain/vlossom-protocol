/**
 * Schedule Page - Hair-Aware Calendar (V5.1)
 *
 * Three calendar view modes:
 * - Rhythm Strip (default): Horizontal day carousel
 * - Month Garden: Full month view
 * - Day Flow: Single day timeline
 *
 * Wired to bookings API for real booking data.
 * Reference: docs/vlossom/15-frontend-ux-flows.md Section 15
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCalendarEvents } from "@/hooks/use-calendar-bookings";
import { AppHeader } from "@/components/layout/app-header";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RhythmStrip,
  MonthGarden,
  DayFlow,
  RitualSheet,
  type CalendarEvent,
  type Ritual,
} from "@/components/calendar";
import { Icon } from "@/components/icons";

type CalendarView = "rhythm" | "month" | "day";

// Mock ritual events - TODO: Wire to ritual API when available
// Bookings come from real API, rituals are still mock data
function getMockRitualEvents(): CalendarEvent[] {
  return [
    {
      id: "ritual-1",
      title: "Wash Day",
      eventCategory: "HAIR_RITUAL",
      eventType: "WASH_DAY_FULL",
      scheduledStart: new Date().toISOString(),
      scheduledEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      loadLevel: "HIGH",
      status: "DUE",
      requiresRestBuffer: true,
    },
    {
      id: "ritual-2",
      title: "Deep Condition",
      eventCategory: "HAIR_RITUAL",
      eventType: "DEEP_CONDITION",
      scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      loadLevel: "MEDIUM",
      status: "PLANNED",
    },
    {
      id: "ritual-3",
      title: "Rest Day",
      eventCategory: "REST_BUFFER",
      eventType: "REST_DAY",
      scheduledStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString(),
      loadLevel: "LOW",
      status: "PLANNED",
    },
  ];
}

// Mock ritual for demonstration
const mockRitual: Ritual = {
  id: "wash-day-1",
  name: "Full Wash Day",
  description: "Complete wash day routine with deep conditioning",
  ritualType: "WASH_DAY_FULL",
  defaultDurationMinutes: 180,
  loadLevel: "HEAVY",
  steps: [
    {
      id: "s1",
      stepOrder: 1,
      stepType: "PRE_POO",
      name: null,
      estimatedMinutes: 20,
      optional: true,
      notes: "Apply oil to dry hair before washing",
    },
    {
      id: "s2",
      stepOrder: 2,
      stepType: "SHAMPOO",
      name: null,
      estimatedMinutes: 10,
      optional: false,
      notes: "Focus on scalp, let suds run through lengths",
    },
    {
      id: "s3",
      stepOrder: 3,
      stepType: "DEEP_CONDITION",
      name: null,
      estimatedMinutes: 30,
      optional: false,
      notes: "Apply heat cap for better penetration",
    },
    {
      id: "s4",
      stepOrder: 4,
      stepType: "DETANGLE",
      name: null,
      estimatedMinutes: 20,
      optional: false,
      notes: "Work in sections from ends to roots",
    },
    {
      id: "s5",
      stepOrder: 5,
      stepType: "LEAVE_IN",
      name: null,
      estimatedMinutes: 5,
      optional: false,
      notes: null,
    },
    {
      id: "s6",
      stepOrder: 6,
      stepType: "MOISTURIZE",
      name: null,
      estimatedMinutes: 10,
      optional: false,
      notes: "Apply LOC or LCO method",
    },
    {
      id: "s7",
      stepOrder: 7,
      stepType: "STYLE",
      name: null,
      estimatedMinutes: 30,
      optional: false,
      notes: "Twist-out, braid-out, or protective style",
    },
  ],
};

export default function SchedulePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [view, setView] = useState<CalendarView>("rhythm");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showRitualSheet, setShowRitualSheet] = useState(false);

  // Fetch bookings from API based on current view
  const {
    events: bookingEvents,
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useCalendarEvents(selectedDate, view);

  // Combine booking events with mock ritual events
  // TODO: Replace mock rituals with real API when available
  const events = useMemo<CalendarEvent[]>(() => {
    const ritualEvents = getMockRitualEvents();
    // Cast booking events to CalendarEvent type (they're compatible)
    const allEvents = [
      ...ritualEvents,
      ...(bookingEvents as unknown as CalendarEvent[]),
    ];
    // Sort by scheduled start time
    return allEvents.sort(
      (a, b) =>
        new Date(a.scheduledStart).getTime() -
        new Date(b.scheduledStart).getTime()
    );
  }, [bookingEvents]);

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (event.eventCategory === "HAIR_RITUAL") {
      setShowRitualSheet(true);
    } else if (event.eventCategory === "BOOKING_SERVICE") {
      // Navigate to booking details
      router.push(`/bookings/${event.id}`);
    }
  };

  const isLoading = authLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader title="Schedule" showNotifications />
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
        
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-24">
      {/* Header */}
      <AppHeader
        title="Schedule"
        subtitle="Your hair care calendar"
        showNotifications
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/profile/hair-health")}
            aria-label="Hair Health"
          >
            <Icon name="sparkle" size="md" />
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Error State */}
        {bookingsError && (
          <div className="flex items-center gap-2 p-3 bg-status-error/10 text-status-error rounded-lg">
            <Icon name="calmError" size="md" />
            <p className="text-sm">Unable to load bookings. Showing ritual events only.</p>
          </div>
        )}

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-background-primary p-1 rounded-xl">
          <ViewButton
            icon="calendar"
            label="Week"
            isActive={view === "rhythm"}
            onClick={() => setView("rhythm")}
          />
          <ViewButton
            icon="calendar"
            label="Month"
            isActive={view === "month"}
            onClick={() => setView("month")}
          />
          <ViewButton
            icon="clock"
            label="Day"
            isActive={view === "day"}
            onClick={() => setView("day")}
          />
        </div>

        {/* Calendar View */}
        <div className="bg-background-primary rounded-xl p-4">
          {view === "rhythm" && (
            <RhythmStrip
              events={events}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onEventClick={handleEventClick}
            />
          )}
          {view === "month" && (
            <MonthGarden
              events={events}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onEventClick={handleEventClick}
            />
          )}
          {view === "day" && (
            <DayFlow
              events={events}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/profile/hair-health")}
          >
            <Icon name="sparkle" size="sm" className="mr-2" />
            Hair Profile
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              // TODO: Add event creation flow
            }}
          >
            <Icon name="add" size="sm" className="mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Ritual Sheet */}
      {selectedEvent?.eventCategory === "HAIR_RITUAL" && (
        <RitualSheet
          ritual={mockRitual}
          isOpen={showRitualSheet}
          onClose={() => {
            setShowRitualSheet(false);
            setSelectedEvent(null);
          }}
          onStartRitual={() => {
            // TODO: Start ritual tracking
          }}
        />
      )}

      {/* Bottom Navigation */}
      
    </div>
  );
}

// View Button Component
function ViewButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: import("@/components/icons").IconName;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-brand-rose text-white shadow-sm"
          : "text-text-secondary hover:bg-background-tertiary"
      }`}
    >
      <Icon name={icon} size="sm" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
