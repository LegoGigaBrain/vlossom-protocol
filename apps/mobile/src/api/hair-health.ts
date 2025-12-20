/**
 * Hair Health API Client (V6.8.0)
 *
 * Handles all hair health-related API calls:
 * - Hair profile CRUD
 * - Learning progress
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
    const response = await apiRequest<ProfileResponse>('/hair-health/profile');
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
  const response = await apiRequest<ProfileResponse>('/hair-health/profile', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * Update hair health profile
 */
export async function updateHairProfile(input: HairProfileUpdateInput): Promise<HairProfile> {
  const response = await apiRequest<ProfileResponse>('/hair-health/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.data;
}

/**
 * Delete hair health profile
 */
export async function deleteHairProfile(): Promise<void> {
  await apiRequest('/hair-health/profile', {
    method: 'DELETE',
  });
}

/**
 * Get learning progress
 */
export async function getLearningProgress(): Promise<LearningProgressResponse['data']> {
  const response = await apiRequest<LearningProgressResponse>('/hair-health/learning');
  return response.data;
}

/**
 * Unlock a learning node
 */
export async function unlockLearningNode(nodeId: LearningNodeId): Promise<UnlockNodeResponse['data']> {
  const response = await apiRequest<UnlockNodeResponse>(`/hair-health/learning/${nodeId}`, {
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
