/**
 * Ritual Generation Engine (V6.9.0)
 *
 * Generates personalized ritual recommendations based on hair profile
 * characteristics. Creates weekly ritual schedules that balance load
 * and optimize hair health.
 */

import type { HairProfileResponse, RitualResponse, RitualStepResponse } from "./types";
import { analyzeProfile, type WeeklyLoadCapacity, type CareNeed } from "./intelligence-engine";

// ============================================================================
// Types
// ============================================================================

export interface RitualTemplate {
  id: string;
  name: string;
  ritualType: RitualType;
  description: string;
  loadLevel: "LIGHT" | "STANDARD" | "HEAVY";
  defaultDurationMinutes: number;
  frequency: RitualFrequency;
  steps: RitualTemplateStep[];
  /** Profile criteria for recommendation */
  criteria: RitualCriteria;
}

export interface RitualTemplateStep {
  stepType: string;
  name: string;
  estimatedMinutes: number;
  optional: boolean;
  notes?: string;
}

export interface RitualCriteria {
  /** Required texture classes (if empty, applies to all) */
  textureClasses?: string[];
  /** Required pattern families */
  patternFamilies?: string[];
  /** Porosity levels this ritual helps */
  porosityLevels?: string[];
  /** Care needs this ritual addresses */
  careNeeds?: CareNeed["category"][];
  /** Minimum health score to recommend */
  minHealthScore?: number;
  /** Maximum health score (for recovery rituals) */
  maxHealthScore?: number;
}

export type RitualType =
  | "WASH_DAY"
  | "DEEP_CONDITION"
  | "PROTEIN_TREATMENT"
  | "SCALP_TREATMENT"
  | "MOISTURE_REFRESH"
  | "DETANGLE"
  | "PROTECTIVE_STYLE"
  | "STYLE_REFRESH"
  | "HOT_OIL";

export type RitualFrequency =
  | "DAILY"
  | "EVERY_OTHER_DAY"
  | "TWICE_WEEKLY"
  | "WEEKLY"
  | "BI_WEEKLY"
  | "MONTHLY";

export interface GeneratedRitualPlan {
  recommendations: RitualRecommendation[];
  weeklySchedule: WeeklyRitualSlot[];
  loadSummary: {
    totalWeeklyLoad: number;
    maxCapacity: number;
    balance: "UNDER" | "OPTIMAL" | "OVER";
  };
  reasoning: string[];
}

