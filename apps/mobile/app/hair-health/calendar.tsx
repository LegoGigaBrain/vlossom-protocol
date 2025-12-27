/**
 * Hair Health Calendar Screen (V7.2.0)
 *
 * Full calendar view with:
 * - Month/Week/Day view switcher
 * - Navigation (prev/next month, today button)
 * - Ritual event management
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomCalendarIcon,
  VlossomHealthyIcon,
  VlossomGrowingIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import {
  CalendarMonthView,
  CalendarWeekView,
  CalendarDayView,
} from '../../src/components/calendar';
import {
  useHairHealthStore,
  selectCalendarEvents,
  selectSelectedDate,
  selectViewMode,
  selectCalendarMonth,
  selectCalendarLoading,
  selectHasCalendarEvents,
  useDemoModeStore,
  selectIsDemoMode,
  type CalendarViewMode,
  type CalendarEventFull,
} from '../../src/stores';
import { MOCK_CALENDAR_EVENTS } from '../../src/data/mock-data';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Demo mode
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Store state
  const storeEvents = useHairHealthStore(selectCalendarEvents);
  const selectedDate = useHairHealthStore(selectSelectedDate);
  const viewMode = useHairHealthStore(selectViewMode);
  const calendarMonth = useHairHealthStore(selectCalendarMonth);
  const isLoading = useHairHealthStore(selectCalendarLoading);
  const hasEvents = useHairHealthStore(selectHasCalendarEvents);

  const {
    setSelectedDate,
    setViewMode,
    setCalendarMonth,
    fetchCalendarEvents,
    completeRitual,
    skipRitual,
    generateCalendarEvents,
  } = useHairHealthStore();

  // Local state for complete modal
  const [selectedRitual, setSelectedRitual] = useState<CalendarEventFull | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Use mock data in demo mode
  const events: CalendarEventFull[] = useMemo(() => {
    if (isDemoMode) {
      return MOCK_CALENDAR_EVENTS;
    }
    return storeEvents;
  }, [isDemoMode, storeEvents]);

  // Fetch events on mount
  useEffect(() => {
    if (!isDemoMode) {
      const startDate = `${calendarMonth}-01`;
      const endDate = getMonthEnd(calendarMonth);
      fetchCalendarEvents(startDate, endDate);
    }
  }, [calendarMonth, isDemoMode, fetchCalendarEvents]);

  // Get events for selected date (for day view)
  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => e.date === selectedDate);
  }, [events, selectedDate]);

  // Get week start for week view
  const weekStart = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    return date.toISOString().split('T')[0];
  }, [selectedDate]);

  // Navigation handlers
  const handleBack = () => router.back();

  const handlePrevMonth = () => {
    const [year, month] = calendarMonth.split('-').map(Number);
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    setCalendarMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = calendarMonth.split('-').map(Number);
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    setCalendarMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarMonth(today.toISOString().slice(0, 7));
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    // Auto-switch to day view when selecting a date in month view
    if (viewMode === 'month') {
      setViewMode('day');
    }
  };

  const handleCompleteRitual = async (eventId: string) => {
    // Find the ritual to show modal
    const ritual = events.find((e) => e.id === eventId);
    if (ritual) {
      setSelectedRitual(ritual);
    }
  };

  const handleConfirmComplete = async (quality: 'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'POOR') => {
    if (selectedRitual) {
      if (!isDemoMode) {
        await completeRitual(selectedRitual.id, quality);
      }
      setSelectedRitual(null);
    }
  };

  const handleSkipRitual = async (eventId: string) => {
    Alert.alert(
      'Skip Ritual',
      'Are you sure you want to skip this ritual?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            if (!isDemoMode) {
              await skipRitual(eventId);
            }
          },
        },
      ]
    );
  };

  const handlePressRitual = (event: CalendarEventFull) => {
    // Could navigate to ritual detail or show modal
    if (!event.isCompleted && !event.isSkipped) {
      setSelectedRitual(event);
    }
  };

  const handleGenerate = async (weeks: number) => {
    if (!isDemoMode) {
      await generateCalendarEvents(weeks);
    }
    setShowGenerateModal(false);
  };

  // Format month for display
  const monthLabel = formatMonth(calendarMonth);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to hair health dashboard"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}
          accessibilityRole="header"
        >
          Care Calendar
        </Text>
        <Pressable
          onPress={() => setShowGenerateModal(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Generate calendar"
          accessibilityHint="Double tap to create a personalized care schedule"
        >
          <VlossomGrowingIcon size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <Pressable
          onPress={handlePrevMonth}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          accessibilityHint="Navigate to the previous month"
        >
          <Text style={[textStyles.h3, { color: colors.text.secondary }]} aria-hidden>‹</Text>
        </Pressable>
        <Pressable
          onPress={handleToday}
          style={styles.monthLabel}
          accessibilityRole="button"
          accessibilityLabel={`${monthLabel}, double tap to go to today`}
        >
          <Text style={[textStyles.h3, { color: colors.text.primary }]}>{monthLabel}</Text>
        </Pressable>
        <Pressable
          onPress={handleNextMonth}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityHint="Navigate to the next month"
        >
          <Text style={[textStyles.h3, { color: colors.text.secondary }]} aria-hidden>›</Text>
        </Pressable>
      </View>

      {/* View Mode Tabs */}
      <View
        style={[styles.viewTabs, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg }]}
        accessibilityRole="tablist"
        accessibilityLabel="Calendar view mode"
      >
        {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[
              styles.viewTab,
              viewMode === mode && {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.md,
                ...shadows.card,
              },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
            accessibilityState={{ selected: viewMode === mode }}
          >
            <Text
              style={[
                textStyles.bodySmall,
                {
                  color: viewMode === mode ? colors.primary : colors.text.secondary,
                  fontWeight: viewMode === mode ? '600' : '400',
                },
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Calendar Content */}
      <View style={styles.content}>
        {isLoading && events.length === 0 ? (
          <View
            style={styles.loadingContainer}
            accessible
            accessibilityLabel="Loading calendar"
            accessibilityRole="progressbar"
          >
            <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
            <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>
              Loading calendar...
            </Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primary + '15', borderRadius: borderRadius.circle },
              ]}
              aria-hidden
            >
              <VlossomCalendarIcon size={48} color={colors.primary} />
            </View>
            <Text
              style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
              accessibilityRole="header"
            >
              No Rituals Scheduled
            </Text>
            <Text
              style={[
                textStyles.body,
                { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
              ]}
            >
              Generate your personalized care calendar based on your hair profile
            </Text>
            <Pressable
              onPress={() => setShowGenerateModal(true)}
              style={[
                styles.generateButton,
                { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing.xl },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Generate Calendar"
              accessibilityHint="Double tap to create a personalized care schedule"
            >
              <VlossomGrowingIcon size={16} color={colors.white} aria-hidden />
              <Text style={[textStyles.button, { color: colors.white, marginLeft: spacing.xs }]}>
                Generate Calendar
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {viewMode === 'month' && (
              <CalendarMonthView
                month={calendarMonth}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            )}
            {viewMode === 'week' && (
              <CalendarWeekView
                weekStart={weekStart}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onCompleteRitual={handleCompleteRitual}
                onSkipRitual={handleSkipRitual}
                onPressRitual={handlePressRitual}
              />
            )}
            {viewMode === 'day' && (
              <CalendarDayView
                date={selectedDate}
                events={selectedDateEvents}
                onCompleteRitual={handleCompleteRitual}
                onSkipRitual={handleSkipRitual}
                onPressRitual={handlePressRitual}
              />
            )}
          </>
        )}
      </View>

      {/* Complete Ritual Modal */}
      {selectedRitual && (
        <CompleteRitualModal
          ritual={selectedRitual}
          visible={!!selectedRitual}
          onClose={() => setSelectedRitual(null)}
          onComplete={handleConfirmComplete}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
      )}

      {/* Generate Calendar Modal */}
      <GenerateCalendarModal
        visible={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerate}
        colors={colors}
        spacing={spacing}
        borderRadius={borderRadius}
      />
    </View>
  );
}

// Helper functions
function getMonthEnd(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0);
  return lastDay.toISOString().split('T')[0];
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Complete Ritual Modal
interface CompleteRitualModalProps {
  ritual: CalendarEventFull;
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
          accessible
          accessibilityViewIsModal
          accessibilityLabel={`Complete ritual: ${ritual.title}. Select how well this ritual went.`}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[textStyles.h3, { color: colors.text.primary }]}
              numberOfLines={1}
              accessibilityRole="header"
            >
              Complete: {ritual.title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Double tap to close this dialog"
            >
              <VlossomCloseIcon size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            How did this ritual go? Your feedback helps optimize future recommendations.
          </Text>

          <View
            style={[styles.qualityOptions, { marginTop: spacing.lg }]}
            accessibilityRole="radiogroup"
            accessibilityLabel="Quality rating"
          >
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
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityHint={`Double tap to rate this ritual as ${option.label.toLowerCase()}`}
                accessibilityState={{ disabled: isCompleting }}
              >
                <View style={[styles.qualityDot, { backgroundColor: option.color }]} aria-hidden />
                <Text style={[textStyles.body, { color: colors.text.primary, marginLeft: spacing.md }]} aria-hidden>
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
          accessible
          accessibilityViewIsModal
          accessibilityLabel="Generate calendar dialog. Choose how many weeks to plan."
        >
          <View style={styles.modalHeader}>
            <Text
              style={[textStyles.h3, { color: colors.text.primary }]}
              accessibilityRole="header"
            >
              Generate Calendar
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Double tap to close this dialog"
            >
              <VlossomCloseIcon size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            Create a personalized schedule based on your hair profile.
          </Text>

          <Text
            style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.xl }]}
            nativeID="weeks-label"
          >
            How many weeks to plan?
          </Text>
          <View
            style={[styles.weekSelector, { marginTop: spacing.md }]}
            accessibilityRole="radiogroup"
            accessibilityLabelledBy="weeks-label"
          >
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
                accessibilityRole="radio"
                accessibilityLabel={`${w} week${w > 1 ? 's' : ''}`}
                accessibilityState={{ selected: weeks === w }}
                accessibilityHint={weeks === w ? 'Currently selected' : `Double tap to select ${w} week${w > 1 ? 's' : ''}`}
              >
                <Text
                  style={[
                    textStyles.button,
                    { color: weeks === w ? colors.white : colors.text.primary },
                  ]}
                  aria-hidden
                >
                  {w}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.modalActions, { marginTop: spacing.xl }]}>
            <Pressable
              onPress={onClose}
              style={[
                styles.modalButton,
                { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, flex: 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityHint="Double tap to cancel and close dialog"
            >
              <Text style={[textStyles.button, { color: colors.text.primary }]} aria-hidden>Cancel</Text>
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
              accessibilityRole="button"
              accessibilityLabel={isGenerating ? 'Generating calendar' : `Generate ${weeks} week calendar`}
              accessibilityState={{ disabled: isGenerating }}
              accessibilityHint={isGenerating ? 'Please wait' : `Double tap to generate a ${weeks} week care calendar`}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.white} accessibilityLabel="Generating" />
              ) : (
                <Text style={[textStyles.button, { color: colors.white }]} aria-hidden>Generate</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    flex: 1,
    alignItems: 'center',
  },
  viewTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
  },
  viewTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
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
    paddingVertical: 12,
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
