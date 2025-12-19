/**
 * Property Owner Chairs Screen (V6.5.2)
 *
 * Manage chairs across all properties
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomSettingsIcon } from '../../src/components/icons/VlossomIcons';

// Chair type labels
const CHAIR_TYPE_LABELS: Record<string, string> = {
  BRAID_CHAIR: 'Braid Chair',
  BARBER_CHAIR: 'Barber Chair',
  STYLING_STATION: 'Styling Station',
  NAIL_STATION: 'Nail Station',
  LASH_BED: 'Lash Bed',
  FACIAL_BED: 'Facial Bed',
  GENERAL: 'General',
};

// Chair status styles
type ChairStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

const STATUS_COLORS: Record<ChairStatus, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: '#dcfce7', text: '#16a34a', label: 'Available' },
  OCCUPIED: { bg: '#fef3c7', text: '#d97706', label: 'Occupied' },
  MAINTENANCE: { bg: '#fee2e2', text: '#dc2626', label: 'Maintenance' },
  BLOCKED: { bg: '#f3f4f6', text: '#6b7280', label: 'Blocked' },
};

// Mock data
const mockChairs = [
  {
    id: '1',
    name: 'Station #1',
    type: 'STYLING_STATION',
    status: 'AVAILABLE' as ChairStatus,
    propertyId: '1',
    propertyName: 'Glamour Studios',
    dailyRateCents: 15000,
    amenities: ['Mirror', 'Sink', 'Hair Dryer'],
  },
  {
    id: '2',
    name: 'Station #2',
    type: 'STYLING_STATION',
    status: 'OCCUPIED' as ChairStatus,
    propertyId: '1',
    propertyName: 'Glamour Studios',
    dailyRateCents: 15000,
    amenities: ['Mirror', 'Sink'],
  },
  {
    id: '3',
    name: 'Braid Station',
    type: 'BRAID_CHAIR',
    status: 'AVAILABLE' as ChairStatus,
    propertyId: '1',
    propertyName: 'Glamour Studios',
    dailyRateCents: 12000,
    amenities: ['Mirror', 'TV'],
  },
  {
    id: '4',
    name: 'Luxury Suite 1',
    type: 'STYLING_STATION',
    status: 'AVAILABLE' as ChairStatus,
    propertyId: '2',
    propertyName: 'Style Haven',
    dailyRateCents: 25000,
    amenities: ['Mirror', 'Sink', 'Hair Dryer', 'Private Room'],
  },
];

export default function ChairsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ property?: string }>();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [filterStatus, setFilterStatus] = useState<ChairStatus | 'all'>('all');

  // Filter by property if param provided
  const filteredByProperty = params.property
    ? mockChairs.filter((c) => c.propertyId === params.property)
    : mockChairs;

  // Filter by status
  const filteredChairs =
    filterStatus === 'all'
      ? filteredByProperty
      : filteredByProperty.filter((c) => c.status === filterStatus);

  // Format price
  const formatPrice = (cents: number) => `R ${(cents / 100).toFixed(2)}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { paddingHorizontal: spacing.lg }]}
      >
        {(['all', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED'] as const).map((status) => {
          const isActive = filterStatus === status;
          return (
            <Pressable
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.background.tertiary,
                  borderRadius: borderRadius.pill,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: isActive ? colors.white : colors.text.secondary },
                ]}
              >
                {status === 'all' ? 'All' : STATUS_COLORS[status].label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Chairs List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
      >
        {filteredChairs.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              No chairs match your filters
            </Text>
          </View>
        ) : (
          filteredChairs.map((chair) => {
            const statusStyle = STATUS_COLORS[chair.status];

            return (
              <View
                key={chair.id}
                style={[
                  styles.chairCard,
                  {
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.md,
                    ...shadows.card,
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}
                    >
                      {chair.name}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg, borderRadius: borderRadius.pill },
                      ]}
                    >
                      <Text style={[textStyles.caption, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                    {CHAIR_TYPE_LABELS[chair.type]} • {chair.propertyName}
                  </Text>
                </View>

                {/* Pricing */}
                <View style={[styles.cardSection, { borderTopColor: colors.border.default }]}>
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    Daily Rate
                  </Text>
                  <Text
                    style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}
                  >
                    {formatPrice(chair.dailyRateCents)}
                  </Text>
                </View>

                {/* Amenities */}
                {chair.amenities.length > 0 && (
                  <View style={[styles.cardSection, { borderTopColor: colors.border.default }]}>
                    <View style={styles.amenitiesRow}>
                      {chair.amenities.slice(0, 3).map((amenity) => (
                        <View
                          key={amenity}
                          style={[
                            styles.amenityChip,
                            {
                              backgroundColor: colors.background.tertiary,
                              borderRadius: borderRadius.sm,
                            },
                          ]}
                        >
                          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                            {amenity}
                          </Text>
                        </View>
                      ))}
                      {chair.amenities.length > 3 && (
                        <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                          +{chair.amenities.length - 3}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={[styles.cardActions, { borderTopColor: colors.border.default }]}>
                  <Pressable style={styles.actionButton}>
                    <VlossomSettingsIcon size={16} color={colors.text.secondary} />
                    <Text
                      style={[
                        textStyles.caption,
                        { color: colors.text.secondary, marginLeft: spacing.xs },
                      ]}
                    >
                      Edit
                    </Text>
                  </Pressable>
                  {chair.status !== 'AVAILABLE' && (
                    <Pressable style={styles.actionButton}>
                      <Text style={[textStyles.caption, { color: colors.status.success }]}>
                        Mark Available
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  chairCard: {
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardSection: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