export interface RitualRecommendation {
  template: RitualTemplate;
  priority: "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  reasoning: string;
  suggestedDayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  suggestedFrequency: RitualFrequency;
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

// ============================================================================
// Ritual Template Library
// ============================================================================

const RITUAL_TEMPLATES: RitualTemplate[] = [
  // ========================
  // WASH DAY RITUALS
  // ========================
  {
    id: "wash-day-full-coily",
    name: "Full Wash Day (Coily)",
    ritualType: "WASH_DAY",
    description: "Complete wash day routine for coily textures with detangle and deep condition",
    loadLevel: "HEAVY",
    defaultDurationMinutes: 180,
    frequency: "WEEKLY",
    steps: [
      { stepType: "PRE_POO", name: "Pre-poo oil treatment", estimatedMinutes: 30, optional: false },
      { stepType: "DETANGLE", name: "Gentle detangle with conditioner", estimatedMinutes: 30, optional: false },
      { stepType: "SHAMPOO", name: "Sulfate-free cleanse", estimatedMinutes: 10, optional: false },
      { stepType: "DEEP_CONDITION", name: "Deep conditioning with heat cap", estimatedMinutes: 45, optional: false },
      { stepType: "LEAVE_IN", name: "Leave-in conditioner application", estimatedMinutes: 10, optional: false },
      { stepType: "STYLE", name: "LOC/LCO method styling", estimatedMinutes: 30, optional: false },
      { stepType: "DRY", name: "Air dry or diffuse", estimatedMinutes: 25, optional: false },
    ],
    criteria: {
      patternFamilies: ["COILY", "KINKY"],
      careNeeds: ["MOISTURE", "PROTECTION"],
    },
  },
  {
    id: "wash-day-full-curly",
    name: "Full Wash Day (Curly)",
    ritualType: "WASH_DAY",
    description: "Complete wash day for curly textures with emphasis on definition",
    loadLevel: "HEAVY",
    defaultDurationMinutes: 120,
    frequency: "WEEKLY",
    steps: [
      { stepType: "SHAMPOO", name: "Gentle cleanse", estimatedMinutes: 10, optional: false },
      { stepType: "CONDITION", name: "Rinse-out conditioner", estimatedMinutes: 10, optional: false },
      { stepType: "DETANGLE", name: "Wide-tooth comb detangle", estimatedMinutes: 15, optional: false },
      { stepType: "DEEP_CONDITION", name: "Deep conditioner (15-20 min)", estimatedMinutes: 25, optional: false },
      { stepType: "STYLE", name: "Curl cream and gel application", estimatedMinutes: 20, optional: false },
      { stepType: "DRY", name: "Diffuse or air dry", estimatedMinutes: 40, optional: false },
    ],
    criteria: {
      patternFamilies: ["CURLY"],
      careNeeds: ["MOISTURE"],
    },
  },
  {
    id: "wash-day-wavy",
    name: "Wash Day (Wavy)",
    ritualType: "WASH_DAY",
    description: "Lightweight wash day for wavy textures",
    loadLevel: "STANDARD",
    defaultDurationMinutes: 60,
    frequency: "TWICE_WEEKLY",
    steps: [
      { stepType: "SHAMPOO", name: "Clarifying or gentle shampoo", estimatedMinutes: 5, optional: false },
      { stepType: "CONDITION", name: "Lightweight conditioner", estimatedMinutes: 5, optional: false },
      { stepType: "STYLE", name: "Mousse or light gel", estimatedMinutes: 10, optional: false },
      { stepType: "DRY", name: "Air dry or scrunch dry", estimatedMinutes: 40, optional: false },
    ],
    criteria: {
      patternFamilies: ["WAVY", "STRAIGHT"],
    },
  },
  {
    id: "cowash-refresh",
    name: "Co-wash Refresh",
    ritualType: "WASH_DAY",
    description: "Quick co-wash for mid-week refresh",
    loadLevel: "LIGHT",
    defaultDurationMinutes: 30,
    frequency: "WEEKLY",
    steps: [
      { stepType: "COWASH", name: "Cleansing conditioner", estimatedMinutes: 10, optional: false },
      { stepType: "DETANGLE", name: "Finger detangle", estimatedMinutes: 10, optional: false },
      { stepType: "LEAVE_IN", name: "Light leave-in", estimatedMinutes: 5, optional: false },
      { stepType: "REFRESH", name: "Refresh curls", estimatedMinutes: 5, optional: false },
    ],
    criteria: {
      patternFamilies: ["CURLY", "COILY"],
      porosityLevels: ["HIGH", "MEDIUM"],
    },
  },

  // ========================
  // DEEP CONDITIONING
  // ========================
  {
    id: "deep-condition-moisture",
    name: "Deep Moisture Treatment",
    ritualType: "DEEP_CONDITION",
    description: "Intensive moisture treatment for dry, thirsty hair",
    loadLevel: "STANDARD",
    defaultDurationMinutes: 45,
    frequency: "WEEKLY",
    steps: [
      { stepType: "PREP", name: "Dampen hair", estimatedMinutes: 5, optional: false },
      { stepType: "APPLY", name: "Apply deep conditioner generously", estimatedMinutes: 10, optional: false },
      { stepType: "HEAT", name: "Heat cap or plastic cap treatment", estimatedMinutes: 20, optional: false },
      { stepType: "RINSE", name: "Cool water rinse", estimatedMinutes: 10, optional: false },
    ],
    criteria: {
      porosityLevels: ["HIGH"],
      careNeeds: ["MOISTURE"],
    },
  },
  {
    id: "deep-condition-low-porosity",
    name: "Steam Deep Condition",
    ritualType: "DEEP_CONDITION",
    description: "Heat-assisted deep conditioning for low porosity hair",
    loadLevel: "STANDARD",
    defaultDurationMinutes: 60,
    frequency: "BI_WEEKLY",
    steps: [
      { stepType: "CLARIFY", name: "Light clarifying rinse", estimatedMinutes: 5, optional: true },
      { stepType: "APPLY", name: "Apply lightweight deep conditioner", estimatedMinutes: 10, optional: false },
      { stepType: "STEAM", name: "Steamer or hot towel treatment", estimatedMinutes: 30, optional: false },
      { stepType: "RINSE", name: "Cool water rinse", estimatedMinutes: 10, optional: false },
      { stepType: "SEAL", name: "Light oil to seal", estimatedMinutes: 5, optional: false },
    ],
    criteria: {
      porosityLevels: ["LOW"],
    },
  },

  // ========================
  // PROTEIN TREATMENTS
  // ========================
  {
    id: "protein-treatment-light",
    name: "Light Protein Treatment",
    ritualType: "PROTEIN_TREATMENT",
    description: "Gentle protein boost for maintaining strength",
    loadLevel: "STANDARD",
    defaultDurationMinutes: 30,
    frequency: "BI_WEEKLY",
    steps: [
      { stepType: "APPLY", name: "Apply protein treatment", estimatedMinutes: 5, optional: false },
      { stepType: "WAIT", name: "Process time", estimatedMinutes: 15, optional: false },
      { stepType: "RINSE", name: "Rinse thoroughly", estimatedMinutes: 5, optional: false },
      { stepType: "CONDITION", name: "Follow with moisturizing conditioner", estimatedMinutes: 5, optional: false },
    ],
    criteria: {
      careNeeds: ["PROTEIN"],
    },
  },
  {
    id: "protein-treatment-intensive",
    name: "Intensive Protein Reconstructor",
    ritualType: "PROTEIN_TREATMENT",
    description: "Strong protein treatment for damaged or high-porosity hair",
    loadLevel: "HEAVY",
    defaultDurationMinutes: 60,
    frequency: "MONTHLY",
    steps: [
      { stepType: "SHAMPOO", name: "Clarifying shampoo", estimatedMinutes: 5, optional: false },
      { stepType: "APPLY", name: "Apply reconstructor treatment", estimatedMinutes: 10, optional: false },
      { stepType: "HEAT", name: "Process with heat", estimatedMinutes: 20, optional: false },
      { stepType: "RINSE", name: "Rinse completely", estimatedMinutes: 5, optional: false },
      { stepType: "DEEP_CONDITION", name: "Deep moisture treatment", estimatedMinutes: 20, optional: false },
    ],
    criteria: {
      porosityLevels: ["HIGH"],
      careNeeds: ["PROTEIN"],
      maxHealthScore: 60,
    },
  },

  // ========================
  // SCALP TREATMENTS
  // ========================
  {
    id: "scalp-treatment-sensitive",
    name: "Gentle Scalp Treatment",
    ritualType: "SCALP_TREATMENT",
    description: "Soothing treatment for sensitive scalps",
    loadLevel: "LIGHT",
    defaultDurationMinutes: 20,
    frequency: "WEEKLY",
    steps: [
      { stepType: "OIL", name: "Apply scalp oil", estimatedMinutes: 5, optional: false },
      { stepType: "MASSAGE", name: "Gentle scalp massage", estimatedMinutes: 10, optional: false },
      { stepType: "REST", name: "Leave in or rinse", estimatedMinutes: 5, optional: true },
    ],
    criteria: {
      careNeeds: ["SCALP_CARE"],
    },
  },
  {
    id: "scalp-detox",
    name: "Scalp Detox Treatment",
    ritualType: "SCALP_TREATMENT",
    description: "Clarifying treatment to remove buildup",
    loadLevel: "STANDARD",
    defaultDurationMinutes: 30,
    frequency: "MONTHLY",
    steps: [
      { stepType: "APPLY", name: "Apply scalp scrub or ACV rinse", estimatedMinutes: 5, optional: false },
      { stepType: "MASSAGE", name: "Massage into scalp", estimatedMinutes: 10, optional: false },
      { stepType: "RINSE", name: "Rinse thoroughly", estimatedMinutes: 5, optional: false },
      { stepType: "CONDITION", name: "Follow with conditioner", estimatedMinutes: 10, optional: false },
    ],
    criteria: {
      porosityLevels: ["LOW"],
    },
  },

  // ========================
  // MOISTURE REFRESH
  // ========================
  {
    id: "moisture-refresh-daily",
    name: "Daily Moisture Refresh",
    ritualType: "MOISTURE_REFRESH",
    description: "Quick daily hydration boost",
    loadLevel: "LIGHT",
    defaultDurationMinutes: 10,
    frequency: "DAILY",
    steps: [
      { stepType: "SPRAY", name: "Water or leave-in spray", estimatedMinutes: 3, optional: false },
      { stepType: "SEAL", name: "Light oil to seal", estimatedMinutes: 3, optional: false },
      { stepType: "STYLE", name: "Finger coil or smooth", estimatedMinutes: 4, optional: true },
    ],
    criteria: {
      porosityLevels: ["HIGH"],
      careNeeds: ["MOISTURE"],
    },
  },
  {
    id: "refresh-style",
    name: "Style Refresh",
    ritualType: "STYLE_REFRESH",
    description: "Revive second or third day curls",
    loadLevel: "LIGHT",
    defaultDurationMinutes: 15,
    frequency: "EVERY_OTHER_DAY",
    steps: [
      { stepType: "SPRAY", name: "Dampen with water spray", estimatedMinutes: 3, optional: false },
      { stepType: "APPLY", name: "Light curl refresher", estimatedMinutes: 5, optional: false },
      { stepType: "SCRUNCH", name: "Scrunch and reshape", estimatedMinutes: 5, optional: false },
      { stepType: "DRY", name: "Air dry or diffuse", estimatedMinutes: 2, optional: true },
    ],
    criteria: {
      patternFamilies: ["CURLY", "WAVY"],
    },
  },

  // ========================
  // HOT OIL TREATMENTS
  // ========================
  {
    id: "hot-oil-treatment",
    name: "Hot Oil Treatment",
    ritualType: "HOT_OIL",
    description: "Pre-wash oil treatment for moisture and shine",
    loadLevel: "STANDARD",
    defaultDurationMinutes: 45,
    frequency: "WEEKLY",
    steps: [
      { stepType: "WARM", name: "Warm oil blend", estimatedMinutes: 5, optional: false },
      { stepType: "APPLY", name: "Apply to scalp and lengths", estimatedMinutes: 10, optional: false },
      { stepType: "WRAP", name: "Cover with cap and warm towel", estimatedMinutes: 25, optional: false },
      { stepType: "RINSE", name: "Shampoo out", estimatedMinutes: 5, optional: false },
    ],
    criteria: {
      careNeeds: ["MOISTURE"],
      patternFamilies: ["COILY", "CURLY"],
    },
  },

  // ========================
  // PROTECTIVE STYLING
  // ========================
  {
    id: "protective-style-prep",
    name: "Protective Style Prep",
    ritualType: "PROTECTIVE_STYLE",
    description: "Prep routine before installing protective style",
    loadLevel: "HEAVY",
    defaultDurationMinutes: 120,
    frequency: "MONTHLY",
    steps: [
      { stepType: "CLARIFY", name: "Clarifying shampoo", estimatedMinutes: 10, optional: false },
      { stepType: "DEEP_CONDITION", name: "Protein and moisture treatment", estimatedMinutes: 30, optional: false },
      { stepType: "DETANGLE", name: "Thorough detangle", estimatedMinutes: 30, optional: false },
      { stepType: "LEAVE_IN", name: "Leave-in and oil seal", estimatedMinutes: 15, optional: false },
      { stepType: "DRY", name: "Stretch and dry", estimatedMinutes: 35, optional: false },
    ],
    criteria: {
      patternFamilies: ["COILY", "KINKY", "CURLY"],
      careNeeds: ["PROTECTION"],
    },
  },

  // ========================
  // DETANGLE
  // ========================
  {
    id: "gentle-detangle",
    name: "Gentle Detangle Session",
    ritualType: "DETANGLE",
    description: "Low-manipulation detangle for fragile hair",
    loadLevel: "LIGHT",
    defaultDurationMinutes: 30,
    frequency: "WEEKLY",
    steps: [
      { stepType: "PREP", name: "Dampen with water and conditioner", estimatedMinutes: 5, optional: false },
      { stepType: "SECTION", name: "Section hair", estimatedMinutes: 5, optional: false },
      { stepType: "DETANGLE", name: "Finger detangle each section", estimatedMinutes: 15, optional: false },
      { stepType: "TWIST", name: "Twist or braid sections", estimatedMinutes: 5, optional: true },
    ],
    criteria: {
      careNeeds: ["REST"],
    },
  },
];

// ============================================================================
// Load Level Scores
// ============================================================================

const LOAD_SCORES: Record<string, number> = {
  LIGHT: 15,
  STANDARD: 35,
  HEAVY: 60,
};

// ============================================================================
// Core Generation Functions
// ============================================================================

/**
 * Match rituals to a profile based on criteria
 */
function matchRitualsToProfile(
  profile: HairProfileResponse,
  careNeeds: CareNeed[]
): RitualRecommendation[] {
  const recommendations: RitualRecommendation[] = [];
  const analysis = analyzeProfile(profile);
  const healthScore = analysis.healthScore.overall;

  for (const template of RITUAL_TEMPLATES) {
    const { criteria } = template;
    let matches = true;
    let priority: RitualRecommendation["priority"] = "OPTIONAL";
    let reasoning = "";

    // Check texture class
    if (criteria.textureClasses && criteria.textureClasses.length > 0) {
      if (!criteria.textureClasses.includes(profile.textureClass)) {
        matches = false;
      }
    }

    // Check pattern family
    if (criteria.patternFamilies && criteria.patternFamilies.length > 0) {
      if (!criteria.patternFamilies.includes(profile.patternFamily)) {
        matches = false;
      } else {
        reasoning += `Designed for ${profile.patternFamily.toLowerCase()} textures. `;
      }
    }

    // Check porosity
    if (criteria.porosityLevels && criteria.porosityLevels.length > 0) {
      if (profile.porosityLevel && criteria.porosityLevels.includes(profile.porosityLevel)) {
        reasoning += `Optimized for ${profile.porosityLevel.toLowerCase()} porosity. `;
        priority = "RECOMMENDED";
      } else if (!profile.porosityLevel) {
        // Unknown porosity - still recommend but lower priority
      } else {
        matches = false;
      }
    }

    // Check care needs match
    if (criteria.careNeeds && criteria.careNeeds.length > 0) {
      const profileNeedCategories = careNeeds.map((n) => n.category);
      const matchingNeeds = criteria.careNeeds.filter((c) => profileNeedCategories.includes(c));

      if (matchingNeeds.length > 0) {
        const criticalNeeds = careNeeds.filter(
          (n) => matchingNeeds.includes(n.category) && (n.level === "CRITICAL" || n.level === "HIGH")
        );

        if (criticalNeeds.length > 0) {
          priority = "ESSENTIAL";
          reasoning += `Addresses critical ${criticalNeeds[0].category.toLowerCase().replace("_", " ")} needs. `;
        } else {
          priority = priority === "OPTIONAL" ? "RECOMMENDED" : priority;
          reasoning += `Supports ${matchingNeeds[0].toLowerCase().replace("_", " ")} care. `;
        }
      }
    }

    // Check health score requirements
    if (criteria.minHealthScore !== undefined && healthScore < criteria.minHealthScore) {
      matches = false;
    }
    if (criteria.maxHealthScore !== undefined && healthScore > criteria.maxHealthScore) {
      matches = false;
    } else if (criteria.maxHealthScore !== undefined) {
      priority = "ESSENTIAL";
      reasoning += `Recovery treatment for damaged hair. `;
    }

    if (matches) {
      recommendations.push({
        template,
        priority,
        reasoning: reasoning.trim() || `General ${template.ritualType.toLowerCase().replace("_", " ")} routine.`,
        suggestedFrequency: template.frequency,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { ESSENTIAL: 0, RECOMMENDED: 1, OPTIONAL: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Generate a weekly schedule from recommendations
 */
function generateWeeklySchedule(
  recommendations: RitualRecommendation[],
  loadCapacity: WeeklyLoadCapacity
): WeeklyRitualSlot[] {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Initialize empty schedule
  const schedule: WeeklyRitualSlot[] = dayNames.map((name, i) => ({
    dayOfWeek: i,
    dayName: name,
    rituals: [],
    totalLoad: 0,
    isRestDay: false,
  }));

  // Track heavy and medium days used
  let heavyDaysUsed = 0;
  let mediumDaysUsed = 0;

  // Assign essential rituals first
  const essentialRituals = recommendations.filter((r) => r.priority === "ESSENTIAL");
  const recommendedRituals = recommendations.filter((r) => r.priority === "RECOMMENDED");

  // Try to place wash day on weekends (Saturday or Sunday)
  const washDayRitual = essentialRituals.find((r) => r.template.ritualType === "WASH_DAY") ||
    recommendedRituals.find((r) => r.template.ritualType === "WASH_DAY");

  if (washDayRitual) {
    // Prefer Saturday for wash day
    const washDaySlot = schedule[6]; // Saturday
    washDaySlot.rituals.push({
      templateId: washDayRitual.template.id,
      name: washDayRitual.template.name,
      loadLevel: washDayRitual.template.loadLevel,
      estimatedMinutes: washDayRitual.template.defaultDurationMinutes,
      timeOfDay: "MORNING",
    });
    washDaySlot.totalLoad += LOAD_SCORES[washDayRitual.template.loadLevel];

    if (washDayRitual.template.loadLevel === "HEAVY") {
      heavyDaysUsed++;
      // Mark Sunday as rest day after heavy wash day
      schedule[0].isRestDay = true;
    } else if (washDayRitual.template.loadLevel === "STANDARD") {
      mediumDaysUsed++;
    }
  }

  // Place protein treatment mid-week if recommended (Wednesday)
  const proteinRitual = essentialRituals.find((r) => r.template.ritualType === "PROTEIN_TREATMENT") ||
    recommendedRituals.find((r) => r.template.ritualType === "PROTEIN_TREATMENT");

  if (proteinRitual && proteinRitual.suggestedFrequency !== "MONTHLY") {
    if (heavyDaysUsed < loadCapacity.maxHeavyDays || proteinRitual.template.loadLevel !== "HEAVY") {
      const proteinSlot = schedule[3]; // Wednesday
      proteinSlot.rituals.push({
        templateId: proteinRitual.template.id,
        name: proteinRitual.template.name,
        loadLevel: proteinRitual.template.loadLevel,
        estimatedMinutes: proteinRitual.template.defaultDurationMinutes,
        timeOfDay: "EVENING",
      });
      proteinSlot.totalLoad += LOAD_SCORES[proteinRitual.template.loadLevel];

      if (proteinRitual.template.loadLevel === "HEAVY") heavyDaysUsed++;
      else if (proteinRitual.template.loadLevel === "STANDARD") mediumDaysUsed++;
    }
  }

  // Add scalp treatment on Monday evening
  const scalpRitual = recommendations.find((r) => r.template.ritualType === "SCALP_TREATMENT");
  if (scalpRitual) {
    const scalpSlot = schedule[1]; // Monday
    scalpSlot.rituals.push({
      templateId: scalpRitual.template.id,
      name: scalpRitual.template.name,
      loadLevel: scalpRitual.template.loadLevel,
      estimatedMinutes: scalpRitual.template.defaultDurationMinutes,
      timeOfDay: "EVENING",
    });
    scalpSlot.totalLoad += LOAD_SCORES[scalpRitual.template.loadLevel];
  }

  // Add moisture refresh on days without other rituals
  const moistureRefresh = recommendations.find(
    (r) => r.template.ritualType === "MOISTURE_REFRESH" || r.template.ritualType === "STYLE_REFRESH"
  );
  if (moistureRefresh && moistureRefresh.suggestedFrequency !== "WEEKLY") {
    // Add to Tuesday, Thursday, Friday if they're empty
    for (const dayIndex of [2, 4, 5]) {
      if (schedule[dayIndex].rituals.length === 0 && !schedule[dayIndex].isRestDay) {
        schedule[dayIndex].rituals.push({
          templateId: moistureRefresh.template.id,
          name: moistureRefresh.template.name,
          loadLevel: moistureRefresh.template.loadLevel,
          estimatedMinutes: moistureRefresh.template.defaultDurationMinutes,
          timeOfDay: "MORNING",
        });
        schedule[dayIndex].totalLoad += LOAD_SCORES[moistureRefresh.template.loadLevel];
      }
    }
  }

  // Ensure minimum rest days
  const activeDays = schedule.filter((s) => s.rituals.length > 0).length;
  const currentRestDays = 7 - activeDays;

  if (currentRestDays < loadCapacity.recommendedRestDays) {
    // Mark low-load days as optional rest
    const lowLoadDays = schedule
      .filter((s) => !s.isRestDay && s.totalLoad <= 15)
      .sort((a, b) => a.totalLoad - b.totalLoad);

    for (let i = 0; i < loadCapacity.recommendedRestDays - currentRestDays && i < lowLoadDays.length; i++) {
      lowLoadDays[i].isRestDay = true;
    }
  }

  return schedule;
}

/**
 * Calculate load summary for a schedule
 */
function calculateLoadSummary(
  schedule: WeeklyRitualSlot[],
  loadCapacity: WeeklyLoadCapacity
): GeneratedRitualPlan["loadSummary"] {
  const totalWeeklyLoad = schedule.reduce((sum, day) => sum + day.totalLoad, 0);
  const maxCapacity = loadCapacity.maxHeavyDays * 60 + loadCapacity.maxMediumDays * 35;

  let balance: "UNDER" | "OPTIMAL" | "OVER";
  if (totalWeeklyLoad > maxCapacity) {
    balance = "OVER";
  } else if (totalWeeklyLoad >= maxCapacity * 0.6) {
    balance = "OPTIMAL";
  } else {
    balance = "UNDER";
  }

  return {
    totalWeeklyLoad,
    maxCapacity,
    balance,
  };
}

/**
 * Generate reasoning for the plan
 */
function generateReasoning(
  profile: HairProfileResponse,
  recommendations: RitualRecommendation[],
  loadSummary: GeneratedRitualPlan["loadSummary"]
): string[] {
  const reasons: string[] = [];

  // Profile-based reasoning
  if (profile.patternFamily === "COILY" || profile.patternFamily === "KINKY") {
    reasons.push("Coily textures thrive with regular moisture and minimal manipulation.");
  } else if (profile.patternFamily === "CURLY") {
    reasons.push("Curly hair benefits from balanced protein and moisture routines.");
  } else if (profile.patternFamily === "WAVY") {
    reasons.push("Wavy textures do well with lightweight products and regular clarifying.");
  }

  if (profile.porosityLevel === "HIGH") {
    reasons.push("High porosity requires frequent sealing to retain moisture.");
  } else if (profile.porosityLevel === "LOW") {
    reasons.push("Low porosity benefits from heat during conditioning to open cuticles.");
  }

  // Essential ritual reasoning
  const essentialCount = recommendations.filter((r) => r.priority === "ESSENTIAL").length;
  if (essentialCount > 0) {
    reasons.push(`${essentialCount} essential ritual(s) address your hair's critical needs.`);
  }

  // Load balance reasoning
  if (loadSummary.balance === "OPTIMAL") {
    reasons.push("Your weekly load is well balanced for your hair's tolerance.");
  } else if (loadSummary.balance === "OVER") {
    reasons.push("Consider spreading heavy rituals across more days or simplifying some steps.");
  } else {
    reasons.push("You have room for additional treatments if needed.");
  }

  return reasons;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Generate a complete ritual plan for a user based on their profile
 */
export function generateRitualPlan(profile: HairProfileResponse): GeneratedRitualPlan {
  const analysis = analyzeProfile(profile);
  const recommendations = matchRitualsToProfile(profile, analysis.careNeeds);
  const weeklySchedule = generateWeeklySchedule(recommendations, analysis.weeklyLoadCapacity);
  const loadSummary = calculateLoadSummary(weeklySchedule, analysis.weeklyLoadCapacity);
  const reasoning = generateReasoning(profile, recommendations, loadSummary);

  return {
    recommendations,
    weeklySchedule,
    loadSummary,
    reasoning,
  };
}

/**
 * Get a single recommended ritual for a specific need
 */
export function getRecommendedRitual(
  profile: HairProfileResponse,
  ritualType: RitualType
): RitualRecommendation | null {
  const analysis = analyzeProfile(profile);
  const recommendations = matchRitualsToProfile(profile, analysis.careNeeds);

  return recommendations.find((r) => r.template.ritualType === ritualType) || null;
}

/**
 * Get all available ritual templates
 */
export function getAllRitualTemplates(): RitualTemplate[] {
  return [...RITUAL_TEMPLATES];
}

/**
 * Get a ritual template by ID
 */
export function getRitualTemplateById(id: string): RitualTemplate | undefined {
  return RITUAL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Convert a ritual template to a RitualResponse format for API
 */
export function templateToRitualResponse(template: RitualTemplate): Omit<RitualResponse, "id" | "createdAt" | "updatedAt"> {
  return {
    userId: null,
    ritualType: template.ritualType,
    name: template.name,
    description: template.description,
    defaultDurationMinutes: template.defaultDurationMinutes,
    loadLevel: template.loadLevel,
    isTemplate: true,
    steps: template.steps.map((step, index): RitualStepResponse => ({
      id: `${template.id}-step-${index}`,
      stepOrder: index + 1,
      stepType: step.stepType,
      name: step.name,
      estimatedMinutes: step.estimatedMinutes,
      optional: step.optional,
      notes: step.notes || null,
    })),
  };
}
