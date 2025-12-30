/**
 * TPSBreakdown Component (V7.5.2)
 *
 * Displays Trust, Performance, and Safety score breakdown.
 * Used on stylist profile pages to show reputation details.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../styles/tokens';

export interface TPSScore {
  trust: number;
  performance: number;
  safety: number;
  overall: number;
}

export interface ReputationScoreData {
  totalScore: number;
  tpsScore: number;
  reliabilityScore: number;
  feedbackScore: number;
  disputeScore: number;
  completedBookings: number;
  cancelledBookings: number;
  isVerified: boolean;
}

export interface TPSBreakdownProps {
  /**
   * TPS scores object (simple format)
   */
  scores?: TPSScore;
  /**
   * Reputation score data (full format)
   */
  score?: ReputationScoreData;
  /**
   * Show detailed breakdown
   */
  detailed?: boolean;
  /**
   * Display variant
   */
  variant?: 'default' | 'compact' | 'detailed';
  /**
   * Additional container styles
   */
  style?: ViewStyle;
}

function getScoreColor(score: number): string {
  // Score is 0-10000 scale (8500 = 85%)
  const percentage = score > 100 ? score / 100 : score;
  if (percentage >= 90) return colors.status.success;
  if (percentage >= 70) return colors.status.warning;
  return colors.status.error;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const percentage = score > 100 ? score / 100 : score;
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: getScoreColor(score) },
          ]}
        />
      </View>
      <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
        {Math.round(percentage)}
      </Text>
    </View>
  );
}

export function TPSBreakdown({
  scores,
  score,
  detailed = false,
  variant = 'default',
  style,
}: TPSBreakdownProps) {
  // Handle ReputationScoreData format
  if (score) {
    const displayScore = Math.round(score.tpsScore / 100);
    const isCompact = variant === 'compact';

    if (isCompact) {
      return (
        <View style={[styles.compactContainer, style]}>
          <Text style={styles.compactLabel}>TPS</Text>
          <Text style={[styles.compactScore, { color: getScoreColor(score.tpsScore) }]}>
            {displayScore}
          </Text>
          {score.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        {/* Overall Score */}
        <View style={styles.overallContainer}>
          <Text style={styles.overallLabel}>TPS Score</Text>
          <Text style={[styles.overallScore, { color: getScoreColor(score.tpsScore) }]}>
            {displayScore}
          </Text>
        </View>

        {/* Breakdown */}
        {(variant === 'detailed' || detailed) && (
          <View style={styles.breakdown}>
            <ScoreBar label="Reliability" score={score.reliabilityScore} />
            <ScoreBar label="Feedback" score={score.feedbackScore} />
            <ScoreBar label="Disputes" score={score.disputeScore} />
          </View>
        )}

        {/* Stats */}
        {(variant === 'detailed' || detailed) && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score.completedBookings}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score.cancelledBookings}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Handle simple TPSScore format
  if (scores) {
    return (
      <View style={[styles.container, style]}>
        {/* Overall Score */}
        <View style={styles.overallContainer}>
          <Text style={styles.overallLabel}>TPS Score</Text>
          <Text style={[styles.overallScore, { color: getScoreColor(scores.overall) }]}>
            {scores.overall}
          </Text>
        </View>

        {/* Breakdown */}
        {(variant === 'detailed' || detailed) && (
          <View style={styles.breakdown}>
            <ScoreBar label="Trust" score={scores.trust} />
            <ScoreBar label="Performance" score={scores.performance} />
            <ScoreBar label="Safety" score={scores.safety} />
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  compactScore: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  overallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  overallLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  overallScore: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
  },
  breakdown: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border.default,
    borderRadius: borderRadius.pill,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.pill,
  },
  scoreValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    width: 30,
    textAlign: 'right',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
  },
});

export default TPSBreakdown;
