/**
 * Hair Health Profile Service (V5.0)
 *
 * Handles CRUD operations for hair health profiles and related data.
 */

import { PrismaClient, TextureClass, PatternFamily, ThreeLevel, LoadFactor, RoutineType } from "@prisma/client";
import type {
  HairProfileCreateInput,
  HairProfileUpdateInput,
  HairProfileResponse,
} from "./types";

const prisma = new PrismaClient();

// ============================================================================
// Helper Functions
// ============================================================================

function parseEnum<T extends Record<string, string>>(
  value: string | undefined,
  enumObj: T,
  defaultValue: T[keyof T],
  isTextureClass = false
): T[keyof T] {
  if (!value) return defaultValue;
  const upperValue = value.toUpperCase().replace(/-/g, "_");
  // Handle texture class with TYPE_ prefix
  if (isTextureClass && !upperValue.startsWith("TYPE_") && /^[1-4][A-C]$/.test(value.toUpperCase())) {
    const prefixed = `TYPE_${value.toUpperCase()}`;
    if (Object.values(enumObj).includes(prefixed as T[keyof T])) {
      return prefixed as T[keyof T];
    }
  }
  if (Object.values(enumObj).includes(upperValue as T[keyof T])) {
    return upperValue as T[keyof T];
  }
  return defaultValue;
}

function parseThreeLevel(value: string | undefined): ThreeLevel | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "LOW" || upper === "MEDIUM" || upper === "HIGH") {
    return upper as ThreeLevel;
  }
  return null;
}

function parseLoadFactor(value: string | undefined): LoadFactor | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "LIGHT" || upper === "STANDARD" || upper === "HEAVY") {
    return upper as LoadFactor;
  }
  return null;
}

function formatProfileResponse(profile: NonNullable<Awaited<ReturnType<typeof prisma.hairHealthProfile.findUnique>>>): HairProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    profileVersion: profile.profileVersion,
    textureClass: profile.textureClass.replace("TYPE_", ""),
    patternFamily: profile.patternFamily,
    strandThickness: profile.strandThickness,
    densityLevel: profile.densityLevel,
    shrinkageTendency: profile.shrinkageTendency,
    porosityLevel: profile.porosityLevel,
    retentionRisk: profile.retentionRisk,
    detangleTolerance: profile.detangleTolerance,
    manipulationTolerance: profile.manipulationTolerance,
    tensionSensitivity: profile.tensionSensitivity,
    scalpSensitivity: profile.scalpSensitivity,
    washDayLoadFactor: profile.washDayLoadFactor,
    estimatedWashDayMinutes: profile.estimatedWashDayMinutes,
    routineType: profile.routineType,
    learningNodesUnlocked: profile.learningNodesUnlocked as string[],
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    lastReviewedAt: profile.lastReviewedAt?.toISOString() ?? null,
  };
}

// ============================================================================
// Profile Service
// ============================================================================

export async function getProfile(userId: string): Promise<HairProfileResponse | null> {
  const profile = await prisma.hairHealthProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;
  return formatProfileResponse(profile);
}

export async function createProfile(
  userId: string,
  input: HairProfileCreateInput
): Promise<HairProfileResponse> {
  const profile = await prisma.hairHealthProfile.create({
    data: {
      userId,
      textureClass: parseEnum(input.textureClass, TextureClass, TextureClass.UNKNOWN, true),
      patternFamily: parseEnum(input.patternFamily, PatternFamily, PatternFamily.UNKNOWN),
      strandThickness: parseThreeLevel(input.strandThickness),
      densityLevel: parseThreeLevel(input.densityLevel),
      shrinkageTendency: parseThreeLevel(input.shrinkageTendency),
      porosityLevel: parseThreeLevel(input.porosityLevel),
      detangleTolerance: parseThreeLevel(input.detangleTolerance),
      manipulationTolerance: parseThreeLevel(input.manipulationTolerance),
      tensionSensitivity: parseThreeLevel(input.tensionSensitivity),
      scalpSensitivity: parseThreeLevel(input.scalpSensitivity),
      washDayLoadFactor: parseLoadFactor(input.washDayLoadFactor),
      estimatedWashDayMinutes: input.estimatedWashDayMinutes,
      routineType: parseEnum(input.routineType, RoutineType, RoutineType.UNKNOWN),
    },
  });

  return formatProfileResponse(profile);
}

