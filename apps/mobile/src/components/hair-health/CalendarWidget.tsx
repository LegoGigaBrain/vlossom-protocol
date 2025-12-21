/**
 * Calendar Intelligence Widget (V6.9 Mobile)
 *
 * React Native smart calendar widget for hair health.
 * Shows upcoming rituals, weekly load, and quick actions.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme, textStyles } from '../../styles/theme';
import {
  VlossomCalendarIcon,
  VlossomHealthyIcon,
  VlossomGrowingIcon,
  VlossomCloseIcon,
} from '../icons/VlossomIcons';
import {
  useHairHealthStore,
  selectCalendarSummary,
  selectUpcomingRituals,
  selectCalendarLoading,
  selectHasCalendarEvents,
} from '../../stores';
import { formatRitualDate, type UpcomingRitual } from '../../api/hair-health';

export function CalendarWidget() {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedRitual, setSelectedRitual] = useState<UpcomingRitual | null>(null);

  // Store state
  const summary = useHairHealthStore(selectCalendarSummary);
  const upcomingRituals = useHairHealthStore(selectUpcomingRituals);
  const isLoading = useHairHealthStore(selectCalendarLoading);
  const hasEvents = useHairHealthStore(selectHasCalendarEvents);
  const { generateCalendarEvents, completeRitual, skipRitual } = useHairHealthStore();

  // Loading state
  if (isLoading && !summary) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, ...shadows.card },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[textStyles.bodySmall, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
            Loading calendar...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state - prompt to generate
  if (!hasEvents && !summary?.nextRitual) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, ...shadows.card },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <VlossomCalendarIcon size={20} color={colors.primary} />
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginLeft: spacing.sm }]}>
              Smart Calendar
            </Text>
          </View>
        </View>

        {/* Empty State Content */}
        <View style={styles.emptyContent}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.primary + '15', borderRadius: borderRadius.circle },
            ]}
          >
            <VlossomCalendarIcon size={32} color={colors.primary} />
          </View>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.md }]}>
            Generate Your Care Calendar
          </Text>
          <Text
            style={[
              textStyles.caption,
              { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.lg },
            ]}
          >
            Based on your hair profile, we'll create a personalized schedule of rituals and care days.
          </Text>
          <Pressable
            onPress={() => setShowGenerateModal(true)}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing.lg },
            ]}
          >
            <VlossomGrowingIcon size={16} color={colors.white} />
            <Text style={[textStyles.button, { color: colors.white, marginLeft: spacing.xs }]}>
              Generate Calendar
            </Text>
          </Pressable>
        </View>

        {/* Generate Modal */}
        <GenerateCalendarModal
          visible={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={async (weeks) => {
            await generateCalendarEvents(weeks);
            setShowGenerateModal(false);
          }}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
      </View>
    );
  }

  // Full widget with calendar data
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, ...shadows.card },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <VlossomCalendarIcon size={20} color={colors.primary} />
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginLeft: spacing.sm }]}>
            Smart Calendar
          </Text>
        </View>
        {summary && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  summary.overdueCount > 0
                    ? colors.status.error + '20'
                    : summary.streakDays > 3
                    ? colors.status.success + '20'
                    : colors.primary + '15',
                borderRadius: borderRadius.pill,
              },
            ]}
          >
            <Text
              style={[
                textStyles.caption,
                {
                  color:
                    summary.overdueCount > 0
                      ? colors.status.error
                      : summary.streakDays > 3
                      ? colors.status.success
                      : colors.primary,
                },
              ]}
            >
              {summary.overdueCount > 0
                ? `${summary.overdueCount} overdue`
                : summary.streakDays > 0
                ? `${summary.streakDays} day streak`
                : 'On track'}
            </Text>
          </View>
        )}
      </View>

      {/* Weekly Load Progress */}
      {summary && (
        <View style={[styles.loadSection, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md }]}>
          <View style={styles.loadHeader}>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>This Week's Load</Text>
            <Text style={[textStyles.caption, { color: colors.text.primary, fontWeight: '600' }]}>
              {summary.completedThisWeek} completed
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface.light }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    summary.thisWeekLoad / summary.maxWeekLoad > 0.8
                      ? colors.status.warning
                      : summary.thisWeekLoad / summary.maxWeekLoad > 0.5
                      ? colors.accentGold
                      : colors.status.success,
                  width: `${Math.min(100, (summary.thisWeekLoad / summary.maxWeekLoad) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
            {summary.thisWeekLoad} / {summary.maxWeekLoad} load points
          </Text>
        </View>
      )}

      {/* Next Ritual Card */}
      {summary?.nextRitual && (
        <View
          style={[
            styles.nextRitualCard,
            {
              backgroundColor: colors.primary + '08',
              borderColor: colors.primary + '30',
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.nextRitualHeader}>
            <View>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Next Up</Text>
              <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
                {summary.nextRitual.name}
              </Text>
            </View>
            <View
              style={[
                styles.timeBadge,
                {
                  backgroundColor: summary.nextRitual.isOverdue ? colors.status.error + '20' : colors.background.secondary,
                  borderRadius: borderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: summary.nextRitual.isOverdue ? colors.status.error : colors.text.primary },
                ]}
              >
                {summary.nextRitual.isOverdue
                  ? 'Overdue'
                  : summary.nextRitual.daysUntil === 0
                  ? 'Today'
                  : summary.nextRitual.daysUntil === 1
                  ? 'Tomorrow'
                  : `In ${summary.nextRitual.daysUntil} days`}
              </Text>
            </View>
          </View>
          <View style={styles.nextRitualActions}>
            <Pressable
              onPress={() => setSelectedRitual(summary.nextRitual)}
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary, borderRadius: borderRadius.md, flex: 1 },
              ]}
            >
              <VlossomHealthyIcon size={16} color={colors.white} />
              <Text style={[textStyles.button, { color: colors.white, marginLeft: spacing.xs }]}>Done</Text>
            </Pressable>
            <Pressable
              onPress={() => skipRitual(summary.nextRitual!.id)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  flex: 1,
                  marginLeft: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.button, { color: colors.text.secondary }]}>Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Upcoming Rituals List */}
      {upcomingRituals.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={[textStyles.caption, { color: colors.text.secondary, fontWeight: '600', marginBottom: spacing.sm }]}>
            Coming Up
          </Text>
          {upcomingRituals.slice(0, 3).map((ritual) => (
            <Pressable
              key={ritual.id}
              onPress={() => setSelectedRitual(ritual)}
              style={[
                styles.ritualItem,
                {
                  backgroundColor: ritual.isOverdue ? colors.status.error + '10' : colors.background.secondary,
                  borderColor: ritual.isOverdue ? colors.status.error + '30' : 'transparent',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <View style={styles.ritualItemContent}>
                <View
                  style={[
                    styles.loadIndicator,
                    {
                      backgroundColor: ritual.isOverdue
                        ? colors.status.error
                        : ritual.loadLevel === 'HEAVY'
                        ? colors.status.warning
                        : ritual.loadLevel === 'STANDARD'
                        ? colors.accentGold
                        : colors.status.success,
                    },
                  ]}
                />
                <View style={styles.ritualInfo}>
                  <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '500' }]}>
                    {ritual.name}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    {formatRitualDate(ritual.scheduledStart)}
                  </Text>
                </View>
              </View>
              <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Complete Ritual Modal */}
      {selectedRitual && (
        <CompleteRitualModal
          ritual={selectedRitual}
          visible={!!selectedRitual}
          onClose={() => setSelectedRitual(null)}
          onComplete={async (quality) => {
            await completeRitual(selectedRitual.id, quality);
            setSelectedRitual(null);
          }}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
      )}
    </View>
  );
}

// Generate Calendar Modal
interface GenerateCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (weeks: number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function GenerateCalendarModal({
  visible,
  onClose,
  onGenerate,
  colors,
  spacing,
  borderRadius,
}: GenerateCalendarModalProps) {
  const [weeks, setWeeks] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate(weeks);
    setIsGenerating(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>Generate Your Care Calendar</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <VlossomCloseIcon size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Description */}
          <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            We'll create a personalized schedule based on your hair profile, balancing rituals throughout the week.
          </Text>

          {/* Week Selector */}
          <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.xl }]}>
            How many weeks to plan?
          </Text>
          <View style={[styles.weekSelector, { marginTop: spacing.md }]}>
            {[1, 2, 3, 4].map((w) => (
              <Pressable
                key={w}
                onPress={() => setWeeks(w)}
                style={[
                  styles.weekOption,
                  {
                    backgroundColor: weeks === w ? colors.primary : colors.background.secondary,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    textStyles.button,
                    { color: weeks === w ? colors.white : colors.text.primary },
                  ]}
                >
                  {w} week{w > 1 ? 's' : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Actions */}
          <View style={[styles.modalActions, { marginTop: spacing.xl }]}>
            <Pressable
              onPress={onClose}
              style={[
                styles.modalButton,
                { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, flex: 1 },
              ]}
            >
              <Text style={[textStyles.button, { color: colors.text.primary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating}
              style={[
                styles.modalButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  flex: 1,
                  marginLeft: spacing.sm,
                  opacity: isGenerating ? 0.6 : 1,
                },
              ]}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[textStyles.button, { color: colors.white }]}>Generate</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Complete Ritual Modal
interface CompleteRitualModalProps {
  ritual: UpcomingRitual;
  visible: boolean;
  onClose: () => void;
  onComplete: (quality: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR') => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function CompleteRitualModal({
  ritual,
  visible,
  onClose,
  onComplete,
  colors,
  spacing,
  borderRadius,
}: CompleteRitualModalProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async (quality: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR') => {
    setIsCompleting(true);
    await onComplete(quality);
    setIsCompleting(false);
  };

  const options = [
    { value: 'EXCELLENT' as const, label: 'Excellent', color: colors.status.success },
    { value: 'GOOD' as const, label: 'Good', color: colors.accentGold },
    { value: 'ADEQUATE' as const, label: 'Adequate', color: colors.text.secondary },
    { value: 'POOR' as const, label: 'Poor', color: colors.status.warning },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[textStyles.h3, { color: colors.text.primary }]} numberOfLines={1}>
              Complete: {ritual.name}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <VlossomCloseIcon size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Description */}
          <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            How did this ritual go? Your feedback helps optimize future recommendations.
          </Text>

          {/* Quality Options */}
          <View style={[styles.qualityOptions, { marginTop: spacing.lg }]}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleComplete(option.value)}
                disabled={isCompleting}
                style={[
                  styles.qualityOption,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    opacity: isCompleting ? 0.6 : 1,
                  },
                ]}
              >
                <View style={[styles.qualityDot, { backgroundColor: option.color }]} />
                <Text style={[textStyles.body, { color: colors.text.primary, marginLeft: spacing.md }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loadSection: {
    padding: 12,
    marginBottom: 12,
  },
  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextRitualCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  nextRitualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nextRitualActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  upcomingSection: {
    marginTop: 4,
  },
  ritualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  ritualItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ritualInfo: {
    marginLeft: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  weekOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  qualityOptions: {
    gap: 8,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  qualityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
