/**
 * Stylist Profile Editor (V7.3.0)
 *
 * Allows stylists to manage their public profile:
 * - Display name and bio
 * - Avatar upload
 * - Portfolio images
 * - Operating mode (Mobile/Fixed/Hybrid)
 * - Service radius
 * - Specialties
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomProfileIcon,
  VlossomAddIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import { Card, Button, Avatar } from '../../src/components/ui';
import { useAuthStore, useDemoModeStore, selectIsDemoMode } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { OperatingMode } from '../../src/api/stylists';

// Operating modes
const OPERATING_MODES: { value: OperatingMode; label: string; description: string }[] = [
  { value: 'MOBILE', label: 'Mobile', description: 'You travel to clients' },
  { value: 'FIXED', label: 'Fixed Location', description: 'Clients come to you' },
  { value: 'HYBRID', label: 'Both', description: 'Flexible - either works' },
];

// Common specialties
const SPECIALTY_OPTIONS = [
  'Natural Hair',
  'Braids',
  'Locs',
  'Protective Styles',
  'Silk Press',
  'Color',
  'Extensions',
  'Cuts',
  'Treatments',
  'Bridal',
  'Kids',
  'Men',
];

interface StylistProfile {
  id: string;
  bio: string | null;
  operatingMode: OperatingMode;
  baseLocationLat: number | null;
  baseLocationLng: number | null;
  baseLocationAddress: string | null;
  serviceRadius: number;
  specialties: string[];
  isAcceptingBookings: boolean;
  portfolioImages: string[];
}

export default function StylistProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const { user } = useAuthStore();

  // Form state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('MOBILE');
  const [serviceRadius, setServiceRadius] = useState(25);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Mock profile for demo
        setBio('Passionate about natural hair care and protective styles. 5+ years experience.');
        setOperatingMode('HYBRID');
        setServiceRadius(25);
        setSpecialties(['Natural Hair', 'Braids', 'Protective Styles']);
        setPortfolioImages([]);
      } else {
        const profile = await apiRequest<StylistProfile>('/api/v1/stylists/me');
        setBio(profile.bio || '');
        setOperatingMode(profile.operatingMode);
        setServiceRadius(profile.serviceRadius);
        setSpecialties(profile.specialties || []);
        setPortfolioImages(profile.portfolioImages || []);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    // Validate bio length
    if (bio.length < 50) {
      Alert.alert('Bio Too Short', 'Please write at least 50 characters about yourself.');
      return;
    }

    setSaving(true);
    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        await apiRequest('/api/v1/stylists/me', {
          method: 'PUT',
          body: {
            bio,
            operatingMode,
            serviceRadius,
            specialties,
          },
        });
        Alert.alert('Success', 'Profile updated successfully!');
      }
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) => {
      if (prev.includes(specialty)) {
        return prev.filter((s) => s !== specialty);
      }
      if (prev.length >= 10) {
        Alert.alert('Limit Reached', 'You can select up to 10 specialties.');
        return prev;
      }
      return [...prev, specialty];
    });
    setHasChanges(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (portfolioImages.length >= 10) {
        Alert.alert('Limit Reached', 'You can add up to 10 portfolio images.');
        return;
      }

      // In demo mode, just add locally
      if (isDemoMode) {
        setPortfolioImages((prev) => [...prev, result.assets[0].uri]);
        setHasChanges(true);
        return;
      }

      // TODO: Upload to server
      Alert.alert('Coming Soon', 'Image upload will be available in the next update.');
    }
  };

  const removeImage = (index: number) => {
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            borderBottomColor: colors.border.default,
            backgroundColor: colors.background.primary,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.text.primary }]} accessibilityRole="header">
          Edit Profile
        </Text>
        <Button
          title={saving ? 'Saving...' : 'Save'}
          variant="primary"
          size="sm"
          onPress={handleSave}
          disabled={!hasChanges || saving}
          accessibilityLabel="Save profile changes"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { padding: spacing.lg }]}>
          <Avatar name={displayName} size="xl" />
          <Button
            title="Change Photo"
            variant="outline"
            size="sm"
            onPress={pickImage}
            style={{ marginTop: spacing.md }}
            accessibilityLabel="Change profile photo"
          />
        </View>

        {/* Bio Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            About You
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
            Tell clients about your experience and specialties (min. 50 characters)
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                color: colors.text.primary,
                borderColor: colors.border.default,
              },
            ]}
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              setHasChanges(true);
            }}
            placeholder="I specialize in natural hair care and protective styles..."
            placeholderTextColor={colors.text.muted}
            multiline
            numberOfLines={4}
            maxLength={500}
            accessibilityLabel="Bio"
            accessibilityHint="Describe yourself and your services"
          />
          <Text style={[textStyles.caption, { color: colors.text.muted, textAlign: 'right' }]}>
            {bio.length}/500
          </Text>
        </View>

        {/* Operating Mode */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            Operating Mode
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
            How do you prefer to work with clients?
          </Text>

          {OPERATING_MODES.map((mode) => (
            <Pressable
              key={mode.value}
              onPress={() => {
                setOperatingMode(mode.value);
                setHasChanges(true);
              }}
              style={[
                styles.modeOption,
                {
                  backgroundColor:
                    operatingMode === mode.value
                      ? colors.primary + '15'
                      : colors.background.secondary,
                  borderRadius: borderRadius.md,
                  borderColor:
                    operatingMode === mode.value ? colors.primary : colors.border.default,
                  marginBottom: spacing.sm,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: operatingMode === mode.value }}
              accessibilityLabel={`${mode.label}: ${mode.description}`}
            >
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: operatingMode === mode.value ? colors.primary : colors.text.muted },
                ]}
              >
                {operatingMode === mode.value && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.modeInfo}>
                <Text style={[textStyles.body, { color: colors.text.primary }]}>{mode.label}</Text>
                <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                  {mode.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Service Radius (for mobile/hybrid) */}
        {operatingMode !== 'FIXED' && (
          <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
            <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>
              Service Radius
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
              How far are you willing to travel? (in kilometers)
            </Text>

            <View style={styles.radiusRow}>
              {[10, 25, 50, 100].map((radius) => (
                <Pressable
                  key={radius}
                  onPress={() => {
                    setServiceRadius(radius);
                    setHasChanges(true);
                  }}
                  style={[
                    styles.radiusChip,
                    {
                      backgroundColor:
                        serviceRadius === radius ? colors.primary : colors.background.secondary,
                      borderRadius: borderRadius.pill,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: serviceRadius === radius }}
                  accessibilityLabel={`${radius} kilometers`}
                >
                  <Text
                    style={[
                      textStyles.body,
                      { color: serviceRadius === radius ? colors.white : colors.text.primary },
                    ]}
                  >
                    {radius}km
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Specialties */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            Specialties
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
            Select up to 10 areas you specialize in
          </Text>

          <View style={styles.specialtiesGrid}>
            {SPECIALTY_OPTIONS.map((specialty) => {
              const isSelected = specialties.includes(specialty);
              return (
                <Pressable
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  style={[
                    styles.specialtyChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                      borderRadius: borderRadius.pill,
                      borderColor: isSelected ? colors.primary : colors.border.default,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={specialty}
                >
                  <Text
                    style={[
                      textStyles.bodySmall,
                      { color: isSelected ? colors.white : colors.text.primary },
                    ]}
                  >
                    {specialty}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Portfolio Images */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.h4, { color: colors.text.primary }]}>Portfolio</Text>
            <Text style={[textStyles.caption, { color: colors.text.muted }]}>
              {portfolioImages.length}/10
            </Text>
          </View>
          <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
            Show off your best work
          </Text>

          <View style={styles.portfolioGrid}>
            {portfolioImages.map((uri, index) => (
              <View key={index} style={styles.portfolioItem}>
                <Image
                  source={{ uri }}
                  style={[styles.portfolioImage, { borderRadius: borderRadius.md }]}
                />
                <Pressable
                  onPress={() => removeImage(index)}
                  style={[
                    styles.removeImageButton,
                    { backgroundColor: colors.status.error },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove image ${index + 1}`}
                >
                  <VlossomCloseIcon size={12} color={colors.white} />
                </Pressable>
              </View>
            ))}

            {portfolioImages.length < 10 && (
              <Pressable
                onPress={pickImage}
                style={[
                  styles.addImageButton,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    borderColor: colors.border.default,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add portfolio image"
              >
                <VlossomAddIcon size={24} color={colors.text.muted} />
                <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
                  Add Image
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <View
            style={[
              styles.demoIndicator,
              {
                backgroundColor: colors.status.warning + '20',
                marginHorizontal: spacing.lg,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: colors.status.warning }]}>
              Demo Mode - Changes won't be saved to server
            </Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modeInfo: {
    flex: 1,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portfolioItem: {
    position: 'relative',
  },
  portfolioImage: {
    width: 100,
    height: 100,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  demoIndicator: {
    alignItems: 'center',
    marginTop: 24,
  },
});
