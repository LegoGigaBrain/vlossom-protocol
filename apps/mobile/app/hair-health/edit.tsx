/**
 * Hair Health Edit Screen (V7.2.0)
 *
 * Edit existing hair profile attributes
 *
 * Accessibility: Full screen reader support with semantic roles
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
import { VlossomBackIcon } from '../../src/components/icons/VlossomIcons';
import { useState, useEffect } from 'react';
import { useHairHealthStore, selectHairProfile } from '../../src/stores';
import type { ThreeLevel, TextureClass, PatternFamily, LoadFactor, RoutineType } from '../../src/api/hair-health';

// Edit sections
const SECTIONS = [
  {
    title: 'Hair Type',
    fields: [
      {
        key: 'textureClass',
        label: 'Texture Class',
        options: [
          { value: 'TYPE_1', label: 'Type 1 (Straight)' },
          { value: 'TYPE_2', label: 'Type 2 (Wavy)' },
          { value: 'TYPE_3', label: 'Type 3 (Curly)' },
          { value: 'TYPE_4', label: 'Type 4 (Coily)' },
        ],
      },
      {
        key: 'patternFamily',
        label: 'Pattern',
        options: [
          { value: 'STRAIGHT', label: 'Straight' },
          { value: 'WAVY', label: 'Wavy' },
          { value: 'CURLY', label: 'Curly' },
          { value: 'COILY', label: 'Coily' },
        ],
      },
    ],
  },
  {
    title: 'Hair Characteristics',
    fields: [
      {
        key: 'porosityLevel',
        label: 'Porosity',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
      {
        key: 'densityLevel',
        label: 'Density',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
      {
        key: 'strandThickness',
        label: 'Strand Thickness',
        options: [
          { value: 'LOW', label: 'Fine' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'Coarse' },
        ],
      },
      {
        key: 'shrinkageTendency',
        label: 'Shrinkage',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
    ],
  },
  {
    title: 'Sensitivity',
    fields: [
      {
        key: 'detangleTolerance',
        label: 'Detangle Tolerance',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
      {
        key: 'manipulationTolerance',
        label: 'Manipulation Tolerance',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
      {
        key: 'tensionSensitivity',
        label: 'Tension Sensitivity',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
      {
        key: 'scalpSensitivity',
        label: 'Scalp Sensitivity',
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
        ],
      },
    ],
  },
  {
    title: 'Routine',
    fields: [
      {
        key: 'routineType',
        label: 'Routine Complexity',
        options: [
          { value: 'MINIMAL', label: 'Minimal' },
          { value: 'MODERATE', label: 'Moderate' },
          { value: 'ELABORATE', label: 'Elaborate' },
        ],
      },
      {
        key: 'washDayLoadFactor',
        label: 'Wash Day Load',
        options: [
          { value: 'LIGHT', label: 'Light' },
          { value: 'MODERATE', label: 'Moderate' },
          { value: 'HEAVY', label: 'Heavy' },
        ],
      },
    ],
  },
];

export default function HairHealthEdit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const profile = useHairHealthStore(selectHairProfile);
  const { updateProfile, profileLoading } = useHairHealthStore();

  // Local state for edits
  const [formData, setFormData] = useState<Record<string, string | null>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        textureClass: profile.textureClass,
        patternFamily: profile.patternFamily,
        porosityLevel: profile.porosityLevel,
        densityLevel: profile.densityLevel,
        strandThickness: profile.strandThickness,
        shrinkageTendency: profile.shrinkageTendency,
        detangleTolerance: profile.detangleTolerance,
        manipulationTolerance: profile.manipulationTolerance,
        tensionSensitivity: profile.tensionSensitivity,
        scalpSensitivity: profile.scalpSensitivity,
        routineType: profile.routineType,
        washDayLoadFactor: profile.washDayLoadFactor,
      });
    }
  }, [profile]);

  const handleBack = () => {
    router.back();
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const result = await updateProfile(formData as {
      textureClass?: TextureClass;
      patternFamily?: PatternFamily;
      porosityLevel?: ThreeLevel;
      densityLevel?: ThreeLevel;
      strandThickness?: ThreeLevel;
      shrinkageTendency?: ThreeLevel;
      detangleTolerance?: ThreeLevel;
      manipulationTolerance?: ThreeLevel;
      tensionSensitivity?: ThreeLevel;
      scalpSensitivity?: ThreeLevel;
      routineType?: RoutineType;
      washDayLoadFactor?: LoadFactor;
    });

    if (result) {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to hair health dashboard"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}
          accessibilityRole="header"
        >
          Edit Profile
        </Text>
        <View style={{ width: 24 }} aria-hidden />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: spacing.lg }}
        accessibilityLabel="Hair profile edit form"
      >
        {SECTIONS.map((section, sectionIndex) => (
          <View
            key={section.title}
            style={styles.section}
            accessibilityRole="none"
          >
            <Text
              style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginBottom: spacing.md }]}
              accessibilityRole="header"
            >
              {section.title}
            </Text>

            {section.fields.map((field) => {
              const selectedOption = field.options.find((o) => o.value === formData[field.key]);
              return (
                <View key={field.key} style={{ marginBottom: spacing.md }}>
                  <Text
                    style={[textStyles.bodySmall, { color: colors.text.tertiary, marginBottom: spacing.xs }]}
                    nativeID={`label-${field.key}`}
                  >
                    {field.label}
                  </Text>
                  <View
                    style={styles.optionsRow}
                    accessibilityRole="radiogroup"
                    accessibilityLabelledBy={`label-${field.key}`}
                  >
                    {field.options.map((option) => {
                      const isSelected = formData[field.key] === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => handleFieldChange(field.key, option.value)}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                              borderRadius: borderRadius.md,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityLabel={option.label}
                          accessibilityState={{ selected: isSelected }}
                          accessibilityHint={isSelected ? 'Currently selected' : `Double tap to select ${option.label}`}
                        >
                          <Text
                            style={[
                              textStyles.bodySmall,
                              { color: isSelected ? colors.white : colors.text.secondary },
                            ]}
                            aria-hidden
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + spacing.md,
              paddingHorizontal: spacing.lg,
              backgroundColor: colors.background.primary,
              ...shadows.card,
            },
          ]}
          accessibilityLiveRegion="polite"
        >
          <Pressable
            onPress={handleSave}
            disabled={profileLoading}
            style={[
              styles.saveButton,
              {
                backgroundColor: profileLoading ? colors.text.muted : colors.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={profileLoading ? 'Saving changes' : 'Save Changes'}
            accessibilityState={{ disabled: profileLoading }}
            accessibilityHint={profileLoading ? 'Please wait' : 'Double tap to save your profile changes'}
          >
            {profileLoading ? (
              <ActivityIndicator color={colors.white} accessibilityLabel="Saving" />
            ) : (
              <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]} aria-hidden>
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
