/**
 * Add Property Wizard (V7.2.0)
 *
 * 4-step wizard for listing a new property:
 * 1. Welcome & Overview
 * 2. Property Details (name, type, description)
 * 3. Location & Amenities
 * 4. Chair Configuration & Pricing
 *
 * V7.2.0: Full accessibility support with semantic roles
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomHomeIcon,
  VlossomWalletIcon,
  VlossomCalendarIcon,
  VlossomSearchIcon,
} from '../../src/components/icons/VlossomIcons';

// Property types
const PROPERTY_TYPES = [
  { id: 'SALON', label: 'Hair Salon', icon: '💇🏾‍♀️' },
  { id: 'BARBERSHOP', label: 'Barbershop', icon: '💈' },
  { id: 'BEAUTY_STUDIO', label: 'Beauty Studio', icon: '💄' },
  { id: 'NAIL_BAR', label: 'Nail Bar', icon: '💅' },
  { id: 'SPA', label: 'Spa & Wellness', icon: '🧖🏾‍♀️' },
  { id: 'MIXED', label: 'Multi-Service', icon: '✨' },
];

// Amenities options
const AMENITIES = [
  { id: 'WIFI', label: 'Free WiFi', icon: '📶' },
  { id: 'PARKING', label: 'Parking', icon: '🅿️' },
  { id: 'AC', label: 'Air Conditioning', icon: '❄️' },
  { id: 'REFRESHMENTS', label: 'Refreshments', icon: '☕' },
  { id: 'STORAGE', label: 'Storage', icon: '🗄️' },
  { id: 'MUSIC', label: 'Sound System', icon: '🎵' },
  { id: 'MIRRORS', label: 'Styling Mirrors', icon: '🪞' },
  { id: 'SINK', label: 'Wash Basin', icon: '🚿' },
];

interface PropertyData {
  name: string;
  type: string;
  description: string;
  address: string;
  city: string;
  amenities: string[];
  chairCount: string;
  dailyRate: string;
  weeklyRate: string;
  monthlyRate: string;
}

export default function AddPropertyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<PropertyData>({
    name: '',
    type: '',
    description: '',
    address: '',
    city: '',
    amenities: [],
    chairCount: '1',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
  });

  const totalSteps = 4;

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // In a real app, this would save to the API
    Alert.alert(
      'Property Listed!',
      'Your property has been submitted for review. You\'ll be notified once it\'s approved.',
      [
        {
          text: 'View Property',
          onPress: () => router.replace('/property-owner'),
        },
        {
          text: 'Add Another',
          onPress: () => {
            setCurrentStep(0);
            setData({
              name: '',
              type: '',
              description: '',
              address: '',
              city: '',
              amenities: [],
              chairCount: '1',
              dailyRate: '',
              weeklyRate: '',
              monthlyRate: '',
            });
          },
        },
      ]
    );
  };

  const toggleAmenity = (id: string) => {
    setData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Welcome step
      case 1:
        return data.name.length >= 3 && data.type.length > 0;
      case 2:
        return data.address.length >= 5 && data.city.length >= 2;
      case 3:
        return data.dailyRate.length > 0 || data.weeklyRate.length > 0 || data.monthlyRate.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep colors={colors} spacing={spacing} borderRadius={borderRadius} />
        );
      case 1:
        return (
          <PropertyDetailsStep
            data={data}
            setData={setData}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        );
      case 2:
        return (
          <LocationStep
            data={data}
            setData={setData}
            toggleAmenity={toggleAmenity}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        );
      case 3:
        return (
          <PricingStep
            data={data}
            setData={setData}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing.sm,
              paddingHorizontal: spacing.lg,
              borderBottomColor: colors.border.default,
            },
          ]}
        >
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={currentStep === 0 ? 'Close' : 'Go back'}
            accessibilityHint={currentStep === 0 ? 'Exits property listing wizard' : 'Returns to previous step'}
          >
            <VlossomBackIcon size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={[textStyles.h3, { color: colors.text.primary }]}
            accessibilityRole="header"
            accessibilityLabel={currentStep === 0 ? 'List Your Space' : `Step ${currentStep} of ${totalSteps - 1}`}
          >
            {currentStep === 0 ? 'List Your Space' : `Step ${currentStep} of ${totalSteps - 1}`}
          </Text>
          <View style={styles.headerSpacer} aria-hidden />
        </View>

        {/* Progress Bar */}
        <View
          style={[styles.progressContainer, { paddingHorizontal: spacing.lg }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Property listing progress: ${Math.round(((currentStep + 1) / totalSteps) * 100)}%`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(((currentStep + 1) / totalSteps) * 100) }}
        >
          <View style={[styles.progressTrack, { backgroundColor: colors.border.default }]} aria-hidden>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Step Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.lg,
              paddingBottom: insets.bottom + spacing.md,
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.default,
            },
          ]}
        >
          <Pressable
            onPress={handleNext}
            disabled={!canProceed()}
            style={[
              styles.nextButton,
              {
                backgroundColor: canProceed() ? colors.primary : colors.border.default,
                borderRadius: borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={currentStep === totalSteps - 1 ? 'Submit for Review' : 'Continue'}
            accessibilityState={{ disabled: !canProceed() }}
            accessibilityHint={
              !canProceed()
                ? 'Complete required fields to continue'
                : currentStep === totalSteps - 1
                  ? 'Double tap to submit your property for review'
                  : 'Double tap to proceed to next step'
            }
          >
            <Text
              style={[
                textStyles.button,
                { color: canProceed() ? colors.white : colors.text.muted },
              ]}
              aria-hidden
            >
              {currentStep === totalSteps - 1 ? 'Submit for Review' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Step Components
// ============================================================================

interface StepProps {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

interface DataStepProps extends StepProps {
  data: PropertyData;
  setData: React.Dispatch<React.SetStateAction<PropertyData>>;
}

function WelcomeStep({ colors, spacing, borderRadius }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <View style={[styles.welcomeIcon, { marginTop: spacing.xl }]} aria-hidden>
        <Text style={styles.welcomeEmoji}>🏠</Text>
      </View>

      <Text
        style={[
          textStyles.h2,
          { color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg },
        ]}
        accessibilityRole="header"
      >
        List Your Space
      </Text>

      <Text
        style={[
          textStyles.body,
          { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
        ]}
        accessibilityRole="text"
      >
        Turn your salon or beauty space into a revenue stream by renting chairs to talented stylists.
      </Text>

      <View
        style={[styles.benefitsContainer, { marginTop: spacing.xl }]}
        accessibilityRole="list"
        accessibilityLabel="Benefits of listing your space"
      >
        <BenefitRow
          icon={<VlossomSearchIcon size={20} color={colors.primary} />}
          title="Find Stylists"
          description="Connect with verified professional stylists"
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
        <BenefitRow
          icon={<VlossomCalendarIcon size={20} color={colors.primary} />}
          title="Flexible Rentals"
          description="Daily, weekly, or monthly rental options"
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
        <BenefitRow
          icon={<VlossomWalletIcon size={20} color={colors.primary} />}
          title="Secure Payments"
          description="Automatic rent collection via escrow"
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
      </View>
    </View>
  );
}

function BenefitRow({
  icon,
  title,
  description,
  colors,
  spacing,
  borderRadius,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  colors: StepProps['colors'];
  spacing: StepProps['spacing'];
  borderRadius: StepProps['borderRadius'];
}) {
  return (
    <View
      style={[
        styles.benefitRow,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          marginBottom: spacing.sm,
          padding: spacing.md,
        },
      ]}
      accessible
      accessibilityLabel={`${title}: ${description}`}
    >
      <View style={styles.benefitIcon} aria-hidden>{icon}</View>
      <View style={styles.benefitContent} aria-hidden>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
          {title}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 2 }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function PropertyDetailsStep({ data, setData, colors, spacing, borderRadius }: DataStepProps) {
  const selectedType = PROPERTY_TYPES.find((t) => t.id === data.type);

  return (
    <View style={styles.stepContent}>
      <Text
        style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
        accessibilityRole="header"
      >
        Property Details
      </Text>
      <Text
        style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.xs }]}
        accessibilityRole="text"
      >
        Tell us about your space.
      </Text>

      {/* Property Name */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="property-name-label"
        >
          Property Name
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderColor: colors.border.default,
            },
          ]}
          placeholder="e.g., Thandi's Hair Studio"
          placeholderTextColor={colors.text.muted}
          value={data.name}
          onChangeText={(text) => setData((prev) => ({ ...prev, name: text }))}
          accessibilityLabel="Property Name"
          accessibilityHint="Enter your property or salon name, minimum 3 characters"
          accessibilityLabelledBy="property-name-label"
        />
      </View>

      {/* Property Type */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.sm }]}
          nativeID="property-type-label"
        >
          Property Type
        </Text>
        <View
          style={styles.typeGrid}
          accessibilityRole="radiogroup"
          accessibilityLabel={`Property type selection${selectedType ? `, ${selectedType.label} selected` : ''}`}
          accessibilityLabelledBy="property-type-label"
        >
          {PROPERTY_TYPES.map((type) => {
            const isSelected = data.type === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setData((prev) => ({ ...prev, type: type.id }))}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + '20'
                      : colors.background.secondary,
                    borderColor: isSelected ? colors.primary : colors.border.default,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={type.label}
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select this property type'}
              >
                <Text style={styles.typeIcon} aria-hidden>{type.icon}</Text>
                <Text
                  style={[
                    textStyles.caption,
                    {
                      color: isSelected ? colors.primary : colors.text.primary,
                      fontWeight: isSelected ? '600' : '400',
                      marginTop: 4,
                      textAlign: 'center',
                    },
                  ]}
                  aria-hidden
                >
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Description */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="property-description-label"
        >
          Description (optional)
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderColor: colors.border.default,
            },
          ]}
          placeholder="Describe your space, atmosphere, and what makes it special..."
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={3}
          value={data.description}
          onChangeText={(text) => setData((prev) => ({ ...prev, description: text }))}
          textAlignVertical="top"
          accessibilityLabel="Property Description, optional"
          accessibilityHint="Describe your space, atmosphere, and what makes it special"
          accessibilityLabelledBy="property-description-label"
        />
      </View>
    </View>
  );
}

function LocationStep({
  data,
  setData,
  toggleAmenity,
  colors,
  spacing,
  borderRadius,
}: DataStepProps & { toggleAmenity: (id: string) => void }) {
  const selectedAmenities = AMENITIES.filter((a) => data.amenities.includes(a.id));
  const amenitiesLabel = selectedAmenities.length > 0
    ? `${selectedAmenities.length} selected: ${selectedAmenities.map((a) => a.label).join(', ')}`
    : 'None selected';

  return (
    <View style={styles.stepContent}>
      <Text
        style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
        accessibilityRole="header"
      >
        Location & Amenities
      </Text>
      <Text
        style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.xs }]}
        accessibilityRole="text"
      >
        Where is your property located?
      </Text>

      {/* Address */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="street-address-label"
        >
          Street Address
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderColor: colors.border.default,
            },
          ]}
          placeholder="e.g., 123 Main Road"
          placeholderTextColor={colors.text.muted}
          value={data.address}
          onChangeText={(text) => setData((prev) => ({ ...prev, address: text }))}
          accessibilityLabel="Street Address"
          accessibilityHint="Enter your property's street address, minimum 5 characters"
          accessibilityLabelledBy="street-address-label"
        />
      </View>

      {/* City */}
      <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="city-suburb-label"
        >
          City / Suburb
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderColor: colors.border.default,
            },
          ]}
          placeholder="e.g., Sandton, Johannesburg"
          placeholderTextColor={colors.text.muted}
          value={data.city}
          onChangeText={(text) => setData((prev) => ({ ...prev, city: text }))}
          accessibilityLabel="City or Suburb"
          accessibilityHint="Enter your city or suburb, minimum 2 characters"
          accessibilityLabelledBy="city-suburb-label"
        />
      </View>

      {/* Amenities */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.sm }]}
          nativeID="amenities-label"
        >
          Amenities
        </Text>
        <View
          style={styles.amenitiesGrid}
          accessible
          accessibilityLabel={`Amenities selection, ${amenitiesLabel}`}
          accessibilityLabelledBy="amenities-label"
        >
          {AMENITIES.map((amenity) => {
            const isSelected = data.amenities.includes(amenity.id);
            return (
              <Pressable
                key={amenity.id}
                onPress={() => toggleAmenity(amenity.id)}
                style={[
                  styles.amenityChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + '20'
                      : colors.background.secondary,
                    borderColor: isSelected ? colors.primary : colors.border.default,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityLabel={amenity.label}
                accessibilityState={{ checked: isSelected }}
                accessibilityHint={isSelected ? 'Double tap to remove' : 'Double tap to add'}
              >
                <Text style={styles.amenityIcon} aria-hidden>{amenity.icon}</Text>
                <Text
                  style={[
                    textStyles.caption,
                    {
                      color: isSelected ? colors.primary : colors.text.primary,
                      fontWeight: isSelected ? '600' : '400',
                      marginLeft: spacing.xs,
                    },
                  ]}
                  aria-hidden
                >
                  {amenity.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function PricingStep({ data, setData, colors, spacing, borderRadius }: DataStepProps) {
  return (
    <View style={styles.stepContent}>
      <Text
        style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
        accessibilityRole="header"
      >
        Chairs & Pricing
      </Text>
      <Text
        style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.xs }]}
        accessibilityRole="text"
      >
        Set your rental rates per chair.
      </Text>

      {/* Chair Count */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="chair-count-label"
        >
          Number of Chairs
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background.secondary,
              color: colors.text.primary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderColor: colors.border.default,
            },
          ]}
          placeholder="e.g., 4"
          placeholderTextColor={colors.text.muted}
          keyboardType="number-pad"
          value={data.chairCount}
          onChangeText={(text) => setData((prev) => ({ ...prev, chairCount: text }))}
          accessibilityLabel="Number of Chairs"
          accessibilityHint="Enter how many chairs you want to rent out"
          accessibilityLabelledBy="chair-count-label"
        />
      </View>

      <Text
        style={[
          textStyles.body,
          { color: colors.text.secondary, marginTop: spacing.xl, marginBottom: spacing.md },
        ]}
        accessibilityRole="text"
        nativeID="rental-rates-description"
      >
        Rental Rates (per chair, in ZAR)
      </Text>

      {/* Daily Rate */}
      <View style={[styles.inputGroup, { marginTop: spacing.sm }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="daily-rate-label"
        >
          Daily Rate (optional)
        </Text>
        <View style={styles.priceInputRow}>
          <Text
            style={[textStyles.body, { color: colors.text.secondary, marginRight: spacing.sm }]}
            aria-hidden
          >
            R
          </Text>
          <TextInput
            style={[
              styles.textInput,
              styles.priceInput,
              {
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                borderColor: colors.border.default,
              },
            ]}
            placeholder="e.g., 350"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            value={data.dailyRate}
            onChangeText={(text) => setData((prev) => ({ ...prev, dailyRate: text }))}
            accessibilityLabel="Daily Rate in Rands, optional"
            accessibilityHint="Enter daily rental rate per chair"
            accessibilityLabelledBy="daily-rate-label"
          />
        </View>
      </View>

      {/* Weekly Rate */}
      <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="weekly-rate-label"
        >
          Weekly Rate (optional)
        </Text>
        <View style={styles.priceInputRow}>
          <Text
            style={[textStyles.body, { color: colors.text.secondary, marginRight: spacing.sm }]}
            aria-hidden
          >
            R
          </Text>
          <TextInput
            style={[
              styles.textInput,
              styles.priceInput,
              {
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                borderColor: colors.border.default,
              },
            ]}
            placeholder="e.g., 2000"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            value={data.weeklyRate}
            onChangeText={(text) => setData((prev) => ({ ...prev, weeklyRate: text }))}
            accessibilityLabel="Weekly Rate in Rands, optional"
            accessibilityHint="Enter weekly rental rate per chair"
            accessibilityLabelledBy="weekly-rate-label"
          />
        </View>
      </View>

      {/* Monthly Rate */}
      <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="monthly-rate-label"
        >
          Monthly Rate (optional)
        </Text>
        <View style={styles.priceInputRow}>
          <Text
            style={[textStyles.body, { color: colors.text.secondary, marginRight: spacing.sm }]}
            aria-hidden
          >
            R
          </Text>
          <TextInput
            style={[
              styles.textInput,
              styles.priceInput,
              {
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                borderColor: colors.border.default,
              },
            ]}
            placeholder="e.g., 6500"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            value={data.monthlyRate}
            onChangeText={(text) => setData((prev) => ({ ...prev, monthlyRate: text }))}
            accessibilityLabel="Monthly Rate in Rands, optional"
            accessibilityHint="Enter monthly rental rate per chair"
            accessibilityLabelledBy="monthly-rate-label"
          />
        </View>
      </View>

      <Text
        style={[
          textStyles.caption,
          { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' },
        ]}
        accessibilityRole="text"
      >
        Set at least one rate. You can update these later.
      </Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  // Welcome Step
  welcomeIcon: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 64,
  },
  benefitsContainer: {},
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 40,
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Form inputs
  inputGroup: {},
  textInput: {
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeChip: {
    width: '30%',
    marginHorizontal: '1.66%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  typeIcon: {
    fontSize: 24,
  },

  // Amenities grid
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
  },
  amenityIcon: {
    fontSize: 16,
  },

  // Pricing
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
  },
});
