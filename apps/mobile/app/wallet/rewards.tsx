/**
 * Rewards Screen (V7.2.0)
 *
 * Purpose: Display user rewards, XP, tiers, badges, and streaks
 * - XP balance with progress to next tier
 * - Current tier badge (Bronze → Diamond)
 * - Tier progress bar
 * - Badges grid (earned vs locked)
 * - Active streaks display
 * - Recent achievements list
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomGrowingIcon,
  VlossomCommunityIcon,
  VlossomFavoriteIcon,
  VlossomVerifiedIcon,
} from '../../src/components/icons/VlossomIcons';
import {
  useRewardsStore,
  selectUserRewards,
  selectTierInfo,
  selectNextTierInfo,
  selectBadges,
  selectStreaks,
  selectAchievements,
  selectRewardsLoading,
} from '../../src/stores';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { TIER_CONFIG, formatXp, type Badge, type Streak, type Achievement } from '../../src/api/rewards';

// ============================================================================
// Helper Functions
// ============================================================================

function getTierGradientColors(tier: string): string[] {
  switch (tier) {
    case 'BRONZE':
      return ['#CD7F32', '#8B4513'];
    case 'SILVER':
      return ['#C0C0C0', '#808080'];
    case 'GOLD':
      return ['#FFD700', '#DAA520'];
    case 'PLATINUM':
      return ['#E5E4E2', '#A9A9A9'];
    case 'DIAMOND':
      return ['#B9F2FF', '#7EC8E3'];
    default:
      return ['#6B7280', '#4B5563'];
  }
}

function getBadgeIcon(iconName: string, size: number, color: string) {
  switch (iconName) {
    case 'star':
      return <VlossomFavoriteIcon size={size} color={color} />;
    case 'verified':
      return <VlossomVerifiedIcon size={size} color={color} />;
    case 'community':
      return <VlossomCommunityIcon size={size} color={color} />;
    case 'growth':
    default:
      return <VlossomGrowingIcon size={size} color={color} />;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ============================================================================
// Components
// ============================================================================

interface TierCardProps {
  userRewards: NonNullable<ReturnType<typeof selectUserRewards>>;
  tierInfo: NonNullable<ReturnType<typeof selectTierInfo>>;
  nextTierInfo: ReturnType<typeof selectNextTierInfo>;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function TierCard({
  userRewards,
  tierInfo,
  nextTierInfo,
  colors,
  spacing,
  borderRadius,
  shadows,
}: TierCardProps) {
  const tierColors = getTierGradientColors(userRewards.tier);

  // Build accessibility label for tier card
  const tierAccessibilityLabel = useMemo(() => {
    let label = `${tierInfo.name} tier, ${formatXp(userRewards.xp)} XP`;
    if (nextTierInfo) {
      label += `, ${Math.round(userRewards.tierProgress)}% progress to ${nextTierInfo.name}, ${userRewards.xpToNextTier} XP to go`;
    }
    if (tierInfo.benefits.length > 0) {
      label += `. Benefits: ${tierInfo.benefits.slice(0, 2).join(', ')}`;
    }
    return label;
  }, [tierInfo, nextTierInfo, userRewards]);

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={tierAccessibilityLabel}
      style={[
        styles.tierCard,
        {
          backgroundColor: tierColors[0],
          marginHorizontal: spacing.lg,
          borderRadius: borderRadius.xl,
          ...shadows.medium,
        },
      ]}
    >
      {/* Tier Badge */}
      <View style={styles.tierBadgeContainer} aria-hidden>
        <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <VlossomVerifiedIcon size={32} color="#fff" />
        </View>
        <Text style={[styles.tierName, { color: '#fff' }]}>{tierInfo.name}</Text>
      </View>

      {/* XP Display */}
      <View style={styles.xpContainer} aria-hidden>
        <Text style={[styles.xpAmount, { color: '#fff' }]}>{formatXp(userRewards.xp)}</Text>
        <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.8)' }]}>XP</Text>
      </View>

      {/* Progress to Next Tier */}
      {nextTierInfo && (
        <View style={styles.progressContainer} aria-hidden>
          <View style={styles.progressHeader}>
            <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.8)' }]}>
              Progress to {nextTierInfo.name}
            </Text>
            <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.8)' }]}>
              {userRewards.xpToNextTier} XP to go
            </Text>
          </View>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: userRewards.tierProgress,
            }}
            style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: '#fff',
                  width: `${userRewards.tierProgress}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Tier Benefits */}
      <View style={styles.benefitsContainer} aria-hidden>
        <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.9)', fontWeight: '600' }]}>
          Your Benefits:
        </Text>
        {tierInfo.benefits.slice(0, 2).map((benefit, index) => (
          <Text key={index} style={[textStyles.caption, { color: 'rgba(255,255,255,0.8)' }]}>
            • {benefit}
          </Text>
        ))}
      </View>
    </View>
  );
}

interface BadgeItemProps {
  badge: Badge;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function BadgeItem({ badge, colors, borderRadius }: BadgeItemProps) {
  const iconColor = badge.isLocked ? colors.text.muted : colors.primary;
  const bgColor = badge.isLocked ? colors.background.secondary : colors.primary + '15';

  // Build accessibility label
  const accessibilityLabel = badge.isLocked
    ? badge.progress !== undefined
      ? `${badge.name} badge, locked, ${badge.progress}% progress`
      : `${badge.name} badge, locked`
    : `${badge.name} badge, earned`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={styles.badgeItem}
    >
      <View
        style={[
          styles.badgeIcon,
          {
            backgroundColor: bgColor,
            borderRadius: borderRadius.lg,
            opacity: badge.isLocked ? 0.5 : 1,
          },
        ]}
        aria-hidden
      >
        {getBadgeIcon(badge.iconName, 24, iconColor)}
        {badge.isLocked && badge.progress !== undefined && (
          <View
            style={[
              styles.badgeProgress,
              {
                backgroundColor: colors.primary,
                width: `${badge.progress}%`,
              },
            ]}
          />
        )}
      </View>
      <Text
        style={[
          textStyles.caption,
          {
            color: badge.isLocked ? colors.text.muted : colors.text.primary,
            textAlign: 'center',
            marginTop: 4,
          },
        ]}
        numberOfLines={2}
        aria-hidden
      >
        {badge.name}
      </Text>
    </View>
  );
}

interface StreakItemProps {
  streak: Streak;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function StreakItem({ streak, colors, borderRadius }: StreakItemProps) {
  const currentCount = streak.currentCount ?? 0;
  const targetCount = streak.targetCount ?? 1;
  const progress = (currentCount / targetCount) * 100;

  // Build accessibility label
  const accessibilityLabel = `${streak.name}, ${streak.currentCount} of ${streak.targetCount} completed, ${Math.round(progress)}% progress. ${streak.description}. Reward: ${streak.reward}`;

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.streakItem,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      <View style={styles.streakHeader} aria-hidden>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
          {streak.name}
        </Text>
        <Text style={[textStyles.caption, { color: colors.primary }]}>
          {streak.currentCount}/{streak.targetCount}
        </Text>
      </View>
      <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 4 }]} aria-hidden>
        {streak.description}
      </Text>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress),
        }}
        style={[styles.streakProgress, { backgroundColor: colors.background.primary }]}
      >
        <View
          style={[
            styles.streakProgressFill,
            {
              backgroundColor: colors.primary,
              width: `${Math.min(progress, 100)}%`,
            },
          ]}
        />
      </View>
      <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: 4 }]} aria-hidden>
        Reward: {streak.reward}
      </Text>
    </View>
  );
}

interface AchievementItemProps {
  achievement: Achievement;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function AchievementItem({ achievement, colors, borderRadius }: AchievementItemProps) {
  // Build accessibility label
  const accessibilityLabel = `${achievement.title}, ${achievement.description}, plus ${achievement.xpReward} XP earned`;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.achievementItem,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      <View style={[styles.achievementIcon, { backgroundColor: colors.status.successLight }]} aria-hidden>
        <VlossomVerifiedIcon size={20} color={colors.status.success} />
      </View>
      <View style={styles.achievementContent} aria-hidden>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
          {achievement.title}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
          {achievement.description}
        </Text>
      </View>
      <View style={styles.achievementXp} aria-hidden>
        <Text style={[textStyles.caption, { color: colors.primary, fontWeight: '600' }]}>
          +{achievement.xpReward}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.muted }]}>XP</Text>
      </View>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const userRewards = useRewardsStore(selectUserRewards);
  const tierInfo = useRewardsStore(selectTierInfo);
  const nextTierInfo = useRewardsStore(selectNextTierInfo);
  const badges = useRewardsStore(selectBadges);
  const streaks = useRewardsStore(selectStreaks);
  const achievements = useRewardsStore(selectAchievements);
  const isLoading = useRewardsStore(selectRewardsLoading);
  const { fetchOverview } = useRewardsStore();

  // Fetch on mount
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Separate earned and locked badges
  const earnedBadges = useMemo(() => badges.filter((b) => !b.isLocked), [badges]);
  const lockedBadges = useMemo(() => badges.filter((b) => b.isLocked), [badges]);
  const activeStreaks = useMemo(() => streaks.filter((s) => s.isActive), [streaks]);

  // Loading state
  if (isLoading && !userRewards) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <Skeleton variant="card" height={200} style={{ marginBottom: 16 }} />
        <Skeleton variant="text" width="40%" style={{ marginBottom: 16 }} />
        <View style={styles.badgesGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="card" width={80} height={100} />
          ))}
        </View>
      </ScrollView>
    );
  }

  // Empty state
  if (!userRewards || !tierInfo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <EmptyState
          preset="rewards"
          title="Rewards Coming Soon"
          description="Start using Vlossom to earn XP, badges, and unlock exclusive benefits."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Tier Card */}
      <View style={{ marginTop: spacing.lg }}>
        <TierCard
          userRewards={userRewards}
          tierInfo={tierInfo}
          nextTierInfo={nextTierInfo}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
        />
      </View>

      {/* Stats Row */}
      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Stats: ${userRewards.earnedBadges} badges earned, ${userRewards.activeStreaks} active streaks, ${userRewards.lifetimeAchievements} lifetime achievements`}
        style={[styles.statsRow, { marginHorizontal: spacing.lg, marginTop: spacing.xl }]}
      >
        <View style={[styles.statItem, { backgroundColor: colors.background.secondary }]} aria-hidden>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {userRewards.earnedBadges}
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Badges</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.background.secondary }]} aria-hidden>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {userRewards.activeStreaks}
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Streaks</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.background.secondary }]} aria-hidden>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {userRewards.lifetimeAchievements}
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Achievements</Text>
        </View>
      </View>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <View style={[styles.section, { marginHorizontal: spacing.lg }]}>
          <Text
            accessibilityRole="header"
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: 12 }]}
          >
            Earned Badges
          </Text>
          <View
            accessibilityRole="list"
            accessibilityLabel={`Earned badges, ${earnedBadges.length} items`}
            style={styles.badgesGrid}
          >
            {earnedBadges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} colors={colors} borderRadius={borderRadius} />
            ))}
          </View>
        </View>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <View style={[styles.section, { marginHorizontal: spacing.lg }]}>
          <Text
            accessibilityRole="header"
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: 12 }]}
          >
            Badges to Unlock
          </Text>
          <View
            accessibilityRole="list"
            accessibilityLabel={`Badges to unlock, ${lockedBadges.length} items`}
            style={styles.badgesGrid}
          >
            {lockedBadges.map((badge) => (
              <BadgeItem key={badge.id} badge={badge} colors={colors} borderRadius={borderRadius} />
            ))}
          </View>
        </View>
      )}

      {/* Active Streaks */}
      {activeStreaks.length > 0 && (
        <View
          accessibilityRole="list"
          accessibilityLabel={`Active streaks, ${activeStreaks.length} items`}
          style={[styles.section, { marginHorizontal: spacing.lg }]}
        >
          <Text
            accessibilityRole="header"
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: 12 }]}
          >
            Active Streaks
          </Text>
          {activeStreaks.map((streak) => (
            <StreakItem
              key={streak.id}
              streak={streak}
              colors={colors}
              borderRadius={borderRadius}
            />
          ))}
        </View>
      )}

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <View
          accessibilityRole="list"
          accessibilityLabel={`Recent achievements, showing ${Math.min(achievements.length, 5)} of ${achievements.length} items`}
          style={[styles.section, { marginHorizontal: spacing.lg }]}
        >
          <Text
            accessibilityRole="header"
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: 12 }]}
          >
            Recent Achievements
          </Text>
          {achievements.slice(0, 5).map((achievement) => (
            <AchievementItem
              key={achievement.id}
              achievement={achievement}
              colors={colors}
              borderRadius={borderRadius}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tierCard: {
    padding: 24,
  },
  tierBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: 24,
    fontFamily: 'Playfair-Bold',
    marginLeft: 12,
  },
  xpContainer: {
    marginTop: 20,
  },
  xpAmount: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
  },
  progressContainer: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  benefitsContainer: {
    marginTop: 20,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  section: {
    marginTop: 32,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
  },
  streakItem: {
    padding: 16,
    marginBottom: 12,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakProgress: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  streakProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
    marginLeft: 12,
  },
  achievementXp: {
    alignItems: 'center',
  },
});
