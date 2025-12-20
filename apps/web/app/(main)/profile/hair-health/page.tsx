/**
 * Hair Health Profile Page (V6.9)
 *
 * Sections:
 * - Hair Snapshot (archetype, porosity, sensitivity)
 * - Smart Calendar (V6.9 - upcoming rituals, weekly load)
 * - Current Routine (type, weekly load)
 * - Care Insights (personalized guidance)
 * - Learning Progress (unlocked concepts)
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  useHairProfileWithAnalysis,
  useLearningProgress,
  useUnlockLearningNode,
  type ProfileAnalysis,
} from "@/hooks/use-hair-health";
import { AppHeader } from "@/components/layout/app-header";
import { CalendarWidget } from "@/components/hair-health/calendar-widget";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon, type IconName } from "@/components/icons";

export default function HairHealthPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch profile with analysis
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useHairProfileWithAnalysis();

  // Fetch learning progress
  const {
    data: learningData,
    isLoading: learningLoading,
  } = useLearningProgress();

  // Mutation for unlocking nodes
  const unlockNode = useUnlockLearningNode();

  const isLoading = authLoading || profileLoading;
  const profile = profileData?.profile;
  const analysis = profileData?.analysis;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader title="Hair Health" showBack showNotifications />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
        
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  // Handle error state
  if (profileError && !(profileError instanceof Error && profileError.message.includes("not found"))) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader title="Hair Health" showBack backHref="/profile" showNotifications />
        <div className="p-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Icon name="calmError" size="2xl" className="text-status-error mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Unable to Load Profile
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                There was an error loading your hair health profile. Please try again.
              </p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
        
      </div>
    );
  }

  // No profile yet - show onboarding prompt
  if (!profile) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader
          title="Hair Health"
          showBack
          backHref="/profile"
          showNotifications
        />

        <div className="p-4 space-y-6">
          {/* Hero Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-rose/20 via-brand-purple/10 to-accent-gold/20 p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-rose/20 flex items-center justify-center">
                <Icon name="sparkle" size="xl" className="text-brand-rose" />
              </div>
              <h2 className="text-xl font-display font-bold text-text-primary mb-2">
                Discover Your Hair Profile
              </h2>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Answer a few questions to unlock personalized care recommendations
                and connect with stylists who understand your hair.
              </p>
            </div>
            <CardContent className="p-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push("/profile/hair-health/onboarding")}
              >
                Start Hair Assessment
                <Icon name="chevronRight" size="sm" className="ml-1" />
              </Button>
              <p className="text-xs text-text-muted text-center mt-3">
                Takes about 3-5 minutes
              </p>
            </CardContent>
          </Card>

          {/* What You'll Learn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="info" size="md" className="text-brand-purple" />
                What You&apos;ll Discover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DiscoveryItem
                icon="sparkle"
                title="Your Hair Archetype"
                description="Texture class, pattern family, and density"
              />
              <DiscoveryItem
                icon="moisture"
                title="Porosity Level"
                description="How your hair absorbs and retains moisture"
              />
              <DiscoveryItem
                icon="trusted"
                title="Sensitivity Profile"
                description="Detangling, manipulation, and tension tolerance"
              />
              <DiscoveryItem
                icon="calendar"
                title="Optimal Routine"
                description="Personalized wash day schedule and rituals"
              />
            </CardContent>
          </Card>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-4 bg-background-primary rounded-xl border border-border-default">
            <Icon name="locked" size="md" className="text-brand-purple mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Your data stays private
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Share your hair profile with stylists only when you choose to.
                You control what they see.
              </p>
            </div>
          </div>
        </div>

        
      </div>
    );
  }

  // Profile exists - show full dashboard
  return (
    <div className="min-h-screen bg-background-secondary pb-24">
      <AppHeader
        title="Hair Health"
        showBack
        backHref="/profile"
        showNotifications
      />

      <div className="p-4 space-y-6">
        {/* Health Score Card */}
        {analysis && (
          <HealthScoreCard analysis={analysis} />
        )}

        {/* Hair Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="sparkle" size="md" className="text-brand-rose" />
              Hair Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <SnapshotItem
                label="Texture"
                value={formatTextureClass(profile.textureClass)}
              />
              <SnapshotItem
                label="Pattern"
                value={formatPatternFamily(profile.patternFamily)}
              />
              <SnapshotItem
                label="Porosity"
                value={profile.porosityLevel ?? "Not Set"}
                indicator={getThreeLevelIndicator(profile.porosityLevel)}
              />
              <SnapshotItem
                label="Density"
                value={profile.densityLevel ?? "Not Set"}
                indicator={getThreeLevelIndicator(profile.densityLevel)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => router.push("/profile/hair-health/edit")}
            >
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* V6.9 Smart Calendar Widget */}
        <CalendarWidget />

        {/* Current Routine */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="sparkle" size="md" className="text-brand-purple" />
              Routine Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background-secondary rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Routine Type</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatRoutineType(profile.routineType)}
                </p>
              </div>
              <div className="p-3 bg-background-secondary rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Wash Day Load</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    {profile.washDayLoadFactor?.toLowerCase() ?? "Standard"}
                  </p>
                  <Badge
                    variant={
                      profile.washDayLoadFactor === "EXTREME" || profile.washDayLoadFactor === "HEAVY"
                        ? "warning"
                        : profile.washDayLoadFactor === "LIGHT"
                        ? "success"
                        : "default"
                    }
                    className="text-xs"
                  >
                    {profile.estimatedWashDayMinutes ?? 60}m
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-background-secondary rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Detangle</p>
                <p className="text-sm font-medium text-text-primary">
                  {profile.detangleTolerance?.toLowerCase() ?? "Medium"} tolerance
                </p>
              </div>
              <div className="p-3 bg-background-secondary rounded-lg">
                <p className="text-xs text-text-secondary mb-1">Manipulation</p>
                <p className="text-sm font-medium text-text-primary">
                  {profile.manipulationTolerance?.toLowerCase() ?? "Medium"} tolerance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Care Insights */}
        {analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="info" size="md" className="text-accent-gold" />
                Care Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg"
                    >
                      <Icon name="energy" size="sm" className="text-accent-gold mt-0.5" />
                      <p className="text-sm text-text-primary">{rec}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-text-secondary">
                    No insights available yet
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Complete your profile for personalized recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Strengths & Concerns */}
        {analysis && (analysis.strengths.length > 0 || analysis.concerns.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="growing" size="md" className="text-status-success" />
                Profile Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1">
                    <Icon name="favorite" className="w-3 h-3" /> Strengths
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="success" className="text-xs">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {analysis.concerns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1">
                    <Icon name="info" className="w-3 h-3" /> Areas to Watch
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.concerns.map((concern, idx) => (
                      <Badge key={idx} variant="warning" className="text-xs">
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon name="intelligence" size="md" className="text-status-success" />
                Learning Progress
              </span>
              {learningData && (
                <Badge variant="default" className="text-xs">
                  {learningData.progress}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {learningLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : learningData ? (
              <div className="space-y-2">
                {learningData.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      node.isUnlocked
                        ? "bg-status-success/10"
                        : "bg-background-secondary"
                    }`}
                  >
                    {node.isUnlocked ? (
                      <Icon name="success" size="md" className="text-status-success" />
                    ) : (
                      <Icon name="locked" size="md" className="text-text-muted" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {node.title}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {node.description}
                      </p>
                    </div>
                    {!node.isUnlocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unlockNode.mutate(node.id)}
                        disabled={unlockNode.isPending}
                      >
                        Unlock
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-text-secondary">
                  Complete your profile to start learning
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}

// Helper Components

function HealthScoreCard({ analysis }: { analysis: ProfileAnalysis }) {
  const gradeColors: Record<string, string> = {
    A: "text-status-success",
    B: "text-status-success",
    C: "text-accent-gold",
    D: "text-status-warning",
    F: "text-status-error",
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-brand-rose/10 via-brand-purple/5 to-accent-gold/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary mb-1">Overall Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${gradeColors[analysis.healthScore.grade]}`}>
                {analysis.healthScore.grade}
              </span>
              <span className="text-lg text-text-secondary">
                {analysis.healthScore.overall}/100
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary mb-1">Archetype</p>
            <p className="text-sm font-medium text-text-primary">
              {analysis.archetype}
            </p>
          </div>
        </div>
        {analysis.archetypeDescription && (
          <p className="text-xs text-text-secondary mt-3">
            {analysis.archetypeDescription}
          </p>
        )}
      </div>
    </Card>
  );
}

function DiscoveryItem({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-rose/10 flex items-center justify-center flex-shrink-0">
        <Icon name={icon} size="sm" className="text-brand-rose" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
  indicator,
}: {
  label: string;
  value: string;
  indicator?: "low" | "medium" | "high";
}) {
  const indicatorColors = {
    low: "bg-status-success",
    medium: "bg-accent-gold",
    high: "bg-status-warning",
  };

  return (
    <div className="p-3 bg-background-secondary rounded-lg">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-text-primary">{value}</p>
        {indicator && (
          <span
            className={`w-2 h-2 rounded-full ${indicatorColors[indicator]}`}
          />
        )}
      </div>
    </div>
  );
}

// Helper functions

function formatTextureClass(texture: string): string {
  const labels: Record<string, string> = {
    TYPE_1: "Type 1 (Straight)",
    TYPE_2: "Type 2 (Wavy)",
    TYPE_3: "Type 3 (Curly)",
    TYPE_4: "Type 4 (Coily)",
  };
  return labels[texture] ?? texture;
}

function formatPatternFamily(pattern: string): string {
  const labels: Record<string, string> = {
    STRAIGHT: "Straight",
    WAVY: "Wavy",
    CURLY: "Curly",
    COILY: "Coily",
  };
  return labels[pattern] ?? pattern;
}

function formatRoutineType(routine: string): string {
  const labels: Record<string, string> = {
    MINIMALIST: "Minimalist",
    BASIC: "Basic",
    MODERATE: "Moderate",
    INTENSIVE: "Intensive",
    PROFESSIONAL: "Professional",
  };
  return labels[routine] ?? routine;
}

function getThreeLevelIndicator(level: string | null): "low" | "medium" | "high" | undefined {
  if (!level) return undefined;
  if (level === "LOW") return "low";
  if (level === "MEDIUM") return "medium";
  if (level === "HIGH") return "high";
  return undefined;
}
