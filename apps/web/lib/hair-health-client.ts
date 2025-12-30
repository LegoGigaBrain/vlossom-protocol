/**
 * Hair Health API Client (V5.1)
 *
 * Typed API client for hair health endpoints.
 * Used by React Query hooks for data fetching.
 */

import { api } from "./api";

// ============================================================================
// Types (mirrored from backend for frontend use)
// ============================================================================

export type TextureClass = "TYPE_1" | "TYPE_2" | "TYPE_3" | "TYPE_4";
export type PatternFamily = "STRAIGHT" | "WAVY" | "CURLY" | "COILY";
export type ThreeLevel = "LOW" | "MEDIUM" | "HIGH";
export type LoadFactor = "LIGHT" | "MODERATE" | "HEAVY" | "EXTREME";
export type RoutineType = "MINIMALIST" | "BASIC" | "MODERATE" | "INTENSIVE" | "PROFESSIONAL";

export interface HairProfileCreateInput {
  textureClass?: TextureClass;
  patternFamily?: PatternFamily;
  strandThickness?: ThreeLevel;
  densityLevel?: ThreeLevel;
  shrinkageTendency?: ThreeLevel;
  porosityLevel?: ThreeLevel;
  detangleTolerance?: ThreeLevel;
  manipulationTolerance?: ThreeLevel;
  tensionSensitivity?: ThreeLevel;
  scalpSensitivity?: ThreeLevel;
  washDayLoadFactor?: LoadFactor;
  estimatedWashDayMinutes?: number;
  routineType?: RoutineType;
}

export type HairProfileUpdateInput = Partial<HairProfileCreateInput>;

export interface HairProfileResponse {
  id: string;
  userId: string;
  profileVersion: string;
  textureClass: TextureClass;
  patternFamily: PatternFamily;
  strandThickness: ThreeLevel | null;
  densityLevel: ThreeLevel | null;
  shrinkageTendency: ThreeLevel | null;
  porosityLevel: ThreeLevel | null;
  retentionRisk: ThreeLevel | null;
  detangleTolerance: ThreeLevel | null;
  manipulationTolerance: ThreeLevel | null;
  tensionSensitivity: ThreeLevel | null;
  scalpSensitivity: ThreeLevel | null;
  washDayLoadFactor: LoadFactor | null;
  estimatedWashDayMinutes: number | null;
  routineType: RoutineType;
  learningNodesUnlocked: string[];
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
}

