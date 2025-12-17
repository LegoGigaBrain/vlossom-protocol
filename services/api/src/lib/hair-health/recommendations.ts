/**
 * Hair Health Recommendations Service (V5.0 Phase 5)
 *
 * Generates personalized care recommendations based on profile analysis.
 * Provides actionable guidance for hair health improvement.
 */

import type { HairProfileResponse } from "./types";
import {
  analyzeProfile,
  type ProfileAnalysis,
  type CareNeed,
  type RiskFactor,
} from "./intelligence-engine";

// ============================================================================
// Types
// ============================================================================

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  title: string;
  description: string;
  actionItems: string[];
  relatedInsights?: string[];
  productSuggestions?: ProductSuggestion[];
  frequency?: string;
  estimatedImpact: "LOW" | "MEDIUM" | "HIGH";
}

export type RecommendationCategory =
  | "WASH_DAY"
  | "STYLING"
  | "PROTECTION"
  | "SCALP"
  | "PRODUCTS"
  | "ROUTINE"
  | "REST"
  | "LEARNING";

export interface ProductSuggestion {
  type: string;
  characteristics: string[];
  avoid?: string[];
}

export interface RecommendationSet {
  profileId: string;
  generatedAt: string;
  recommendations: Recommendation[];
  weeklyFocus: WeeklyFocus;
  quickWins: string[];
}

export interface WeeklyFocus {
  theme: string;
  description: string;
  targetArea: CareNeed["category"];
}

// ============================================================================
// Recommendation Templates
// ============================================================================

const MOISTURE_RECOMMENDATIONS: Partial<Recommendation>[] = [
  {
    id: "MOISTURE_DEEP_CONDITION",
    title: "Weekly Deep Conditioning",
    description: "Intense moisture treatment to replenish and seal hydration.",
    actionItems: [
      "Apply deep conditioner to clean, damp hair",
      "Use heat cap or steamer for 15-30 minutes",
      "Rinse with cool water to seal cuticle",
    ],
    frequency: "Weekly",
    productSuggestions: [
      {
        type: "Deep Conditioner",
        characteristics: ["Humectant-rich", "Contains glycerin or honey", "Slip for detangling"],
        avoid: ["Protein-heavy if hair is protein-sensitive"],
      },
    ],
  },
  {
    id: "MOISTURE_LOC_METHOD",
    title: "LOC/LCO Layering Method",
    description: "Layer products strategically to lock in moisture.",
    actionItems: [
      "Start with liquid (water or leave-in)",
      "Apply oil to seal moisture",
      "Finish with cream to lock everything in",
      "Adjust order (LCO) if hair prefers cream before oil",
    ],
    frequency: "Every wash day",
  },
  {
    id: "MOISTURE_REFRESH",
    title: "Mid-Week Moisture Refresh",
    description: "Light hydration boost between wash days.",
    actionItems: [
      "Spritz hair with water or diluted leave-in",
      "Apply small amount of oil to seal",
      "Focus on ends and dry areas",
      "Avoid over-wetting to prevent hygral fatigue",
    ],
    frequency: "As needed",
  },
];

const PROTEIN_RECOMMENDATIONS: Partial<Recommendation>[] = [
  {
    id: "PROTEIN_BALANCE",
    title: "Protein-Moisture Balance",
    description: "Maintain the delicate balance between strength and flexibility.",
    actionItems: [
      "Use protein treatment every 4-6 weeks",
      "Follow with deep moisture treatment",
      "Watch for signs of protein overload (dry, brittle feel)",
      "Monitor hair elasticity to gauge needs",
    ],
    frequency: "Monthly",
    productSuggestions: [
      {
        type: "Protein Treatment",
        characteristics: ["Hydrolyzed proteins", "Keratin", "Amino acids"],
        avoid: ["Heavy proteins if hair is protein-sensitive"],
      },
    ],
  },
  {
    id: "PROTEIN_LIGHT",
    title: "Light Protein Maintenance",
    description: "Regular light protein for ongoing strand strength.",
    actionItems: [
      "Use protein-containing conditioner weekly",
      "Focus on mid-lengths and ends",
      "Alternate with moisture-only products",
    ],
    frequency: "Weekly",
  },
];

