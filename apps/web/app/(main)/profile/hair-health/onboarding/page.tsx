/**
 * Hair Health Onboarding Page (V5.1)
 *
 * Multi-step wizard for creating a hair health profile.
 * Steps:
 * 1. Texture & Pattern
 * 2. Porosity & Density
 * 3. Sensitivity Levels
 * 4. Routine & Habits
 * 5. Review & Submit
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateHairProfile,
  type HairProfileCreateInput,
  type TextureClass,
  type PatternFamily,
  type ThreeLevel,
  type LoadFactor,
  type RoutineType,
} from "@/hooks/use-hair-health";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Droplets,
  Shield,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

// Form state type
interface OnboardingFormState {
  textureClass: TextureClass | null;
  patternFamily: PatternFamily | null;
  strandThickness: ThreeLevel | null;
  densityLevel: ThreeLevel | null;
  shrinkageTendency: ThreeLevel | null;
  porosityLevel: ThreeLevel | null;
  detangleTolerance: ThreeLevel | null;
  manipulationTolerance: ThreeLevel | null;
  tensionSensitivity: ThreeLevel | null;
  scalpSensitivity: ThreeLevel | null;
  washDayLoadFactor: LoadFactor | null;
  estimatedWashDayMinutes: number | null;
  routineType: RoutineType | null;
}

const TOTAL_STEPS = 5;

export default function HairHealthOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const createProfile = useCreateHairProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<OnboardingFormState>({
    textureClass: null,
    patternFamily: null,
    strandThickness: null,
    densityLevel: null,
    shrinkageTendency: null,
    porosityLevel: null,
    detangleTolerance: null,
    manipulationTolerance: null,
    tensionSensitivity: null,
    scalpSensitivity: null,
    washDayLoadFactor: null,
    estimatedWashDayMinutes: null,
    routineType: null,
  });

  const updateField = <K extends keyof OnboardingFormState>(
    field: K,
    value: OnboardingFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formState.textureClass !== null && formState.patternFamily !== null;
      case 2:
        return formState.porosityLevel !== null;
      case 3:
        return true; // Sensitivity is optional
      case 4:
        return formState.routineType !== null;
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    const input: HairProfileCreateInput = {
      textureClass: formState.textureClass!,
      patternFamily: formState.patternFamily!,
      strandThickness: formState.strandThickness ?? undefined,
      densityLevel: formState.densityLevel ?? undefined,
      shrinkageTendency: formState.shrinkageTendency ?? undefined,
      porosityLevel: formState.porosityLevel ?? undefined,
      detangleTolerance: formState.detangleTolerance ?? undefined,
      manipulationTolerance: formState.manipulationTolerance ?? undefined,
      tensionSensitivity: formState.tensionSensitivity ?? undefined,
      scalpSensitivity: formState.scalpSensitivity ?? undefined,
      washDayLoadFactor: formState.washDayLoadFactor ?? undefined,
      estimatedWashDayMinutes: formState.estimatedWashDayMinutes ?? undefined,
      routineType: formState.routineType ?? undefined,
    };

    try {
      await createProfile.mutateAsync(input);
      router.push("/profile/hair-health");
    } catch {
      // Error is handled by mutation state
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-rose" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background-secondary pb-8">
      <AppHeader
        title="Hair Assessment"
        showBack
      />

      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div className="w-full bg-background-tertiary rounded-full h-2">
          <div
            className="bg-brand-rose h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">
          Step {currentStep} of {TOTAL_STEPS}
        </p>
      </div>

      <div className="p-4">
        {/* Step 1: Texture & Pattern */}
        {currentStep === 1 && (
          <StepCard
            icon={Sparkles}
            title="Texture & Pattern"
            description="Let's start with your hair's natural texture"
          >
            <div className="space-y-6">
              <SelectionGroup
                label="Hair Type (Texture Class)"
                options={[
                  { value: "TYPE_1", label: "Type 1", description: "Straight" },
                  { value: "TYPE_2", label: "Type 2", description: "Wavy" },
                  { value: "TYPE_3", label: "Type 3", description: "Curly" },
                  { value: "TYPE_4", label: "Type 4", description: "Coily" },
                ]}
                value={formState.textureClass}
                onChange={(v) => updateField("textureClass", v as TextureClass)}
              />

              <SelectionGroup
                label="Pattern Family"
                options={[
                  { value: "STRAIGHT", label: "Straight", description: "No curl pattern" },
                  { value: "WAVY", label: "Wavy", description: "S-shaped waves" },
                  { value: "CURLY", label: "Curly", description: "Defined curls" },
                  { value: "COILY", label: "Coily", description: "Tight coils/zigzag" },
                ]}
                value={formState.patternFamily}
                onChange={(v) => updateField("patternFamily", v as PatternFamily)}
              />

              <SelectionGroup
                label="Strand Thickness (Optional)"
                options={[
                  { value: "LOW", label: "Fine", description: "Thin strands" },
                  { value: "MEDIUM", label: "Medium", description: "Average thickness" },
                  { value: "HIGH", label: "Coarse", description: "Thick strands" },
                ]}
                value={formState.strandThickness}
                onChange={(v) => updateField("strandThickness", v as ThreeLevel)}
              />
            </div>
          </StepCard>
        )}

        {/* Step 2: Porosity & Density */}
        {currentStep === 2 && (
          <StepCard
            icon={Droplets}
            title="Porosity & Density"
            description="How your hair absorbs and holds moisture"
          >
            <div className="space-y-6">
              <SelectionGroup
                label="Porosity Level"
                options={[
                  { value: "LOW", label: "Low", description: "Resists moisture, takes long to dry" },
                  { value: "MEDIUM", label: "Medium", description: "Balanced absorption" },
                  { value: "HIGH", label: "High", description: "Absorbs quickly, loses moisture fast" },
                ]}
                value={formState.porosityLevel}
                onChange={(v) => updateField("porosityLevel", v as ThreeLevel)}
              />

              <SelectionGroup
                label="Hair Density (Optional)"
                options={[
                  { value: "LOW", label: "Low", description: "Can see scalp easily" },
                  { value: "MEDIUM", label: "Medium", description: "Moderate coverage" },
                  { value: "HIGH", label: "High", description: "Dense, full coverage" },
                ]}
                value={formState.densityLevel}
                onChange={(v) => updateField("densityLevel", v as ThreeLevel)}
              />

              <SelectionGroup
                label="Shrinkage Tendency (Optional)"
                options={[
                  { value: "LOW", label: "Minimal", description: "Less than 25% shrinkage" },
                  { value: "MEDIUM", label: "Moderate", description: "25-50% shrinkage" },
                  { value: "HIGH", label: "High", description: "50%+ shrinkage" },
                ]}
                value={formState.shrinkageTendency}
                onChange={(v) => updateField("shrinkageTendency", v as ThreeLevel)}
              />
            </div>
          </StepCard>
        )}

        {/* Step 3: Sensitivity */}
        {currentStep === 3 && (
          <StepCard
            icon={Shield}
            title="Sensitivity Levels"
            description="How your hair responds to manipulation"
          >
            <div className="space-y-6">
              <SelectionGroup
                label="Detangle Tolerance"
                options={[
                  { value: "LOW", label: "Delicate", description: "Breaks easily, needs gentle care" },
                  { value: "MEDIUM", label: "Moderate", description: "Normal handling" },
                  { value: "HIGH", label: "Resilient", description: "Can handle more manipulation" },
                ]}
                value={formState.detangleTolerance}
                onChange={(v) => updateField("detangleTolerance", v as ThreeLevel)}
              />

              <SelectionGroup
                label="Tension Sensitivity"
                options={[
                  { value: "LOW", label: "Low", description: "Tolerates tight styles well" },
                  { value: "MEDIUM", label: "Medium", description: "Needs moderate care" },
                  { value: "HIGH", label: "High", description: "Sensitive to pulling" },
                ]}
                value={formState.tensionSensitivity}
                onChange={(v) => updateField("tensionSensitivity", v as ThreeLevel)}
              />

              <SelectionGroup
                label="Scalp Sensitivity"
                options={[
                  { value: "LOW", label: "Tolerant", description: "No issues with most products" },
                  { value: "MEDIUM", label: "Moderate", description: "Some sensitivities" },
                  { value: "HIGH", label: "Sensitive", description: "Reacts to many products" },
                ]}
                value={formState.scalpSensitivity}
                onChange={(v) => updateField("scalpSensitivity", v as ThreeLevel)}
              />
            </div>
          </StepCard>
        )}

        {/* Step 4: Routine */}
        {currentStep === 4 && (
          <StepCard
            icon={Calendar}
            title="Your Routine"
            description="How you currently care for your hair"
          >
            <div className="space-y-6">
              <SelectionGroup
                label="Routine Type"
                options={[
                  { value: "MINIMALIST", label: "Minimalist", description: "Simple, quick routine" },
                  { value: "BASIC", label: "Basic", description: "Standard wash & go" },
                  { value: "MODERATE", label: "Moderate", description: "Regular styling routine" },
                  { value: "INTENSIVE", label: "Intensive", description: "Detailed multi-step routine" },
                  { value: "PROFESSIONAL", label: "Professional", description: "Salon-level care at home" },
                ]}
                value={formState.routineType}
                onChange={(v) => updateField("routineType", v as RoutineType)}
              />

              <SelectionGroup
                label="Wash Day Intensity"
                options={[
                  { value: "LIGHT", label: "Light", description: "Quick wash, minimal styling" },
                  { value: "MODERATE", label: "Moderate", description: "Standard wash day" },
                  { value: "HEAVY", label: "Heavy", description: "Deep conditioning, detailed styling" },
                  { value: "EXTREME", label: "Extreme", description: "Full treatment day" },
                ]}
                value={formState.washDayLoadFactor}
                onChange={(v) => updateField("washDayLoadFactor", v as LoadFactor)}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Estimated Wash Day Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => updateField("estimatedWashDayMinutes", mins)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formState.estimatedWashDayMinutes === mins
                          ? "border-brand-rose bg-brand-rose/10 text-brand-rose"
                          : "border-border-default bg-background-primary text-text-primary hover:border-brand-rose/50"
                      }`}
                    >
                      <p className="text-lg font-semibold">{mins}</p>
                      <p className="text-xs text-text-secondary">min</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StepCard>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <StepCard
            icon={Check}
            title="Review Your Profile"
            description="Make sure everything looks right"
          >
            <div className="space-y-4">
              <ReviewSection title="Texture & Pattern">
                <ReviewItem label="Type" value={formatTextureClass(formState.textureClass)} />
                <ReviewItem label="Pattern" value={formatPatternFamily(formState.patternFamily)} />
                <ReviewItem label="Strand" value={formatThreeLevel(formState.strandThickness)} />
              </ReviewSection>

              <ReviewSection title="Porosity & Density">
                <ReviewItem label="Porosity" value={formatThreeLevel(formState.porosityLevel)} />
                <ReviewItem label="Density" value={formatThreeLevel(formState.densityLevel)} />
                <ReviewItem label="Shrinkage" value={formatThreeLevel(formState.shrinkageTendency)} />
              </ReviewSection>

              <ReviewSection title="Sensitivity">
                <ReviewItem label="Detangle" value={formatThreeLevel(formState.detangleTolerance)} />
                <ReviewItem label="Tension" value={formatThreeLevel(formState.tensionSensitivity)} />
                <ReviewItem label="Scalp" value={formatThreeLevel(formState.scalpSensitivity)} />
              </ReviewSection>

              <ReviewSection title="Routine">
                <ReviewItem label="Type" value={formatRoutineType(formState.routineType)} />
                <ReviewItem label="Intensity" value={formatLoadFactor(formState.washDayLoadFactor)} />
                <ReviewItem
                  label="Wash Day"
                  value={formState.estimatedWashDayMinutes ? `${formState.estimatedWashDayMinutes} min` : "Not set"}
                />
              </ReviewSection>

              {createProfile.error && (
                <div className="p-3 bg-status-error/10 rounded-lg">
                  <p className="text-sm text-status-error">
                    Failed to create profile. Please try again.
                  </p>
                </div>
              )}
            </div>
          </StepCard>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={createProfile.isPending}
            >
              {createProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Profile
                  <Check className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StepCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-brand-rose" />
          </div>
          <div>
            <p className="text-text-primary">{title}</p>
            <p className="text-sm font-normal text-text-secondary">{description}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SelectionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; description: string }[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-3">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full p-3 rounded-lg border text-left transition-colors ${
              value === option.value
                ? "border-brand-rose bg-brand-rose/10"
                : "border-border-default bg-background-primary hover:border-brand-rose/50"
            }`}
          >
            <p className={`text-sm font-medium ${
              value === option.value ? "text-brand-rose" : "text-text-primary"
            }`}>
              {option.label}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-background-secondary rounded-lg">
      <p className="text-xs font-medium text-text-secondary mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

