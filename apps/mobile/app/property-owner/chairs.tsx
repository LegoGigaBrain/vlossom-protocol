/**
 * Property Owner Chairs Screen (V7.2.0)
 *
 * Manage chairs across all properties.
 * V6.10: Wired to real API with status updates.
 * V7.2.0: Full accessibility support with semantic roles
 */

import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomSettingsIcon } from '../../src/components/icons/VlossomIcons';
import { usePropertyOwnerStore } from '../../src/stores/property-owner';
import type { ChairStatus } from '../../src/api/property-owner';

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
const STATUS_COLORS: Record<ChairStatus, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: '#dcfce7', text: '#16a34a', label: 'Available' },
  OCCUPIED: { bg: '#fef3c7', text: '#d97706', label: 'Occupied' },
  MAINTENANCE: { bg: '#fee2e2', text: '#dc2626', label: 'Maintenance' },
  BLOCKED: { bg: '#f3f4f6', text: '#6b7280', label: 'Blocked' },
};

// Format price
const formatPrice = (cents: number) => `R ${(cents / 100).toFixed(2)}`;

export default function ChairsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ property?: string }>();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [filterStatus, setFilterStatus] = useState<ChairStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingChairId, setUpdatingChairId] = useState<string | null>(null);

  const {
    properties,
    propertiesLoading,
    fetchProperties,
    updateChairStatus,
  } = usePropertyOwnerStore();

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  }, [fetchProperties]);

  // Get all chairs from all properties
  const allChairs = properties.flatMap((property) =>
    (property.chairs || []).map((chair) => ({
      ...chair,
      propertyId: property.id,
      propertyName: property.name,
    }))
  );

  // Filter by property if param provided
  const filteredByProperty = params.property
    ? allChairs.filter((c) => c.propertyId === params.property)
    : allChairs;

  // Filter by status
  const filteredChairs =
    filterStatus === 'all'
      ? filteredByProperty
      : filteredByProperty.filter((c) => c.status === filterStatus);

  // Handle status change
  const handleMarkAvailable = useCallback(async (propertyId: string, chairId: string) => {
    setUpdatingChairId(chairId);
    const success = await updateChairStatus(propertyId, chairId, 'AVAILABLE');
    setUpdatingChairId(null);
    if (success) {
      Alert.alert('Status Updated', 'Chair is now available.');
    } else {
      Alert.alert('Error', 'Failed to update chair status.');
    }
  }, [updateChairStatus]);

  // Loading state
  if (propertiesLoading && properties.length === 0) {
    return (
      <View
        style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background.secondary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Loading chairs, please wait"
      >
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]} aria-hidden>
          Loading chairs...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { paddingHorizontal: spacing.lg }]}
        accessibilityRole="tablist"
        accessibilityLabel="Filter chairs by status"
      >
        {(['all', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED'] as const).map((status) => {
          const isActive = filterStatus === status;
          const statusLabel = status === 'all' ? 'All' : STATUS_COLORS[status].label;
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
              accessibilityRole="tab"
              accessibilityLabel={statusLabel}
              accessibilityState={{ selected: isActive }}
              accessibilityHint={isActive ? 'Currently selected' : `Double tap to filter by ${statusLabel.toLowerCase()}`}
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: isActive ? colors.white : colors.text.secondary },
                ]}
                aria-hidden
              >
                {statusLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Chairs List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
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
            accessible
            accessibilityRole="text"
            accessibilityLabel="No chairs match your filters"
          >
            <Text style={[textStyles.body, { color: colors.text.secondary }]} aria-hidden>
              No chairs match your filters
            </Text>
          </View>
        ) : (
          <View
            accessibilityRole="list"
            accessibilityLabel={`${filteredChairs.length} chairs`}
          >
            {filteredChairs.map((chair) => {
              const statusStyle = STATUS_COLORS[chair.status] || STATUS_COLORS.AVAILABLE;
              const isUpdating = updatingChairId === chair.id;
              const amenitiesText = chair.amenities && chair.amenities.length > 0
                ? `. Amenities: ${chair.amenities.join(', ')}`
                : '';

              return (
                <View
                  key={chair.id}
                  style={[
                    styles.chairCard,
                    {
                      backgroundColor: colors.background.primary,
                      borderRadius: borderRadius.lg,
                      marginBottom: spacing.md,
                      opacity: isUpdating ? 0.7 : 1,
                      ...shadows.card,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`${chair.name}, ${CHAIR_TYPE_LABELS[chair.type]} at ${chair.propertyName}, ${statusStyle.label}, daily rate ${formatPrice(chair.dailyRateCents || 0)}${amenitiesText}${isUpdating ? ', updating' : ''}`}
                >
                  {/* Header */}
                  <View style={styles.cardHeader} aria-hidden>
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
                  <View style={[styles.cardSection, { borderTopColor: colors.border.default }]} aria-hidden>
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      Daily Rate
                    </Text>
                    <Text
                      style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}
                    >
                      {formatPrice(chair.dailyRateCents || 0)}
                    </Text>
                  </View>

                  {/* Amenities */}
                  {chair.amenities && chair.amenities.length > 0 && (
                    <View style={[styles.cardSection, { borderTopColor: colors.border.default }]} aria-hidden>
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
                    <Pressable
                      style={styles.actionButton}
                      disabled={isUpdating}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${chair.name}`}
                      accessibilityHint="Double tap to edit chair details"
                      accessibilityState={{ disabled: isUpdating }}
                    >
                      <VlossomSettingsIcon size={16} color={colors.text.secondary} />
                      <Text
                        style={[
                          textStyles.caption,
                          { color: colors.text.secondary, marginLeft: spacing.xs },
                        ]}
                        aria-hidden
                      >
                        Edit
                      </Text>
                    </Pressable>
                    {chair.status !== 'AVAILABLE' && (
                      <Pressable
                        style={styles.actionButton}
                        onPress={() => handleMarkAvailable(chair.propertyId, chair.id)}
                        disabled={isUpdating}
                        accessibilityRole="button"
                        accessibilityLabel={isUpdating ? 'Updating status' : `Mark ${chair.name} as available`}
                        accessibilityHint={isUpdating ? 'Please wait' : 'Double tap to mark this chair as available'}
                        accessibilityState={{ disabled: isUpdating }}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={colors.status.success} accessibilityLabel="Updating" />
                        ) : (
                          <Text style={[textStyles.caption, { color: colors.status.success }]} aria-hidden>
                            Mark Available
                          </Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
