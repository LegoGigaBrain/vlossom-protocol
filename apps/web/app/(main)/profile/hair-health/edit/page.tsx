/**
 * Hair Health Edit Page (V5.1)
 *
 * Edit existing hair health profile with tabbed sections.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  useHairProfile,
  useUpdateHairProfile,
  useDeleteHairProfile,
  type HairProfileUpdateInput,
  type TextureClass,
  type PatternFamily,
  type ThreeLevel,
  type LoadFactor,
  type RoutineType,
} from "@/hooks/use-hair-health";
import { AppHeader } from "@/components/layout/app-header";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icons";

type TabId = "texture" | "porosity" | "sensitivity" | "routine";

export default function HairHealthEditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useHairProfile();
  const updateProfile = useUpdateHairProfile();
  const deleteProfile = useDeleteHairProfile();

  const [activeTab, setActiveTab] = useState<TabId>("texture");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formState, setFormState] = useState<HairProfileUpdateInput>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form state when profile loads
  useEffect(() => {
    if (profile) {
      setFormState({
        textureClass: profile.textureClass,
        patternFamily: profile.patternFamily,
        strandThickness: profile.strandThickness ?? undefined,
        densityLevel: profile.densityLevel ?? undefined,
        shrinkageTendency: profile.shrinkageTendency ?? undefined,
        porosityLevel: profile.porosityLevel ?? undefined,
        detangleTolerance: profile.detangleTolerance ?? undefined,
        manipulationTolerance: profile.manipulationTolerance ?? undefined,
        tensionSensitivity: profile.tensionSensitivity ?? undefined,
        scalpSensitivity: profile.scalpSensitivity ?? undefined,
        washDayLoadFactor: profile.washDayLoadFactor ?? undefined,
        estimatedWashDayMinutes: profile.estimatedWashDayMinutes ?? undefined,
        routineType: profile.routineType,
      });
    }
  }, [profile]);

  const updateField = <K extends keyof HairProfileUpdateInput>(
    field: K,
    value: HairProfileUpdateInput[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formState);
      setHasChanges(false);
      router.push("/profile/hair-health");
    } catch {
      // Error handled by mutation state
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProfile.mutateAsync();
      router.push("/profile/hair-health");
    } catch {
      // Error handled by mutation state
    }
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader title="Edit Profile" showBack showNotifications />
        <div className="p-4 space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-64" />
        </div>
        
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!profile) {
    router.push("/profile/hair-health/onboarding");
    return null;
  }

  const tabs: { id: TabId; label: string; icon: import("@/components/icons").IconName }[] = [
    { id: "texture", label: "Texture", icon: "sparkle" },
    { id: "porosity", label: "Porosity", icon: "moisture" },
    { id: "sensitivity", label: "Sensitivity", icon: "trusted" },
    { id: "routine", label: "Routine", icon: "calendar" },
  ];

  return (
    <div className="min-h-screen bg-background-secondary pb-24">
      <AppHeader
        title="Edit Profile"
        showBack
        backHref="/profile/hair-health"
        showNotifications
      />

      {/* Tab Navigation */}
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-rose text-white"
                  : "bg-background-primary text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Texture Tab */}
        {activeTab === "texture" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="sparkle" size="md" className="text-brand-rose" />
                Texture & Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SelectionGroup
                label="Hair Type"
                options={[
                  { value: "TYPE_1", label: "Type 1 (Straight)" },
                  { value: "TYPE_2", label: "Type 2 (Wavy)" },
                  { value: "TYPE_3", label: "Type 3 (Curly)" },
                  { value: "TYPE_4", label: "Type 4 (Coily)" },
                ]}
                value={formState.textureClass ?? null}
                onChange={(v) => updateField("textureClass", v as TextureClass)}
              />

              <SelectionGroup
                label="Pattern Family"
                options={[
                  { value: "STRAIGHT", label: "Straight" },
                  { value: "WAVY", label: "Wavy" },
                  { value: "CURLY", label: "Curly" },
                  { value: "COILY", label: "Coily" },
                ]}
                value={formState.patternFamily ?? null}
                onChange={(v) => updateField("patternFamily", v as PatternFamily)}
              />

              <SelectionGroup
                label="Strand Thickness"
                options={[
                  { value: "LOW", label: "Fine" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "Coarse" },
                ]}
                value={formState.strandThickness ?? null}
                onChange={(v) => updateField("strandThickness", v as ThreeLevel)}
                allowClear
              />

              <SelectionGroup
                label="Density Level"
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                ]}
                value={formState.densityLevel ?? null}
                onChange={(v) => updateField("densityLevel", v as ThreeLevel)}
                allowClear
              />

              <SelectionGroup
                label="Shrinkage Tendency"
                options={[
                  { value: "LOW", label: "Minimal" },
                  { value: "MEDIUM", label: "Moderate" },
                  { value: "HIGH", label: "High" },
                ]}
                value={formState.shrinkageTendency ?? null}
                onChange={(v) => updateField("shrinkageTendency", v as ThreeLevel)}
                allowClear
              />
            </CardContent>
          </Card>
        )}

        {/* Porosity Tab */}
        {activeTab === "porosity" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="moisture" size="md" className="text-brand-purple" />
                Porosity & Moisture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SelectionGroup
                label="Porosity Level"
                options={[
                  { value: "LOW", label: "Low - Resists moisture" },
                  { value: "MEDIUM", label: "Medium - Balanced" },
                  { value: "HIGH", label: "High - Absorbs quickly" },
                ]}
                value={formState.porosityLevel ?? null}
                onChange={(v) => updateField("porosityLevel", v as ThreeLevel)}
                allowClear
              />

              <div className="p-4 bg-background-secondary rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Tip:</strong> Low porosity hair benefits from heat during deep conditioning.
                  High porosity hair needs protein treatments and sealing oils.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sensitivity Tab */}
        {activeTab === "sensitivity" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="trusted" size="md" className="text-accent-gold" />
                Sensitivity Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SelectionGroup
                label="Detangle Tolerance"
                options={[
                  { value: "LOW", label: "Delicate - Breaks easily" },
                  { value: "MEDIUM", label: "Moderate - Normal handling" },
                  { value: "HIGH", label: "Resilient - Can handle manipulation" },
                ]}
                value={formState.detangleTolerance ?? null}
                onChange={(v) => updateField("detangleTolerance", v as ThreeLevel)}
                allowClear
              />

              <SelectionGroup
                label="Manipulation Tolerance"
                options={[
                  { value: "LOW", label: "Low - Needs rest between styles" },
                  { value: "MEDIUM", label: "Medium - Regular styling OK" },
                  { value: "HIGH", label: "High - Handles frequent styling" },
                ]}
                value={formState.manipulationTolerance ?? null}
                onChange={(v) => updateField("manipulationTolerance", v as ThreeLevel)}
                allowClear
              />

              <SelectionGroup
                label="Tension Sensitivity"
                options={[
                  { value: "LOW", label: "Low - Tolerates tight styles" },
                  { value: "MEDIUM", label: "Medium - Moderate tension OK" },
                  { value: "HIGH", label: "High - Sensitive to pulling" },
                ]}
                value={formState.tensionSensitivity ?? null}
                onChange={(v) => updateField("tensionSensitivity", v as ThreeLevel)}
                allowClear
              />

              <SelectionGroup
                label="Scalp Sensitivity"
                options={[
                  { value: "LOW", label: "Tolerant - No product issues" },
                  { value: "MEDIUM", label: "Moderate - Some sensitivities" },
                  { value: "HIGH", label: "Sensitive - Reacts to many products" },
                ]}
                value={formState.scalpSensitivity ?? null}
                onChange={(v) => updateField("scalpSensitivity", v as ThreeLevel)}
                allowClear
              />
            </CardContent>
          </Card>
        )}

        {/* Routine Tab */}
        {activeTab === "routine" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="calendar" size="md" className="text-status-success" />
                Routine & Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SelectionGroup
                label="Routine Type"
                options={[
                  { value: "MINIMALIST", label: "Minimalist" },
                  { value: "BASIC", label: "Basic" },
                  { value: "MODERATE", label: "Moderate" },
                  { value: "INTENSIVE", label: "Intensive" },
                  { value: "PROFESSIONAL", label: "Professional" },
                ]}
                value={formState.routineType ?? null}
                onChange={(v) => updateField("routineType", v as RoutineType)}
              />

              <SelectionGroup
                label="Wash Day Intensity"
                options={[
                  { value: "LIGHT", label: "Light - Quick wash" },
                  { value: "MODERATE", label: "Moderate - Standard routine" },
                  { value: "HEAVY", label: "Heavy - Deep conditioning" },
                  { value: "EXTREME", label: "Extreme - Full treatment" },
                ]}
                value={formState.washDayLoadFactor ?? null}
                onChange={(v) => updateField("washDayLoadFactor", v as LoadFactor)}
                allowClear
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Wash Day Duration
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
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {updateProfile.error && (
          <div className="p-3 bg-status-error/10 rounded-lg">
            <p className="text-sm text-status-error">
              Failed to save changes. Please try again.
            </p>
          </div>
        )}

        {/* Save Button */}
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <>
              <Icon name="timer" size="sm" className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icon name="check" size="sm" className="mr-2" />
              Save Changes
            </>
          )}
        </Button>

        {/* Delete Section */}
        <Card className="border-status-error/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-status-error">
              <Icon name="calmError" size="md" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="w-full border-status-error/50 text-status-error hover:bg-status-error/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Icon name="delete" size="sm" className="mr-2" />
                Delete Hair Profile
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Are you sure? This will permanently delete your hair health profile
                  and all associated data.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-status-error text-status-error hover:bg-status-error hover:text-white"
                    onClick={handleDelete}
                    disabled={deleteProfile.isPending}
                  >
                    {deleteProfile.isPending ? (
                      <Icon name="timer" size="sm" className="animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}

// Helper Components

function SelectionGroup({
  label,
  options,
  value,
  onChange,
  allowClear = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | undefined) => void;
  allowClear?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              value === option.value
                ? "border-brand-rose bg-brand-rose/10 text-brand-rose"
                : "border-border-default bg-background-primary text-text-primary hover:border-brand-rose/50"
            }`}
          >
            {option.label}
          </button>
        ))}
        {allowClear && value && (
          <button
            onClick={() => onChange(undefined)}
            className="px-3 py-2 rounded-lg border border-border-default bg-background-secondary text-text-muted text-sm hover:text-text-primary"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
