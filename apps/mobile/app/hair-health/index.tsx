/**
 * Hair Health Dashboard Screen (V7.2.0)
 *
 * Main hair health profile view with:
 * - Profile summary card
 * - V6.9 Smart Calendar widget
 * - Learning progress
 * - Quick actions
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
  VlossomCalendarIcon,
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
import { CalendarWidget } from '../../src/components/hair-health';

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
    // V6.9 Calendar
    fetchCalendarSummary,
    fetchUpcomingRituals,
  } = useHairHealthStore();

  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
    fetchLearningProgress();
    // V6.9 Calendar data
    fetchCalendarSummary();
    fetchUpcomingRituals();
  }, [fetchProfile, fetchLearningProgress, fetchCalendarSummary, fetchUpcomingRituals]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchLearningProgress(),
      fetchCalendarSummary(),
      fetchUpcomingRituals(),
    ]);
    setIsRefreshing(false);
  }, [fetchProfile, fetchLearningProgress, fetchCalendarSummary, fetchUpcomingRituals]);

  const handleBack = () => {
    router.back();
  };

  const handleStartOnboarding = () => {
    router.push('/hair-health/onboarding');
  };

  const handleEditProfile = () => {
    router.push('/hair-health/edit');
  };

  const handleViewCalendar = () => {
    router.push('/hair-health/calendar');
  };

  // Loading state
  if (profileLoading && !profile) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}
        accessible
        accessibilityLabel="Loading hair profile"
        accessibilityRole="progressbar"
      >
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
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
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to previous screen"
          >
            <VlossomBackIcon size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}
            accessibilityRole="header"
          >
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
            aria-hidden
          >
            <VlossomHealthyIcon size={48} color={colors.primary} />
          </View>
          <Text
            style={[textStyles.h2, { color: colors.text.primary, marginTop: spacing.xl }]}
            accessibilityRole="header"
          >
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
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            accessibilityHint="Double tap to create your hair profile"
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
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to previous screen"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}
          accessibilityRole="header"
        >
          Hair Health
        </Text>
        <Pressable
          onPress={handleEditProfile}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit hair profile"
          accessibilityHint="Double tap to edit your hair attributes"
        >
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
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Hair profile: ${getTextureLabel(profile?.textureClass || null)}, ${getPatternLabel(profile?.patternFamily || null)}. Profile ${completion}% complete.`}
          style={[
            styles.profileCard,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.xl, ...shadows.card },
          ]}
        >
          {/* Texture Badge */}
          <View style={styles.textureHeader} aria-hidden>
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
          <View
            style={styles.progressSection}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Profile completion: ${completion}%`}
            accessibilityValue={{ min: 0, max: 100, now: completion }}
          >
            <View style={styles.progressHeader} aria-hidden>
              <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>
                Profile Completion
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                {completion}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface.light }]} aria-hidden>
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

        {/* V6.9 Smart Calendar Widget */}
        <CalendarWidget />

        {/* Learning Progress Section */}
        <Text
          style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.xl }]}
          accessibilityRole="header"
        >
          Learning Journey
        </Text>
        <Text
          style={[textStyles.bodySmall, { color: colors.text.tertiary, marginBottom: spacing.md }]}
          accessibilityLabel={`${unlockedNodes.length} of ${totalNodes} modules completed`}
        >
          {unlockedNodes.length} of {totalNodes} modules completed
        </Text>

        <View
          style={styles.learningGrid}
          accessibilityRole="list"
          accessibilityLabel={`Learning modules, ${unlockedNodes.length} of ${totalNodes} completed`}
        >
          {LEARNING_NODES.map((node) => {
            const isUnlocked = unlockedNodes.includes(node.id);
            return (
              <View
                key={node.id}
                accessible
                accessibilityRole="listitem"
                accessibilityLabel={`${node.title}, ${isUnlocked ? 'completed' : 'locked'}`}
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
                  aria-hidden
                >
                  {node.title}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <Text
          style={[textStyles.body, { color: colors.text.primary, fontWeight: '600', marginTop: spacing.xl }]}
          accessibilityRole="header"
        >
          Quick Actions
        </Text>

        <Pressable
          onPress={handleViewCalendar}
          style={[
            styles.actionCard,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, ...shadows.card, marginTop: spacing.md },
          ]}
          accessibilityRole="button"
          accessibilityLabel="View Calendar, See your full ritual schedule"
          accessibilityHint="Double tap to open your hair care calendar"
        >
          <VlossomCalendarIcon size={24} color={colors.primary} aria-hidden />
          <View style={styles.actionInfo} aria-hidden>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>View Calendar</Text>
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              See your full ritual schedule
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleEditProfile}
          style={[
            styles.actionCard,
            { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, ...shadows.card, marginTop: spacing.sm },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit Profile, Update your hair attributes"
          accessibilityHint="Double tap to edit your hair profile"
        >
          <VlossomSettingsIcon size={24} color={colors.primary} aria-hidden />
          <View style={styles.actionInfo} aria-hidden>
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
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.attributeItem,
        { backgroundColor: colors.surface.light, borderRadius: borderRadius.md },
      ]}
    >
      <Text style={[textStyles.caption, { color: colors.text.tertiary }]} aria-hidden>{label}</Text>
      <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]} aria-hidden>
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