const SCALP_RECOMMENDATIONS: Partial<Recommendation>[] = [
  {
    id: "SCALP_MASSAGE",
    title: "Scalp Massage Routine",
    description: "Stimulate blood flow and promote scalp health.",
    actionItems: [
      "Massage scalp for 3-5 minutes before washing",
      "Use fingertips, not nails",
      "Optional: Add lightweight oil like jojoba",
      "Focus on tension areas (temples, nape)",
    ],
    frequency: "Every wash day",
    estimatedImpact: "HIGH",
  },
  {
    id: "SCALP_CLEANSE",
    title: "Gentle Scalp Cleansing",
    description: "Keep scalp clean without stripping natural oils.",
    actionItems: [
      "Focus shampoo on scalp only",
      "Use sulfate-free or low-poo cleanser",
      "Double cleanse if using heavy products",
      "Rinse thoroughly",
    ],
    frequency: "Every wash day",
    productSuggestions: [
      {
        type: "Shampoo",
        characteristics: ["Sulfate-free", "pH balanced", "Gentle cleansing agents"],
        avoid: ["Harsh sulfates", "Strong fragrances"],
      },
    ],
  },
  {
    id: "SCALP_SENSITIVE",
    title: "Sensitive Scalp Protocol",
    description: "Gentle care routine for reactive scalps.",
    actionItems: [
      "Patch test all new products",
      "Choose fragrance-free formulas",
      "Avoid scratching or aggressive manipulation",
      "Keep scalp dry and clean between washes",
    ],
    frequency: "Ongoing",
    productSuggestions: [
      {
        type: "Scalp Treatment",
        characteristics: ["Fragrance-free", "Minimal ingredients", "Soothing agents like aloe"],
        avoid: ["Alcohol", "Menthol", "Strong essential oils"],
      },
    ],
  },
];

const PROTECTION_RECOMMENDATIONS: Partial<Recommendation>[] = [
  {
    id: "PROTECT_SLEEP",
    title: "Nighttime Protection",
    description: "Preserve your style and prevent friction damage while sleeping.",
    actionItems: [
      "Sleep on silk or satin pillowcase",
      "Alternatively, use a satin bonnet or scarf",
      "Pineapple or loosely braid long hair",
      "Avoid cotton which absorbs moisture",
    ],
    frequency: "Nightly",
    estimatedImpact: "HIGH",
  },
  {
    id: "PROTECT_STYLE",
    title: "Protective Styling",
    description: "Low-manipulation styles to preserve length and reduce breakage.",
    actionItems: [
      "Choose styles that tuck away ends",
      "Keep styles for 1-2 weeks max",
      "Moisturize hair before installing",
      "Avoid excessive tension at edges",
    ],
    frequency: "As desired",
  },
  {
    id: "PROTECT_HEAT",
    title: "Heat Protection Protocol",
    description: "Minimize heat damage when styling.",
    actionItems: [
      "Always use heat protectant before tools",
      "Start at lowest effective temperature",
      "Limit heat styling to once per week max",
      "Give hair recovery time after heat",
    ],
    frequency: "When using heat",
    productSuggestions: [
      {
        type: "Heat Protectant",
        characteristics: ["Silicone-based for high heat", "Up to 450F protection"],
      },
    ],
  },
];

const REST_RECOMMENDATIONS: Partial<Recommendation>[] = [
  {
    id: "REST_LOW_MANIPULATION",
    title: "Low Manipulation Period",
    description: "Give hair a break from styling and handling.",
    actionItems: [
      "Keep hair in simple, low-tension style",
      "Minimize touching and restyling",
      "Focus on moisture maintenance only",
      "Avoid combing or brushing unnecessarily",
    ],
    frequency: "Weekly",
  },
  {
    id: "REST_ROUTINE_SIMPLIFY",
    title: "Simplify Your Routine",
    description: "Reduce routine complexity to prevent fatigue and overload.",
    actionItems: [
      "Identify your core 3-4 products",
      "Eliminate redundant steps",
      "Batch tasks (e.g., pre-poo night before)",
      "Set realistic wash day expectations",
    ],
    frequency: "Routine review monthly",
    estimatedImpact: "MEDIUM",
  },
];

// ============================================================================
// Recommendation Generation
// ============================================================================

function createRecommendation(
  template: Partial<Recommendation>,
  priority: Recommendation["priority"],
  category: RecommendationCategory,
  impact: Recommendation["estimatedImpact"] = "MEDIUM"
): Recommendation {
  return {
    id: template.id || `REC_${Date.now()}`,
    category,
    priority,
    title: template.title || "Care Recommendation",
    description: template.description || "",
    actionItems: template.actionItems || [],
    relatedInsights: template.relatedInsights,
    productSuggestions: template.productSuggestions,
    frequency: template.frequency,
    estimatedImpact: template.estimatedImpact || impact,
  };
}

