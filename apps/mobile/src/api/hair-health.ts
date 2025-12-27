/**
 * Hair Health API Client (V6.9.0)
 *
 * Handles all hair health-related API calls:
 * - Hair profile CRUD
 * - Learning progress
 * - V6.9 Calendar Intelligence
 */

import { apiRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type TextureClass = 'TYPE_1' | 'TYPE_2' | 'TYPE_3' | 'TYPE_4';
export type PatternFamily = 'STRAIGHT' | 'WAVY' | 'CURLY' | 'COILY';
export type ThreeLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type LoadFactor = 'LIGHT' | 'MODERATE' | 'HEAVY';
export type RoutineType = 'MINIMAL' | 'MODERATE' | 'ELABORATE';

export interface HairProfile {
  id: string;
  userId: string;
  profileVersion: string;
  textureClass: TextureClass | null;
  patternFamily: PatternFamily | null;
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

export interface HairProfileUpdateInput extends Partial<HairProfileCreateInput> {}

export interface ProfileResponse {
  data: HairProfile;
}

export interface LearningProgressResponse {
  data: {
    unlockedNodes: string[];
    totalAvailable: number;
  };
}

export interface UnlockNodeResponse {
  data: {
    unlockedNodes: string[];
    justUnlocked: string;
  };
}

// Learning node IDs
export type LearningNodeId =
  | 'POROSITY_BASICS'
  | 'MOISTURE_PROTEIN_BALANCE'
  | 'PROTECTIVE_STYLING'
  | 'HEAT_STYLING_SAFETY'
  | 'SCALP_HEALTH'
  | 'PRODUCT_INGREDIENTS';

export const LEARNING_NODES: { id: LearningNodeId; title: string; description: string }[] = [
  {
    id: 'POROSITY_BASICS',
    title: 'Porosity Basics',
    description: 'Learn how your hair absorbs and retains moisture',
  },
  {
    id: 'MOISTURE_PROTEIN_BALANCE',
    title: 'Moisture-Protein Balance',
    description: 'Find the right balance for healthy hair',
  },
  {
    id: 'PROTECTIVE_STYLING',
    title: 'Protective Styling',
    description: 'Styles that protect your ends and reduce manipulation',
  },
  {
    id: 'HEAT_STYLING_SAFETY',
    title: 'Heat Styling Safety',
    description: 'How to use heat without damage',
  },
  {
    id: 'SCALP_HEALTH',
    title: 'Scalp Health',
    description: 'Keep your foundation healthy',
  },
  {
    id: 'PRODUCT_INGREDIENTS',
    title: 'Product Ingredients',
    description: 'Understand what works for your hair',
  },
];

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get current user's hair health profile
 */
export async function getHairProfile(): Promise<HairProfile | null> {
  try {
    const response = await apiRequest<ProfileResponse>('/api/v1/hair-health/profile');
    return response.data;
  } catch (error) {
    // 404 means no profile yet
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create hair health profile
 */
export async function createHairProfile(input: HairProfileCreateInput): Promise<HairProfile> {
  const response = await apiRequest<ProfileResponse>('/api/v1/hair-health/profile', {
    method: 'POST',
    body: input,
  });
  return response.data;
}

/**
 * Update hair health profile
 */
export async function updateHairProfile(input: HairProfileUpdateInput): Promise<HairProfile> {
  const response = await apiRequest<ProfileResponse>('/api/v1/hair-health/profile', {
    method: 'PATCH',
    body: input,
  });
  return response.data;
}

/**
 * Delete hair health profile
 */
export async function deleteHairProfile(): Promise<void> {
  await apiRequest('/api/v1/hair-health/profile', {
    method: 'DELETE',
  });
}

/**
 * Get learning progress
 */
export async function getLearningProgress(): Promise<LearningProgressResponse['data']> {
  const response = await apiRequest<LearningProgressResponse>('/api/v1/hair-health/learning');
  return response.data;
}

/**
 * Unlock a learning node
 */
export async function unlockLearningNode(nodeId: LearningNodeId): Promise<UnlockNodeResponse['data']> {
  const response = await apiRequest<UnlockNodeResponse>(`/api/v1/hair-health/learning/${nodeId}`, {
    method: 'POST',
  });
  return response.data;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get display label for texture class
 */
export function getTextureLabel(texture: TextureClass | null): string {
  if (!texture) return 'Unknown';
  switch (texture) {
    case 'TYPE_1':
      return 'Type 1 (Straight)';
    case 'TYPE_2':
      return 'Type 2 (Wavy)';
    case 'TYPE_3':
      return 'Type 3 (Curly)';
    case 'TYPE_4':
      return 'Type 4 (Coily)';
  }
}

/**
 * Get display label for pattern family
 */
export function getPatternLabel(pattern: PatternFamily | null): string {
  if (!pattern) return 'Unknown';
  switch (pattern) {
    case 'STRAIGHT':
      return 'Straight';
    case 'WAVY':
      return 'Wavy';
    case 'CURLY':
      return 'Curly';
    case 'COILY':
      return 'Coily/Kinky';
  }
}

/**
 * Get display label for three-level values
 */
export function getThreeLevelLabel(level: ThreeLevel | null): string {
  if (!level) return 'Unknown';
  return level.charAt(0) + level.slice(1).toLowerCase();
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletion(profile: HairProfile | null): number {
  if (!profile) return 0;

  const fields = [
    profile.textureClass,
    profile.patternFamily,
    profile.strandThickness,
    profile.densityLevel,
    profile.shrinkageTendency,
    profile.porosityLevel,
    profile.detangleTolerance,
    profile.manipulationTolerance,
    profile.tensionSensitivity,
    profile.scalpSensitivity,
    profile.washDayLoadFactor,
    profile.routineType,
  ];

  const filledFields = fields.filter((f) => f !== null && f !== undefined);
  return Math.round((filledFields.length / fields.length) * 100);
}

/**
 * Get texture class icon/color
 */
export function getTextureColor(texture: TextureClass | null): string {
  if (!texture) return '#6B7280';
  switch (texture) {
    case 'TYPE_1':
      return '#22C55E';
    case 'TYPE_2':
      return '#3B82F6';
    case 'TYPE_3':
      return '#F59E0B';
    case 'TYPE_4':
      return '#311E6B';
  }
}

// ============================================================================
// V6.9 Calendar Intelligence Types
// ============================================================================

export interface RitualStep {
  stepType: string;
  name: string;
  estimatedMinutes: number;
  optional: boolean;
  notes?: string;
}

export interface RitualRecommendation {
  templateId: string;
  name: string;
  description: string;
  ritualType: string;
  loadLevel: 'LIGHT' | 'STANDARD' | 'HEAVY';
  durationMinutes: number;
  frequency: string;
  priority: 'ESSENTIAL' | 'RECOMMENDED' | 'OPTIONAL';
  reasoning: string;
  steps: RitualStep[];
}

export interface WeeklyRitualSlot {
  dayOfWeek: number;
  dayName: string;
  rituals: {
    templateId: string;
    name: string;
    loadLevel: string;
    estimatedMinutes: number;
    timeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING';
  }[];
  totalLoad: number;
  isRestDay: boolean;
}

export interface RitualPlanResponse {
  data: {
    recommendations: RitualRecommendation[];
    weeklySchedule: WeeklyRitualSlot[];
    loadSummary: {
      totalWeeklyLoad: number;
      maxCapacity: number;
      balance: 'UNDER' | 'OPTIMAL' | 'OVER';
    };
    reasoning: string[];
  };
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
  data: {
    rituals: UpcomingRitual[];
    totalUpcoming: number;
    nextWashDay: string | null;
    weeklyLoadStatus: {
      current: number;
      max: number;
      percentage: number;
    };
  };
}

export interface CalendarSummaryResponse {
  data: {
    nextRitual: UpcomingRitual | null;
    thisWeekLoad: number;
    maxWeekLoad: number;
    overdueCount: number;
    completedThisWeek: number;
    streakDays: number;
  };
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

export interface GenerateCalendarResponse {
  data: CalendarGenerateResult;
}

// ============================================================================
// V6.9 Calendar Intelligence API Functions
// ============================================================================

/**
 * Get personalized ritual plan based on profile
 */
export async function getRitualPlan(): Promise<RitualPlanResponse['data']> {
  const response = await apiRequest<RitualPlanResponse>('/api/v1/hair-health/ritual-plan');
  return response.data;
}

/**
 * Get all available ritual templates
 */
export async function getRitualTemplates(): Promise<RitualRecommendation[]> {
  const response = await apiRequest<{ data: RitualRecommendation[] }>('/api/v1/hair-health/ritual-templates');
  return response.data;
}

/**
 * Generate calendar events from ritual plan
 */
export async function generateCalendar(options?: {
  weeksToGenerate?: number;
  replaceExisting?: boolean;
}): Promise<CalendarGenerateResult> {
  const response = await apiRequest<GenerateCalendarResponse>('/api/v1/hair-health/calendar/generate', {
    method: 'POST',
    body: options || {},
  });
  return response.data;
}

/**
 * Get upcoming rituals for the next N days
 */
export async function getUpcomingRituals(days: number = 14): Promise<UpcomingRitualsResponse['data']> {
  const response = await apiRequest<UpcomingRitualsResponse>(`/api/v1/hair-health/calendar/upcoming?days=${days}`);
  return response.data;
}

/**
 * Get calendar summary for widget display
 */
export async function getCalendarSummary(): Promise<CalendarSummaryResponse['data']> {
  const response = await apiRequest<CalendarSummaryResponse>('/api/v1/hair-health/calendar/summary');
  return response.data;
}

/**
 * Mark a calendar event as completed
 */
export async function completeCalendarEvent(
  eventId: string,
  quality: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR' = 'GOOD'
): Promise<void> {
  await apiRequest(`/api/v1/hair-health/calendar/${eventId}/complete`, {
    method: 'POST',
    body: { quality },
  });
}

/**
 * Skip a calendar event
 */
export async function skipCalendarEvent(
  eventId: string,
  reason?: string
): Promise<{ suggestedMakeup: string | null }> {
  const response = await apiRequest<{ data: { suggestedMakeup: string | null } }>(
    `/api/v1/hair-health/calendar/${eventId}/skip`,
    {
      method: 'POST',
      body: { reason },
    }
  );
  return response.data;
}

/**
 * Reschedule a calendar event
 */
export async function rescheduleCalendarEvent(
  eventId: string,
  newDate: Date
): Promise<{ success: boolean; warnings: string[] }> {
  const response = await apiRequest<{ data: { success: boolean; warnings: string[] } }>(
    `/api/v1/hair-health/calendar/${eventId}/reschedule`,
    {
      method: 'PATCH',
      body: { newDate: newDate.toISOString() },
    }
  );
  return response.data;
}

/**
 * Format ritual date for display
 */
export function formatRitualDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
