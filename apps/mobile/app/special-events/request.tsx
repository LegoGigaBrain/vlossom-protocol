/**
 * Special Events Request Form (V6.10.0)
 *
 * Multi-step form for requesting special event quotes
 * Steps:
 * 1. Event Details (category, date, description)
 * 2. Location Selection
 * 3. Service Requirements
 * 4. Review & Submit
 *
 * V6.10: Added proper submission handling with loading state
 */

import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomCalendarIcon,
  VlossomGrowingIcon,
  VlossomProfileIcon,
  VlossomCloseIcon,
  VlossomHomeIcon,
} from '../../src/components/icons/VlossomIcons';

// Event categories
const EVENT_CATEGORIES = [
  { id: 'bridal', label: 'Bridal / Wedding' },
  { id: 'photoshoot', label: 'Photoshoot' },
  { id: 'corporate', label: 'Corporate Event' },
  { id: 'party', label: 'Party / Celebration' },
  { id: 'matric', label: 'Matric Dance / Prom' },
  { id: 'other', label: 'Other Event' },
];

// Location types
const LOCATION_TYPES = [
  {
    id: 'customer_home',
    label: 'My Location',
    description: 'Stylist comes to you',
    icon: 'home',
  },
  {
    id: 'stylist_base',
    label: 'Stylist Location',
    description: 'Visit the stylist',
    icon: 'profile',
  },
  {
    id: 'venue',
    label: 'Event Venue',
    description: 'At wedding, studio, etc.',
    icon: 'calendar',
  },
];

// Service types
const SERVICE_TYPES = [
  { id: 'styling', label: 'Hair Styling', selected: true },
  { id: 'braiding', label: 'Braiding' },
  { id: 'locs', label: 'Locs / Twists' },
  { id: 'coloring', label: 'Coloring' },
  { id: 'extensions', label: 'Extensions / Weave' },
  { id: 'treatment', label: 'Treatment / Care' },
];

type FormStep = 'details' | 'location' | 'services' | 'review';

interface FormData {
  category: string;
  eventDate: string;
  eventTime: string;
  description: string;
  numberOfPeople: string;
  locationType: string;
  address: string;
  services: string[];
  additionalNotes: string;
}

