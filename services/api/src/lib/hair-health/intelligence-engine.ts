/**
 * Hair Health Intelligence Engine (V5.0 Phase 5)
 *
 * Rules-based scoring and analysis engine for hair health profiles.
 * Evaluates profiles and generates actionable insights.
 */

import { ThreeLevel } from "@prisma/client";
import type { HairProfileResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface HealthScore {
  overall: number; // 0-100
  categories: {
    hydration: number;
    strength: number;
    scalp: number;
    routine: number;
  };
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface RiskAssessment {
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  score: number; // 0-100 (higher = more risk)
}

export interface RiskFactor {
  id: string;
  category: "BREAKAGE" | "DRYNESS" | "SCALP" | "OVERLOAD" | "TENSION";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  mitigation: string;
}

export interface ProfileAnalysis {
  profileId: string;
  analyzedAt: string;
  healthScore: HealthScore;
  riskAssessment: RiskAssessment;
  archetype: HairArchetype;
  careNeeds: CareNeed[];
  weeklyLoadCapacity: WeeklyLoadCapacity;
}

export interface HairArchetype {
  id: string;
  name: string;
  description: string;
  keyTraits: string[];
  carePriorities: string[];
}

export interface CareNeed {
  category: "MOISTURE" | "PROTEIN" | "REST" | "PROTECTION" | "SCALP_CARE";
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  reasoning: string;
}

export interface WeeklyLoadCapacity {
  maxHeavyDays: number;
  maxMediumDays: number;
  recommendedRestDays: number;
  washDayFrequency: "WEEKLY" | "BI_WEEKLY" | "TRI_WEEKLY" | "MONTHLY";
}

// ============================================================================
// Constants
// ============================================================================

const ARCHETYPES: Record<string, HairArchetype> = {
  RESILIENT_COILY: {
    id: "RESILIENT_COILY",
    name: "Resilient Coily",
    description: "Strong, tightly coiled hair that thrives with moisture and low manipulation.",
    keyTraits: ["High shrinkage", "Coily pattern", "Medium-high density"],
    carePriorities: ["Moisture retention", "Gentle detangling", "Protective styling"],
  },
  DELICATE_FINE: {
    id: "DELICATE_FINE",
    name: "Delicate Fine",
    description: "Fine strands requiring careful handling and light products.",
    keyTraits: ["Fine strand thickness", "Prone to breakage", "Quick to weigh down"],
    carePriorities: ["Protein balance", "Light products", "Minimal tension"],
  },
  BALANCED_WAVY: {
    id: "BALANCED_WAVY",
    name: "Balanced Wavy",
    description: "Versatile wavy texture that maintains well with consistent care.",
    keyTraits: ["S-pattern waves", "Moderate density", "Balanced porosity"],
    carePriorities: ["Definition", "Frizz control", "Hydration balance"],
  },
  HIGH_MAINTENANCE_CURLY: {
    id: "HIGH_MAINTENANCE_CURLY",
    name: "High-Maintenance Curly",
    description: "Curly hair requiring dedicated routine and careful product selection.",
    keyTraits: ["Spiral curls", "High porosity", "Moisture hungry"],
    carePriorities: ["Deep conditioning", "LOC/LCO method", "Sealant layers"],
  },
  LOW_POROSITY_GUARDIAN: {
    id: "LOW_POROSITY_GUARDIAN",
    name: "Low-Porosity Guardian",
    description: "Dense cuticle layer that resists moisture but holds it once absorbed.",
    keyTraits: ["Low porosity", "Product buildup prone", "Heat helps absorption"],
    carePriorities: ["Clarifying", "Light products", "Steam treatments"],
  },
  SENSITIVE_SCALP: {
    id: "SENSITIVE_SCALP",
    name: "Sensitive Scalp",
    description: "Scalp-first approach needed due to sensitivity concerns.",
    keyTraits: ["High scalp sensitivity", "Reactive to products", "Needs gentle formulas"],
    carePriorities: ["Scalp health", "Fragrance-free options", "Minimal ingredients"],
  },
  GROWTH_FOCUSED: {
    id: "GROWTH_FOCUSED",
    name: "Growth Focused",
    description: "Retention-focused routine for maximum length preservation.",
    keyTraits: ["Length retention goal", "Protective styling", "Minimal manipulation"],
    carePriorities: ["Breakage prevention", "Protective styles", "Ends protection"],
  },
  UNKNOWN_EXPLORER: {
    id: "UNKNOWN_EXPLORER",
    name: "Hair Journey Explorer",
    description: "Still discovering your unique hair needs and patterns.",
    keyTraits: ["Learning phase", "Experimenting", "Building knowledge"],
    carePriorities: ["Profile completion", "Pattern identification", "Baseline establishment"],
  },
};

// ============================================================================
// Scoring Functions
// ============================================================================

function levelToScore(level: ThreeLevel | string | null): number {
  switch (level) {
    case "LOW":
      return 30;
    case "MEDIUM":
      return 60;
    case "HIGH":
      return 90;
    default:
      return 50; // Unknown defaults to middle
  }
}

function invertedLevelScore(level: ThreeLevel | string | null): number {
  // For negative traits (sensitivity), invert the score
  switch (level) {
    case "LOW":
      return 90;
    case "MEDIUM":
      return 60;
    case "HIGH":
      return 30;
    default:
      return 50;
  }
}

function calculateHydrationScore(profile: HairProfileResponse): number {
  const porosityScore = levelToScore(profile.porosityLevel as ThreeLevel | null);
  // High porosity = more hydration challenges
  const adjustedPorosity = profile.porosityLevel === "HIGH" ? 40 : porosityScore;

  // Routine matters for hydration
  const routineBonus =
    profile.routineType === "MOISTURE" || profile.routineType === "REPAIR" ? 15 : 0;

  return Math.min(100, Math.max(0, adjustedPorosity + routineBonus));
}

function calculateStrengthScore(profile: HairProfileResponse): number {
  const thicknessScore = levelToScore(profile.strandThickness as ThreeLevel | null);
  const densityScore = levelToScore(profile.densityLevel as ThreeLevel | null);
  const manipulationScore = levelToScore(profile.manipulationTolerance as ThreeLevel | null);

  // Fine hair + low manipulation tolerance = lower strength score
  return Math.round((thicknessScore + densityScore + manipulationScore) / 3);
}

function calculateScalpScore(profile: HairProfileResponse): number {
  // Lower sensitivity = better scalp health score
  return invertedLevelScore(profile.scalpSensitivity as ThreeLevel | null);
}

function calculateRoutineScore(profile: HairProfileResponse): number {
  let score = 50; // Base score

  // Having a specific routine type is good
  if (profile.routineType && profile.routineType !== "UNKNOWN") {
    score += 20;
  }

  // Knowing wash day duration shows awareness
  if (profile.estimatedWashDayMinutes && profile.estimatedWashDayMinutes > 0) {
    score += 15;
  }

  // Having unlocked learning nodes shows engagement
  const nodesUnlocked = profile.learningNodesUnlocked?.length || 0;
  score += Math.min(15, nodesUnlocked * 5);

  return Math.min(100, score);
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// ============================================================================
// Risk Assessment
// ============================================================================

function assessRisks(profile: HairProfileResponse): RiskAssessment {
  const factors: RiskFactor[] = [];

  // Breakage risk
  if (profile.strandThickness === "LOW" || profile.manipulationTolerance === "LOW") {
    factors.push({
      id: "BREAKAGE_FINE_HAIR",
      category: "BREAKAGE",
      severity: profile.strandThickness === "LOW" && profile.manipulationTolerance === "LOW" ? "HIGH" : "MEDIUM",
      description: "Fine or fragile strands are prone to breakage with rough handling.",
      mitigation: "Use wide-tooth combs, detangle gently when wet with conditioner, avoid tight styles.",
    });
  }

  // Dryness risk
  if (profile.porosityLevel === "HIGH") {
    factors.push({
      id: "DRYNESS_HIGH_POROSITY",
      category: "DRYNESS",
      severity: "HIGH",
      description: "High porosity hair loses moisture quickly and needs frequent hydration.",
      mitigation: "Use LOC/LCO method, deep condition regularly, seal with oils or butters.",
    });
  }

  if (profile.shrinkageTendency === "HIGH" && profile.patternFamily === "COILY") {
    factors.push({
      id: "DRYNESS_COILY_SHRINKAGE",
      category: "DRYNESS",
      severity: "MEDIUM",
      description: "High shrinkage coily hair may indicate moisture absorption challenges.",
      mitigation: "Stretch gently when drying, use leave-in conditioners, try greenhouse method.",
    });
  }

  // Scalp risk
  if (profile.scalpSensitivity === "HIGH") {
    factors.push({
      id: "SCALP_SENSITIVITY",
      category: "SCALP",
      severity: "HIGH",
      description: "Sensitive scalp may react to harsh products or techniques.",
      mitigation: "Use fragrance-free products, avoid sulfates, patch test new products.",
    });
  }

  // Overload risk
  if (profile.washDayLoadFactor === "HEAVY" && profile.estimatedWashDayMinutes && profile.estimatedWashDayMinutes > 180) {
    factors.push({
      id: "ROUTINE_OVERLOAD",
      category: "OVERLOAD",
      severity: "MEDIUM",
      description: "Extended wash day routines can lead to fatigue and inconsistency.",
      mitigation: "Consider breaking routine into smaller sessions or simplifying steps.",
    });
  }

  // Tension risk
  if (profile.tensionSensitivity === "HIGH") {
    factors.push({
      id: "TENSION_SENSITIVITY",
      category: "TENSION",
      severity: "HIGH",
      description: "High tension sensitivity increases risk of traction alopecia.",
      mitigation: "Avoid tight ponytails, braids, or extensions. Choose loose protective styles.",
    });
  }

  if (profile.detangleTolerance === "LOW") {
    factors.push({
      id: "DETANGLE_DIFFICULTY",
      category: "TENSION",
      severity: "MEDIUM",
      description: "Low detangle tolerance means tangles cause significant stress.",
      mitigation: "Pre-poo before wash day, section hair, use plenty of slip.",
    });
  }

  // Calculate overall risk score
  const severityScores: Record<string, number> = { LOW: 10, MEDIUM: 25, HIGH: 40 };
  const totalRiskScore = factors.reduce((sum, f) => sum + severityScores[f.severity], 0);
  const normalizedScore = Math.min(100, totalRiskScore);

  let level: RiskAssessment["level"];
  if (normalizedScore >= 80) level = "CRITICAL";
  else if (normalizedScore >= 50) level = "HIGH";
  else if (normalizedScore >= 25) level = "MODERATE";
  else level = "LOW";

  return { level, factors, score: normalizedScore };
}

// ============================================================================
// Archetype Detection
// ============================================================================

function detectArchetype(profile: HairProfileResponse): HairArchetype {
  const {
    patternFamily,
    strandThickness,
    porosityLevel,
    scalpSensitivity,
    routineType,
    shrinkageTendency,
  } = profile;

  // Priority-based archetype detection

  // Sensitive scalp takes priority
  if (scalpSensitivity === "HIGH") {
    return ARCHETYPES.SENSITIVE_SCALP;
  }

  // Growth-focused routine
  if (routineType === "GROWTH") {
    return ARCHETYPES.GROWTH_FOCUSED;
  }

  // Low porosity
  if (porosityLevel === "LOW") {
    return ARCHETYPES.LOW_POROSITY_GUARDIAN;
  }

  // Coily with high shrinkage
  if ((patternFamily === "COILY" || patternFamily === "KINKY") && shrinkageTendency === "HIGH") {
    return ARCHETYPES.RESILIENT_COILY;
  }

  // Fine delicate hair
  if (strandThickness === "LOW") {
    return ARCHETYPES.DELICATE_FINE;
  }

  // High porosity curly
  if (patternFamily === "CURLY" && porosityLevel === "HIGH") {
    return ARCHETYPES.HIGH_MAINTENANCE_CURLY;
  }

  // Wavy pattern
  if (patternFamily === "WAVY") {
    return ARCHETYPES.BALANCED_WAVY;
  }

  // Default for incomplete profiles
  return ARCHETYPES.UNKNOWN_EXPLORER;
}

// ============================================================================
// Care Needs Assessment
// ============================================================================

function assessCareNeeds(profile: HairProfileResponse): CareNeed[] {
  const needs: CareNeed[] = [];

  // Moisture needs
  if (profile.porosityLevel === "HIGH") {
    needs.push({
      category: "MOISTURE",
      level: "CRITICAL",
      reasoning: "High porosity hair loses moisture rapidly and requires constant hydration.",
    });
  } else if (profile.porosityLevel === "MEDIUM") {
    needs.push({
      category: "MOISTURE",
      level: "MODERATE",
      reasoning: "Medium porosity hair maintains good moisture balance with regular care.",
    });
  } else {
    needs.push({
      category: "MOISTURE",
      level: "LOW",
      reasoning: "Low porosity hair retains moisture well once absorbed.",
    });
  }

  // Protein needs (inverse relationship with porosity often)
  if (profile.strandThickness === "LOW" || profile.porosityLevel === "HIGH") {
    needs.push({
      category: "PROTEIN",
      level: profile.strandThickness === "LOW" && profile.porosityLevel === "HIGH" ? "HIGH" : "MODERATE",
      reasoning: "Fine or high-porosity hair benefits from protein to strengthen strand structure.",
    });
  }

  // Rest needs
  if (profile.washDayLoadFactor === "HEAVY" || profile.manipulationTolerance === "LOW") {
    needs.push({
      category: "REST",
      level: profile.manipulationTolerance === "LOW" ? "HIGH" : "MODERATE",
      reasoning: "Low manipulation tolerance or heavy routines require adequate rest periods.",
    });
  }

  // Protection needs
  if (profile.shrinkageTendency === "HIGH" || profile.patternFamily === "COILY" || profile.patternFamily === "KINKY") {
    needs.push({
      category: "PROTECTION",
      level: "HIGH",
      reasoning: "Coily textures with high shrinkage benefit greatly from protective styling.",
    });
  } else if (profile.patternFamily === "CURLY") {
    needs.push({
      category: "PROTECTION",
      level: "MODERATE",
      reasoning: "Curly hair benefits from protective styles during harsh weather or activities.",
    });
  }

  // Scalp care needs
  if (profile.scalpSensitivity === "HIGH") {
    needs.push({
      category: "SCALP_CARE",
      level: "CRITICAL",
      reasoning: "High scalp sensitivity requires gentle, targeted scalp care routines.",
    });
  } else if (profile.scalpSensitivity === "MEDIUM") {
    needs.push({
      category: "SCALP_CARE",
      level: "MODERATE",
      reasoning: "Moderate scalp sensitivity means being mindful of product ingredients.",
    });
  }

  return needs;
}

// ============================================================================
// Weekly Load Capacity
// ============================================================================

function calculateWeeklyLoadCapacity(profile: HairProfileResponse): WeeklyLoadCapacity {
  let maxHeavyDays = 2;
  let maxMediumDays = 3;
  let recommendedRestDays = 2;
  let washDayFrequency: WeeklyLoadCapacity["washDayFrequency"] = "WEEKLY";

  // Adjust based on manipulation tolerance
  if (profile.manipulationTolerance === "LOW") {
    maxHeavyDays = 1;
    maxMediumDays = 2;
    recommendedRestDays = 4;
  } else if (profile.manipulationTolerance === "HIGH") {
    maxHeavyDays = 3;
    maxMediumDays = 4;
    recommendedRestDays = 1;
  }

  // Adjust based on wash day load factor
  if (profile.washDayLoadFactor === "HEAVY") {
    recommendedRestDays = Math.max(recommendedRestDays, 3);
    washDayFrequency = "BI_WEEKLY";
  } else if (profile.washDayLoadFactor === "LIGHT") {
    washDayFrequency = "WEEKLY";
  }

  // Coily/kinky textures often do better with less frequent washing
  if (profile.patternFamily === "COILY" || profile.patternFamily === "KINKY") {
    washDayFrequency = profile.porosityLevel === "HIGH" ? "WEEKLY" : "BI_WEEKLY";
  }

  // Adjust for tension sensitivity
  if (profile.tensionSensitivity === "HIGH") {
    maxHeavyDays = Math.max(0, maxHeavyDays - 1);
    recommendedRestDays = Math.min(5, recommendedRestDays + 1);
  }

  return {
    maxHeavyDays,
    maxMediumDays,
    recommendedRestDays,
    washDayFrequency,
  };
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze a hair health profile and generate comprehensive insights
 */
export function analyzeProfile(profile: HairProfileResponse): ProfileAnalysis {
  // Calculate health scores
  const hydrationScore = calculateHydrationScore(profile);
  const strengthScore = calculateStrengthScore(profile);
  const scalpScore = calculateScalpScore(profile);
  const routineScore = calculateRoutineScore(profile);

  const overallScore = Math.round(
    (hydrationScore * 0.3 + strengthScore * 0.25 + scalpScore * 0.2 + routineScore * 0.25)
  );

  const healthScore: HealthScore = {
    overall: overallScore,
    categories: {
      hydration: hydrationScore,
      strength: strengthScore,
      scalp: scalpScore,
      routine: routineScore,
    },
    grade: scoreToGrade(overallScore),
  };

  // Assess risks
  const riskAssessment = assessRisks(profile);

  // Detect archetype
  const archetype = detectArchetype(profile);

  // Assess care needs
  const careNeeds = assessCareNeeds(profile);

  // Calculate weekly load capacity
  const weeklyLoadCapacity = calculateWeeklyLoadCapacity(profile);

  return {
    profileId: profile.id,
    analyzedAt: new Date().toISOString(),
    healthScore,
    riskAssessment,
    archetype,
    careNeeds,
    weeklyLoadCapacity,
  };
}

/**
 * Get a quick health score without full analysis
 */
export function getQuickHealthScore(profile: HairProfileResponse): HealthScore {
  const hydrationScore = calculateHydrationScore(profile);
  const strengthScore = calculateStrengthScore(profile);
  const scalpScore = calculateScalpScore(profile);
  const routineScore = calculateRoutineScore(profile);

  const overallScore = Math.round(
    (hydrationScore * 0.3 + strengthScore * 0.25 + scalpScore * 0.2 + routineScore * 0.25)
  );

  return {
    overall: overallScore,
    categories: {
      hydration: hydrationScore,
      strength: strengthScore,
      scalp: scalpScore,
      routine: routineScore,
    },
    grade: scoreToGrade(overallScore),
  };
}

/**
 * Get archetype for a profile
 */
export function getArchetype(profile: HairProfileResponse): HairArchetype {
  return detectArchetype(profile);
}

/**
 * Get all available archetypes
 */
export function getAllArchetypes(): HairArchetype[] {
  return Object.values(ARCHETYPES);
}
