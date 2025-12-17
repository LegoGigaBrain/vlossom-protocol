/**
 * Hair Health Intelligence Types (V5.0)
 * Reference: docs/vlossom/06-database-schema.md Section 12
 */

// Re-export Prisma enums for convenience
export {
  TextureClass,
  PatternFamily,
  ThreeLevel,
  LoadFactor,
  RoutineType,
  HairEventCategory,
  HairEventStatus,
  HairInsightType,
} from "@prisma/client";

// ============================================================================
// Hair Profile Types
// ============================================================================

export interface HairProfileCreateInput {
  textureClass?: string;
  patternFamily?: string;
  strandThickness?: string;
  densityLevel?: string;
  shrinkageTendency?: string;
  porosityLevel?: string;
  detangleTolerance?: string;
  manipulationTolerance?: string;
  tensionSensitivity?: string;
  scalpSensitivity?: string;
  washDayLoadFactor?: string;
  estimatedWashDayMinutes?: number;
  routineType?: string;
}

export interface HairProfileUpdateInput extends Partial<HairProfileCreateInput> {}

export interface HairProfileResponse {
  id: string;
  userId: string;
  profileVersion: string;
  textureClass: string;
  patternFamily: string;
  strandThickness: string | null;
  densityLevel: string | null;
  shrinkageTendency: string | null;
  porosityLevel: string | null;
  retentionRisk: string | null;
  detangleTolerance: string | null;
  manipulationTolerance: string | null;
  tensionSensitivity: string | null;
  scalpSensitivity: string | null;
  washDayLoadFactor: string | null;
  estimatedWashDayMinutes: number | null;
  routineType: string;
  learningNodesUnlocked: string[];
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
}

// ============================================================================
// Hair Ritual Types
// ============================================================================

export interface RitualStepInput {
  stepOrder: number;
  stepType: string;
  name?: string;
  estimatedMinutes: number;
  optional?: boolean;
  notes?: string;
}

export interface RitualCreateInput {
  ritualType: string;
  name: string;
  description?: string;
  defaultDurationMinutes: number;
  loadLevel: string;
  steps: RitualStepInput[];
}

export interface RitualResponse {
  id: string;
  userId: string | null;
  ritualType: string;
  name: string;
  description: string | null;
  defaultDurationMinutes: number;
  loadLevel: string;
  isTemplate: boolean;
  steps: RitualStepResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface RitualStepResponse {
  id: string;
  stepOrder: number;
  stepType: string;
  name: string | null;
  estimatedMinutes: number;
  optional: boolean;
  notes: string | null;
}

// ============================================================================
// Calendar Event Types
// ============================================================================

export interface CalendarEventCreateInput {
  eventCategory: string;
  eventType: string;
  title: string;
  description?: string;
  scheduledStart: string; // ISO date string
  scheduledEnd: string;
  loadLevel?: string;
  requiresRestBuffer?: boolean;
  recommendedRestHoursAfter?: number;
  linkedRitualId?: string;
  linkedBookingId?: string;
}

export interface CalendarEventUpdateInput {
  title?: string;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  status?: string;
  completionQuality?: string;
}

export interface CalendarEventResponse {
  id: string;
  userId: string;
  eventCategory: string;
  eventType: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  loadLevel: string | null;
  requiresRestBuffer: boolean;
  recommendedRestHoursAfter: number | null;
  status: string;
  completionQuality: string | null;
  completedAt: string | null;
  linkedRitualId: string | null;
  linkedBookingId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Insight Types
// ============================================================================

export interface InsightResponse {
  id: string;
  userId: string;
  insightType: string;
  title: string;
  body: string;
  confidenceScore: number | null;
  priority: string;
  displayStart: string;
  displayEnd: string | null;
  isDismissed: boolean;
  createdAt: string;
}

// ============================================================================
// Stylist Context Types
// ============================================================================

export type ConsentScope = "TEXTURE" | "POROSITY" | "SENSITIVITY" | "ROUTINE" | "FULL";

export interface StylistContextCreateInput {
  stylistUserId: string;
  consentScope: ConsentScope[];
}

export interface StylistContextResponse {
  id: string;
  customerUserId: string;
  stylistUserId: string;
  consentGranted: boolean;
  consentGrantedAt: string | null;
  consentScope: ConsentScope[];
  sharedProfileSnapshot: Partial<HairProfileResponse> | null;
  stylistNotes: string | null;
  lastServiceNotes: string | null;
  createdAt: string;
  updatedAt: string;
}
