/**
 * Ritual Sheet - Bottom Sheet for Ritual Details (V5.0)
 *
 * Shows ritual steps with progress dots.
 * - Step list with estimated time per step
 * - Gentle copy ("Take your time")
 * - Progress tracking
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 10
 * Motion: docs/vlossom/24-brand-narrative-and-lore.md Section 13
 */

"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  X,
  Clock,
  CheckCircle,
  Circle,
  Droplets,
  Sparkles,
  Heart,
} from "lucide-react";

export interface RitualStep {
  id: string;
  stepOrder: number;
  stepType: string;
  name: string | null;
  estimatedMinutes: number;
  optional: boolean;
  notes: string | null;
  isCompleted?: boolean;
}

export interface Ritual {
  id: string;
  name: string;
  description: string | null;
  ritualType: string;
  defaultDurationMinutes: number;
  loadLevel: "LIGHT" | "STANDARD" | "HEAVY";
  steps: RitualStep[];
}

interface RitualSheetProps {
  ritual: Ritual;
  isOpen: boolean;
  onClose: () => void;
  onStepComplete?: (stepId: string) => void;
  onStartRitual?: () => void;
  className?: string;
}

const stepTypeLabels: Record<string, string> = {
  PRE_POO: "Pre-Poo Treatment",
  SHAMPOO: "Shampoo",
  CLARIFY: "Clarifying Wash",
  CONDITION: "Condition",
  DEEP_CONDITION: "Deep Condition",
  PROTEIN_TREATMENT: "Protein Treatment",
  DETANGLE: "Detangle",
  RINSE: "Rinse",
  LEAVE_IN: "Leave-In",
  MOISTURIZE: "Moisturize",
  SEAL: "Seal",
  STYLE: "Style",
  DRY: "Dry",
  SCALP_MASSAGE: "Scalp Massage",
  CUSTOM: "Custom Step",
};

const loadLevelCopy: Record<string, { label: string; color: string }> = {
  LIGHT: { label: "Light session", color: "text-status-success" },
  STANDARD: { label: "Standard session", color: "text-accent-gold" },
  HEAVY: { label: "Deep care session", color: "text-status-warning" },
};

export function RitualSheet({
  ritual,
  isOpen,
  onClose,
  onStepComplete,
  onStartRitual,
  className,
}: RitualSheetProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleStepToggle = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
    onStepComplete?.(stepId);
  };

  const totalSteps = ritual.steps.length;
  const completedCount = completedSteps.size;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  const remainingMinutes = ritual.steps
    .filter((step) => !completedSteps.has(step.id))
    .reduce((sum, step) => sum + step.estimatedMinutes, 0);

  const loadInfo = loadLevelCopy[ritual.loadLevel] || loadLevelCopy.STANDARD;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background-primary rounded-t-3xl z-50 max-h-[85vh] overflow-hidden",
          "animate-in slide-in-from-bottom duration-300",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border-default" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-border-default">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-5 h-5 text-brand-rose" />
                <h2 className="text-lg font-display font-semibold text-text-primary">
                  {ritual.name}
                </h2>
              </div>
              {ritual.description && (
                <p className="text-sm text-text-secondary">
                  {ritual.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={cn("text-xs font-medium", loadInfo.color)}>
                  {loadInfo.label}
                </span>
                <span className="text-xs text-text-muted">•</span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {remainingMinutes} min remaining
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-background-tertiary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-rose rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">
              {completedCount} of {totalSteps} steps complete
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-4">
          <div className="space-y-3">
            {ritual.steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const stepLabel =
                step.name || stepTypeLabels[step.stepType] || step.stepType;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepToggle(step.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                    isCompleted
                      ? "bg-status-success/10"
                      : "bg-background-secondary hover:bg-background-tertiary"
                  )}
                >
                  {/* Step Number / Check */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      isCompleted
                        ? "bg-status-success text-white"
                        : "bg-background-tertiary text-text-muted"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCompleted
                            ? "text-text-secondary line-through"
                            : "text-text-primary"
                        )}
                      >
                        {stepLabel}
                      </p>
                      {step.optional && (
                        <span className="text-[10px] text-text-muted bg-background-tertiary px-1.5 py-0.5 rounded">
                          optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      ~{step.estimatedMinutes} min
                    </p>
                    {step.notes && (
                      <p className="text-xs text-text-secondary mt-1 italic">
                        {step.notes}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-background-primary">
          {completedCount === totalSteps ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-brand-rose" />
                <p className="font-medium text-text-primary">
                  Ritual complete!
                </p>
              </div>
              <p className="text-sm text-text-secondary">
                Well done. Your hair thanks you.
              </p>
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={onClose}
              >
                <Heart className="w-4 h-4 mr-2" />
                Finish
              </Button>
            </div>
          ) : completedCount === 0 ? (
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-3">
                Take your time. There&apos;s no rush.
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={onStartRitual}
              >
                Begin Ritual
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-text-secondary">
                {remainingMinutes} minutes to go. You&apos;re doing great.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
