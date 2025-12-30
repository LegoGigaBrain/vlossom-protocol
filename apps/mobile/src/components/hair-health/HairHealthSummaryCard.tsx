/**
 * Hair Health Summary Card (V7.5.2 Mobile)
 *
 * Displays hair health status, next ritual, streak, and overdue count
 * on the profile screen.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/tokens';
import {
  VlossomHealthyIcon,
  VlossomGrowingIcon,
  VlossomRestingIcon,
  VlossomNeedsCareIcon,
  VlossomCalendarIcon,
  VlossomChevronRightIcon,
} from '../icons/VlossomIcons';
import type { HairProfile, HairHealthStatus } from '../../data/mock-data';

// =============================================================================
// Types
// =============================================================================

export interface NextRitual {
  type: string;
  title: string;
  date: string;
  daysUntil: number;
}

export interface HairHealthSummaryCardProps {
  profile: HairProfile;
  nextRitual: NextRitual | null;
  streakDays: number;
  overdueCount: number;
}

export interface HairHealthEmptyCardProps {
  onSetup?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getStatusIcon(status: HairHealthStatus, size: number = 32) {
  const props = { size, color: colors.primary };

  switch (status) {
    case 'EXCELLENT':
      return <VlossomHealthyIcon {...props} accent />;
    case 'GOOD':
      return <VlossomHealthyIcon {...props} />;
    case 'FAIR':
      return <VlossomGrowingIcon {...props} />;
    case 'NEEDS_CARE':
      return <VlossomNeedsCareIcon {...props} />;
    default:
      return <VlossomRestingIcon {...props} />;
  }
}

function getStatusLabel(status: HairHealthStatus): string {
  switch (status) {
    case 'EXCELLENT':
      return 'Excellent';
    case 'GOOD':
      return 'Good';
    case 'FAIR':
      return 'Fair';
    case 'NEEDS_CARE':
      return 'Needs Care';
    default:
      return 'Unknown';
  }
}

function getStatusColor(status: HairHealthStatus): string {
  switch (status) {
    case 'EXCELLENT':
      return colors.accent;
    case 'GOOD':
      return colors.status.success;
    case 'FAIR':
      return colors.status.warning;
    case 'NEEDS_CARE':
      return colors.status.error;
    default:
      return colors.text.secondary;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// =============================================================================
// Hair Health Summary Card
// =============================================================================

export function HairHealthSummaryCard({
  profile,
  nextRitual,
  streakDays,
  overdueCount,
}: HairHealthSummaryCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push('/hair-health');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Hair health: ${getStatusLabel(profile.status)}. Tap to view details.`}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {getStatusIcon(profile.status)}
          <View style={styles.titleContent}>
            <Text style={styles.title}>Hair Health</Text>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(profile.status) },
              ]}
            >
              {getStatusLabel(profile.status)}
            </Text>
          </View>
        </View>
        <VlossomChevronRightIcon size={20} color={colors.text.tertiary} />
      </View>

      {/* Health Score */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreFill,
              {
                width: `${profile.healthScore}%`,
                backgroundColor: getStatusColor(profile.status),
              },
            ]}
          />
        </View>
        <Text style={styles.scoreText}>{profile.healthScore}%</Text>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        {/* Hair Type */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue}>{profile.hairType}</Text>
        </View>

        {/* Streak */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Streak</Text>
          <Text style={[styles.infoValue, streakDays > 7 && styles.infoValueHighlight]}>
            {streakDays} days
          </Text>
        </View>

        {/* Overdue */}
        {overdueCount > 0 && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Overdue</Text>
            <Text style={[styles.infoValue, styles.infoValueWarning]}>
              {overdueCount} task{overdueCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Next Ritual */}
      {nextRitual && (
        <View style={styles.nextRitual}>
          <VlossomCalendarIcon size={16} color={colors.primary} />
          <Text style={styles.nextRitualText}>
            <Text style={styles.nextRitualLabel}>Next: </Text>
            {nextRitual.title}
            {nextRitual.daysUntil <= 3 && (
              <Text style={styles.nextRitualSoon}>
                {' '}
                ({nextRitual.daysUntil === 0
                  ? 'Today'
                  : nextRitual.daysUntil === 1
                    ? 'Tomorrow'
                    : `in ${nextRitual.daysUntil} days`})
              </Text>
            )}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// =============================================================================
// Hair Health Empty Card
// =============================================================================

export function HairHealthEmptyCard({ onSetup }: HairHealthEmptyCardProps) {
  const router = useRouter();

  const handleSetup = () => {
    if (onSetup) {
      onSetup();
    } else {
      router.push('/hair-health/setup');
    }
  };

  return (
    <Pressable
      onPress={handleSetup}
      style={({ pressed }) => [
        styles.emptyCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Set up your hair profile"
    >
      <View style={styles.emptyIconContainer}>
        <VlossomGrowingIcon size={48} color={colors.primarySoft} />
      </View>
      <Text style={styles.emptyTitle}>Track Your Hair Health</Text>
      <Text style={styles.emptyDescription}>
        Set up your hair profile to get personalized care reminders and track your hair journey.
      </Text>
      <View style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Get Started</Text>
      </View>
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleContent: {
    gap: spacing.xs / 2,
  },
  title: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  statusText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.medium,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: borderRadius.pill,
  },
  scoreText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  infoItem: {
    gap: spacing.xs / 2,
  },
  infoLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  infoValue: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  infoValueHighlight: {
    color: colors.status.success,
  },
  infoValueWarning: {
    color: colors.status.warning,
  },
  nextRitual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  nextRitualText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  nextRitualLabel: {
    fontWeight: typography.fontWeight.medium,
  },
  nextRitualSoon: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },

  // Empty Card Styles
  emptyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
  },
  emptyButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default HairHealthSummaryCard;
