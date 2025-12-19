/**
 * Location Selector Component (V6.6.0)
 *
 * Reusable component for selecting service location type
 * Used in: Booking flow, Special Events, Property visits
 *
 * Location Types:
 * - CUSTOMER_HOME: Stylist comes to customer
 * - STYLIST_BASE: Customer goes to stylist
 * - PROPERTY: Customer goes to salon/studio (chair rental)
 */

import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useTheme, textStyles } from '../../styles/theme';
import {
  VlossomHomeIcon,
  VlossomProfileIcon,
  VlossomSettingsIcon,
} from '../icons/VlossomIcons';

// Location type definitions matching API
export type LocationType = 'CUSTOMER_HOME' | 'STYLIST_BASE' | 'PROPERTY';

export interface LocationOption {
  type: LocationType;
  label: string;
  description: string;
  available: boolean;
  travelFee?: number; // in cents
}

export interface SelectedLocation {
  type: LocationType;
  address?: string;
  propertyId?: string;
  chairId?: string;
}

interface LocationSelectorProps {
  options: LocationOption[];
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation | null) => void;
  showAddressInput?: boolean;
  label?: string;
}

// Format price from cents to ZAR
const formatPrice = (cents: number) => {
  return `R ${(cents / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function LocationSelector({
  options,
  value,
  onChange,
  showAddressInput = true,
  label = 'Where would you like the service?',
}: LocationSelectorProps) {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [address, setAddress] = useState(value?.address || '');

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'CUSTOMER_HOME':
        return <VlossomHomeIcon size={24} color={colors.primary} />;
      case 'STYLIST_BASE':
        return <VlossomProfileIcon size={24} color={colors.primary} />;
      case 'PROPERTY':
        return <VlossomSettingsIcon size={24} color={colors.primary} />;
      default:
        return <VlossomHomeIcon size={24} color={colors.primary} />;
    }
  };

  const handleSelect = (option: LocationOption) => {
    if (!option.available) return;

    if (value?.type === option.type) {
      // Deselect
      onChange(null);
    } else {
      onChange({
        type: option.type,
        address: option.type === 'CUSTOMER_HOME' ? address : undefined,
      });
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    if (value?.type === 'CUSTOMER_HOME') {
      onChange({
        ...value,
        address: newAddress,
      });
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.md }]}>
          {label}
        </Text>
      )}

      {options.map((option) => {
        const isSelected = value?.type === option.type;
        const isDisabled = !option.available;

        return (
          <Pressable
            key={option.type}
            onPress={() => handleSelect(option)}
            disabled={isDisabled}
            style={[
              styles.optionCard,
              {
                backgroundColor: isSelected
                  ? colors.primary + '10'
                  : isDisabled
                    ? colors.background.tertiary
                    : colors.background.primary,
                borderColor: isSelected
                  ? colors.primary
                  : isDisabled
                    ? colors.border.light
                    : colors.border.default,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
                opacity: isDisabled ? 0.6 : 1,
                ...(!isDisabled && shadows.card),
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '20'
                    : colors.background.tertiary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              {getLocationIcon(option.type)}
            </View>

            <View style={styles.optionInfo}>
              <Text
                style={[
                  textStyles.bodySmall,
                  {
                    color: isDisabled ? colors.text.muted : colors.text.primary,
                    fontWeight: '600',
                  },
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  textStyles.caption,
                  { color: isDisabled ? colors.text.muted : colors.text.tertiary },
                ]}
              >
                {option.description}
              </Text>
              {option.travelFee && option.travelFee > 0 && (
                <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                  +{formatPrice(option.travelFee)} travel fee
                </Text>
              )}
              {isDisabled && (
                <Text style={[textStyles.caption, { color: colors.status.warning, marginTop: 2 }]}>
                  Not available
                </Text>
              )}
            </View>

            <View
              style={[
                styles.radio,
                {
                  borderColor: isSelected
                    ? colors.primary
                    : isDisabled
                      ? colors.border.light
                      : colors.border.default,
                },
              ]}
            >
              {isSelected && (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </Pressable>
        );
      })}

      {/* Address input for home visits */}
      {showAddressInput && value?.type === 'CUSTOMER_HOME' && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
            Your Address
          </Text>
          <TextInput
            style={[
              styles.addressInput,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.default,
                borderRadius: borderRadius.md,
                color: colors.text.primary,
              },
            ]}
            placeholder="Enter your full address..."
            placeholderTextColor={colors.text.muted}
            value={address}
            onChangeText={handleAddressChange}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
            The stylist will travel to this location
          </Text>
        </View>
      )}
    </View>
  );
}

// Default location options for stylists
export const DEFAULT_STYLIST_OPTIONS: LocationOption[] = [
  {
    type: 'CUSTOMER_HOME',
    label: 'At My Location',
    description: 'Stylist travels to you',
    available: true,
    travelFee: 5000, // R50
  },
  {
    type: 'STYLIST_BASE',
    label: 'At Stylist Location',
    description: 'Visit the stylist',
    available: true,
  },
  {
    type: 'PROPERTY',
    label: 'At Salon/Studio',
    description: 'Visit a salon chair',
    available: true,
  },
];

const styles = StyleSheet.create({
  container: {},
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addressInput: {
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
  },
});

export default LocationSelector;