// Formatting helpers

function formatTextureClass(value: string | null): string {
  if (!value) return "Not set";
  const labels: Record<string, string> = {
    TYPE_1: "Type 1",
    TYPE_2: "Type 2",
    TYPE_3: "Type 3",
    TYPE_4: "Type 4",
  };
  return labels[value] ?? value;
}

function formatPatternFamily(value: string | null): string {
  if (!value) return "Not set";
  const labels: Record<string, string> = {
    STRAIGHT: "Straight",
    WAVY: "Wavy",
    CURLY: "Curly",
    COILY: "Coily",
  };
  return labels[value] ?? value;
}

function formatThreeLevel(value: string | null): string {
  if (!value) return "Not set";
  const labels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  };
  return labels[value] ?? value;
}

function formatLoadFactor(value: string | null): string {
  if (!value) return "Not set";
  const labels: Record<string, string> = {
    LIGHT: "Light",
    MODERATE: "Moderate",
    HEAVY: "Heavy",
    EXTREME: "Extreme",
  };
  return labels[value] ?? value;
}

function formatRoutineType(value: string | null): string {
  if (!value) return "Not set";
  const labels: Record<string, string> = {
    MINIMALIST: "Minimalist",
    BASIC: "Basic",
    MODERATE: "Moderate",
    INTENSIVE: "Intensive",
    PROFESSIONAL: "Professional",
  };
  return labels[value] ?? value;
}