function getRecommendationsForNeed(need: CareNeed): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const priority: Recommendation["priority"] =
    need.level === "CRITICAL" ? "ESSENTIAL" :
    need.level === "HIGH" ? "ESSENTIAL" :
    need.level === "MODERATE" ? "RECOMMENDED" : "OPTIONAL";

  switch (need.category) {
    case "MOISTURE":
      if (need.level === "CRITICAL" || need.level === "HIGH") {
        recommendations.push(
          createRecommendation(MOISTURE_RECOMMENDATIONS[0]!, priority, "WASH_DAY", "HIGH"),
          createRecommendation(MOISTURE_RECOMMENDATIONS[1]!, priority, "STYLING", "HIGH")
        );
      }
      if (need.level === "MODERATE") {
        recommendations.push(
          createRecommendation(MOISTURE_RECOMMENDATIONS[2]!, priority, "ROUTINE", "MEDIUM")
        );
      }
      break;

    case "PROTEIN":
      if (need.level === "HIGH" || need.level === "MODERATE") {
        recommendations.push(
          createRecommendation(PROTEIN_RECOMMENDATIONS[0]!, priority, "WASH_DAY", "HIGH")
        );
      }
      if (need.level === "MODERATE") {
        recommendations.push(
          createRecommendation(PROTEIN_RECOMMENDATIONS[1]!, "RECOMMENDED", "ROUTINE", "MEDIUM")
        );
      }
      break;

    case "SCALP_CARE":
      if (need.level === "CRITICAL") {
        recommendations.push(
          createRecommendation(SCALP_RECOMMENDATIONS[2]!, "ESSENTIAL", "SCALP", "HIGH")
        );
      }
      recommendations.push(
        createRecommendation(SCALP_RECOMMENDATIONS[0]!, priority, "SCALP", "HIGH"),
        createRecommendation(SCALP_RECOMMENDATIONS[1]!, priority, "WASH_DAY", "MEDIUM")
      );
      break;

    case "PROTECTION":
      recommendations.push(
        createRecommendation(PROTECTION_RECOMMENDATIONS[0]!, "ESSENTIAL", "PROTECTION", "HIGH")
      );
      if (need.level === "HIGH") {
        recommendations.push(
          createRecommendation(PROTECTION_RECOMMENDATIONS[1]!, priority, "STYLING", "HIGH")
        );
      }
      break;

    case "REST":
      if (need.level === "HIGH" || need.level === "MODERATE") {
        recommendations.push(
          createRecommendation(REST_RECOMMENDATIONS[0]!, priority, "REST", "MEDIUM"),
          createRecommendation(REST_RECOMMENDATIONS[1]!, priority, "ROUTINE", "MEDIUM")
        );
      }
      break;
  }

  return recommendations;
}

function getRecommendationsForRisk(risk: RiskFactor): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const priority: Recommendation["priority"] =
    risk.severity === "HIGH" ? "ESSENTIAL" : "RECOMMENDED";

  switch (risk.category) {
    case "BREAKAGE":
      recommendations.push(
        createRecommendation(
          {
            id: `RISK_${risk.id}`,
            title: "Breakage Prevention",
            description: risk.mitigation,
            actionItems: risk.mitigation.split(", "),
          },
          priority,
          "PROTECTION",
          "HIGH"
        )
      );
      break;

    case "DRYNESS":
      recommendations.push(
        createRecommendation(MOISTURE_RECOMMENDATIONS[0]!, priority, "WASH_DAY", "HIGH")
      );
      break;

    case "TENSION":
      recommendations.push(
        createRecommendation(
          {
            id: `RISK_${risk.id}`,
            title: "Reduce Tension",
            description: risk.mitigation,
            actionItems: [
              "Avoid tight hairstyles",
              "Give edges regular breaks",
              "Use gentle hair ties",
              "Monitor for signs of traction damage",
            ],
          },
          priority,
          "PROTECTION",
          "HIGH"
        )
      );
      break;

    case "OVERLOAD":
      recommendations.push(
        createRecommendation(REST_RECOMMENDATIONS[1]!, priority, "ROUTINE", "MEDIUM")
      );
      break;
  }

  return recommendations;
}

