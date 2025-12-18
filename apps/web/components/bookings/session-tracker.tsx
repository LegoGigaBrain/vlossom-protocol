/**
 * Session Tracker Component (V5.1)
 *
 * Simplified session progress tracking with three clear states:
 * - Started: Stylist has begun the session
 * - In Progress: Service is being performed
 * - Complete: Session has ended
 *
 * UX optimized for clarity and reduced cognitive load.
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLiveUpdates, useSessionProgress } from "@/hooks/use-live-updates";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";

// Simplified session states
type SessionState = "not_started" | "started" | "in_progress" | "complete";

interface SessionTrackerProps {
  bookingId: string;
  /** Optional callback when session state changes */
  onStateChange?: (state: SessionState) => void;
  /** Show compact version */
  compact?: boolean;
  className?: string;
}

export function SessionTracker({
  bookingId,
  onStateChange,
  compact = false,
  className,
}: SessionTrackerProps) {
  const [sessionState, setSessionState] = useState<SessionState>("not_started");

  // Live updates via SSE
  const {
    isConnected,
    isReconnecting,
    sessionProgress,
    connect,
  } = useLiveUpdates({
    bookingId,
    onProgress: (progress) => {
      // Map progress to simplified states
      if (progress.progressPercent === 100) {
        setSessionState("complete");
      } else if (progress.progressPercent && progress.progressPercent > 0) {
        setSessionState("in_progress");
      } else if (progress.currentStep) {
        setSessionState("started");
      }
    },
    onArrived: () => {
      setSessionState("started");
    },
    onSessionEnded: () => {
      setSessionState("complete");
    },
  });

  // Fallback polling for session progress
  const { progress: polledProgress, refetch } = useSessionProgress(
    !isConnected ? bookingId : null
  );

  // Sync polled progress to state
  useEffect(() => {
    if (polledProgress && !isConnected) {
      if (polledProgress.progressPercent === 100) {
        setSessionState("complete");
      } else if (polledProgress.progressPercent && polledProgress.progressPercent > 0) {
        setSessionState("in_progress");
      } else {
        setSessionState("started");
      }
    }
  }, [polledProgress, isConnected]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(sessionState);
  }, [sessionState, onStateChange]);

  // ETA display
  const eta = sessionProgress?.etaMinutes || polledProgress?.etaMinutes;
  const progressPercent = sessionProgress?.progressPercent || polledProgress?.progressPercent || 0;

  // Compact version for inline display
  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        role="status"
        aria-live="polite"
      >
        <SessionStateIcon state={sessionState} size="sm" />
        <span className="text-sm font-medium text-text-primary">
          {getStateLabel(sessionState)}
        </span>
        {sessionState === "in_progress" && progressPercent > 0 && (
          <span className="text-sm text-text-secondary">
            ({progressPercent}%)
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-background-primary rounded-xl p-4 shadow-sm border border-border-default",
        className
      )}
      role="region"
      aria-label="Session progress"
    >
      {/* Connection Status */}
      {!isConnected && !isReconnecting && (
        <div className="flex items-center justify-between mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Icon name="web" size="sm" aria-hidden="true" />
            <span className="text-sm">Live updates unavailable</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              connect();
              refetch();
            }}
            className="h-7 px-2"
            aria-label="Retry connection"
          >
            <Icon name="refresh" size="xs" className="mr-1" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {isReconnecting && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
          <Icon name="loading" size="sm" className="animate-spin" aria-hidden="true" />
          <span className="text-sm">Reconnecting...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Session Progress
        </h3>
        {isConnected && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            Live
          </span>
        )}
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div
          className="absolute left-4 top-6 w-0.5 h-[calc(100%-3rem)] bg-border-default"
          aria-hidden="true"
        />
        <div
          className="absolute left-4 top-6 w-0.5 transition-all duration-500 bg-brand-rose"
          style={{
            height: `${getProgressLineHeight(sessionState)}%`,
            maxHeight: "calc(100% - 3rem)",
          }}
          aria-hidden="true"
        />

        {/* Steps */}
        <ul className="space-y-6" role="list">
          <SessionStep
            state={sessionState}
            stepState="started"
            label="Session Started"
            description="Your stylist has arrived and begun"
            icon={<Icon name="circle" size="sm" />}
            activeIcon={<Icon name="check" size="sm" />}
          />
          <SessionStep
            state={sessionState}
            stepState="in_progress"
            label="In Progress"
            description={
              progressPercent > 0
                ? `${progressPercent}% complete${eta ? ` • ~${eta} min remaining` : ""}`
                : "Service is being performed"
            }
            icon={<Icon name="clock" size="sm" />}
            activeIcon={<Icon name="loading" size="sm" className="animate-spin" />}
            showProgress={sessionState === "in_progress"}
            progressPercent={progressPercent}
          />
          <SessionStep
            state={sessionState}
            stepState="complete"
            label="Complete"
            description="Session has ended successfully"
            icon={<Icon name="check" size="sm" />}
            activeIcon={<Icon name="check" size="sm" />}
          />
        </ul>
      </div>

      {/* ETA Card (only show during in_progress) */}
      {sessionState === "in_progress" && eta && eta > 0 && (
        <div className="mt-4 p-3 bg-brand-rose/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="clock" size="sm" className="text-brand-rose" aria-hidden="true" />
            <span className="text-sm font-medium text-brand-rose">
              Estimated completion in {eta} minutes
            </span>
          </div>
        </div>
      )}

      {/* Location indicator (if available) */}
      {sessionProgress?.lat && sessionProgress?.lng && sessionState !== "complete" && (
        <div className="mt-4 p-3 bg-background-secondary rounded-lg">
          <div className="flex items-center gap-2 text-text-secondary">
            <Icon name="pin" size="sm" aria-hidden="true" />
            <span className="text-sm">Stylist location available</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Session Step Component
interface SessionStepProps {
  state: SessionState;
  stepState: "started" | "in_progress" | "complete";
  label: string;
  description: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  showProgress?: boolean;
  progressPercent?: number;
}

function SessionStep({
  state,
  stepState,
  label,
  description,
  icon,
  activeIcon,
  showProgress,
  progressPercent = 0,
}: SessionStepProps) {
  const isCompleted = getStepIndex(state) > getStepIndex(stepState);
  const isActive = state === stepState;
  const isPending = getStepIndex(state) < getStepIndex(stepState);

  return (
    <li className="flex items-start gap-3 relative">
      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors",
          isCompleted && "bg-brand-rose text-white",
          isActive && "bg-brand-rose/20 text-brand-rose",
          isPending && "bg-background-secondary text-text-tertiary"
        )}
        aria-hidden="true"
      >
        {isCompleted ? activeIcon : isActive ? activeIcon : icon}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <p
          className={cn(
            "font-medium transition-colors",
            isCompleted && "text-text-primary",
            isActive && "text-brand-rose",
            isPending && "text-text-tertiary"
          )}
        >
          {label}
        </p>
        <p className="text-sm text-text-secondary mt-0.5">{description}</p>

        {/* Progress bar for in_progress step */}
        {showProgress && progressPercent > 0 && (
          <div className="mt-2 h-1.5 bg-background-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-rose rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPercent}% complete`}
            />
          </div>
        )}
      </div>
    </li>
  );
}

