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

export interface HairProfileUpdateInput extends Partial<HairProfileCreateInput> {}

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
