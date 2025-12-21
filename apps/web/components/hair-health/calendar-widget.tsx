/**
 * Calendar Intelligence Widget (V6.9)
 *
 * Smart calendar widget for hair health profile page.
 * Shows upcoming rituals, weekly load, and quick actions.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCalendarSummary,
  useUpcomingRituals,
  useGenerateCalendar,
  useCompleteCalendarEvent,
  useSkipCalendarEvent,
  type UpcomingRitual,
} from "@/hooks/use-hair-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function CalendarWidget() {
  const router = useRouter();
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedRitual, setSelectedRitual] = useState<UpcomingRitual | null>(null);

  const { data: summary, isLoading: summaryLoading } = useCalendarSummary();
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingRituals(7);
  const generateCalendar = useGenerateCalendar();
  const completeEvent = useCompleteCalendarEvent();
  const skipEvent = useSkipCalendarEvent();

  const isLoading = summaryLoading || upcomingLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  // No calendar events yet - prompt to generate
  if (!upcoming?.rituals?.length && !summary?.nextRitual) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="calendar" size="md" className="text-brand-purple" />
            Smart Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-purple/10 flex items-center justify-center">
              <Icon name="calendar" size="xl" className="text-brand-purple" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Generate Your Care Calendar
            </h3>
            <p className="text-xs text-text-secondary mb-4 max-w-xs mx-auto">
              Based on your hair profile, we&apos;ll create a personalized schedule
              of rituals and care days.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowGenerateDialog(true)}
              disabled={generateCalendar.isPending}
            >
              {generateCalendar.isPending ? (
                <>
                  <Icon name="timer" size="sm" className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon name="sparkle" size="sm" className="mr-2" />
                  Generate Calendar
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <GenerateCalendarDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          onGenerate={(weeks) => {
            generateCalendar.mutate({ weeksToGenerate: weeks });
            setShowGenerateDialog(false);
          }}
          isPending={generateCalendar.isPending}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon name="calendar" size="md" className="text-brand-purple" />
            Smart Calendar
          </span>
          {summary && (
            <Badge
              variant={
                summary.overdueCount > 0
                  ? "error"
                  : summary.streakDays > 3
                  ? "success"
                  : "default"
              }
              className="text-xs"
            >
              {summary.overdueCount > 0
                ? `${summary.overdueCount} overdue`
                : summary.streakDays > 0
                ? `${summary.streakDays} day streak`
                : "On track"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weekly Load Progress */}
        {summary && (
          <div className="p-3 bg-background-secondary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-secondary">This Week&apos;s Load</p>
              <p className="text-xs font-medium text-text-primary">
                {summary.completedThisWeek} completed
              </p>
            </div>
            <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.thisWeekLoad / summary.maxWeekLoad > 0.8
                    ? "bg-status-warning"
                    : summary.thisWeekLoad / summary.maxWeekLoad > 0.5
                    ? "bg-accent-gold"
                    : "bg-status-success"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (summary.thisWeekLoad / summary.maxWeekLoad) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">
              {summary.thisWeekLoad} / {summary.maxWeekLoad} load points
            </p>
          </div>
        )}

        {/* Next Ritual Card */}
        {summary?.nextRitual && (
          <div className="p-4 border border-brand-purple/20 bg-brand-purple/5 rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-text-secondary">Next Up</p>
                <p className="text-sm font-semibold text-text-primary">
                  {summary.nextRitual.name}
                </p>
              </div>
              <Badge variant={summary.nextRitual.isOverdue ? "error" : "default"}>
                {summary.nextRitual.isOverdue
                  ? "Overdue"
                  : summary.nextRitual.daysUntil === 0
                  ? "Today"
                  : summary.nextRitual.daysUntil === 1
                  ? "Tomorrow"
                  : `In ${summary.nextRitual.daysUntil} days`}
              </Badge>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedRitual(summary.nextRitual)}
              >
                <Icon name="success" size="sm" className="mr-1" />
                Done
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  skipEvent.mutate({ eventId: summary.nextRitual!.id });
                }}
                disabled={skipEvent.isPending}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Upcoming Rituals List */}
        {upcoming?.rituals && upcoming.rituals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">Coming Up</p>
            {upcoming.rituals.slice(0, 3).map((ritual) => (
              <div
                key={ritual.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  ritual.isOverdue
                    ? "bg-status-error/10 border border-status-error/20"
                    : "bg-background-secondary"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      ritual.isOverdue
                        ? "bg-status-error"
                        : ritual.loadLevel === "HEAVY"
                        ? "bg-status-warning"
                        : ritual.loadLevel === "STANDARD"
                        ? "bg-accent-gold"
                        : "bg-status-success"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {ritual.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatRitualDate(ritual.scheduledStart)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRitual(ritual)}
                >
                  <Icon name="chevronRight" size="sm" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* View Full Calendar */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push("/schedule")}
        >
          View Full Calendar
          <Icon name="chevronRight" size="sm" className="ml-1" />
        </Button>
      </CardContent>

      {/* Complete Ritual Dialog */}
      {selectedRitual && (
        <CompleteRitualDialog
          ritual={selectedRitual}
          open={!!selectedRitual}
          onOpenChange={(open) => !open && setSelectedRitual(null)}
          onComplete={(quality) => {
            completeEvent.mutate({ eventId: selectedRitual.id, quality });
            setSelectedRitual(null);
          }}
          isPending={completeEvent.isPending}
        />
      )}
    </Card>
  );
}

// Generate Calendar Dialog
function GenerateCalendarDialog({
  open,
  onOpenChange,
  onGenerate,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (weeks: number) => void;
  isPending: boolean;
}) {
  const [weeks, setWeeks] = useState(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Your Care Calendar</DialogTitle>
          <DialogDescription>
            We&apos;ll create a personalized schedule based on your hair profile,
            balancing rituals throughout the week.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium text-text-primary mb-3">
            How many weeks to plan?
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((w) => (
              <Button
                key={w}
                variant={weeks === w ? "primary" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setWeeks(w)}
              >
                {w} week{w > 1 ? "s" : ""}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onGenerate(weeks)}
            disabled={isPending}
          >
            {isPending ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Complete Ritual Dialog
function CompleteRitualDialog({
  ritual,
  open,
  onOpenChange,
  onComplete,
  isPending,
}: {
  ritual: UpcomingRitual;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (quality: "EXCELLENT" | "GOOD" | "ADEQUATE" | "POOR") => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete: {ritual.name}</DialogTitle>
          <DialogDescription>
            How did this ritual go? Your feedback helps optimize future recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          {(
            [
              { value: "EXCELLENT", label: "Excellent", icon: "sparkle", color: "text-status-success" },
              { value: "GOOD", label: "Good", icon: "favorite", color: "text-accent-gold" },
              { value: "ADEQUATE", label: "Adequate", icon: "info", color: "text-text-secondary" },
              { value: "POOR", label: "Poor", icon: "calmError", color: "text-status-warning" },
            ] as const
          ).map((option) => (
            <Button
              key={option.value}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onComplete(option.value)}
              disabled={isPending}
            >
              <Icon name={option.icon} size="md" className={`mr-3 ${option.color}`} />
              {option.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function
function formatRitualDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