export interface LearningNode {
  id: string;
  nodeType: string;
  title: string;
  description: string;
  unlockCriteria: string[];
  prerequisiteNodes: string[];
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface LearningProgressResponse {
  totalNodes: number;
  unlockedNodes: number;
  progress: number; // 0-100
  nodes: LearningNode[];
}

export interface HealthScore {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: {
    texture: number;
    porosity: number;
    sensitivity: number;
    routine: number;
  };
}

export interface ProfileAnalysis {
  healthScore: HealthScore;
  archetype: string;
  archetypeDescription: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

// ============================================================================
// API Response Wrappers
// ============================================================================

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ProfileWithAnalysis {
  profile: HairProfileResponse;
  analysis: ProfileAnalysis;
}

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Get the current user's hair health profile
 */
export async function getHairProfile(): Promise<HairProfileResponse | null> {
  try {
    const response = await api.get<ApiResponse<ProfileWithAnalysis>>(
      "/api/v1/hair-health/profile"
    );
    return response.data.profile;
  } catch (error) {
    // 404 means no profile exists yet
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get the current user's hair health profile with full analysis
 */
export async function getHairProfileWithAnalysis(): Promise<ProfileWithAnalysis | null> {
  try {
    const response = await api.get<ApiResponse<ProfileWithAnalysis>>(
      "/api/v1/hair-health/profile"
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new hair health profile
 */
export async function createHairProfile(
  input: HairProfileCreateInput
): Promise<HairProfileResponse> {
  const response = await api.post<ApiResponse<{ profile: HairProfileResponse }>>(
    "/api/v1/hair-health/profile",
    input
  );
  return response.data.profile;
}

/**
 * Update the current user's hair health profile
 */
export async function updateHairProfile(
  input: HairProfileUpdateInput
): Promise<HairProfileResponse> {
  const response = await api.patch<ApiResponse<{ profile: HairProfileResponse }>>(
    "/api/v1/hair-health/profile",
    input
  );
  return response.data.profile;
}

/**
 * Delete the current user's hair health profile
 */
export async function deleteHairProfile(): Promise<void> {
  await api.delete("/api/v1/hair-health/profile");
}

/**
 * Get learning progress for the current user
 */
export async function getLearningProgress(): Promise<LearningProgressResponse> {
  const response = await api.get<ApiResponse<LearningProgressResponse>>(
    "/api/v1/hair-health/learning"
  );
  return response.data;
}

/**
 * Unlock a learning node
 */
export async function unlockLearningNode(nodeId: string): Promise<LearningNode> {
  const response = await api.post<ApiResponse<{ node: LearningNode }>>(
    `/api/v1/hair-health/learning/${nodeId}`
  );
  return response.data.node;
}

// ============================================================================
// V6.9 Calendar Intelligence Types & Functions
// ============================================================================

export interface RitualRecommendation {
  templateId: string;
  name: string;
  description: string;
  ritualType: string;
  loadLevel: "LIGHT" | "STANDARD" | "HEAVY";
  durationMinutes: number;
  frequency: string;
  priority: "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  reasoning: string;
  steps: RitualStep[];
}

export interface RitualStep {
  stepType: string;
  name: string;
  estimatedMinutes: number;
  optional: boolean;
  notes?: string;
}

export interface WeeklyRitualSlot {
  dayOfWeek: number;
  dayName: string;
  rituals: {
    templateId: string;
    name: string;
    loadLevel: string;
    estimatedMinutes: number;
    timeOfDay: "MORNING" | "AFTERNOON" | "EVENING";
  }[];
  totalLoad: number;
  isRestDay: boolean;
}

export interface RitualPlanResponse {
  recommendations: RitualRecommendation[];
  weeklySchedule: WeeklyRitualSlot[];
  loadSummary: {
    totalWeeklyLoad: number;
    maxCapacity: number;
    balance: "UNDER" | "OPTIMAL" | "OVER";
  };
  reasoning: string[];
}

export interface UpcomingRitual {
  id: string;
  name: string;
  scheduledStart: string;
  scheduledEnd: string;
  loadLevel: string;
  eventType: string;
  status: string;
  isOverdue: boolean;
  daysUntil: number;
}

export interface UpcomingRitualsResponse {
  rituals: UpcomingRitual[];
  totalUpcoming: number;
  nextWashDay: string | null;
  weeklyLoadStatus: {
    current: number;
    max: number;
    percentage: number;
  };
}

export interface CalendarSummaryResponse {
  nextRitual: UpcomingRitual | null;
  thisWeekLoad: number;
  maxWeekLoad: number;
  overdueCount: number;
  completedThisWeek: number;
  streakDays: number;
}

export interface CalendarGenerateResult {
  success: boolean;
  eventsCreated: number;
  eventsSkipped: number;
  conflicts: {
    date: string;
    proposedEvent: string;
    existingEvent: string;
    resolution: string;
  }[];
  nextScheduledDate: string | null;
  weeklyLoadScore: number;
}

/**
 * Get personalized ritual recommendations based on profile
 */
export async function getRitualPlan(): Promise<RitualPlanResponse> {
  const response = await api.get<ApiResponse<RitualPlanResponse>>(
    "/api/v1/hair-health/ritual-plan"
  );
  return response.data;
}

/**
 * Get all available ritual templates
 */
export async function getRitualTemplates(): Promise<RitualRecommendation[]> {
  const response = await api.get<ApiResponse<RitualRecommendation[]>>(
    "/api/v1/hair-health/ritual-templates"
  );
  return response.data;
}

/**
 * Generate calendar events from ritual plan
 */
export async function generateCalendar(options?: {
  weeksToGenerate?: number;
  replaceExisting?: boolean;
}): Promise<CalendarGenerateResult> {
  const response = await api.post<ApiResponse<CalendarGenerateResult>>(
    "/api/v1/hair-health/calendar/generate",
    options || {}
  );
  return response.data;
}

/**
 * Get upcoming rituals for the next N days
 */
export async function getUpcomingRituals(
  days: number = 14
): Promise<UpcomingRitualsResponse> {
  const response = await api.get<ApiResponse<UpcomingRitualsResponse>>(
    `/api/v1/hair-health/calendar/upcoming?days=${days}`
  );
  return response.data;
}

/**
 * Get calendar summary for widget display
 */
export async function getCalendarSummary(): Promise<CalendarSummaryResponse> {
  const response = await api.get<ApiResponse<CalendarSummaryResponse>>(
    "/api/v1/hair-health/calendar/summary"
  );
  return response.data;
}

/**
 * Mark an event as completed
 */
export async function completeCalendarEvent(
  eventId: string,
  quality: "EXCELLENT" | "GOOD" | "ADEQUATE" | "POOR" = "GOOD"
): Promise<void> {
  await api.post(`/api/v1/hair-health/calendar/${eventId}/complete`, { quality });
}

/**
 * Skip an event
 */
export async function skipCalendarEvent(
  eventId: string,
  reason?: string
): Promise<{ suggestedMakeup: string | null }> {
  const response = await api.post<ApiResponse<{ suggestedMakeup: string | null }>>(
    `/api/v1/hair-health/calendar/${eventId}/skip`,
    { reason }
  );
  return response.data;
}

/**
 * Reschedule an event
 */
export async function rescheduleCalendarEvent(
  eventId: string,
  newDate: Date
): Promise<{ success: boolean; warnings: string[] }> {
  const response = await api.patch<ApiResponse<{ success: boolean; warnings: string[] }>>(
    `/api/v1/hair-health/calendar/${eventId}/reschedule`,
    { newDate: newDate.toISOString() }
  );
  return response.data;
}
