/**
 * Add Chair Screen (V7.2.0)
 *
 * Multi-step form for creating a new chair/station in a property.
 * Steps:
 * 1. Select Property
 * 2. Chair Details (name, type)
 * 3. Pricing & Rental Modes
 * 4. Amenities
 * 5. Confirmation
 *
 * V7.2.0: Full accessibility support with semantic roles
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomCloseIcon,
  VlossomCheckIcon,
  VlossomLocationIcon,
} from '../../src/components/icons/VlossomIcons';
import { usePropertyOwnerStore } from '../../src/stores/property-owner';
import { createChair, type ChairType, type RentalMode } from '../../src/api/property-owner';

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  { id: 'property', title: 'Select Property' },
  { id: 'details', title: 'Chair Details' },
  { id: 'pricing', title: 'Pricing' },
  { id: 'amenities', title: 'Amenities' },
  { id: 'confirm', title: 'Confirm' },
] as const;

const CHAIR_TYPES: { value: ChairType; label: string; description: string }[] = [
  { value: 'BRAID_CHAIR', label: 'Braid Chair', description: 'For braiding and natural hair styling' },
  { value: 'BARBER_CHAIR', label: 'Barber Chair', description: 'For haircuts and beard grooming' },
  { value: 'STYLING_STATION', label: 'Styling Station', description: 'Full-service styling with mirror' },
  { value: 'NAIL_STATION', label: 'Nail Station', description: 'Manicure and pedicure services' },
  { value: 'LASH_BED', label: 'Lash Bed', description: 'For lash extensions and brow services' },
  { value: 'FACIAL_BED', label: 'Facial Bed', description: 'For facials and skin treatments' },
  { value: 'GENERAL', label: 'General', description: 'Multi-purpose station' },
];

const RENTAL_MODES: { value: RentalMode; label: string }[] = [
  { value: 'PER_BOOKING', label: 'Per Booking' },
  { value: 'PER_HOUR', label: 'Hourly' },
  { value: 'PER_DAY', label: 'Daily' },
  { value: 'PER_WEEK', label: 'Weekly' },
  { value: 'PER_MONTH', label: 'Monthly' },
];

const COMMON_AMENITIES = [
  'Mirror',
  'Sink',
  'Dryer',
  'Storage Cabinet',
  'Tool Organizer',
  'Adjustable Chair',
  'Arm Rests',
  'Footrest',
  'LED Lighting',
  'Power Outlets',
  'WiFi',
  'Air Conditioning',
];

// ============================================================================
// Component
// ============================================================================

export default function AddChairScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const { properties, fetchProperties, propertiesLoading } = usePropertyOwnerStore();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(params.propertyId || '');
  const [chairName, setChairName] = useState('');
  const [chairType, setChairType] = useState<ChairType>('GENERAL');
  const [rentalModes, setRentalModes] = useState<RentalMode[]>(['PER_DAY']);
  const [hourlyRateCents, setHourlyRateCents] = useState('');
  const [dailyRateCents, setDailyRateCents] = useState('');
  const [weeklyRateCents, setWeeklyRateCents] = useState('');
  const [monthlyRateCents, setMonthlyRateCents] = useState('');
  const [perBookingFeeCents, setPerBookingFeeCents] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');

  // Load properties on mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Skip property step if propertyId is provided
  useEffect(() => {
    if (params.propertyId && currentStep === 0) {
      setSelectedPropertyId(params.propertyId);
      setCurrentStep(1);
    }
  }, [params.propertyId, currentStep]);

  // Get selected property
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Validation
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return !!selectedPropertyId;
      case 1:
        return chairName.trim().length >= 2 && !!chairType;
      case 2:
        return rentalModes.length > 0;
      case 3:
        return true; // Amenities are optional
      case 4:
        return true; // Confirmation step
      default:
        return false;
    }
  }, [currentStep, selectedPropertyId, chairName, chairType, rentalModes]);

  // Navigation
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Toggle rental mode
  const toggleRentalMode = (mode: RentalMode) => {
    if (rentalModes.includes(mode)) {
      setRentalModes(rentalModes.filter((m) => m !== mode));
    } else {
      setRentalModes([...rentalModes, mode]);
    }
  };

  // Toggle amenity
  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  // Add custom amenity
  const addCustomAmenity = () => {
    if (customAmenity.trim() && !amenities.includes(customAmenity.trim())) {
      setAmenities([...amenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  // Parse price to cents
  const parseToCents = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const num = parseFloat(value);
    if (isNaN(num)) return undefined;
    return Math.round(num * 100);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedPropertyId) return;

    setIsSubmitting(true);
    try {
      await createChair(selectedPropertyId, {
        name: chairName.trim(),
        type: chairType,
        amenities,
        rentalModesEnabled: rentalModes,
        hourlyRateCents: parseToCents(hourlyRateCents),
        dailyRateCents: parseToCents(dailyRateCents),
        weeklyRateCents: parseToCents(weeklyRateCents),
        monthlyRateCents: parseToCents(monthlyRateCents),
        perBookingFeeCents: parseToCents(perBookingFeeCents),
      });

      // Refresh properties to update chair list
      await fetchProperties();

      Alert.alert('Success', 'Chair has been created successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create chair. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPropertyStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderPricingStep();
      case 3:
        return renderAmenitiesStep();
      case 4:
        return renderConfirmStep();
      default:
        return null;
    }
  };

  // Step 1: Select Property
  const renderPropertyStep = () => {
    if (propertiesLoading && properties.length === 0) {
      return (
        <View
          style={styles.loadingContainer}
          accessible
          accessibilityRole="alert"
          accessibilityLabel="Loading properties, please wait"
        >
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
          <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]} aria-hidden>
            Loading properties...
          </Text>
        </View>
      );
    }

    if (properties.length === 0) {
      return (
        <View
          style={styles.emptyContainer}
          accessible
          accessibilityRole="text"
          accessibilityLabel="You don't have any properties yet. Add a property first before creating chairs."
        >
          <Text style={[textStyles.body, { color: colors.text.secondary, textAlign: 'center' }]} aria-hidden>
            You don't have any properties yet.{'\n'}Add a property first before creating chairs.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text
          style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.lg }]}
          accessibilityRole="text"
        >
          Select the property where you want to add a new chair.
        </Text>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Select a property"
        >
          {properties.map((property) => {
            const isSelected = selectedPropertyId === property.id;
            const chairCount = property.chairs?.length || 0;
            return (
              <Pressable
                key={property.id}
                onPress={() => setSelectedPropertyId(property.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? colors.primary + '15' : colors.background.primary,
                    borderColor: isSelected ? colors.primary : colors.border.default,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.md,
                    ...shadows.card,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={`${property.name}, ${property.address}, ${property.city}, ${chairCount} existing chairs`}
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select this property'}
              >
                <View style={styles.optionContent} aria-hidden>
                  <VlossomLocationIcon size={20} color={isSelected ? colors.primary : colors.text.tertiary} />
                  <View style={styles.optionText}>
                    <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
                      {property.name}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {property.address}, {property.city}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.muted }]}>
                      {chairCount} chairs
                    </Text>
                  </View>
                </View>
                {isSelected && <VlossomCheckIcon size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  // Step 2: Chair Details
  const renderDetailsStep = () => {
    const selectedTypeLabel = CHAIR_TYPES.find((t) => t.value === chairType)?.label;
    return (
      <View style={styles.stepContent}>
        {/* Chair Name */}
        <View style={styles.inputGroup}>
          <Text
            style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
            nativeID="chair-name-label"
          >
            Chair Name *
          </Text>
          <TextInput
            value={chairName}
            onChangeText={setChairName}
            placeholder="e.g., Station 1, Braid Chair A"
            placeholderTextColor={colors.text.muted}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.default,
                borderRadius: borderRadius.md,
                color: colors.text.primary,
              },
            ]}
            accessibilityLabel="Chair Name, required"
            accessibilityHint="Enter a name for this chair, minimum 2 characters"
            accessibilityLabelledBy="chair-name-label"
          />
        </View>

        {/* Chair Type */}
        <View style={styles.inputGroup}>
          <Text
            style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.sm }]}
            nativeID="chair-type-label"
          >
            Chair Type *
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={`Chair type selection${selectedTypeLabel ? `, ${selectedTypeLabel} selected` : ''}`}
            accessibilityLabelledBy="chair-type-label"
          >
            {CHAIR_TYPES.map((type) => {
              const isSelected = chairType === type.value;
              return (
                <Pressable
                  key={type.value}
                  onPress={() => setChairType(type.value)}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: isSelected ? colors.primary + '10' : colors.background.primary,
                      borderColor: isSelected ? colors.primary : colors.border.light,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityLabel={`${type.label}: ${type.description}`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select this chair type'}
                >
                  <View style={styles.typeContent} aria-hidden>
                    <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '500' }]}>
                      {type.label}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {type.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: isSelected ? colors.primary : colors.border.default,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                    aria-hidden
                  >
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.white }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Step 3: Pricing
  const renderPricingStep = () => {
    const selectedModeLabels = rentalModes.map((m) => RENTAL_MODES.find((rm) => rm.value === m)?.label || m);
    const modesLabel = selectedModeLabels.length > 0 ? selectedModeLabels.join(', ') : 'None selected';

    return (
      <View style={styles.stepContent}>
        {/* Rental Modes */}
        <View style={styles.inputGroup}>
          <Text
            style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
            nativeID="rental-modes-label"
          >
            Rental Modes Enabled *
          </Text>
          <Text
            style={[textStyles.caption, { color: colors.text.muted, marginBottom: spacing.sm }]}
            accessibilityRole="text"
          >
            Select at least one rental mode for stylists.
          </Text>
          <View
            style={styles.chipsContainer}
            accessibilityRole="group"
            accessibilityLabel={`Rental modes, ${modesLabel}`}
            accessibilityLabelledBy="rental-modes-label"
          >
            {RENTAL_MODES.map((mode) => {
              const isSelected = rentalModes.includes(mode.value);
              return (
                <Pressable
                  key={mode.value}
                  onPress={() => toggleRentalMode(mode.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background.tertiary,
                      borderRadius: borderRadius.pill,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={mode.label}
                  accessibilityState={{ checked: isSelected }}
                  accessibilityHint={isSelected ? 'Double tap to remove' : 'Double tap to add'}
                >
                  <Text
                    style={[
                      textStyles.caption,
                      { color: isSelected ? colors.white : colors.text.primary },
                    ]}
                    aria-hidden
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Price Inputs */}
        {rentalModes.includes('PER_HOUR') && (
          <View style={styles.inputGroup}>
            <Text
              style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
              nativeID="hourly-rate-label"
            >
              Hourly Rate (R)
            </Text>
            <TextInput
              value={hourlyRateCents}
              onChangeText={setHourlyRateCents}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              accessibilityLabel="Hourly Rate in Rands"
              accessibilityHint="Enter the hourly rental rate"
              accessibilityLabelledBy="hourly-rate-label"
            />
          </View>
        )}

        {rentalModes.includes('PER_DAY') && (
          <View style={styles.inputGroup}>
            <Text
              style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
              nativeID="daily-rate-label"
            >
              Daily Rate (R)
            </Text>
            <TextInput
              value={dailyRateCents}
              onChangeText={setDailyRateCents}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              accessibilityLabel="Daily Rate in Rands"
              accessibilityHint="Enter the daily rental rate"
              accessibilityLabelledBy="daily-rate-label"
            />
          </View>
        )}

        {rentalModes.includes('PER_WEEK') && (
          <View style={styles.inputGroup}>
            <Text
              style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
              nativeID="weekly-rate-label"
            >
              Weekly Rate (R)
            </Text>
            <TextInput
              value={weeklyRateCents}
              onChangeText={setWeeklyRateCents}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              accessibilityLabel="Weekly Rate in Rands"
              accessibilityHint="Enter the weekly rental rate"
              accessibilityLabelledBy="weekly-rate-label"
            />
          </View>
        )}

        {rentalModes.includes('PER_MONTH') && (
          <View style={styles.inputGroup}>
            <Text
              style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
              nativeID="monthly-rate-label"
            >
              Monthly Rate (R)
            </Text>
            <TextInput
              value={monthlyRateCents}
              onChangeText={setMonthlyRateCents}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              accessibilityLabel="Monthly Rate in Rands"
              accessibilityHint="Enter the monthly rental rate"
              accessibilityLabelledBy="monthly-rate-label"
            />
          </View>
        )}

        {rentalModes.includes('PER_BOOKING') && (
          <View style={styles.inputGroup}>
            <Text
              style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
              nativeID="per-booking-fee-label"
            >
              Per Booking Fee (R)
            </Text>
            <TextInput
              value={perBookingFeeCents}
              onChangeText={setPerBookingFeeCents}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              accessibilityLabel="Per Booking Fee in Rands"
              accessibilityHint="Enter the fee charged per booking"
              accessibilityLabelledBy="per-booking-fee-label"
            />
          </View>
        )}
      </View>
    );
  };

  // Step 4: Amenities
  const renderAmenitiesStep = () => {
    const amenitiesLabel = amenities.length > 0
      ? `${amenities.length} selected: ${amenities.slice(0, 3).join(', ')}${amenities.length > 3 ? ' and more' : ''}`
      : 'None selected';

    return (
      <View style={styles.stepContent}>
        <Text
          style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.lg }]}
          accessibilityRole="text"
        >
          Select amenities included with this chair. This helps stylists understand what's available.
        </Text>

        {/* Common Amenities */}
        <View
          style={styles.chipsContainer}
          accessibilityRole="group"
          accessibilityLabel={`Chair amenities, ${amenitiesLabel}`}
        >
          {COMMON_AMENITIES.map((amenity) => {
            const isSelected = amenities.includes(amenity);
            return (
              <Pressable
                key={amenity}
                onPress={() => toggleAmenity(amenity)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background.tertiary,
                    borderRadius: borderRadius.pill,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityLabel={amenity}
                accessibilityState={{ checked: isSelected }}
                accessibilityHint={isSelected ? 'Double tap to remove' : 'Double tap to add'}
              >
                <Text
                  style={[
                    textStyles.caption,
                    { color: isSelected ? colors.white : colors.text.primary },
                  ]}
                  aria-hidden
                >
                  {amenity}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Amenity */}
        <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
          <Text
            style={[textStyles.bodySmall, { color: colors.text.secondary, marginBottom: spacing.xs }]}
            nativeID="custom-amenity-label"
          >
            Add Custom Amenity
          </Text>
          <View style={styles.customAmenityRow}>
            <TextInput
              value={customAmenity}
              onChangeText={setCustomAmenity}
              placeholder="e.g., Steamer"
              placeholderTextColor={colors.text.muted}
              style={[
                styles.textInput,
                {
                  flex: 1,
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              accessibilityLabel="Custom amenity name"
              accessibilityHint="Enter a custom amenity not in the list above"
              accessibilityLabelledBy="custom-amenity-label"
            />
            <Pressable
              onPress={addCustomAmenity}
              disabled={!customAmenity.trim()}
              style={[
                styles.addButton,
                {
                  backgroundColor: customAmenity.trim() ? colors.primary : colors.background.tertiary,
                  borderRadius: borderRadius.md,
                  marginLeft: spacing.sm,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add custom amenity"
              accessibilityState={{ disabled: !customAmenity.trim() }}
              accessibilityHint={customAmenity.trim() ? 'Double tap to add this amenity' : 'Enter an amenity name first'}
            >
              <Text
                style={[
                  textStyles.button,
                  { color: customAmenity.trim() ? colors.white : colors.text.muted },
                ]}
                aria-hidden
              >
                Add
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Selected Amenities Count */}
        {amenities.length > 0 && (
          <Text
            style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.lg }]}
            accessibilityRole="text"
            accessibilityLabel={`${amenities.length} amenities selected`}
          >
            {amenities.length} amenities selected
          </Text>
        )}
      </View>
    );
  };

  // Step 5: Confirmation
  const renderConfirmStep = () => {
    const typeLabel = CHAIR_TYPES.find((t) => t.value === chairType)?.label || chairType;
    const modeLabels = rentalModes.map((m) => RENTAL_MODES.find((rm) => rm.value === m)?.label || m);

    // Build summary for accessibility
    const summaryParts = [
      `Property: ${selectedProperty?.name}`,
      `Chair Name: ${chairName}`,
      `Type: ${typeLabel}`,
      `Rental Modes: ${modeLabels.join(', ')}`,
    ];
    if (dailyRateCents) summaryParts.push(`Daily Rate: R ${parseFloat(dailyRateCents).toFixed(2)}`);
    if (hourlyRateCents) summaryParts.push(`Hourly Rate: R ${parseFloat(hourlyRateCents).toFixed(2)} per hour`);
    if (amenities.length > 0) summaryParts.push(`${amenities.length} amenities`);

    return (
      <View style={styles.stepContent}>
        <Text
          style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.lg }]}
          accessibilityRole="text"
        >
          Review your chair details before creating.
        </Text>

        <View
          style={[
            styles.confirmCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Chair summary: ${summaryParts.join(', ')}`}
        >
          {/* Property */}
          <View style={styles.confirmRow} aria-hidden>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Property</Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '500' }]}>
              {selectedProperty?.name}
            </Text>
          </View>

          {/* Name */}
          <View style={[styles.confirmRow, { borderTopColor: colors.border.light }]} aria-hidden>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Chair Name</Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '500' }]}>
              {chairName}
            </Text>
          </View>

          {/* Type */}
          <View style={[styles.confirmRow, { borderTopColor: colors.border.light }]} aria-hidden>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Type</Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '500' }]}>
              {typeLabel}
            </Text>
          </View>

          {/* Rental Modes */}
          <View style={[styles.confirmRow, { borderTopColor: colors.border.light }]} aria-hidden>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Rental Modes</Text>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '500' }]}>
              {modeLabels.join(', ')}
            </Text>
          </View>

          {/* Pricing */}
          {dailyRateCents && (
            <View style={[styles.confirmRow, { borderTopColor: colors.border.light }]} aria-hidden>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Daily Rate</Text>
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                R {parseFloat(dailyRateCents).toFixed(2)}
              </Text>
            </View>
          )}
          {hourlyRateCents && (
            <View style={[styles.confirmRow, { borderTopColor: colors.border.light }]} aria-hidden>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Hourly Rate</Text>
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                R {parseFloat(hourlyRateCents).toFixed(2)}/hr
              </Text>
            </View>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <View style={[styles.confirmRow, { borderTopColor: colors.border.light }]} aria-hidden>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Amenities</Text>
              <Text
                style={[textStyles.bodySmall, { color: colors.text.primary, flex: 1, textAlign: 'right' }]}
                numberOfLines={2}
              >
                {amenities.slice(0, 4).join(', ')}
                {amenities.length > 4 && ` +${amenities.length - 4} more`}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={currentStep === 0 ? 'Close' : 'Go back'}
          accessibilityHint={currentStep === 0 ? 'Exits add chair wizard' : 'Returns to previous step'}
        >
          <VlossomCloseIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.h3, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          Add Chair
        </Text>
        <View style={{ width: 24 }} aria-hidden />
      </View>

      {/* Progress Steps */}
      <View
        style={[styles.progressContainer, { backgroundColor: colors.background.primary }]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep].title}`}
        accessibilityValue={{ min: 0, max: STEPS.length, now: currentStep + 1 }}
      >
        <View style={styles.progressRow} aria-hidden>
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <View key={step.id} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: isCompleted
                        ? colors.primary
                        : isActive
                        ? colors.primary
                        : colors.surface.light,
                    },
                  ]}
                >
                  {isCompleted && <VlossomCheckIcon size={12} color={colors.white} />}
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      { backgroundColor: isCompleted ? colors.primary : colors.surface.light },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
        <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: spacing.xs }]} aria-hidden>
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.default,
          },
        ]}
      >
        {currentStep > 0 && (
          <Pressable
            onPress={handleBack}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.background.tertiary,
                borderRadius: borderRadius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to previous step"
          >
            <Text style={[textStyles.button, { color: colors.text.primary }]} aria-hidden>Back</Text>
          </Pressable>
        )}

        {currentStep < STEPS.length - 1 ? (
          <Pressable
            onPress={handleNext}
            disabled={!canProceed()}
            style={[
              styles.primaryButton,
              {
                backgroundColor: canProceed() ? colors.primary : colors.surface.light,
                borderRadius: borderRadius.md,
                flex: currentStep === 0 ? 1 : undefined,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !canProceed() }}
            accessibilityHint={
              !canProceed()
                ? 'Complete required fields to continue'
                : 'Double tap to proceed to next step'
            }
          >
            <Text style={[textStyles.button, { color: canProceed() ? colors.white : colors.text.muted }]} aria-hidden>
              Continue
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[
              styles.primaryButton,
              {
                backgroundColor: isSubmitting ? colors.surface.light : colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isSubmitting ? 'Creating chair' : 'Create Chair'}
            accessibilityState={{ disabled: isSubmitting }}
            accessibilityHint={isSubmitting ? 'Please wait' : 'Double tap to create this chair'}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} accessibilityLabel="Creating" />
            ) : (
              <Text style={[textStyles.button, { color: colors.white }]} aria-hidden>Create Chair</Text>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  stepContent: {},
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
  },
  typeContent: {
    flex: 1,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  customAmenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmCard: {
    padding: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