function generateWeeklyFocus(analysis: ProfileAnalysis): WeeklyFocus {
  // Find the highest priority care need
  const criticalNeed = analysis.careNeeds.find((n) => n.level === "CRITICAL");
  const highNeed = analysis.careNeeds.find((n) => n.level === "HIGH");
  const focusNeed = criticalNeed || highNeed || analysis.careNeeds[0];

  if (!focusNeed) {
    return {
      theme: "Maintenance Week",
      description: "Focus on maintaining your current healthy hair routine.",
      targetArea: "MOISTURE",
    };
  }

  const themes: Record<CareNeed["category"], { theme: string; description: string }> = {
    MOISTURE: {
      theme: "Hydration Week",
      description: "Focus on deep moisture treatments and sealing techniques.",
    },
    PROTEIN: {
      theme: "Strength Week",
      description: "Rebuild strand integrity with protein and follow with moisture.",
    },
    REST: {
      theme: "Recovery Week",
      description: "Low manipulation and gentle care to let hair recover.",
    },
    PROTECTION: {
      theme: "Protection Week",
      description: "Install or maintain a protective style to preserve progress.",
    },
    SCALP_CARE: {
      theme: "Scalp Wellness Week",
      description: "Prioritize scalp health with gentle cleansing and treatments.",
    },
  };

  const themeInfo = themes[focusNeed.category];
  return {
    theme: themeInfo.theme,
    description: themeInfo.description,
    targetArea: focusNeed.category,
  };
}

function generateQuickWins(analysis: ProfileAnalysis): string[] {
  const wins: string[] = [];

  // Always beneficial quick wins
  wins.push("Sleep on a silk or satin pillowcase tonight");

  // Score-based quick wins
  if (analysis.healthScore.categories.hydration < 60) {
    wins.push("Add a leave-in conditioner after your next wash");
  }

  if (analysis.healthScore.categories.scalp < 60) {
    wins.push("Give yourself a 2-minute scalp massage today");
  }

  // Risk-based quick wins
  if (analysis.riskAssessment.factors.some((f) => f.category === "BREAKAGE")) {
    wins.push("Switch to a wide-tooth comb for detangling");
  }

  if (analysis.riskAssessment.factors.some((f) => f.category === "TENSION")) {
    wins.push("Loosen your ponytail or try a claw clip instead");
  }

  // Archetype-based quick wins
  if (analysis.archetype.id === "LOW_POROSITY_GUARDIAN") {
    wins.push("Use warm water to help products absorb better");
  }

  if (analysis.archetype.id === "HIGH_MAINTENANCE_CURLY") {
    wins.push("Apply products to soaking wet hair for better absorption");
  }

  // Learning-based
  if (analysis.healthScore.categories.routine < 60) {
    wins.push("Explore one learning node in the Hair Health section");
  }

  return wins.slice(0, 5); // Return top 5 quick wins
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Generate personalized recommendations for a hair profile
 */
export function generateRecommendations(profile: HairProfileResponse): RecommendationSet {
  const analysis = analyzeProfile(profile);

  // Collect all recommendations
  const allRecommendations: Recommendation[] = [];

  // Add need-based recommendations
  for (const need of analysis.careNeeds) {
    allRecommendations.push(...getRecommendationsForNeed(need));
  }

  // Add risk-based recommendations
  for (const risk of analysis.riskAssessment.factors) {
    allRecommendations.push(...getRecommendationsForRisk(risk));
  }

  // Deduplicate by ID
  const uniqueRecommendations = Array.from(
    new Map(allRecommendations.map((r) => [r.id, r])).values()
  );

  // Sort by priority
  const priorityOrder: Record<Recommendation["priority"], number> = {
    ESSENTIAL: 0,
    RECOMMENDED: 1,
    OPTIONAL: 2,
  };
  uniqueRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    profileId: profile.id,
    generatedAt: new Date().toISOString(),
    recommendations: uniqueRecommendations,
    weeklyFocus: generateWeeklyFocus(analysis),
    quickWins: generateQuickWins(analysis),
  };
}

/**
 * Get quick wins without full recommendation generation
 */
export function getQuickWins(profile: HairProfileResponse): string[] {
  const analysis = analyzeProfile(profile);
  return generateQuickWins(analysis);
}

/**
 * Get weekly focus for a profile
 */
export function getWeeklyFocus(profile: HairProfileResponse): WeeklyFocus {
  const analysis = analyzeProfile(profile);
  return generateWeeklyFocus(analysis);
}

/**
 * Get recommendations for a specific category
 */
export function getRecommendationsByCategory(
  profile: HairProfileResponse,
  category: RecommendationCategory
): Recommendation[] {
  const { recommendations } = generateRecommendations(profile);
  return recommendations.filter((r) => r.category === category);
}
