/**
 * Hair Health Dashboard Screen (V6.8.0)
 *
 * Main hair health profile view with:
 * - Profile summary card
 * - Learning progress
 * - Quick actions
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomHealthyIcon,
  VlossomGrowingIcon,
  VlossomSettingsIcon,
} from '../../src/components/icons/VlossomIcons';
import { useEffect, useState, useCallback } from 'react';
import {
  useHairHealthStore,
  selectHairProfile,
  selectHasProfile,
  selectUnlockedNodes,
} from '../../src/stores';
import {
  getTextureLabel,
  getPatternLabel,
  getThreeLevelLabel,
  getProfileCompletion,
  getTextureColor,
  LEARNING_NODES,
} from '../../src/api/hair-health';

export default function HairHealthDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const profile = useHairHealthStore(selectHairProfile);
  const hasProfile = useHairHealthStore(selectHasProfile);
  const unlockedNodes = useHairHealthStore(selectUnlockedNodes);
  const {
    profileLoading,
    profileError,
    fetchProfile,
    fetchLearningProgress,
    totalNodes,
  } = useHairHealthStore();

  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
    fetchLearningProgress();
  }, [fetchProfile, fetchLearningProgress]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProfile(), fetchLearningProgress()]);
    setIsRefreshing(false);
  }, [fetchProfile, fetchLearningProgress]);

  const handleBack = () => {
    router.back();
  };

  const handleStartOnboarding = () => {
    router.push('/hair-health/onboarding');
  };

  const handleEditProfile = () => {
    router.push('/hair-health/edit');
  };

  // Loading state
  if (profileLoading && !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]}>
          Loading hair profile...
        </Text>
      </View>
    );
  }

  // No profile state
  if (!hasProfile && !profileLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <VlossomBackIcon size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            Hair Health
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.surface.light, borderRadius: borderRadius.circle },
            ]}
          >
            <VlossomHealthyIcon size={48} color={colors.primary} />
          </View>
          <Text style={[textStyles.h2, { color: colors.text.primary, marginTop: spacing.xl }]}>
            Know Your Hair
          </Text>
          <Text
            style={[
              textStyles.body,
              { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl },
            ]}
          >
            Create your hair profile to get personalized recommendations and track your hair health journey
          </Text>
          <Pressable
            onPress={handleStartOnboarding}
            style={[
              styles.startButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing.xl },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]}>
              Get Started
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Profile completion
  const completion = getProfileCompletion(profile);
  const textureColor = getTextureColor(profile?.textureClass || null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
          Hair Health
        </Text>
        <Pressable onPress={handleEditProfile} hitSlop={8}>
          <VlossomSettingsIcon size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Summary Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, ...shadows.card },
          ]}
        >
          {/* Texture Badge */}
          <View style={styles.textureHeader}>
            <View
              style={[
                styles.textureBadge,
                { backgroundColor: textureColor + '20', borderRadius: borderRadius.lg },
              ]}
            >
              <VlossomHealthyIcon size={32} color={textureColor} />
            </View>
            <View style={styles.textureInfo}>
              <Text style={[textStyles.h3, { color: colors.text.primary }]}>
                {getTextureLabel(profile?.textureClass || null)}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
                {getPatternLabel(profile?.patternFamily || null)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>
                Profile Completion
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                {completion}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface.light }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${completion}%` },
                ]}
              />
            </View>
          </View>

          {/* Attributes Grid */}
          <View style={styles.attributesGrid}>
            <AttributeItem
              label="Porosity"
              value={getThreeLevelLabel(profile?.porosityLevel || null)}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
            <AttributeItem
              label="Density"
              value={getThreeLevelLabel(profile?.densityLevel || null)}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
            <AttributeItem
              label="Thickness"
              value={getThreeLevelLabel(profile?.strandThickness || null)}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
            <AttributeItem
              label="Shrinkage"
              value={getThreeLevelLabel(profile?.shrinkageTendency || null)}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
          </View>
        </View>

        {/* Learning Progress Section */}
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.xl }]}>
          Learning Journey
        </Text>
        <Text style={[textStyles.bodySmall, { color: colors.text.tertiary, marginBottom: spacing.md }]}>
          {unlockedNodes.length} of {totalNodes} modules completed
        </Text>

        <View style={styles.learningGrid}>
          {LEARNING_NODES.map((node) => {
            const isUnlocked = unlockedNodes.includes(node.id);
            return (
              <Pressable
                key={node.id}
                style={[
                  styles.learningCard,
                  {
                    backgroundColor: isUnlocked ? colors.tertiary + '10' : colors.background.secondary,
                    borderRadius: borderRadius.lg,
                    borderColor: isUnlocked ? colors.tertiary : 'transparent',
                    borderWidth: isUnlocked ? 1 : 0,
                  },
                ]}
              >
                <VlossomGrowingIcon
                  size={24}
                  color={isUnlocked ? colors.tertiary : colors.text.muted}
                />
                <Text
                  style={[
                    textStyles.bodySmall,
                    {
                      color: isUnlocked ? colors.text.primary : colors.text.tertiary,
                      fontWeight: isUnlocked ? '600' : '400',
                      marginTop: spacing.xs,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {node.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Quick Actions */}
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.xl }]}>
          Quick Actions
        </Text>

        <Pressable
          onPress={handleEditProfile}
          style={[
            styles.actionCard,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, ...shadows.card, marginTop: spacing.md },
          ]}
        >
          <VlossomSettingsIcon size={24} color={colors.primary} />
          <View style={styles.actionInfo}>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>Edit Profile</Text>
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Update your hair attributes
            </Text>
          </View>
        </Pressable>

        {/* Bottom padding */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

// Attribute Item Component
interface AttributeItemProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function AttributeItem({ label, value, colors, spacing, borderRadius }: AttributeItemProps) {
  return (
    <View
      style={[
        styles.attributeItem,
        { backgroundColor: colors.surface.light, borderRadius: borderRadius.md },
      ]}
    >
      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>{label}</Text>
      <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  profileCard: {
    padding: 16,
  },
  textureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textureBadge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textureInfo: {
    marginLeft: 16,
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  attributeItem: {
    width: '48%',
    padding: 12,
  },
  learningGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  learningCard: {
    width: '31%',
    padding: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionInfo: {
    marginLeft: 12,
  },
});
