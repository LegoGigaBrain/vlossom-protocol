/**
 * Smart Calendar Scheduling Service (V6.9.0)
 *
 * Automatically generates and populates calendar events based on
 * profile-derived ritual plans. Handles conflict detection, rest
 * buffer scheduling, and intelligent rescheduling.
 */

import prisma from "../prisma";
import type { HairCalendarEvent } from "@prisma/client";
import type { HairProfileResponse, CalendarEventResponse } from "./types";
import { generateRitualPlan } from "./ritual-generator";
import { assessEventLoad } from "./rest-buffer-calculator";
import { analyzeProfile } from "./intelligence-engine";
import { HairEventCategory, HairEventStatus, LoadFactor } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface ScheduleGenerationOptions {
  /** Start date for the schedule (defaults to today) */
  startDate?: Date;
  /** Number of weeks to generate (1-4, defaults to 2) */
  weeksToGenerate?: number;
  /** Whether to overwrite existing scheduled events */
  replaceExisting?: boolean;
  /** Whether to include rest buffer events */
  includeRestBuffers?: boolean;
  /** Whether to include education prompts */
  includeEducationPrompts?: boolean;
}

export interface ScheduleGenerationResult {
  success: boolean;
  eventsCreated: number;
  eventsSkipped: number;
  conflicts: ScheduleConflict[];
  nextScheduledDate: Date | null;
  weeklyLoadScore: number;
}

export interface ScheduleConflict {
  date: Date;
  proposedEvent: string;
  existingEvent: string;
  resolution: "SKIPPED" | "RESCHEDULED" | "REPLACED";
  newDate?: Date;
}

export interface UpcomingRitualsResponse {
  rituals: UpcomingRitual[];
  totalUpcoming: number;
  nextWashDay: Date | null;
  weeklyLoadStatus: {
    current: number;
    max: number;
    percentage: number;
  };
}

