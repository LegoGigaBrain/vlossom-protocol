/**
 * Hair Health Onboarding Wizard (V6.8.0)
 *
 * 6-step guided quiz to build hair profile:
 * 1. Pattern Test (air dry behavior)
 * 2. Porosity Test (water test)
 * 3. Density Test (scalp visibility)
 * 4. Strand Thickness (thread comparison)
 * 5. Shrinkage (wet to dry)
 * 6. Visual Confirmation
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomCloseIcon,
  VlossomHealthyIcon,
} from '../../src/components/icons/VlossomIcons';
import { useState } from 'react';
import {
  useHairHealthStore,
  selectOnboardingStep,
  selectOnboardingData,
} from '../../src/stores';
import type {
  TextureClass,
  PatternFamily,
  ThreeLevel,
} from '../../src/api/hair-health';

// Onboarding questions
const QUESTIONS = [
  {
    step: 1,
    title: 'Pattern Test',
    question: 'When your hair is wet and left to air dry, does it...',
    options: [
      { value: 'TYPE_1', label: 'Dry completely straight', pattern: 'STRAIGHT' as PatternFamily },
      { value: 'TYPE_2', label: 'Form loose, beachy waves', pattern: 'WAVY' as PatternFamily },
      { value: 'TYPE_3', label: 'Form defined ringlets or spirals', pattern: 'CURLY' as PatternFamily },
      { value: 'TYPE_4', label: 'Coil tightly or form z-patterns', pattern: 'COILY' as PatternFamily },
    ],
    field: 'textureClass' as const,
    patternField: 'patternFamily' as const,
  },
  {
    step: 2,
    title: 'Porosity Test',
    question: 'When you place a single strand of hair in a glass of water, does it...',
    options: [
      { value: 'LOW', label: 'Float on top for several minutes' },
      { value: 'MEDIUM', label: 'Slowly sink to the middle' },
      { value: 'HIGH', label: 'Sink to the bottom quickly' },
    ],
    field: 'porosityLevel' as const,
  },
  {
    step: 3,
    title: 'Density Test',
    question: 'Can you see your scalp through your hair without parting it?',
    options: [
      { value: 'LOW', label: 'Yes, easily' },
      { value: 'MEDIUM', label: 'Somewhat, with effort' },
      { value: 'HIGH', label: 'Not at all' },
    ],
    field: 'densityLevel' as const,
  },
  {
    step: 4,
    title: 'Strand Thickness',
    question: 'Compare a single strand of your hair to a piece of sewing thread',
    options: [
      { value: 'LOW', label: 'Much thinner than thread' },
      { value: 'MEDIUM', label: 'About the same' },
      { value: 'HIGH', label: 'Thicker than thread' },
    ],
    field: 'strandThickness' as const,
  },
  {
    step: 5,
    title: 'Shrinkage',
    question: 'How much does your hair shrink when it dries?',
    options: [
      { value: 'LOW', label: 'Little to none (stays same length)' },
      { value: 'MEDIUM', label: 'Moderate (25-50% shorter)' },
      { value: 'HIGH', label: 'Significant (50%+ shorter)' },
    ],
    field: 'shrinkageTendency' as const,
  },
];

const TOTAL_STEPS = QUESTIONS.length + 1; // +1 for confirmation

export default function HairHealthOnboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const onboardingStep = useHairHealthStore(selectOnboardingStep);
  const onboardingData = useHairHealthStore(selectOnboardingData);
  const {
    setOnboardingStep,
    setOnboardingData,
    completeOnboarding,
    profileLoading,
  } = useHairHealthStore();

  // Local state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentQuestion = onboardingStep < QUESTIONS.length ? QUESTIONS[onboardingStep] : null;
  const isConfirmationStep = onboardingStep >= QUESTIONS.length;

  const handleClose = () => {
    router.back();
  };

  const handleBack = () => {
    if (onboardingStep === 0) {
      router.back();
    } else {
      setOnboardingStep(onboardingStep - 1);
      setSelectedOption(null);
    }
  };

  const handleSelectOption = (value: string) => {
    setSelectedOption(value);
  };

  const handleNext = () => {
    if (!currentQuestion || !selectedOption) return;

    // Save the answer
    const data: Record<string, unknown> = {
      [currentQuestion.field]: selectedOption,
    };

    // If this is the pattern test, also save the pattern family
    if (currentQuestion.patternField) {
      const option = currentQuestion.options.find((o) => o.value === selectedOption);
      if (option && 'pattern' in option) {
        data[currentQuestion.patternField] = option.pattern;
      }
    }

    setOnboardingData(data);
    setOnboardingStep(onboardingStep + 1);
    setSelectedOption(null);
  };

  const handleComplete = async () => {
    const profile = await completeOnboarding();
    if (profile) {
      router.replace('/hair-health');
    }
  };

  // Confirmation Step
  if (isConfirmationStep) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <VlossomBackIcon size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            Review
          </Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <VlossomCloseIcon size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { paddingHorizontal: spacing.lg }]}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface.light }]}>
            <View
              style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]}
            />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.lg }}>
          <View
            style={[
              styles.confirmationIcon,
              { backgroundColor: colors.tertiary + '20', borderRadius: borderRadius.circle },
            ]}
          >
            <VlossomHealthyIcon size={48} color={colors.tertiary} />
          </View>

          <Text style={[textStyles.h2, { color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg }]}>
            Your Hair Profile
          </Text>
          <Text
            style={[textStyles.body, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm }]}
          >
            Based on your answers, here's what we learned about your hair
          </Text>

          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Texture"
              value={getTextureLabel(onboardingData.textureClass as TextureClass)}
              colors={colors}
              borderRadius={borderRadius}
            />
            <SummaryCard
              label="Pattern"
              value={getPatternLabel(onboardingData.patternFamily as PatternFamily)}
              colors={colors}
              borderRadius={borderRadius}
            />
            <SummaryCard
              label="Porosity"
              value={getLevelLabel(onboardingData.porosityLevel as ThreeLevel)}
              colors={colors}
              borderRadius={borderRadius}
            />
            <SummaryCard
              label="Density"
              value={getLevelLabel(onboardingData.densityLevel as ThreeLevel)}
              colors={colors}
              borderRadius={borderRadius}
            />
            <SummaryCard
              label="Thickness"
              value={getLevelLabel(onboardingData.strandThickness as ThreeLevel)}
              colors={colors}
              borderRadius={borderRadius}
            />
            <SummaryCard
              label="Shrinkage"
              value={getLevelLabel(onboardingData.shrinkageTendency as ThreeLevel)}
              colors={colors}
              borderRadius={borderRadius}
            />
          </View>

          <Text
            style={[
              textStyles.caption,
              { color: colors.text.muted, textAlign: 'center', marginTop: spacing.lg },
            ]}
          >
            You can update these details anytime from your profile
          </Text>
        </ScrollView>

        {/* Complete Button */}
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg },
          ]}
        >
          <Pressable
            onPress={handleComplete}
            disabled={profileLoading}
            style={[
              styles.completeButton,
              {
                backgroundColor: profileLoading ? colors.text.muted : colors.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            {profileLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
                Save Profile
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // Question Step
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
          Step {onboardingStep + 1} of {TOTAL_STEPS}
        </Text>
        <Pressable onPress={handleClose} hitSlop={8}>
          <VlossomCloseIcon size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.progressTrack, { backgroundColor: colors.surface.light }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${((onboardingStep + 1) / TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Question Title */}
        <Text style={[textStyles.h2, { color: colors.text.primary }]}>
          {currentQuestion?.title}
        </Text>
        <Text
          style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.sm }]}
        >
          {currentQuestion?.question}
        </Text>

        {/* Options */}
        <View style={[styles.optionsContainer, { marginTop: spacing.xl }]}>
          {currentQuestion?.options.map((option) => {
            const isSelected = selectedOption === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelectOption(option.value)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? colors.primary + '10' : colors.background.secondary,
                    borderColor: isSelected ? colors.primary : 'transparent',
                    borderWidth: isSelected ? 2 : 0,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionRadio,
                    {
                      borderColor: isSelected ? colors.primary : colors.text.muted,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <View style={styles.optionRadioInner} />}
                </View>
                <Text
                  style={[
                    textStyles.body,
                    { color: isSelected ? colors.primary : colors.text.primary, flex: 1 },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Next Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg },
        ]}
      >
        <Pressable
          onPress={handleNext}
          disabled={!selectedOption}
          style={[
            styles.nextButton,
            {
              backgroundColor: selectedOption ? colors.primary : colors.text.muted,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Summary Card Component
interface SummaryCardProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function SummaryCard({ label, value, colors, borderRadius }: SummaryCardProps) {
  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: colors.surface.light, borderRadius: borderRadius.md },
      ]}
    >
      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>{label}</Text>
      <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
        {value || 'Unknown'}
      </Text>
    </View>
  );
}

// Helper functions
function getTextureLabel(texture: TextureClass | undefined): string {
  if (!texture) return 'Unknown';
  switch (texture) {
    case 'TYPE_1':
      return 'Type 1';
    case 'TYPE_2':
      return 'Type 2';
    case 'TYPE_3':
      return 'Type 3';
    case 'TYPE_4':
      return 'Type 4';
  }
}

function getPatternLabel(pattern: PatternFamily | undefined): string {
  if (!pattern) return 'Unknown';
  switch (pattern) {
    case 'STRAIGHT':
      return 'Straight';
    case 'WAVY':
      return 'Wavy';
    case 'CURLY':
      return 'Curly';
    case 'COILY':
      return 'Coily';
  }
}

function getLevelLabel(level: ThreeLevel | undefined): string {
  if (!level) return 'Unknown';
  return level.charAt(0) + level.slice(1).toLowerCase();
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
  progressContainer: {
    paddingBottom: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  optionsContainer: {},
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  footer: {
    paddingTop: 16,
  },
  nextButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmationIcon: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  summaryCard: {
    width: '48%',
    padding: 12,
  },
});
