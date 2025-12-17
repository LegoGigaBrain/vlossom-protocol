/**
 * Hair Health Profile Page (V5.0)
 *
 * Sections:
 * - Hair Snapshot (archetype, porosity, sensitivity)
 * - Current Routine (type, weekly load)
 * - Care Insights (personalized guidance)
 * - Learning Progress (unlocked concepts)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { AppHeader } from "../../../components/layout/app-header";
import { BottomNav } from "../../../components/layout/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  Sparkles,
  Droplets,
  Shield,
  Calendar,
  BookOpen,
  ChevronRight,
  Info,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Hair profile types (from Doc 06 schema)
type TextureClass = "1A" | "1B" | "1C" | "2A" | "2B" | "2C" | "3A" | "3B" | "3C" | "4A" | "4B" | "4C" | "MIXED" | "UNKNOWN";
type PorosityLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
type SensitivityLevel = "LOW" | "MEDIUM" | "HIGH";
type RoutineType = "GROWTH" | "REPAIR" | "MAINTENANCE" | "KIDS" | "PROTECTIVE" | "TRANSITION" | "UNKNOWN";

interface HairHealthProfile {
  textureClass: TextureClass;
  porosityLevel: PorosityLevel;
  sensitivityLevel: SensitivityLevel;
  routineType: RoutineType;
  washDayLoadFactor: "LIGHT" | "STANDARD" | "HEAVY";
  estimatedWashDayMinutes: number;
  learningNodesUnlocked: string[];
}

// Learning nodes available
const learningNodes = [
  { id: "POROSITY_BASICS", label: "Porosity Basics", description: "Understanding how your hair absorbs moisture" },
  { id: "MOISTURE_PROTEIN_BALANCE", label: "Moisture-Protein Balance", description: "Finding the right balance for your hair" },
  { id: "PROTECTIVE_STYLING", label: "Protective Styling", description: "Low manipulation techniques" },
  { id: "HEAT_STYLING_SAFETY", label: "Heat Styling Safety", description: "Minimizing damage from heat" },
  { id: "SCALP_HEALTH", label: "Scalp Health", description: "Foundation for healthy hair growth" },
  { id: "PRODUCT_INGREDIENTS", label: "Product Ingredients", description: "Reading labels like a pro" },
];

export default function HairHealthPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Mock profile data - will be from API
  const [profile] = useState<HairHealthProfile | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        <AppHeader title="Hair Health" showBack showNotifications />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
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
                <Sparkles className="w-10 h-10 text-brand-rose" />
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
                <ChevronRight className="w-4 h-4 ml-1" />
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
                <Info className="w-5 h-5 text-brand-purple" />
                What You&apos;ll Discover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DiscoveryItem
                icon={Sparkles}
                title="Your Hair Archetype"
                description="Texture class, pattern family, and density"
              />
              <DiscoveryItem
                icon={Droplets}
                title="Porosity Level"
                description="How your hair absorbs and retains moisture"
              />
              <DiscoveryItem
                icon={Shield}
                title="Sensitivity Profile"
                description="Detangling, manipulation, and tension tolerance"
              />
              <DiscoveryItem
                icon={Calendar}
                title="Optimal Routine"
                description="Personalized wash day schedule and rituals"
              />
            </CardContent>
          </Card>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-4 bg-background-primary rounded-xl border border-border-default">
            <Lock className="w-5 h-5 text-brand-purple mt-0.5" />
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

        <BottomNav />
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
        {/* Hair Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-rose" />
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
                label="Porosity"
                value={profile.porosityLevel}
                indicator={getPorosityIndicator(profile.porosityLevel)}
              />
              <SnapshotItem
                label="Sensitivity"
                value={profile.sensitivityLevel}
                indicator={getSensitivityIndicator(profile.sensitivityLevel)}
              />
              <SnapshotItem
                label="Routine"
                value={formatRoutineType(profile.routineType)}
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

        {/* Current Routine */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-purple" />
              Current Routine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg mb-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Wash Day Load
                </p>
                <p className="text-xs text-text-secondary">
                  {profile.washDayLoadFactor.toLowerCase()} intensity
                </p>
              </div>
              <Badge
                variant={
                  profile.washDayLoadFactor === "HEAVY"
                    ? "warning"
                    : profile.washDayLoadFactor === "LIGHT"
                    ? "success"
                    : "default"
                }
              >
                {profile.estimatedWashDayMinutes} min
              </Badge>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => router.push("/schedule")}
            >
              View Care Calendar
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Care Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent-gold" />
              Care Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-sm text-text-secondary">
                Personalized insights coming soon
              </p>
              <p className="text-xs text-text-muted mt-1">
                Based on your profile, routine, and weather
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-status-success" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {learningNodes.map((node) => {
                const isUnlocked = profile.learningNodesUnlocked.includes(node.id);
                return (
                  <div
                    key={node.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isUnlocked
                        ? "bg-status-success/10"
                        : "bg-background-secondary opacity-60"
                    }`}
                  >
                    {isUnlocked ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <Lock className="w-5 h-5 text-text-muted" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {node.label}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {node.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}

// Helper Components

function DiscoveryItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-rose/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-brand-rose" />
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

function formatTextureClass(texture: TextureClass): string {
  if (texture === "MIXED") return "Mixed";
  if (texture === "UNKNOWN") return "Unknown";
  return texture;
}

function formatRoutineType(routine: RoutineType): string {
  const labels: Record<RoutineType, string> = {
    GROWTH: "Growth Focus",
    REPAIR: "Repair",
    MAINTENANCE: "Maintenance",
    KIDS: "Kids Care",
    PROTECTIVE: "Protective",
    TRANSITION: "Transition",
    UNKNOWN: "Not Set",
  };
  return labels[routine];
}

function getPorosityIndicator(level: PorosityLevel): "low" | "medium" | "high" | undefined {
  if (level === "LOW") return "low";
  if (level === "MEDIUM") return "medium";
  if (level === "HIGH") return "high";
  return undefined;
}

function getSensitivityIndicator(level: SensitivityLevel): "low" | "medium" | "high" {
  return level.toLowerCase() as "low" | "medium" | "high";
}
