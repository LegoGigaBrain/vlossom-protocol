/**
 * Schedule Page - Hair-Aware Calendar (V5.0)
 *
 * Three calendar view modes:
 * - Rhythm Strip (default): Horizontal day carousel
 * - Month Garden: Full month view
 * - Day Flow: Single day timeline
 *
 * Reference: docs/vlossom/15-frontend-ux-flows.md Section 15
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import { AppHeader } from "../../components/layout/app-header";
import { BottomNav } from "../../components/layout/bottom-nav";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import {
  RhythmStrip,
  MonthGarden,
  DayFlow,
  RitualSheet,
  type CalendarEvent,
  type Ritual,
} from "../../components/calendar";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";

type CalendarView = "rhythm" | "month" | "day";

// Mock events for demonstration
const mockEvents: CalendarEvent[] = [
  {
    id: "1",
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
    id: "2",
    title: "Deep Condition",
    eventCategory: "HAIR_RITUAL",
    eventType: "DEEP_CONDITION",
    scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    loadLevel: "MEDIUM",
    status: "PLANNED",
  },
  {
    id: "3",
    title: "Rest Day",
    eventCategory: "REST_BUFFER",
    eventType: "REST_DAY",
    scheduledStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString(),
    loadLevel: "LOW",
    status: "PLANNED",
  },
  {
    id: "4",
    title: "Styling Session with Sarah",
    eventCategory: "BOOKING_SERVICE",
    eventType: "BOOKING",
    scheduledStart: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
    loadLevel: "HIGH",
    status: "PLANNED",
    requiresRestBuffer: true,
  },
  {
    id: "5",
    title: "Learn: Porosity Basics",
    eventCategory: "EDUCATION_PROMPT",
    eventType: "LEARNING",
    scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    loadLevel: "LOW",
    status: "PLANNED",
  },
];

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
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<CalendarView>("rhythm");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events] = useState<CalendarEvent[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showRitualSheet, setShowRitualSheet] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader title="Schedule" showNotifications />
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
        <BottomNav />
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
            <Sparkles className="w-5 h-5" />
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-background-primary p-1 rounded-xl">
          <ViewButton
            icon={CalendarRange}
            label="Week"
            isActive={view === "rhythm"}
            onClick={() => setView("rhythm")}
          />
          <ViewButton
            icon={CalendarDays}
            label="Month"
            isActive={view === "month"}
            onClick={() => setView("month")}
          />
          <ViewButton
            icon={Clock}
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
            <Sparkles className="w-4 h-4 mr-2" />
            Hair Profile
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              // TODO: Add event creation flow
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
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
      <BottomNav />
    </div>
  );
}

// View Button Component
function ViewButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: typeof CalendarDays;
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
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
