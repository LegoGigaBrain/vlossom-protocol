"use client";

import { cn } from "@vlossom/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReputationBadge } from "./reputation-badge";

interface ReputationScoreData {
  totalScore: number;
  tpsScore: number;
  reliabilityScore: number;
  feedbackScore: number;
  disputeScore: number;
  completedBookings: number;
  cancelledBookings: number;
  isVerified: boolean;
}

interface ReputationCardProps {
  score: ReputationScoreData;
  userName?: string;
  className?: string;
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-vlossom-neutral-600">{label}</span>
        <span className="font-medium text-vlossom-neutral-900">
          {(value / 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-vlossom-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value / 100}%` }}
        />
      </div>
    </div>
  );
}

export function ReputationCard({
  score,
  userName,
  className,
}: ReputationCardProps) {
  const totalPercent = score.totalScore / 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reputation Score</span>
          {userName && (
            <span className="text-sm font-normal text-vlossom-neutral-500">
              {userName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main score display */}
        <div className="flex items-center gap-4">
          <ReputationBadge
            score={Math.round(totalPercent)}
            size="lg"
            showLabel
            isVerified={score.isVerified}
          />
          <div className="flex-1">
            <div className="text-3xl font-bold text-vlossom-neutral-900">
              {totalPercent.toFixed(1)}%
            </div>
            <div className="text-sm text-vlossom-neutral-500">
              Overall Reputation
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-4">
          <ScoreBar
            label="Time Performance (TPS)"
            value={score.tpsScore}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Reliability"
            value={score.reliabilityScore}
            color="bg-green-500"
          />
          <ScoreBar
            label="Customer Feedback"
            value={score.feedbackScore}
            color="bg-yellow-500"
          />
          <ScoreBar
            label="Dispute-Free"
            value={score.disputeScore}
            color="bg-purple-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-vlossom-neutral-100">
          <div>
            <div className="text-2xl font-bold text-vlossom-neutral-900">
              {score.completedBookings}
            </div>
            <div className="text-sm text-vlossom-neutral-500">
              Completed Bookings
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-vlossom-neutral-900">
              {Math.round(
                (score.completedBookings /
                  (score.completedBookings + score.cancelledBookings || 1)) *
                  100
              )}
              %
            </div>
            <div className="text-sm text-vlossom-neutral-500">
              Completion Rate
            </div>
          </div>
        </div>

        {/* Score weights info */}
        <div className="text-xs text-vlossom-neutral-400 pt-4 border-t border-vlossom-neutral-100">
          <div className="font-medium mb-1">Score Weights:</div>
          <div className="flex flex-wrap gap-x-4">
            <span>TPS: 30%</span>
            <span>Reliability: 30%</span>
            <span>Feedback: 30%</span>
            <span>Disputes: 10%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
