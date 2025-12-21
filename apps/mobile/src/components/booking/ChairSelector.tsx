/**
 * Chair Selector Component (V6.6.0)
 *
 * Reusable component for selecting a chair at a property
 * Used when customer chooses PROPERTY location type
 *
 * Features:
 * - Property list with available chairs
 * - Chair availability indicators
 * - Rental pricing display
 */

import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { useTheme, textStyles } from '../../styles/theme';
import { VlossomSettingsIcon, VlossomGrowingIcon } from '../icons/VlossomIcons';

// Chair data types matching API
export interface Chair {
  id: string;
  name: string;
  description?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  amenities: string[];
  imageUrl?: string;
  rentalMode: 'PER_BOOKING' | 'PER_HOUR' | 'PER_DAY' | 'PER_WEEK' | 'PER_MONTH';
  baseRateCents: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  rating?: number;
  chairs: Chair[];
}

export interface SelectedChair {
  propertyId: string;
  chairId: string;
  propertyName: string;
  chairName: string;
}

interface ChairSelectorProps {
  properties: Property[];
  value: SelectedChair | null;
  onChange: (chair: SelectedChair | null) => void;
  loading?: boolean;
  label?: string;
}

// Format price from cents to ZAR
const formatPrice = (cents: number) => {
  return `R ${(cents / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Rental mode labels
const RENTAL_MODE_LABELS: Record<string, string> = {
  PER_BOOKING: '/booking',
  PER_HOUR: '/hour',
  PER_DAY: '/day',
  PER_WEEK: '/week',
  PER_MONTH: '/month',
};

export function ChairSelector({
  properties,
  value,
  onChange,
  loading = false,
  label = 'Select a chair',
}: ChairSelectorProps) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [expandedProperty, setExpandedProperty] = useState<string | null>(
    value?.propertyId || null
  );

  const handlePropertyToggle = (propertyId: string) => {
    setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
  };

  const handleChairSelect = (property: Property, chair: Chair) => {
    if (chair.status !== 'AVAILABLE') return;

    if (value?.chairId === chair.id) {
      // Deselect
      onChange(null);
    } else {
      onChange({
        propertyId: property.id,
        chairId: chair.id,
        propertyName: property.name,
        chairName: chair.name,
      });
    }
  };

  const getStatusColor = (status: Chair['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return colors.status.success;
      case 'OCCUPIED':
        return colors.status.error;
      case 'MAINTENANCE':
        return colors.status.warning;
      default:
        return colors.text.muted;
    }
  };

  const getStatusLabel = (status: Chair['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'OCCUPIED':
        return 'Occupied';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[textStyles.body, { color: colors.text.secondary }]}>
          Loading nearby salons...
        </Text>
      </View>
    );
  }

  if (properties.length === 0) {
    return (
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
        <VlossomSettingsIcon size={32} color={colors.text.muted} />
        <Text
          style={[
            textStyles.body,
            { color: colors.text.secondary, marginTop: spacing.md, textAlign: 'center' },
          ]}
        >
          No salons available nearby
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.muted, textAlign: 'center' }]}>
          Try selecting a different location
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.md }]}>
          {label}
        </Text>
      )}

      {properties.map((property) => {
        const isExpanded = expandedProperty === property.id;
        const availableChairs = property.chairs.filter((c) => c.status === 'AVAILABLE').length;

        return (
          <View
            key={property.id}
            style={[
              styles.propertyCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.md,
                ...shadows.card,
              },
            ]}
          >
            {/* Property Header */}
            <Pressable
              onPress={() => handlePropertyToggle(property.id)}
              style={[styles.propertyHeader, { borderBottomColor: colors.border.default }]}
            >
              <View
                style={[
                  styles.propertyImage,
                  { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md },
                ]}
              >
                {property.imageUrl ? (
                  <Image
                    source={{ uri: property.imageUrl }}
                    style={{ width: 56, height: 56, borderRadius: 8 }}
                  />
                ) : (
                  <VlossomSettingsIcon size={24} color={colors.text.muted} />
                )}
              </View>

              <View style={styles.propertyInfo}>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
                  {property.name}
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]} numberOfLines={1}>
                  {property.address}
                </Text>
                <View style={styles.propertyMeta}>
                  {property.rating && (
                    <Text style={[textStyles.caption, { color: colors.accent }]}>
                      ★ {property.rating.toFixed(1)}
                    </Text>
                  )}
                  <Text style={[textStyles.caption, { color: colors.status.success }]}>
                    {availableChairs} chairs available
                  </Text>
                </View>
              </View>

              <Text style={[textStyles.body, { color: colors.text.muted }]}>
                {isExpanded ? '▲' : '▼'}
              </Text>
            </Pressable>

            {/* Chairs List */}
            {isExpanded && (
              <View style={[styles.chairsList, { borderTopColor: colors.border.default }]}>
                {property.chairs.map((chair, index) => {
                  const isSelected = value?.chairId === chair.id;
                  const isAvailable = chair.status === 'AVAILABLE';
                  const isLast = index === property.chairs.length - 1;

                  return (
                    <Pressable
                      key={chair.id}
                      onPress={() => handleChairSelect(property, chair)}
                      disabled={!isAvailable}
                      style={[
                        styles.chairRow,
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth },
                        {
                          backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
                          borderBottomColor: colors.border.light,
                          opacity: isAvailable ? 1 : 0.5,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.chairIcon,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + '20'
                              : colors.background.tertiary,
                            borderRadius: borderRadius.sm,
                          },
                        ]}
                      >
                        <VlossomGrowingIcon
                          size={18}
                          color={isSelected ? colors.primary : colors.text.muted}
                        />
                      </View>

                      <View style={styles.chairInfo}>
                        <Text
                          style={[
                            textStyles.bodySmall,
                            { color: colors.text.primary, fontWeight: '500' },
                          ]}
                        >
                          {chair.name}
                        </Text>
                        {chair.description && (
                          <Text
                            style={[textStyles.caption, { color: colors.text.tertiary }]}
                            numberOfLines={1}
                          >
                            {chair.description}
                          </Text>
                        )}
                        <View style={styles.chairMeta}>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: getStatusColor(chair.status) + '20',
                                borderRadius: borderRadius.sm,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(chair.status) },
                              ]}
                            />
                            <Text
                              style={[
                                textStyles.caption,
                                { color: getStatusColor(chair.status), marginLeft: 4 },
                              ]}
                            >
                              {getStatusLabel(chair.status)}
                            </Text>
                          </View>
                          {chair.amenities.length > 0 && (
                            <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                              {chair.amenities.slice(0, 2).join(' • ')}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.chairPrice}>
                        <Text
                          style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}
                        >
                          {formatPrice(chair.baseRateCents)}
                        </Text>
                        <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                          {RENTAL_MODE_LABELS[chair.rentalMode]}
                        </Text>
                      </View>

                      {isAvailable && (
                        <View
                          style={[
                            styles.radio,
                            { borderColor: isSelected ? colors.primary : colors.border.default },
                          ]}
                        >
                          {isSelected && (
                            <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Mock data for testing
export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Glamour Studios',
    address: '123 Main Road, Sandton',
    rating: 4.8,
    chairs: [
      {
        id: '1a',
        name: 'Station #1',
        description: 'Window seat with natural light',
        status: 'AVAILABLE',
        amenities: ['Mirror', 'Storage', 'Wifi'],
        rentalMode: 'PER_DAY',
        baseRateCents: 15000,
      },
      {
        id: '1b',
        name: 'Station #2',
        status: 'OCCUPIED',
        amenities: ['Mirror', 'Storage'],
        rentalMode: 'PER_DAY',
        baseRateCents: 12000,
      },
      {
        id: '1c',
        name: 'VIP Suite',
        description: 'Private room with premium amenities',
        status: 'AVAILABLE',
        amenities: ['Private', 'AC', 'Premium Tools'],
        rentalMode: 'PER_DAY',
        baseRateCents: 25000,
      },
    ],
  },
  {
    id: '2',
    name: 'Style Haven',
    address: '45 Fashion Ave, Rosebank',
    rating: 4.6,
    chairs: [
      {
        id: '2a',
        name: 'Luxury Suite 1',
        status: 'AVAILABLE',
        amenities: ['Sink', 'Dryer', 'Products'],
        rentalMode: 'PER_DAY',
        baseRateCents: 20000,
      },
      {
        id: '2b',
        name: 'Braid Station',
        description: 'Specialized for braiding',
        status: 'MAINTENANCE',
        amenities: ['Braid Bar', 'Storage'],
        rentalMode: 'PER_DAY',
        baseRateCents: 18000,
      },
    ],
  },
];

const styles = StyleSheet.create({
  container: {},
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  propertyCard: {
    overflow: 'hidden',
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  propertyImage: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  propertyMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chairsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
  },
  chairIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairInfo: {
    flex: 1,
    marginLeft: 10,
  },
  chairMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chairPrice: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default ChairSelector;
