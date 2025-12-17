/**
 * Rest Buffer Calculator (V5.0 Phase 5)
 *
 * Calculates recommended rest periods between hair events based on
 * profile characteristics, event load, and cumulative stress.
 */

import type { HairProfileResponse, CalendarEventResponse } from "./types";
import { analyzeProfile } from "./intelligence-engine";

// ============================================================================
// Types
// ============================================================================

export interface RestBufferResult {
  requiredHours: number;
  recommendedHours: number;
  reasoning: string;
  urgency: "NONE" | "SUGGESTED" | "IMPORTANT" | "CRITICAL";
  nextAvailableSlot: Date;
}

export interface LoadLevel {
  level: "NONE" | "LIGHT" | "MEDIUM" | "HEAVY" | "EXTREME";
  score: number; // 0-100
}

export interface EventLoadAssessment {
  eventType: string;
  loadLevel: LoadLevel;
  restBufferHours: number;
  cumulativeLoadToday: number;
  weeklyLoadRemaining: number;
  canSchedule: boolean;
  warnings: string[];
}

export interface WeeklyLoadStatus {
  currentLoad: number; // 0-100
  maxLoad: number;
  heavyEventsUsed: number;
  heavyEventsRemaining: number;
  mediumEventsUsed: number;
  mediumEventsRemaining: number;
  restDaysThisWeek: number;
  restDaysNeeded: number;
  overloaded: boolean;
  recommendation: string;
}

// ============================================================================
// Constants
// ============================================================================

// Base rest buffer hours by event type
const BASE_REST_HOURS: Record<string, number> = {
  // Wash day rituals
  WASH_DAY_FULL: 24,
  WASH_DAY_COWASH: 12,
  WASH_DAY_CLARIFY: 36,
  DEEP_CONDITION: 12,

  // Styling events
  STYLE_INSTALL: 48,
  STYLE_PROTECTIVE: 24,
  STYLE_REFRESH: 6,
  STYLE_TAKEDOWN: 24,

  // Treatments
  PROTEIN_TREATMENT: 48,
  HOT_OIL_TREATMENT: 12,
  SCALP_TREATMENT: 12,

  // Professional services
  SALON_TRIM: 24,
  SALON_COLOR: 72,
  SALON_CHEMICAL: 168, // 1 week
  SALON_EXTENSIONS: 48,
  SALON_BRAIDS: 48,
  SALON_LOCS_MAINTENANCE: 24,

  // Heat styling
  HEAT_BLOWDRY: 48,
  HEAT_FLAT_IRON: 72,
  HEAT_CURLING: 48,

  // Low load events
  MOISTURE_REFRESH: 0,
  OIL_SCALP: 0,
  DETANGLE_LIGHT: 6,

  // Default
  DEFAULT: 12,
};

