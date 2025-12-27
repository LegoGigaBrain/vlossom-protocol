/**
 * Stylist Availability Management (V7.3.0)
 *
 * Allows stylists to manage their weekly schedule:
 * - Toggle days on/off
 * - Set operating hours per day
 * - Add exception dates (holidays, time off)
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomCalendarIcon,
  VlossomAddIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import { Card, Button } from '../../src/components/ui';
import { useDemoModeStore, selectIsDemoMode } from '../../src/stores';
import {
  getStylistAvailability,
  updateStylistAvailability,
  addAvailabilityException,
  removeAvailabilityException,
  type WeeklySchedule,
  type TimeSlot,
  type DayOfWeek,
  type AvailabilityException,
} from '../../src/api/stylists';

// Day configuration
const DAYS: { key: DayOfWeek; label: string; shortLabel: string }[] = [
  { key: 'mon', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tue', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wed', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thu', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'fri', label: 'Friday', shortLabel: 'Fri' },
  { key: 'sat', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sun', label: 'Sunday', shortLabel: 'Sun' },
];

// Default schedule (9am-5pm weekdays)
const DEFAULT_SCHEDULE: WeeklySchedule = {
  mon: [{ start: '09:00', end: '17:00' }],
  tue: [{ start: '09:00', end: '17:00' }],
  wed: [{ start: '09:00', end: '17:00' }],
  thu: [{ start: '09:00', end: '17:00' }],
  fri: [{ start: '09:00', end: '17:00' }],
  sat: [],
  sun: [],
};

// Time options for picker
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start at 6am
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export default function AvailabilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal state
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('17:00');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionNote, setExceptionNote] = useState('');

  // Load availability on mount
  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // Mock data for demo mode
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSchedule(DEFAULT_SCHEDULE);
        setExceptions([
          { date: '2025-12-25', blocked: true, note: 'Christmas Day' },
          { date: '2025-12-26', blocked: true, note: 'Boxing Day' },
        ]);
      } else {
        const availability = await getStylistAvailability();
        setSchedule(availability.schedule);
        setExceptions(availability.exceptions);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
      // Use defaults on error
      setSchedule(DEFAULT_SCHEDULE);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Alert.alert('Success', 'Availability updated successfully!');
      } else {
        await updateStylistAvailability(schedule);
        Alert.alert('Success', 'Availability updated successfully!');
      }
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      if (newSchedule[day].length > 0) {
        // Turn off - clear slots
        newSchedule[day] = [];
      } else {
        // Turn on - add default slot
        newSchedule[day] = [{ start: '09:00', end: '17:00' }];
      }
      return newSchedule;
    });
    setHasChanges(true);
  };

  const openTimeEditor = (day: DayOfWeek) => {
    const slots = schedule[day];
    if (slots.length > 0) {
      setEditStartTime(slots[0].start);
      setEditEndTime(slots[0].end);
    } else {
      setEditStartTime('09:00');
      setEditEndTime('17:00');
    }
    setEditingDay(day);
  };

  const saveTimeSlot = () => {
    if (!editingDay) return;

    // Validate times
    if (editStartTime >= editEndTime) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setSchedule((prev) => ({
      ...prev,
      [editingDay]: [{ start: editStartTime, end: editEndTime }],
    }));
    setHasChanges(true);
    setEditingDay(null);
  };

  const addException = async () => {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(exceptionDate)) {
      Alert.alert('Invalid Date', 'Please enter date in YYYY-MM-DD format.');
      return;
    }

    try {
      if (isDemoMode) {
        setExceptions((prev) => [
          ...prev,
          { date: exceptionDate, blocked: true, note: exceptionNote || undefined },
        ]);
      } else {
        await addAvailabilityException({
          date: exceptionDate,
          blocked: true,
          note: exceptionNote || undefined,
        });
        await loadAvailability(); // Refresh
      }
      setShowExceptionModal(false);
      setExceptionDate('');
      setExceptionNote('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add exception.');
    }
  };

  const removeException = async (date: string) => {
    Alert.alert(
      'Remove Exception',
      'Are you sure you want to remove this exception?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isDemoMode) {
                setExceptions((prev) => prev.filter((e) => e.date !== date));
              } else {
                await removeAvailabilityException(date);
                await loadAvailability();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove exception.');
            }
          },
        },
      ]
    );
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':');
      const h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minute} ${ampm}`;
    };
    return `${formatTime(slot.start)} - ${formatTime(slot.end)}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Loading availability...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            borderBottomColor: colors.border.default,
            backgroundColor: colors.background.primary,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.text.primary }]} accessibilityRole="header">
          Availability
        </Text>
        <Button
          title={saving ? 'Saving...' : 'Save'}
          variant="primary"
          size="sm"
          onPress={handleSave}
          disabled={!hasChanges || saving}
          accessibilityLabel="Save availability changes"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Schedule */}
        <View style={[styles.section, { padding: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Weekly Schedule
          </Text>

          {DAYS.map(({ key, label }) => {
            const isActive = schedule[key].length > 0;
            const slots = schedule[key];

            return (
              <Card
                key={key}
                variant="outlined"
                style={{ marginBottom: spacing.sm }}
                accessible
                accessibilityLabel={`${label}: ${isActive ? formatTimeSlot(slots[0]) : 'Not available'}`}
              >
                <View style={styles.dayRow}>
                  <View style={styles.dayInfo}>
                    <Text
                      style={[
                        textStyles.body,
                        { color: isActive ? colors.text.primary : colors.text.muted },
                      ]}
                    >
                      {label}
                    </Text>
                    {isActive && slots.length > 0 && (
                      <Pressable
                        onPress={() => openTimeEditor(key)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${label} hours`}
                      >
                        <Text style={[textStyles.bodySmall, { color: colors.primary }]}>
                          {formatTimeSlot(slots[0])}
                        </Text>
                      </Pressable>
                    )}
                    {!isActive && (
                      <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                        Not available
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={() => toggleDay(key)}
                    trackColor={{ false: colors.border.default, true: colors.primary + '80' }}
                    thumbColor={isActive ? colors.primary : colors.background.tertiary}
                    accessibilityLabel={`Toggle ${label} availability`}
                  />
                </View>
              </Card>
            );
          })}
        </View>

        {/* Exception Dates */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.h4, { color: colors.text.primary }]} accessibilityRole="header">
              Exception Dates
            </Text>
            <Pressable
              onPress={() => setShowExceptionModal(true)}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Add exception date"
            >
              <VlossomAddIcon size={20} color={colors.white} />
            </Pressable>
          </View>

          <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
            Block specific dates for holidays, vacations, or personal time.
          </Text>

          {exceptions.length === 0 ? (
            <Card variant="outlined">
              <View style={styles.emptyExceptions}>
                <VlossomCalendarIcon size={32} color={colors.text.muted} />
                <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
                  No exceptions set
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                  Add dates when you're unavailable
                </Text>
              </View>
            </Card>
          ) : (
            exceptions.map((exception) => (
              <Card
                key={exception.date}
                variant="outlined"
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.exceptionRow}>
                  <View style={styles.exceptionInfo}>
                    <Text style={[textStyles.body, { color: colors.text.primary }]}>
                      {new Date(exception.date + 'T00:00:00').toLocaleDateString('en-ZA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    {exception.note && (
                      <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                        {exception.note}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => removeException(exception.date)}
                    style={styles.removeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove exception for ${exception.date}`}
                  >
                    <VlossomCloseIcon size={18} color={colors.status.error} />
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <View
            style={[
              styles.demoIndicator,
              {
                backgroundColor: colors.status.warning + '20',
                marginHorizontal: spacing.lg,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: colors.status.warning }]}>
              Demo Mode - Changes won't be saved to server
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Time Editor Modal */}
      <Modal
        visible={editingDay !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.xl,
                ...shadows.elevated,
              },
            ]}
          >
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.lg }]}>
              Edit Hours - {editingDay && DAYS.find((d) => d.key === editingDay)?.label}
            </Text>

            <View style={styles.timePickerRow}>
              <View style={styles.timePicker}>
                <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                  Start Time
                </Text>
                <ScrollView style={styles.timeScroller} showsVerticalScrollIndicator={false}>
                  {TIME_OPTIONS.map((time) => (
                    <Pressable
                      key={time}
                      onPress={() => setEditStartTime(time)}
                      style={[
                        styles.timeOption,
                        editStartTime === time && { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.body,
                          { color: editStartTime === time ? colors.primary : colors.text.primary },
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <Text style={[textStyles.body, { color: colors.text.muted, marginHorizontal: spacing.md }]}>
                to
              </Text>

              <View style={styles.timePicker}>
                <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                  End Time
                </Text>
                <ScrollView style={styles.timeScroller} showsVerticalScrollIndicator={false}>
                  {TIME_OPTIONS.map((time) => (
                    <Pressable
                      key={time}
                      onPress={() => setEditEndTime(time)}
                      style={[
                        styles.timeOption,
                        editEndTime === time && { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          textStyles.body,
                          { color: editEndTime === time ? colors.primary : colors.text.primary },
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditingDay(null)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Save"
                variant="primary"
                onPress={saveTimeSlot}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Exception Modal */}
      <Modal
        visible={showExceptionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExceptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.xl,
                ...shadows.elevated,
              },
            ]}
          >
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.lg }]}>
              Add Exception Date
            </Text>

            <View style={{ marginBottom: spacing.md }}>
              <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                Date (YYYY-MM-DD)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    color: colors.text.primary,
                  },
                ]}
                value={exceptionDate}
                onChangeText={setExceptionDate}
                placeholder="2025-01-01"
                placeholderTextColor={colors.text.muted}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
                Note (optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    color: colors.text.primary,
                  },
                ]}
                value={exceptionNote}
                onChangeText={setExceptionNote}
                placeholder="e.g., Holiday, Vacation"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowExceptionModal(false);
                  setExceptionDate('');
                  setExceptionNote('');
                }}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Add"
                variant="primary"
                onPress={addException}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyExceptions: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  exceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exceptionInfo: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  demoIndicator: {
    alignItems: 'center',
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    padding: 24,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  timePicker: {
    flex: 1,
  },
  timeScroller: {
    maxHeight: 200,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
  },
});