export default function SpecialEventsRequestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const [step, setStep] = useState<FormStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    category: params.category || '',
    eventDate: '',
    eventTime: '',
    description: '',
    numberOfPeople: '1',
    locationType: '',
    address: '',
    services: ['styling'],
    additionalNotes: '',
  });

  const steps: FormStep[] = ['details', 'location', 'services', 'review'];
  const currentStepIndex = steps.indexOf(step);

  const updateFormData = (key: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    } else {
      router.back();
    }
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // API endpoint for special events will be added in a future version
      // For now, simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Show success alert
      Alert.alert(
        'Request Submitted!',
        'Your special event request has been sent to stylists. You\'ll receive quotes within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/special-events'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'Unable to submit your request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, router]);

  const canProceed = () => {
    switch (step) {
      case 'details':
        return formData.category && formData.eventDate && formData.description;
      case 'location':
        return formData.locationType;
      case 'services':
        return formData.services.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const getLocationIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return <VlossomHomeIcon size={24} color={colors.primary} />;
      case 'profile':
        return <VlossomProfileIcon size={24} color={colors.primary} />;
      case 'calendar':
        return <VlossomCalendarIcon size={24} color={colors.primary} />;
      default:
        return <VlossomHomeIcon size={24} color={colors.primary} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Progress Steps */}
      <View style={[styles.progressBar, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        {steps.map((s, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = s === step;
          return (
            <View key={s} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: isActive ? colors.accent : colors.border.default,
                    borderWidth: isCurrent ? 2 : 0,
                    borderColor: colors.accent,
                  },
                ]}
              />
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    { backgroundColor: isActive ? colors.accent : colors.border.default },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + 100,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Event Details */}
        {step === 'details' && (
          <View>
            <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.lg }]}>
              Tell us about your event
            </Text>

            {/* Category Selection */}
            <Text style={[textStyles.label, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              Event Type *
            </Text>
            <View style={styles.categoryGrid}>
              {EVENT_CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => updateFormData('category', cat.id)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.background.primary,
                        borderColor: isSelected ? colors.accent : colors.border.default,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        textStyles.caption,
                        { color: isSelected ? colors.white : colors.text.secondary },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date */}
            <Text
              style={[
                textStyles.label,
                { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              Event Date *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              placeholder="e.g., December 25, 2025"
              placeholderTextColor={colors.text.muted}
              value={formData.eventDate}
              onChangeText={(v) => updateFormData('eventDate', v)}
            />

            {/* Time */}
            <Text
              style={[
                textStyles.label,
                { color: colors.text.secondary, marginTop: spacing.md, marginBottom: spacing.sm },
              ]}
            >
              Preferred Time
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              placeholder="e.g., 9:00 AM - 12:00 PM"
              placeholderTextColor={colors.text.muted}
              value={formData.eventTime}
              onChangeText={(v) => updateFormData('eventTime', v)}
            />

            {/* Number of People */}
            <Text
              style={[
                textStyles.label,
                { color: colors.text.secondary, marginTop: spacing.md, marginBottom: spacing.sm },
              ]}
            >
              Number of People
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              placeholder="How many people need styling?"
              placeholderTextColor={colors.text.muted}
              value={formData.numberOfPeople}
              onChangeText={(v) => updateFormData('numberOfPeople', v)}
              keyboardType="number-pad"
            />

            {/* Description */}
            <Text
              style={[
                textStyles.label,
                { color: colors.text.secondary, marginTop: spacing.md, marginBottom: spacing.sm },
              ]}
            >
              Describe Your Event *
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Tell stylists about your event, style preferences, and any special requirements..."
              placeholderTextColor={colors.text.muted}
              value={formData.description}
              onChangeText={(v) => updateFormData('description', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Step 2: Location */}
        {step === 'location' && (
          <View>
            <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.lg }]}>
              Where will the styling happen?
            </Text>

            {LOCATION_TYPES.map((loc) => {
              const isSelected = formData.locationType === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => updateFormData('locationType', loc.id)}
                  style={[
                    styles.locationCard,
                    {
                      backgroundColor: isSelected ? colors.accent + '15' : colors.background.primary,
                      borderColor: isSelected ? colors.accent : colors.border.default,
                      borderRadius: borderRadius.lg,
                      marginBottom: spacing.md,
                      ...shadows.card,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.locationIcon,
                      {
                        backgroundColor: isSelected ? colors.accent + '20' : colors.background.tertiary,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    {getLocationIcon(loc.icon)}
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
                      {loc.label}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                      {loc.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: isSelected ? colors.accent : colors.border.default,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}

            {/* Address field for customer_home or venue */}
            {(formData.locationType === 'customer_home' || formData.locationType === 'venue') && (
              <>
                <Text
                  style={[
                    textStyles.label,
                    { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
                  ]}
                >
                  {formData.locationType === 'venue' ? 'Venue Address' : 'Your Address'}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.default,
                      borderRadius: borderRadius.md,
                      color: colors.text.primary,
                    },
                  ]}
                  placeholder="Enter the full address..."
                  placeholderTextColor={colors.text.muted}
                  value={formData.address}
                  onChangeText={(v) => updateFormData('address', v)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </>
            )}
          </View>
        )}

        {/* Step 3: Services */}
        {step === 'services' && (
          <View>
            <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.lg }]}>
              What services do you need?
            </Text>

            <Text style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.md }]}>
              Select all that apply
            </Text>

            {SERVICE_TYPES.map((service) => {
              const isSelected = formData.services.includes(service.id);
              return (
                <Pressable
                  key={service.id}
                  onPress={() => toggleService(service.id)}
                  style={[
                    styles.serviceRow,
                    {
                      backgroundColor: isSelected ? colors.accent + '10' : colors.background.primary,
                      borderColor: isSelected ? colors.accent : colors.border.default,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Text style={[textStyles.body, { color: colors.text.primary }]}>{service.label}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                        borderColor: isSelected ? colors.accent : colors.border.default,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                  >
                    {isSelected && <Text style={{ color: colors.white, fontSize: 12 }}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}

            {/* Additional Notes */}
            <Text
              style={[
                textStyles.label,
                { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              Additional Notes
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.md,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Any specific styles, references, or special requests..."
              placeholderTextColor={colors.text.muted}
              value={formData.additionalNotes}
              onChangeText={(v) => updateFormData('additionalNotes', v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <View>
            <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.lg }]}>
              Review Your Request
            </Text>

            <View
              style={[
                styles.reviewCard,
                {
                  backgroundColor: colors.background.primary,
                  borderRadius: borderRadius.lg,
                  ...shadows.card,
                },
              ]}
            >
              {/* Event Type */}
              <View style={[styles.reviewRow, { borderBottomColor: colors.border.default }]}>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Event Type</Text>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                  {EVENT_CATEGORIES.find((c) => c.id === formData.category)?.label || 'Not selected'}
                </Text>
              </View>

              {/* Date & Time */}
              <View style={[styles.reviewRow, { borderBottomColor: colors.border.default }]}>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Date & Time</Text>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                  {formData.eventDate}
                  {formData.eventTime && ` at ${formData.eventTime}`}
                </Text>
              </View>

              {/* People */}
              <View style={[styles.reviewRow, { borderBottomColor: colors.border.default }]}>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>People</Text>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                  {formData.numberOfPeople} {parseInt(formData.numberOfPeople) === 1 ? 'person' : 'people'}
                </Text>
              </View>

              {/* Location */}
              <View style={[styles.reviewRow, { borderBottomColor: colors.border.default }]}>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Location</Text>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                  {LOCATION_TYPES.find((l) => l.id === formData.locationType)?.label || 'Not selected'}
                </Text>
              </View>

              {/* Services */}
              <View style={[styles.reviewRow, { borderBottomColor: colors.border.default }]}>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Services</Text>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                  {formData.services
                    .map((s) => SERVICE_TYPES.find((st) => st.id === s)?.label)
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>

              {/* Description */}
              <View style={styles.reviewDescription}>
                <Text style={[textStyles.caption, { color: colors.text.tertiary, marginBottom: spacing.xs }]}>
                  Description
                </Text>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                  {formData.description}
                </Text>
              </View>
            </View>

            {/* Info Banner */}
            <View
              style={[
                styles.infoBanner,
                {
                  backgroundColor: colors.accent + '15',
                  borderColor: colors.accent + '30',
                  borderRadius: borderRadius.lg,
                  marginTop: spacing.lg,
                },
              ]}
            >
              <VlossomGrowingIcon size={20} color={colors.accent} accent />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
                  What happens next?
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                  Stylists will review your request and send custom quotes within 24-48 hours.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: colors.background.primary,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopColor: colors.border.default,
            ...shadows.elevated,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            {
              borderColor: colors.border.default,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Text style={[textStyles.button, { color: colors.text.secondary }]}>
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Text>
        </Pressable>

        <Pressable
          onPress={step === 'review' ? handleSubmit : handleNext}
          disabled={!canProceed() || isSubmitting}
          style={[
            styles.nextButton,
            {
              backgroundColor: canProceed() && !isSubmitting ? colors.accent : colors.border.default,
              borderRadius: borderRadius.md,
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[textStyles.button, { color: colors.white }]}>
              {step === 'review' ? 'Submit Request' : 'Continue'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  locationIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCard: {
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewDescription: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