// State Icon for compact display
function SessionStateIcon({
  state,
  size = "md",
}: {
  state: SessionState;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "xs" : "sm";

  switch (state) {
    case "not_started":
      return <Icon name="circle" size={iconSize} className="text-text-tertiary" aria-hidden="true" />;
    case "started":
      return <Icon name="circle" size={iconSize} className="text-brand-rose" aria-hidden="true" />;
    case "in_progress":
      return <Icon name="loading" size={iconSize} className="text-brand-rose animate-spin" aria-hidden="true" />;
    case "complete":
      return <Icon name="check" size={iconSize} className="text-green-500" aria-hidden="true" />;
  }
}

// Helper functions
function getStateLabel(state: SessionState): string {
  switch (state) {
    case "not_started":
      return "Waiting to start";
    case "started":
      return "Session started";
    case "in_progress":
      return "In progress";
    case "complete":
      return "Complete";
  }
}

function getStepIndex(state: SessionState | "started" | "in_progress" | "complete"): number {
  switch (state) {
    case "not_started":
      return 0;
    case "started":
      return 1;
    case "in_progress":
      return 2;
    case "complete":
      return 3;
  }
}

function getProgressLineHeight(state: SessionState): number {
  switch (state) {
    case "not_started":
      return 0;
    case "started":
      return 33;
    case "in_progress":
      return 66;
    case "complete":
      return 100;
  }
}

// Export simplified session state type
export type { SessionState };