export interface UpcomingRitual {
  id: string;
  name: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  loadLevel: string;
  eventType: string;
  status: string;
  isOverdue: boolean;
  daysUntil: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIME_SLOTS: Record<string, { hour: number; minute: number }> = {
  MORNING: { hour: 9, minute: 0 },
  AFTERNOON: { hour: 14, minute: 0 },
  EVENING: { hour: 19, minute: 0 },
};

const EDUCATION_PROMPTS = [
  {
    title: "Understanding Your Porosity",
    body: "Your porosity level affects how your hair absorbs and retains moisture. Take a moment to observe how quickly your hair absorbs water.",
    triggerDay: 2, // Tuesday
  },
  {
    title: "Protein-Moisture Balance",
    body: "Healthy hair needs a balance of protein (strength) and moisture (flexibility). Notice how your hair feels today.",
    triggerDay: 4, // Thursday
  },
  {
    title: "Protective Styling Tips",
    body: "Low manipulation helps retain length. Consider if your current style is protecting your ends.",
    triggerDay: 6, // Saturday
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function setTimeOfDay(date: Date, timeOfDay: "MORNING" | "AFTERNOON" | "EVENING"): Date {
  const result = new Date(date);
  const time = DEFAULT_TIME_SLOTS[timeOfDay];
  result.setHours(time.hour, time.minute, 0, 0);
  return result;
}

function mapRitualTypeToEventType(ritualType: string): string {
  const mapping: Record<string, string> = {
    WASH_DAY: "WASH_DAY_FULL",
    DEEP_CONDITION: "DEEP_CONDITION",
    PROTEIN_TREATMENT: "PROTEIN_TREATMENT",
    SCALP_TREATMENT: "SCALP_TREATMENT",
    MOISTURE_REFRESH: "MOISTURE_REFRESH",
    STYLE_REFRESH: "STYLE_REFRESH",
    HOT_OIL: "HOT_OIL_TREATMENT",
    PROTECTIVE_STYLE: "STYLE_PROTECTIVE",
    DETANGLE: "DETANGLE_LIGHT",
  };
  return mapping[ritualType] || "DEFAULT";
}

// ============================================================================
// Core Scheduling Functions
// ============================================================================

/**
 * Generate calendar events from a ritual plan
 */
export async function generateCalendarFromPlan(
  userId: string,
  profile: HairProfileResponse,
  options: ScheduleGenerationOptions = {}
): Promise<ScheduleGenerationResult> {
  const {
    startDate = new Date(),
    weeksToGenerate = 2,
    replaceExisting = false,
    includeRestBuffers = true,
    includeEducationPrompts = true,
  } = options;

  const plan = generateRitualPlan(profile);
  const weekStart = getStartOfWeek(startDate);
  const conflicts: ScheduleConflict[] = [];
  let eventsCreated = 0;
  let eventsSkipped = 0;

  // Get existing events in the date range
  const endDate = addDays(weekStart, weeksToGenerate * 7);
  const existingEvents = await prisma.hairCalendarEvent.findMany({
    where: {
      userId,
      scheduledStart: {
        gte: weekStart,
        lt: endDate,
      },
      status: {
        not: HairEventStatus.SKIPPED,
      },
    },
  });

  // Delete existing auto-generated events if replacing
  if (replaceExisting) {
    await prisma.hairCalendarEvent.deleteMany({
      where: {
        userId,
        scheduledStart: {
          gte: weekStart,
          lt: endDate,
        },
        eventCategory: HairEventCategory.HAIR_RITUAL,
        // Only delete events that were auto-generated (no linked booking)
        linkedBookingId: null,
      },
    });
  }

  // Generate events for each week
  for (let week = 0; week < weeksToGenerate; week++) {
    const currentWeekStart = addDays(weekStart, week * 7);

    for (const daySlot of plan.weeklySchedule) {
      if (daySlot.isRestDay || daySlot.rituals.length === 0) continue;

      const eventDate = addDays(currentWeekStart, daySlot.dayOfWeek);

      for (const ritual of daySlot.rituals) {
        const scheduledStart = setTimeOfDay(eventDate, ritual.timeOfDay);
        const scheduledEnd = new Date(scheduledStart.getTime() + ritual.estimatedMinutes * 60 * 1000);

        // Check for conflicts with existing events (unless we're replacing)
        if (!replaceExisting) {
          const conflictingEvent = existingEvents.find((e) => {
            const eStart = new Date(e.scheduledStart);
            const eEnd = new Date(e.scheduledEnd);
            return scheduledStart < eEnd && scheduledEnd > eStart;
          });

          if (conflictingEvent) {
            conflicts.push({
              date: eventDate,
              proposedEvent: ritual.name,
              existingEvent: conflictingEvent.title,
              resolution: "SKIPPED",
            });
            eventsSkipped++;
            continue;
          }
        }

        // Create the calendar event
        try {
          await prisma.hairCalendarEvent.create({
            data: {
              userId,
              eventCategory: HairEventCategory.HAIR_RITUAL,
              eventType: mapRitualTypeToEventType(ritual.templateId.split("-")[0].toUpperCase()),
              title: ritual.name,
              description: `Auto-scheduled ${ritual.loadLevel.toLowerCase()} ritual`,
              scheduledStart,
              scheduledEnd,
              loadLevel: ritual.loadLevel as LoadFactor,
              requiresRestBuffer: ritual.loadLevel === "HEAVY",
              recommendedRestHoursAfter: ritual.loadLevel === "HEAVY" ? 24 : 12,
              status: HairEventStatus.PLANNED,
            },
          });
          eventsCreated++;

          // Add rest buffer event after heavy rituals
          if (includeRestBuffers && ritual.loadLevel === "HEAVY") {
            const restStart = new Date(scheduledEnd.getTime() + 60 * 60 * 1000); // 1 hour after
            const restEnd = addDays(restStart, 1);

            await prisma.hairCalendarEvent.create({
              data: {
                userId,
                eventCategory: HairEventCategory.REST_BUFFER,
                eventType: "REST_DAY",
                title: "Recovery Day",
                description: "Rest period after intensive ritual. Keep manipulation minimal.",
                scheduledStart: restStart,
                scheduledEnd: restEnd,
                loadLevel: "LIGHT",
                requiresRestBuffer: false,
                status: HairEventStatus.PLANNED,
              },
            });
            eventsCreated++;
          }
        } catch (_error) {
          eventsSkipped++;
        }
      }
    }

    // Add education prompts for the first week
    if (week === 0 && includeEducationPrompts) {
      for (const prompt of EDUCATION_PROMPTS) {
        const promptDate = addDays(currentWeekStart, prompt.triggerDay);
        const scheduledStart = setTimeOfDay(promptDate, "EVENING");
        scheduledStart.setHours(20, 0, 0, 0); // 8 PM for education

        try {
          await prisma.hairCalendarEvent.create({
            data: {
              userId,
              eventCategory: HairEventCategory.EDUCATION_PROMPT,
              eventType: "LEARNING_PROMPT",
              title: prompt.title,
              description: prompt.body,
              scheduledStart,
              scheduledEnd: new Date(scheduledStart.getTime() + 15 * 60 * 1000), // 15 min
              loadLevel: "LIGHT",
              requiresRestBuffer: false,
              status: HairEventStatus.PLANNED,
            },
          });
          eventsCreated++;
        } catch {
          // Skip if already exists
        }
      }
    }
  }

  // Find next scheduled date
  const nextEvent = await prisma.hairCalendarEvent.findFirst({
    where: {
      userId,
      scheduledStart: { gte: new Date() },
      status: HairEventStatus.PLANNED,
    },
    orderBy: { scheduledStart: "asc" },
  });

  return {
    success: true,
    eventsCreated,
    eventsSkipped,
    conflicts,
    nextScheduledDate: nextEvent?.scheduledStart || null,
    weeklyLoadScore: plan.loadSummary.totalWeeklyLoad,
  };
}

/**
 * Get upcoming rituals for a user
 */
export async function getUpcomingRituals(
  userId: string,
  daysAhead: number = 14
): Promise<UpcomingRitualsResponse> {
  const now = new Date();
  const endDate = addDays(now, daysAhead);

  const events = await prisma.hairCalendarEvent.findMany({
    where: {
      userId,
      scheduledStart: {
        gte: addDays(now, -1), // Include events from yesterday (for overdue check)
        lte: endDate,
      },
      eventCategory: {
        in: [HairEventCategory.HAIR_RITUAL, HairEventCategory.REST_BUFFER],
      },
      status: {
        not: HairEventStatus.SKIPPED,
      },
    },
    orderBy: { scheduledStart: "asc" },
  });

  const rituals: UpcomingRitual[] = events.map((e: HairCalendarEvent) => {
    const scheduledStart = new Date(e.scheduledStart);
    const daysUntil = Math.ceil((scheduledStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: e.id,
      name: e.title,
      scheduledStart,
      scheduledEnd: new Date(e.scheduledEnd),
      loadLevel: e.loadLevel || "STANDARD",
      eventType: e.eventType,
      status: e.status,
      isOverdue: scheduledStart < now && e.status === HairEventStatus.PLANNED,
      daysUntil,
    };
  });

  // Find next wash day
  const nextWashDay = events.find(
    (e: HairCalendarEvent) => e.eventType.includes("WASH") && new Date(e.scheduledStart) >= now
  );

  // Calculate weekly load
  const weekStart = getStartOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const weekEvents = events.filter((e: HairCalendarEvent) => {
    const start = new Date(e.scheduledStart);
    return start >= weekStart && start < weekEnd;
  });

  const loadScores: Record<string, number> = {
    LIGHT: 15,
    STANDARD: 35,
    HEAVY: 60,
  };

  const currentLoad = weekEvents.reduce((sum: number, e: { loadLevel: string | null }) => sum + (loadScores[e.loadLevel || "STANDARD"] || 0), 0);
  const maxLoad = 150; // Default max weekly load

  return {
    rituals,
    totalUpcoming: rituals.length,
    nextWashDay: nextWashDay ? new Date(nextWashDay.scheduledStart) : null,
    weeklyLoadStatus: {
      current: currentLoad,
      max: maxLoad,
      percentage: Math.round((currentLoad / maxLoad) * 100),
    },
  };
}

/**
 * Reschedule an event to a new date/time
 */
export async function rescheduleEvent(
  userId: string,
  eventId: string,
  newStart: Date,
  profile: HairProfileResponse
): Promise<{ success: boolean; warnings: string[] }> {
  const event = await prisma.hairCalendarEvent.findFirst({
    where: { id: eventId, userId },
  });

  if (!event) {
    return { success: false, warnings: ["Event not found"] };
  }

  // Get existing events for conflict check
  const existingEvents = await prisma.hairCalendarEvent.findMany({
    where: {
      userId,
      id: { not: eventId },
      status: { not: HairEventStatus.SKIPPED },
    },
  });

  const calendarEvents: CalendarEventResponse[] = existingEvents.map((e) => ({
    id: e.id,
    userId: e.userId,
    eventCategory: e.eventCategory,
    eventType: e.eventType,
    title: e.title,
    description: e.description,
    scheduledStart: e.scheduledStart.toISOString(),
    scheduledEnd: e.scheduledEnd.toISOString(),
    loadLevel: e.loadLevel,
    requiresRestBuffer: e.requiresRestBuffer,
    recommendedRestHoursAfter: e.recommendedRestHoursAfter,
    status: e.status,
    completionQuality: e.completionQuality,
    completedAt: e.completedAt?.toISOString() || null,
    linkedRitualId: e.linkedRitualId,
    linkedBookingId: e.linkedBookingId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  // Assess the new schedule
  const assessment = assessEventLoad(profile, event.eventType, newStart, calendarEvents);

  // Calculate new end time
  const duration = new Date(event.scheduledEnd).getTime() - new Date(event.scheduledStart).getTime();
  const newEnd = new Date(newStart.getTime() + duration);

  // Update the event
  await prisma.hairCalendarEvent.update({
    where: { id: eventId },
    data: {
      scheduledStart: newStart,
      scheduledEnd: newEnd,
      status: HairEventStatus.RESCHEDULED,
    },
  });

  return {
    success: assessment.canSchedule,
    warnings: assessment.warnings,
  };
}

/**
 * Mark an event as completed with quality rating
 */
export async function completeEvent(
  userId: string,
  eventId: string,
  quality: "EXCELLENT" | "GOOD" | "ADEQUATE" | "POOR"
): Promise<{ success: boolean }> {
  const event = await prisma.hairCalendarEvent.findFirst({
    where: { id: eventId, userId },
  });

  if (!event) {
    return { success: false };
  }

  await prisma.hairCalendarEvent.update({
    where: { id: eventId },
    data: {
      status: HairEventStatus.COMPLETED,
      completedAt: new Date(),
      completionQuality: quality,
    },
  });

  return { success: true };
}

/**
 * Skip an event (mark as skipped)
 */
export async function skipEvent(
  userId: string,
  eventId: string,
  reason?: string
): Promise<{ success: boolean; suggestedMakeup?: Date }> {
  const event = await prisma.hairCalendarEvent.findFirst({
    where: { id: eventId, userId },
  });

  if (!event) {
    return { success: false };
  }

  await prisma.hairCalendarEvent.update({
    where: { id: eventId },
    data: {
      status: HairEventStatus.SKIPPED,
      description: reason ? `${event.description || ""}\n\nSkipped: ${reason}` : event.description,
    },
  });

  // Suggest a makeup date (2 days later, same time)
  const suggestedMakeup = addDays(new Date(event.scheduledStart), 2);

  return {
    success: true,
    suggestedMakeup,
  };
}

/**
 * Regenerate schedule when profile changes
 */
export async function regenerateOnProfileChange(
  userId: string,
  profile: HairProfileResponse
): Promise<ScheduleGenerationResult> {
  // Only regenerate future events
  return generateCalendarFromPlan(userId, profile, {
    startDate: new Date(),
    weeksToGenerate: 2,
    replaceExisting: true,
    includeRestBuffers: true,
    includeEducationPrompts: false, // Don't duplicate prompts
  });
}

/**
 * Get calendar summary for widget display
 */
export async function getCalendarSummary(
  userId: string,
  profile: HairProfileResponse
): Promise<{
  nextRitual: UpcomingRitual | null;
  thisWeekLoad: number;
  maxWeekLoad: number;
  overdueCount: number;
  completedThisWeek: number;
  streakDays: number;
}> {
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = addDays(weekStart, 7);

  // Get this week's events
  const weekEvents = await prisma.hairCalendarEvent.findMany({
    where: {
      userId,
      scheduledStart: {
        gte: weekStart,
        lt: weekEnd,
      },
      eventCategory: HairEventCategory.HAIR_RITUAL,
    },
  });

  // Calculate load
  const loadScores: Record<string, number> = { LIGHT: 15, STANDARD: 35, HEAVY: 60 };
  const thisWeekLoad = weekEvents.reduce(
    (sum: number, e: HairCalendarEvent) => sum + (loadScores[e.loadLevel || "STANDARD"] || 0),
    0
  );

  const analysis = analyzeProfile(profile);
  const maxWeekLoad = analysis.weeklyLoadCapacity.maxHeavyDays * 60 + analysis.weeklyLoadCapacity.maxMediumDays * 35;

  // Count overdue
  const overdueCount = weekEvents.filter(
    (e) => new Date(e.scheduledStart) < now && e.status === HairEventStatus.PLANNED
  ).length;

  // Count completed
  const completedThisWeek = weekEvents.filter((e) => e.status === HairEventStatus.COMPLETED).length;

  // Get next ritual
  const nextEvent = await prisma.hairCalendarEvent.findFirst({
    where: {
      userId,
      scheduledStart: { gte: now },
      eventCategory: HairEventCategory.HAIR_RITUAL,
      status: HairEventStatus.PLANNED,
    },
    orderBy: { scheduledStart: "asc" },
  });

  // Calculate streak (consecutive days with completed rituals)
  let streakDays = 0;
  const yesterday = addDays(now, -1);
  let checkDate = new Date(yesterday);

  for (let i = 0; i < 30; i++) {
    const dayStart = new Date(checkDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    const completedOnDay = await prisma.hairCalendarEvent.findFirst({
      where: {
        userId,
        scheduledStart: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: HairEventStatus.COMPLETED,
      },
    });

    if (completedOnDay) {
      streakDays++;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  const nextRitual = nextEvent
    ? {
        id: nextEvent.id,
        name: nextEvent.title,
        scheduledStart: nextEvent.scheduledStart,
        scheduledEnd: nextEvent.scheduledEnd,
        loadLevel: nextEvent.loadLevel || "STANDARD",
        eventType: nextEvent.eventType,
        status: nextEvent.status,
        isOverdue: false,
        daysUntil: Math.ceil(
          (nextEvent.scheduledStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }
    : null;

  return {
    nextRitual,
    thisWeekLoad,
    maxWeekLoad,
    overdueCount,
    completedThisWeek,
    streakDays,
  };
}