// Load level scores by event type
const EVENT_LOAD_SCORES: Record<string, number> = {
  // High load (60-100)
  SALON_CHEMICAL: 100,
  HEAT_FLAT_IRON: 85,
  SALON_COLOR: 80,
  PROTEIN_TREATMENT: 75,
  WASH_DAY_CLARIFY: 70,
  STYLE_INSTALL: 70,
  SALON_BRAIDS: 70,
  SALON_EXTENSIONS: 70,
  HEAT_BLOWDRY: 65,
  HEAT_CURLING: 65,

  // Medium load (30-59)
  WASH_DAY_FULL: 55,
  STYLE_TAKEDOWN: 50,
  DEEP_CONDITION: 45,
  STYLE_PROTECTIVE: 40,
  SALON_TRIM: 35,
  SALON_LOCS_MAINTENANCE: 35,
  HOT_OIL_TREATMENT: 30,

  // Light load (10-29)
  WASH_DAY_COWASH: 25,
  SCALP_TREATMENT: 20,
  STYLE_REFRESH: 15,
  DETANGLE_LIGHT: 15,

  // Minimal load (0-9)
  MOISTURE_REFRESH: 5,
  OIL_SCALP: 5,

  // Default
  DEFAULT: 30,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getLoadScore(eventType: string): number {
  return EVENT_LOAD_SCORES[eventType] ?? EVENT_LOAD_SCORES.DEFAULT;
}

function getBaseRestHours(eventType: string): number {
  return BASE_REST_HOURS[eventType] ?? BASE_REST_HOURS.DEFAULT;
}

function scoreToLoadLevel(score: number): LoadLevel {
  if (score >= 80) return { level: "EXTREME", score };
  if (score >= 60) return { level: "HEAVY", score };
  if (score >= 30) return { level: "MEDIUM", score };
  if (score >= 10) return { level: "LIGHT", score };
  return { level: "NONE", score };
}

function calculateProfileMultiplier(profile: HairProfileResponse): number {
  let multiplier = 1.0;

  // Manipulation tolerance affects rest needs
  if (profile.manipulationTolerance === "LOW") {
    multiplier *= 1.5;
  } else if (profile.manipulationTolerance === "HIGH") {
    multiplier *= 0.8;
  }

  // Tension sensitivity increases rest needs
  if (profile.tensionSensitivity === "HIGH") {
    multiplier *= 1.3;
  }

  // Scalp sensitivity increases rest after treatments
  if (profile.scalpSensitivity === "HIGH") {
    multiplier *= 1.2;
  }

  // Fine hair needs more rest
  if (profile.strandThickness === "LOW") {
    multiplier *= 1.25;
  } else if (profile.strandThickness === "HIGH") {
    multiplier *= 0.9;
  }

  // High porosity may need more recovery time
  if (profile.porosityLevel === "HIGH") {
    multiplier *= 1.15;
  }

  return multiplier;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================================
// Main Calculator Functions
// ============================================================================

/**
 * Calculate rest buffer needed after an event
 */
export function calculateRestBuffer(
  profile: HairProfileResponse,
  eventType: string,
  recentEvents?: CalendarEventResponse[]
): RestBufferResult {
  const baseHours = getBaseRestHours(eventType);
  const multiplier = calculateProfileMultiplier(profile);

  // Calculate required and recommended hours
  const requiredHours = Math.round(baseHours * 0.5 * multiplier); // Minimum
  const recommendedHours = Math.round(baseHours * multiplier);

  // Check cumulative load from recent events
  let cumulativeLoad = 0;
  if (recentEvents && recentEvents.length > 0) {
    const last48Hours = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentHighLoad = recentEvents.filter((e) => {
      const eventDate = new Date(e.scheduledEnd);
      return eventDate > last48Hours && getLoadScore(e.eventType) >= 60;
    });

    cumulativeLoad = recentHighLoad.reduce((sum, e) => sum + getLoadScore(e.eventType), 0);
  }

  // Adjust based on cumulative load
  let urgency: RestBufferResult["urgency"] = "NONE";
  let adjustedRecommended = recommendedHours;

  if (cumulativeLoad > 100) {
    urgency = "CRITICAL";
    adjustedRecommended = Math.round(recommendedHours * 1.5);
  } else if (cumulativeLoad > 60) {
    urgency = "IMPORTANT";
    adjustedRecommended = Math.round(recommendedHours * 1.25);
  } else if (requiredHours > 0) {
    urgency = "SUGGESTED";
  }

  // Calculate next available slot
  const nextAvailableSlot = new Date(Date.now() + adjustedRecommended * 60 * 60 * 1000);

  // Generate reasoning
  let reasoning = `Based on your hair profile, `;
  if (profile.manipulationTolerance === "LOW") {
    reasoning += "low manipulation tolerance requires extended rest. ";
  }
  if (profile.tensionSensitivity === "HIGH") {
    reasoning += "high tension sensitivity means gentle recovery is important. ";
  }
  if (cumulativeLoad > 60) {
    reasoning += `Recent high-load events (${cumulativeLoad} load score) suggest extra rest.`;
  } else {
    reasoning += `${eventType.replace(/_/g, " ").toLowerCase()} typically needs ${baseHours}h recovery.`;
  }

  return {
    requiredHours,
    recommendedHours: adjustedRecommended,
    reasoning,
    urgency,
    nextAvailableSlot,
  };
}

/**
 * Assess the load of a proposed event
 */
export function assessEventLoad(
  profile: HairProfileResponse,
  eventType: string,
  proposedDate: Date,
  existingEvents: CalendarEventResponse[]
): EventLoadAssessment {
  const loadScore = getLoadScore(eventType);
  const loadLevel = scoreToLoadLevel(loadScore);
  const restBufferHours = getBaseRestHours(eventType);
  const warnings: string[] = [];

  // Calculate cumulative load for the proposed day
  const dayStart = new Date(proposedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(proposedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const sameDayEvents = existingEvents.filter((e) => {
    const eventDate = new Date(e.scheduledStart);
    return eventDate >= dayStart && eventDate <= dayEnd;
  });

  const cumulativeLoadToday = sameDayEvents.reduce(
    (sum, e) => sum + getLoadScore(e.eventType),
    loadScore
  );

  // Calculate weekly load
  const analysis = analyzeProfile(profile);
  const weeklyCapacity = analysis.weeklyLoadCapacity;

  const weekStart = getStartOfWeek(proposedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekEvents = existingEvents.filter((e) => {
    const eventDate = new Date(e.scheduledStart);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

  const heavyEventsThisWeek = weekEvents.filter((e) => getLoadScore(e.eventType) >= 60).length;
  const mediumEventsThisWeek = weekEvents.filter((e) => {
    const score = getLoadScore(e.eventType);
    return score >= 30 && score < 60;
  }).length;

  // Check if adding this event would exceed limits
  let canSchedule = true;
  const isHeavy = loadScore >= 60;
  const isMedium = loadScore >= 30 && loadScore < 60;

  if (isHeavy && heavyEventsThisWeek >= weeklyCapacity.maxHeavyDays) {
    canSchedule = false;
    warnings.push(
      `Weekly limit of ${weeklyCapacity.maxHeavyDays} heavy events reached. Consider rescheduling.`
    );
  }

  if (isMedium && mediumEventsThisWeek >= weeklyCapacity.maxMediumDays) {
    warnings.push(
      `Approaching weekly limit of ${weeklyCapacity.maxMediumDays} medium events.`
    );
  }

  if (cumulativeLoadToday > 100) {
    warnings.push("Daily load exceeds recommended maximum. Hair may be stressed.");
  }

  // Check rest buffer from previous events
  const sortedEvents = [...existingEvents].sort(
    (a, b) => new Date(b.scheduledEnd).getTime() - new Date(a.scheduledEnd).getTime()
  );
  const lastEvent = sortedEvents[0];

  if (lastEvent) {
    const lastEventEnd = new Date(lastEvent.scheduledEnd);
    const hoursSinceLastEvent =
      (proposedDate.getTime() - lastEventEnd.getTime()) / (1000 * 60 * 60);
    const requiredRest = getBaseRestHours(lastEvent.eventType) * calculateProfileMultiplier(profile);

    if (hoursSinceLastEvent < requiredRest * 0.5) {
      canSchedule = false;
      warnings.push(
        `Insufficient rest since last event (${Math.round(hoursSinceLastEvent)}h vs ${Math.round(requiredRest * 0.5)}h minimum required).`
      );
    } else if (hoursSinceLastEvent < requiredRest) {
      warnings.push(
        `Less than recommended rest since last event. ${Math.round(requiredRest - hoursSinceLastEvent)}h more rest would be ideal.`
      );
    }
  }

  // Calculate weekly load remaining
  const totalWeeklyLoad = weekEvents.reduce((sum, e) => sum + getLoadScore(e.eventType), 0);
  const maxWeeklyLoad = weeklyCapacity.maxHeavyDays * 80 + weeklyCapacity.maxMediumDays * 45;
  const weeklyLoadRemaining = Math.max(0, maxWeeklyLoad - totalWeeklyLoad - loadScore);

  return {
    eventType,
    loadLevel,
    restBufferHours,
    cumulativeLoadToday,
    weeklyLoadRemaining,
    canSchedule,
    warnings,
  };
}

/**
 * Get weekly load status for a profile
 */
export function getWeeklyLoadStatus(
  profile: HairProfileResponse,
  weekStart: Date,
  events: CalendarEventResponse[]
): WeeklyLoadStatus {
  const analysis = analyzeProfile(profile);
  const capacity = analysis.weeklyLoadCapacity;

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekEvents = events.filter((e) => {
    const eventDate = new Date(e.scheduledStart);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

  // Count events by load level
  const heavyEventsUsed = weekEvents.filter((e) => getLoadScore(e.eventType) >= 60).length;
  const mediumEventsUsed = weekEvents.filter((e) => {
    const score = getLoadScore(e.eventType);
    return score >= 30 && score < 60;
  }).length;

  // Calculate current load
  const currentLoad = weekEvents.reduce((sum, e) => sum + getLoadScore(e.eventType), 0);
  const maxLoad = capacity.maxHeavyDays * 80 + capacity.maxMediumDays * 45;

  // Count rest days (days with no events or only light events)
  const daysWithEvents = new Set<string>();
  weekEvents.forEach((e) => {
    if (getLoadScore(e.eventType) >= 10) {
      const dayKey = new Date(e.scheduledStart).toISOString().split("T")[0];
      daysWithEvents.add(dayKey);
    }
  });
  const restDaysThisWeek = 7 - daysWithEvents.size;

  const overloaded = currentLoad > maxLoad || heavyEventsUsed > capacity.maxHeavyDays;

  // Generate recommendation
  let recommendation: string;
  if (overloaded) {
    recommendation =
      "Your hair needs more rest this week. Consider rescheduling some events or keeping them low-manipulation.";
  } else if (restDaysThisWeek < capacity.recommendedRestDays) {
    recommendation = `Try to keep at least ${capacity.recommendedRestDays - restDaysThisWeek} more days free for rest.`;
  } else if (heavyEventsUsed === capacity.maxHeavyDays) {
    recommendation = "You've used all heavy event slots. Keep remaining days light.";
  } else {
    recommendation = "Your weekly load is balanced. Keep up the good routine!";
  }

  return {
    currentLoad,
    maxLoad,
    heavyEventsUsed,
    heavyEventsRemaining: Math.max(0, capacity.maxHeavyDays - heavyEventsUsed),
    mediumEventsUsed,
    mediumEventsRemaining: Math.max(0, capacity.maxMediumDays - mediumEventsUsed),
    restDaysThisWeek,
    restDaysNeeded: capacity.recommendedRestDays,
    overloaded,
    recommendation,
  };
}

/**
 * Suggest optimal time for an event based on rest requirements
 */
export function suggestOptimalTime(
  profile: HairProfileResponse,
  _eventType: string,
  existingEvents: CalendarEventResponse[],
  preferredStart: Date = new Date()
): Date {
  const multiplier = calculateProfileMultiplier(profile);

  // Find the last event
  const sortedEvents = [...existingEvents].sort(
    (a, b) => new Date(b.scheduledEnd).getTime() - new Date(a.scheduledEnd).getTime()
  );
  const lastEvent = sortedEvents.find(
    (e) => new Date(e.scheduledEnd) <= preferredStart
  );

  if (!lastEvent) {
    return preferredStart;
  }

  const lastEventEnd = new Date(lastEvent.scheduledEnd);
  const requiredRestMs =
    getBaseRestHours(lastEvent.eventType) * multiplier * 60 * 60 * 1000;

  const earliestPossible = new Date(lastEventEnd.getTime() + requiredRestMs);

  // Return the later of preferred start or earliest possible
  return earliestPossible > preferredStart ? earliestPossible : preferredStart;
}

/**
 * Get all event types with their load levels
 */
export function getAllEventLoadLevels(): Array<{ eventType: string; loadLevel: LoadLevel }> {
  return Object.entries(EVENT_LOAD_SCORES)
    .filter(([key]) => key !== "DEFAULT")
    .map(([eventType, score]) => ({
      eventType,
      loadLevel: scoreToLoadLevel(score),
    }))
    .sort((a, b) => b.loadLevel.score - a.loadLevel.score);
}