export async function updateProfile(
  userId: string,
  input: HairProfileUpdateInput
): Promise<HairProfileResponse | null> {
  // Check if profile exists
  const existing = await prisma.hairHealthProfile.findUnique({
    where: { userId },
  });

  if (!existing) return null;

  // Build update data
  const updateData: Parameters<typeof prisma.hairHealthProfile.update>[0]["data"] = {
    updatedAt: new Date(),
  };

  if (input.textureClass !== undefined) {
    updateData.textureClass = parseEnum(input.textureClass, TextureClass, existing.textureClass, true);
  }
  if (input.patternFamily !== undefined) {
    updateData.patternFamily = parseEnum(input.patternFamily, PatternFamily, existing.patternFamily);
  }
  if (input.strandThickness !== undefined) {
    updateData.strandThickness = parseThreeLevel(input.strandThickness);
  }
  if (input.densityLevel !== undefined) {
    updateData.densityLevel = parseThreeLevel(input.densityLevel);
  }
  if (input.shrinkageTendency !== undefined) {
    updateData.shrinkageTendency = parseThreeLevel(input.shrinkageTendency);
  }
  if (input.porosityLevel !== undefined) {
    updateData.porosityLevel = parseThreeLevel(input.porosityLevel);
  }
  if (input.detangleTolerance !== undefined) {
    updateData.detangleTolerance = parseThreeLevel(input.detangleTolerance);
  }
  if (input.manipulationTolerance !== undefined) {
    updateData.manipulationTolerance = parseThreeLevel(input.manipulationTolerance);
  }
  if (input.tensionSensitivity !== undefined) {
    updateData.tensionSensitivity = parseThreeLevel(input.tensionSensitivity);
  }
  if (input.scalpSensitivity !== undefined) {
    updateData.scalpSensitivity = parseThreeLevel(input.scalpSensitivity);
  }
  if (input.washDayLoadFactor !== undefined) {
    updateData.washDayLoadFactor = parseLoadFactor(input.washDayLoadFactor);
  }
  if (input.estimatedWashDayMinutes !== undefined) {
    updateData.estimatedWashDayMinutes = input.estimatedWashDayMinutes;
  }
  if (input.routineType !== undefined) {
    updateData.routineType = parseEnum(input.routineType, RoutineType, existing.routineType);
  }

  const profile = await prisma.hairHealthProfile.update({
    where: { userId },
    data: updateData,
  });

  return formatProfileResponse(profile);
}

export async function deleteProfile(userId: string): Promise<boolean> {
  try {
    await prisma.hairHealthProfile.delete({
      where: { userId },
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Learning Progress
// ============================================================================

export async function unlockLearningNode(
  userId: string,
  nodeId: string
): Promise<string[]> {
  const profile = await prisma.hairHealthProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  const currentNodes = profile.learningNodesUnlocked as string[];
  if (currentNodes.includes(nodeId)) {
    return currentNodes; // Already unlocked
  }

  const updatedNodes = [...currentNodes, nodeId];
  await prisma.hairHealthProfile.update({
    where: { userId },
    data: { learningNodesUnlocked: updatedNodes },
  });

  return updatedNodes;
}

export async function getLearningProgress(userId: string): Promise<string[]> {
  const profile = await prisma.hairHealthProfile.findUnique({
    where: { userId },
    select: { learningNodesUnlocked: true },
  });

  if (!profile) return [];
  return profile.learningNodesUnlocked as string[];
}
