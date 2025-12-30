/**
 * Calendar Components (V7.5.2 Mobile)
 *
 * Month, Week, and Day views for the hair health calendar.
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/tokens';
import {
  VlossomHealthyIcon,
  VlossomGrowingIcon,
  VlossomCalendarIcon,
  VlossomCheckIcon,
} from '../icons/VlossomIcons';
import type { CalendarEvent } from '../../data/mock-data';

// =============================================================================
// Types
// =============================================================================

export interface CalendarEventFull extends CalendarEvent {
  // Extended properties if needed
}

export interface CalendarMonthViewProps {
  month: string; // 'YYYY-MM' format
  events: CalendarEventFull[];
  selectedDate: string; // 'YYYY-MM-DD' format
  onSelectDate: (date: string) => void;
}

export interface CalendarWeekViewProps {
  weekStart: string; // 'YYYY-MM-DD' format (start of week)
  events: CalendarEventFull[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onCompleteRitual?: (event: CalendarEventFull) => void;
  onSkipRitual?: (event: CalendarEventFull) => void;
  onPressRitual?: (event: CalendarEventFull) => void;
}

export interface CalendarDayViewProps {
  date: string; // 'YYYY-MM-DD' format
  events: CalendarEventFull[];
  onCompleteRitual?: (event: CalendarEventFull) => void;
  onSkipRitual?: (event: CalendarEventFull) => void;
  onPressRitual?: (event: CalendarEventFull) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getEventTypeColor(type: CalendarEvent['type']): string {
  switch (type) {
    case 'WASH_DAY':
      return colors.primary;
    case 'DEEP_CONDITION':
      return colors.status.info;
    case 'TRIM':
      return colors.status.warning;
    case 'TREATMENT':
      return colors.status.success;
    case 'PROTECTIVE_STYLE':
      return colors.accent;
    default:
      return colors.primary;
  }
}

function getEventTypeIcon(type: CalendarEvent['type'], size: number = 16) {
  const props = { size, color: colors.white };

  switch (type) {
    case 'WASH_DAY':
    case 'DEEP_CONDITION':
    case 'TREATMENT':
      return <VlossomGrowingIcon {...props} />;
    case 'TRIM':
    case 'PROTECTIVE_STYLE':
      return <VlossomHealthyIcon {...props} />;
    default:
      return <VlossomCalendarIcon {...props} />;
  }
}

// =============================================================================
// Calendar Month View
// =============================================================================

export function CalendarMonthView({
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarMonthViewProps) {
  const [year, monthNum] = month.split('-').map(Number);
  const monthIndex = monthNum - 1;

  // Build event map for quick lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEventFull[]>();
    events.forEach((event) => {
      const key = event.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, monthIndex);
  const firstDay = getFirstDayOfMonth(year, monthIndex);

  // Build calendar grid
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.monthContainer}>
      {/* Days of Week Header */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }

            const dateKey = formatDateKey(year, monthIndex, day);
            const dayEvents = eventMap.get(dateKey) || [];
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === today;

            return (
              <Pressable
                key={dayIndex}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => onSelectDate(dateKey)}
                accessibilityRole="button"
                accessibilityLabel={`${day}, ${dayEvents.length} events`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                  ]}
                >
                  {day}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <View
                        key={i}
                        style={[
                          styles.eventDot,
                          { backgroundColor: getEventTypeColor(event.type) },
                          event.isCompleted && styles.eventDotCompleted,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// Calendar Week View
// =============================================================================

export function CalendarWeekView({
  weekStart,
  events,
  selectedDate,
  onSelectDate,
  onCompleteRitual,
  onPressRitual,
}: CalendarWeekViewProps) {
  // Build week days
  const weekDays = useMemo(() => {
    const days: string[] = [];
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }, [weekStart]);

  // Build event map
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEventFull[]>();
    events.forEach((event) => {
      const key = event.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <ScrollView style={styles.weekViewContainer} showsVerticalScrollIndicator={false}>
      {weekDays.map((date) => {
        const dayEvents = eventMap.get(date) || [];
        const isSelected = date === selectedDate;
        const isToday = date === today;
        const dateObj = new Date(date);
        const dayName = DAYS_OF_WEEK[dateObj.getDay()];
        const dayNum = dateObj.getDate();

        return (
          <View key={date} style={styles.weekDayRow}>
            <Pressable
              style={[
                styles.weekDayHeader,
                isSelected && styles.weekDayHeaderSelected,
                isToday && !isSelected && styles.weekDayHeaderToday,
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.weekDayName,
                  isSelected && styles.weekDayNameSelected,
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  styles.weekDayNumber,
                  isSelected && styles.weekDayNumberSelected,
                  isToday && !isSelected && styles.weekDayNumberToday,
                ]}
              >
                {dayNum}
              </Text>
            </Pressable>
            <View style={styles.weekDayEvents}>
              {dayEvents.length === 0 ? (
                <Text style={styles.noEventsText}>No events</Text>
              ) : (
                dayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onPress={() => onPressRitual?.(event)}
                    onComplete={() => onCompleteRitual?.(event)}
                  />
                ))
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// =============================================================================
// Calendar Day View
// =============================================================================

export function CalendarDayView({
  date,
  events,
  onCompleteRitual,
  onPressRitual,
}: CalendarDayViewProps) {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.dayViewContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.dayViewTitle}>{formattedDate}</Text>

      {events.length === 0 ? (
        <View style={styles.emptyDay}>
          <VlossomCalendarIcon size={48} color={colors.primarySoft} />
          <Text style={styles.emptyDayText}>No events scheduled</Text>
        </View>
      ) : (
        <View style={styles.dayEventsList}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => onPressRitual?.(event)}
              onComplete={() => onCompleteRitual?.(event)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// =============================================================================
// Event Card Component
// =============================================================================

interface EventCardProps {
  event: CalendarEventFull;
  compact?: boolean;
  onPress?: () => void;
  onComplete?: () => void;
}

function EventCard({ event, compact = false, onPress, onComplete }: EventCardProps) {
  const typeColor = getEventTypeColor(event.type);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.eventCard,
        compact && styles.eventCardCompact,
        event.isCompleted && styles.eventCardCompleted,
        event.isSkipped && styles.eventCardSkipped,
      ]}
    >
      <View style={[styles.eventCardAccent, { backgroundColor: typeColor }]} />
      <View style={styles.eventCardContent}>
        <View style={styles.eventCardHeader}>
          <View
            style={[styles.eventCardIcon, { backgroundColor: typeColor }]}
          >
            {event.isCompleted ? (
              <VlossomCheckIcon size={14} color={colors.white} />
            ) : (
              getEventTypeIcon(event.type, 14)
            )}
          </View>
          <View style={styles.eventCardInfo}>
            <Text
              style={[
                styles.eventCardTitle,
                (event.isCompleted || event.isSkipped) && styles.eventCardTitleDone,
              ]}
            >
              {event.title}
            </Text>
            <Text style={styles.eventCardTime}>
              {event.time} ({event.durationMinutes} min)
            </Text>
          </View>
          {!compact && event.loadLevel && (
            <View
              style={[
                styles.loadBadge,
                event.loadLevel === 'LIGHT' && styles.loadBadgeLight,
                event.loadLevel === 'HEAVY' && styles.loadBadgeHeavy,
              ]}
            >
              <Text style={styles.loadBadgeText}>{event.loadLevel}</Text>
            </View>
          )}
        </View>
        {!compact && event.description && (
          <Text style={styles.eventCardDescription}>{event.description}</Text>
        )}
        {!compact && !event.isCompleted && !event.isSkipped && onComplete && (
          <Pressable
            onPress={onComplete}
            style={styles.completeButton}
            accessibilityRole="button"
            accessibilityLabel="Mark as complete"
          >
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  // Month View
  monthContainer: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekDayText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    backgroundColor: colors.background.secondary,
  },
  dayNumber: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.text.primary,
  },
  dayNumberSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventDotCompleted: {
    opacity: 0.5,
  },

  // Week View
  weekViewContainer: {
    flex: 1,
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  weekDayHeader: {
    width: 56,
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  weekDayHeaderSelected: {
    backgroundColor: colors.primary,
  },
  weekDayHeaderToday: {
    backgroundColor: colors.background.secondary,
  },
  weekDayName: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  weekDayNameSelected: {
    color: colors.white,
  },
  weekDayNumber: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  weekDayNumberSelected: {
    color: colors.white,
  },
  weekDayNumberToday: {
    color: colors.primary,
  },
  weekDayEvents: {
    flex: 1,
    gap: spacing.sm,
  },
  noEventsText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },

  // Day View
  dayViewContainer: {
    flex: 1,
  },
  dayViewTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  emptyDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyDayText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  dayEventsList: {
    gap: spacing.md,
  },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.soft,
  },
  eventCardCompact: {
    ...shadows.soft,
  },
  eventCardCompleted: {
    opacity: 0.7,
  },
  eventCardSkipped: {
    opacity: 0.5,
  },
  eventCardAccent: {
    width: 4,
  },
  eventCardContent: {
    flex: 1,
    padding: spacing.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  eventCardTitleDone: {
    textDecorationLine: 'line-through',
  },
  eventCardTime: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  eventCardDescription: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  loadBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
  },
  loadBadgeLight: {
    backgroundColor: colors.status.infoLight,
  },
  loadBadgeHeavy: {
    backgroundColor: colors.status.warningLight,
  },
  loadBadgeText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  completeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  completeButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default CalendarMonthView;
