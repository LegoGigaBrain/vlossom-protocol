/**
 * Stylist Onboarding Wizard (V7.2.0)
 *
 * 4-step wizard for new stylists:
 * 1. Welcome & Overview
 * 2. Profile Details (bio, experience, specialties)
 * 3. Services & Pricing
 * 4. Operating Mode & Location
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
  VlossomCalendarIcon,
  VlossomProfileIcon,
  VlossomWalletIcon,
  VlossomSearchIcon,
} from '../../src/components/icons/VlossomIcons';

// Service categories for stylists
const SERVICE_CATEGORIES = [
  { id: 'BRAIDS', label: 'Braids & Locs', icon: '🪢' },
  { id: 'NATURAL', label: 'Natural Hair', icon: '🌀' },
  { id: 'WEAVES', label: 'Weaves & Wigs', icon: '💇🏾‍♀️' },
  { id: 'COLOR', label: 'Color & Treatments', icon: '🎨' },
  { id: 'NAILS', label: 'Nails', icon: '💅' },
  { id: 'MAKEUP', label: 'Makeup & Lashes', icon: '💄' },
  { id: 'BARBER', label: 'Barbering', icon: '✂️' },
  { id: 'SKINCARE', label: 'Skincare & Facials', icon: '✨' },
];

// Operating modes
const OPERATING_MODES = [
  {
    id: 'MOBILE',
    label: 'Mobile Stylist',
    description: 'I travel to clients',
    icon: '🚗',
  },
  {
    id: 'FIXED',
    label: 'Salon-Based',
    description: 'Clients come to me',
    icon: '🏠',
  },
  {
    id: 'HYBRID',
    label: 'Both',
    description: 'Mobile & salon services',
    icon: '🔄',
  },
];

interface OnboardingData {
  bio: string;
  yearsExperience: string;
  specialties: string[];
  operatingMode: string;
  travelRadius: string;
  baseLocation: string;
}

export default function StylistOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    bio: '',
    yearsExperience: '',
    specialties: [],
    operatingMode: '',
    travelRadius: '25',
    baseLocation: '',
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
      'Profile Created!',
      'Your stylist profile is ready. Add your services to start receiving bookings.',
      [
        {
          text: 'Add Services',
          onPress: () => router.replace('/stylist/services'),
        },
        {
          text: 'Go to Dashboard',
          onPress: () => router.replace('/(tabs)/profile'),
        },
      ]
    );
  };

  const toggleSpecialty = (id: string) => {
    setData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(id)
        ? prev.specialties.filter((s) => s !== id)
        : [...prev.specialties, id],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true; // Welcome step
      case 1:
        return data.bio.length >= 20 && data.yearsExperience.length > 0;
      case 2:
        return data.specialties.length > 0;
      case 3:
        return data.operatingMode.length > 0;
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
          <ProfileStep
            data={data}
            setData={setData}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        );
      case 2:
        return (
          <SpecialtiesStep
            data={data}
            toggleSpecialty={toggleSpecialty}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        );
      case 3:
        return (
          <OperatingModeStep
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
            accessibilityHint={currentStep === 0 ? 'Exits onboarding wizard' : 'Returns to previous step'}
          >
            <VlossomBackIcon size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={[textStyles.h3, { color: colors.text.primary }]}
            accessibilityRole="header"
            accessibilityLabel={currentStep === 0 ? 'Welcome' : `Step ${currentStep} of ${totalSteps - 1}`}
          >
            {currentStep === 0 ? 'Welcome' : `Step ${currentStep} of ${totalSteps - 1}`}
          </Text>
          <View style={styles.headerSpacer} aria-hidden />
        </View>

        {/* Progress Bar */}
        <View
          style={[styles.progressContainer, { paddingHorizontal: spacing.lg }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Onboarding progress: ${Math.round(((currentStep + 1) / totalSteps) * 100)}%`}
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
            accessibilityLabel={currentStep === totalSteps - 1 ? 'Complete Setup' : 'Continue'}
            accessibilityState={{ disabled: !canProceed() }}
            accessibilityHint={
              !canProceed()
                ? 'Complete required fields to continue'
                : currentStep === totalSteps - 1
                  ? 'Double tap to complete your stylist profile setup'
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
              {currentStep === totalSteps - 1 ? 'Complete Setup' : 'Continue'}
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
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

function WelcomeStep({ colors, spacing, borderRadius }: StepProps) {
  return (
    <View style={styles.stepContent}>
      <View style={[styles.welcomeIcon, { marginTop: spacing.xl }]} aria-hidden>
        <Text style={styles.welcomeEmoji}>💇🏾‍♀️</Text>
      </View>

      <Text
        style={[
          textStyles.h2,
          { color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg },
        ]}
        accessibilityRole="header"
      >
        Welcome to Vlossom
      </Text>

      <Text
        style={[
          textStyles.body,
          { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md },
        ]}
      >
        Let's set up your stylist profile so clients can discover you and book your services.
      </Text>

      <View
        style={[styles.benefitsContainer, { marginTop: spacing.xl }]}
        accessibilityRole="list"
        accessibilityLabel="Benefits of becoming a Vlossom stylist"
      >
        <BenefitRow
          icon={<VlossomSearchIcon size={20} color={colors.primary} />}
          title="Get Discovered"
          description="Appear in client searches based on your specialties"
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
        <BenefitRow
          icon={<VlossomCalendarIcon size={20} color={colors.primary} />}
          title="Manage Bookings"
          description="Accept or decline requests on your schedule"
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
        />
        <BenefitRow
          icon={<VlossomWalletIcon size={20} color={colors.primary} />}
          title="Get Paid Securely"
          description="Payments are held in escrow until service completion"
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

function ProfileStep({ data, setData, colors, spacing, borderRadius }: DataStepProps) {
  return (
    <View style={styles.stepContent}>
      <Text
        style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
        accessibilityRole="header"
      >
        Tell us about yourself
      </Text>
      <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.xs }]}>
        Help clients get to know you better.
      </Text>

      {/* Bio */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="bio-label"
        >
          Bio
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
          placeholder="Tell clients about your experience and style..."
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={4}
          value={data.bio}
          onChangeText={(text) => setData((prev) => ({ ...prev, bio: text }))}
          textAlignVertical="top"
          accessibilityLabel="Bio"
          accessibilityHint="Tell clients about your experience and style. Minimum 20 characters."
          accessibilityLabelledBy="bio-label"
        />
        <Text
          style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}
          accessibilityLabel={`${data.bio.length} of 500 characters entered, minimum 20 required`}
          accessibilityLiveRegion="polite"
        >
          {data.bio.length}/500 characters (minimum 20)
        </Text>
      </View>

      {/* Years Experience */}
      <View style={[styles.inputGroup, { marginTop: spacing.lg }]}>
        <Text
          style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
          nativeID="experience-label"
        >
          Years of Experience
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
          placeholder="e.g., 5"
          placeholderTextColor={colors.text.muted}
          keyboardType="number-pad"
          value={data.yearsExperience}
          onChangeText={(text) => setData((prev) => ({ ...prev, yearsExperience: text }))}
          accessibilityLabel="Years of Experience"
          accessibilityHint="Enter the number of years you have been working as a stylist"
          accessibilityLabelledBy="experience-label"
        />
      </View>
    </View>
  );
}

function SpecialtiesStep({
  data,
  toggleSpecialty,
  colors,
  spacing,
  borderRadius,
}: StepProps & { data: OnboardingData; toggleSpecialty: (id: string) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text
        style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
        accessibilityRole="header"
      >
        Your specialties
      </Text>
      <Text
        style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.xs }]}
        nativeID="specialties-description"
      >
        Select all categories that apply to your services.
      </Text>

      <View
        style={[styles.specialtiesGrid, { marginTop: spacing.lg }]}
        accessible
        accessibilityLabelledBy="specialties-description"
      >
        {SERVICE_CATEGORIES.map((category) => {
          const isSelected = data.specialties.includes(category.id);
          return (
            <Pressable
              key={category.id}
              onPress={() => toggleSpecialty(category.id)}
              style={[
                styles.specialtyChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '20'
                    : colors.background.secondary,
                  borderColor: isSelected ? colors.primary : colors.border.default,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityLabel={category.label}
              accessibilityState={{ checked: isSelected }}
              accessibilityHint={isSelected ? 'Double tap to deselect' : 'Double tap to select this specialty'}
            >
              <Text style={styles.specialtyIcon} aria-hidden>{category.icon}</Text>
              <Text
                style={[
                  textStyles.bodySmall,
                  {
                    color: isSelected ? colors.primary : colors.text.primary,
                    fontWeight: isSelected ? '600' : '400',
                    marginTop: spacing.xs,
                  },
                ]}
                aria-hidden
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.md }]}
        accessibilityLabel={`${data.specialties.length} specialties selected`}
        accessibilityLiveRegion="polite"
      >
        {data.specialties.length} selected
      </Text>
    </View>
  );
}

function OperatingModeStep({ data, setData, colors, spacing, borderRadius }: DataStepProps) {
  return (
    <View style={styles.stepContent}>
      <Text
        style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.lg }]}
        accessibilityRole="header"
      >
        How do you work?
      </Text>
      <Text
        style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.xs }]}
        nativeID="operating-mode-description"
      >
        Choose your preferred operating mode.
      </Text>

      <View
        style={{ marginTop: spacing.lg }}
        accessibilityRole="radiogroup"
        accessibilityLabelledBy="operating-mode-description"
      >
        {OPERATING_MODES.map((mode) => {
          const isSelected = data.operatingMode === mode.id;
          return (
            <Pressable
              key={mode.id}
              onPress={() => setData((prev) => ({ ...prev, operatingMode: mode.id }))}
              style={[
                styles.modeOption,
                {
                  backgroundColor: isSelected
                    ? colors.primary + '15'
                    : colors.background.secondary,
                  borderColor: isSelected ? colors.primary : colors.border.default,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={`${mode.label}: ${mode.description}`}
              accessibilityState={{ selected: isSelected }}
              accessibilityHint={isSelected ? 'Currently selected' : 'Double tap to select this operating mode'}
            >
              <Text style={styles.modeIcon} aria-hidden>{mode.icon}</Text>
              <View style={styles.modeContent} aria-hidden>
                <Text
                  style={[
                    textStyles.body,
                    {
                      color: isSelected ? colors.primary : colors.text.primary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {mode.label}
                </Text>
                <Text
                  style={[
                    textStyles.caption,
                    { color: colors.text.secondary, marginTop: 2 },
                  ]}
                >
                  {mode.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: isSelected ? colors.primary : colors.border.default,
                  },
                ]}
                aria-hidden
              >
                {isSelected && (
                  <View
                    style={[styles.radioInner, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Travel Radius (shown for MOBILE and HYBRID modes) */}
      {(data.operatingMode === 'MOBILE' || data.operatingMode === 'HYBRID') && (
        <View
          style={[styles.inputGroup, { marginTop: spacing.lg }]}
          accessibilityLiveRegion="polite"
        >
          <Text
            style={[textStyles.label, { color: colors.text.primary, marginBottom: spacing.xs }]}
            nativeID="travel-radius-label"
          >
            Travel Radius (km)
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
            placeholder="e.g., 25"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            value={data.travelRadius}
            onChangeText={(text) => setData((prev) => ({ ...prev, travelRadius: text }))}
            accessibilityLabel="Travel Radius in kilometers"
            accessibilityHint="Enter how far you're willing to travel to clients"
            accessibilityLabelledBy="travel-radius-label"
          />
          <Text
            style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}
            aria-hidden
          >
            How far you're willing to travel to clients
          </Text>
        </View>
      )}
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

  // Profile Step
  inputGroup: {},
  textInput: {
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },

  // Specialties Step
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  specialtyChip: {
    width: '45%',
    marginHorizontal: '2.5%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  specialtyIcon: {
    fontSize: 28,
  },

  // Operating Mode Step
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  modeIcon: {
    fontSize: 28,
    width: 40,
  },
  modeContent: {
    flex: 1,
    marginLeft: 12,
  },
  radioOuter: {
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
});
