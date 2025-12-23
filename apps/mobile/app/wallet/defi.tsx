/**
 * DeFi Screen (V7.2.0)
 *
 * Purpose: Display DeFi pools, staking, and earnings
 * - Total staked balance
 * - Current APY display
 * - Earnings this period
 * - Pool list with stake/unstake CTAs
 * - Recent earnings history
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomGrowthIcon,
  VlossomWalletIcon,
  VlossomVerifiedIcon,
} from '../../src/components/icons/VlossomIcons';
import {
  useDefiStore,
  selectTotalStaked,
  selectTotalStakedUsd,
  selectTotalEarnings,
  selectTotalEarningsUsd,
  selectCurrentApy,
  selectPools,
  selectRecentEarnings,
  selectDefiLoading,
  selectStakeLoading,
} from '../../src/stores';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Skeleton } from '../../src/components/ui/Skeleton';
import {
  formatApy,
  formatTvl,
  formatLockPeriod,
  getPoolTierLabel,
  getPoolTierColor,
  type Pool,
  type DefiEarnings,
} from '../../src/api/defi';

// ============================================================================
// Components
// ============================================================================

interface OverviewCardProps {
  totalStaked: string;
  totalStakedUsd: number;
  totalEarnings: string;
  totalEarningsUsd: number;
  currentApy: number;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function OverviewCard({
  totalStaked,
  totalStakedUsd,
  totalEarnings,
  totalEarningsUsd,
  currentApy,
  colors,
  spacing,
  borderRadius,
  shadows,
}: OverviewCardProps) {
  // Build accessibility label
  const accessibilityLabel = `DeFi Staking overview. Current APY: ${formatApy(currentApy)}. Total staked: $${totalStakedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}, ${totalStaked} USDC. Total earnings: plus $${totalEarningsUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}, ${totalEarnings} USDC`;

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.overviewCard,
        {
          backgroundColor: colors.primary,
          marginHorizontal: spacing.lg,
          borderRadius: borderRadius.xl,
          ...shadows.medium,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.overviewHeader} aria-hidden>
        <View style={styles.overviewHeaderLeft}>
          <VlossomGrowthIcon size={24} color="#fff" />
          <Text style={[styles.overviewTitle, { color: '#fff' }]}>DeFi Staking</Text>
        </View>
        <View style={[styles.apyBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={[textStyles.caption, { color: '#fff', fontWeight: '600' }]}>
            {formatApy(currentApy)} APY
          </Text>
        </View>
      </View>

      {/* Main Stats */}
      <View style={styles.overviewStats} aria-hidden>
        <View style={styles.overviewStatItem}>
          <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.7)' }]}>
            Total Staked
          </Text>
          <Text style={[styles.overviewAmount, { color: '#fff' }]}>
            ${totalStakedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.7)' }]}>
            {totalStaked} USDC
          </Text>
        </View>

        <View style={[styles.overviewDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

        <View style={styles.overviewStatItem}>
          <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.7)' }]}>
            Total Earnings
          </Text>
          <Text style={[styles.overviewAmount, { color: '#22C55E' }]}>
            +${totalEarningsUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.7)' }]}>
            {totalEarnings} USDC
          </Text>
        </View>
      </View>
    </View>
  );
}

interface PoolCardProps {
  pool: Pool;
  onStake: (poolId: string) => void;
  onUnstake: (poolId: string) => void;
  isStaking: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function PoolCard({
  pool,
  onStake,
  onUnstake,
  isStaking,
  colors,
  spacing,
  borderRadius,
}: PoolCardProps) {
  const tierColor = getPoolTierColor(pool.tier);
  const hasStake = parseFloat(pool.userStake) > 0;

  // Build accessibility label for pool card
  const poolAccessibilityLabel = `${pool.name}, ${getPoolTierLabel(pool.tier)} tier. ${pool.description}. APY: ${formatApy(pool.apy)}. Total value locked: ${formatTvl(pool.tvlUsd)}. Lock period: ${formatLockPeriod(pool.lockPeriodDays)}.${hasStake ? ` Your stake: $${pool.userStakeUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''} Minimum: $${pool.minStake}, Maximum: $${pool.maxStake}`;

  return (
    <View
      accessible
      accessibilityLabel={poolAccessibilityLabel}
      style={[
        styles.poolCard,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.xl,
          borderLeftWidth: 4,
          borderLeftColor: tierColor,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.poolHeader} aria-hidden>
        <View>
          <View style={styles.poolTitleRow}>
            <Text style={[textStyles.h4, { color: colors.text.primary }]}>{pool.name}</Text>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
              <Text style={[textStyles.caption, { color: tierColor, fontWeight: '600' }]}>
                {getPoolTierLabel(pool.tier)}
              </Text>
            </View>
          </View>
          <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 4 }]}>
            {pool.description}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.poolStats} aria-hidden>
        <View style={styles.poolStatItem}>
          <Text style={[textStyles.caption, { color: colors.text.muted }]}>APY</Text>
          <Text style={[textStyles.body, { color: colors.status.success, fontWeight: '600' }]}>
            {formatApy(pool.apy)}
          </Text>
        </View>

        <View style={styles.poolStatItem}>
          <Text style={[textStyles.caption, { color: colors.text.muted }]}>TVL</Text>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            {formatTvl(pool.tvlUsd)}
          </Text>
        </View>

        <View style={styles.poolStatItem}>
          <Text style={[textStyles.caption, { color: colors.text.muted }]}>Lock Period</Text>
          <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
            {formatLockPeriod(pool.lockPeriodDays)}
          </Text>
        </View>
      </View>

      {/* User Position */}
      {hasStake && (
        <View style={[styles.userPosition, { backgroundColor: colors.background.primary }]} aria-hidden>
          <View style={styles.positionRow}>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>Your Stake</Text>
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
              ${pool.userStakeUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.poolActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isStaking ? 'Processing stake' : hasStake ? `Stake more in ${pool.name}` : `Stake in ${pool.name}`}
          accessibilityState={{ disabled: !pool.isActive || isStaking }}
          accessibilityHint={pool.isActive ? 'Double tap to stake USDC in this pool' : 'Pool is not active'}
          style={[
            styles.poolActionButton,
            {
              backgroundColor: pool.isActive ? colors.primary : colors.text.muted,
              borderRadius: borderRadius.md,
              flex: hasStake ? 1 : undefined,
            },
          ]}
          onPress={() => onStake(pool.id)}
          disabled={!pool.isActive || isStaking}
        >
          {isStaking ? (
            <ActivityIndicator size="small" color="#fff" accessibilityLabel="Processing" />
          ) : (
            <Text style={[textStyles.body, { color: '#fff', fontWeight: '600' }]} aria-hidden>
              {hasStake ? 'Stake More' : 'Stake'}
            </Text>
          )}
        </Pressable>

        {hasStake && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Unstake from ${pool.name}`}
            accessibilityState={{ disabled: isStaking }}
            accessibilityHint="Double tap to unstake your USDC"
            style={[
              styles.poolActionButton,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.border.default,
                borderRadius: borderRadius.md,
                flex: 1,
                marginLeft: 8,
              },
            ]}
            onPress={() => onUnstake(pool.id)}
            disabled={isStaking}
          >
            <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]} aria-hidden>
              Unstake
            </Text>
          </Pressable>
        )}
      </View>

      {/* Min/Max */}
      <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: 8, textAlign: 'center' }]} aria-hidden>
        Min: ${pool.minStake} • Max: ${pool.maxStake}
      </Text>
    </View>
  );
}

interface EarningsHistoryProps {
  earnings: DefiEarnings[];
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function EarningsHistory({ earnings, colors, borderRadius }: EarningsHistoryProps) {
  if (earnings.length === 0) return null;

  return (
    <View
      accessibilityRole="list"
      accessibilityLabel={`Recent earnings, ${earnings.length} items`}
      style={styles.earningsSection}
    >
      <Text
        accessibilityRole="header"
        style={[textStyles.h4, { color: colors.text.primary, marginBottom: 12 }]}
      >
        Recent Earnings
      </Text>
      {earnings.map((item, index) => (
        <View
          key={index}
          accessible
          accessibilityRole="listitem"
          accessibilityLabel={`${item.period}: plus $${item.amountUsd.toFixed(2)}, ${item.amount} USDC`}
          style={[
            styles.earningsItem,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[textStyles.body, { color: colors.text.primary }]} aria-hidden>
            {item.period}
          </Text>
          <View style={styles.earningsAmount} aria-hidden>
            <Text style={[textStyles.body, { color: colors.status.success, fontWeight: '600' }]}>
              +${item.amountUsd.toFixed(2)}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.muted }]}>
              {item.amount} USDC
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DefiScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const totalStaked = useDefiStore(selectTotalStaked);
  const totalStakedUsd = useDefiStore(selectTotalStakedUsd);
  const totalEarnings = useDefiStore(selectTotalEarnings);
  const totalEarningsUsd = useDefiStore(selectTotalEarningsUsd);
  const currentApy = useDefiStore(selectCurrentApy);
  const pools = useDefiStore(selectPools);
  const recentEarnings = useDefiStore(selectRecentEarnings);
  const isLoading = useDefiStore(selectDefiLoading);
  const isStaking = useDefiStore(selectStakeLoading);
  const { fetchOverview, stakeTokens, unstakeTokens } = useDefiStore();

  // Fetch on mount
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Handle stake
  const handleStake = useCallback(
    (poolId: string) => {
      const pool = pools.find((p) => p.id === poolId);
      if (!pool) return;

      Alert.prompt(
        `Stake in ${pool.name}`,
        `Enter amount to stake (min $${pool.minStake}, max $${pool.maxStake})`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stake',
            onPress: async (amount) => {
              if (!amount) return;
              const success = await stakeTokens(poolId, amount);
              if (success) {
                Alert.alert('Success', 'Your stake has been confirmed!');
              }
            },
          },
        ],
        'plain-text',
        '',
        'decimal-pad'
      );
    },
    [pools, stakeTokens]
  );

  // Handle unstake
  const handleUnstake = useCallback(
    (poolId: string) => {
      const pool = pools.find((p) => p.id === poolId);
      if (!pool) return;

      Alert.prompt(
        `Unstake from ${pool.name}`,
        `Enter amount to unstake (max $${pool.userStake})`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unstake',
            onPress: async (amount) => {
              if (!amount) return;
              const success = await unstakeTokens(poolId, amount);
              if (success) {
                Alert.alert('Success', 'Your unstake has been processed!');
              }
            },
          },
        ],
        'plain-text',
        '',
        'decimal-pad'
      );
    },
    [pools, unstakeTokens]
  );

  // Loading state
  if (isLoading && pools.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <Skeleton variant="card" height={180} style={{ marginBottom: 24 }} />
        <Skeleton variant="text" width="40%" style={{ marginBottom: 16 }} />
        <Skeleton variant="card" height={200} style={{ marginBottom: 12 }} />
        <Skeleton variant="card" height={200} style={{ marginBottom: 12 }} />
      </ScrollView>
    );
  }

  // Empty state
  if (pools.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <EmptyState
          preset="defi"
          title="DeFi Coming Soon"
          description="Stake your USDC to earn yield and participate in the Vlossom liquidity ecosystem."
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
      {/* Overview Card */}
      <View style={{ marginTop: spacing.lg }}>
        <OverviewCard
          totalStaked={totalStaked}
          totalStakedUsd={totalStakedUsd}
          totalEarnings={totalEarnings}
          totalEarningsUsd={totalEarningsUsd}
          currentApy={currentApy}
          colors={colors}
          spacing={spacing}
          borderRadius={borderRadius}
          shadows={shadows}
        />
      </View>

      {/* How It Works */}
      <View
        accessible
        accessibilityLabel="Earn yield by staking USDC in liquidity pools. Your funds help power the Vlossom payment network."
        style={[styles.infoCard, { marginHorizontal: spacing.lg, marginTop: spacing.xl }]}
      >
        <View style={[styles.infoRow, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg }]} aria-hidden>
          <VlossomWalletIcon size={20} color={colors.primary} />
          <Text style={[textStyles.caption, { color: colors.text.secondary, marginLeft: 8, flex: 1 }]}>
            Earn yield by staking USDC in liquidity pools. Your funds help power the Vlossom payment network.
          </Text>
        </View>
      </View>

      {/* Available Pools */}
      <View
        accessibilityRole="list"
        accessibilityLabel={`Available pools, ${pools.length} options`}
        style={[styles.section, { marginHorizontal: spacing.lg }]}
      >
        <Text
          accessibilityRole="header"
          style={[textStyles.h4, { color: colors.text.primary, marginBottom: 16 }]}
        >
          Available Pools
        </Text>
        {pools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            onStake={handleStake}
            onUnstake={handleUnstake}
            isStaking={isStaking}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        ))}
      </View>

      {/* Earnings History */}
      <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <EarningsHistory earnings={recentEarnings} colors={colors} borderRadius={borderRadius} />
      </View>

      {/* Security Note */}
      <View
        accessible
        accessibilityLabel="Security: All funds are secured by audited smart contracts. Withdraw anytime, subject to lock periods."
        style={[styles.securityNote, { marginHorizontal: spacing.lg, marginTop: spacing.xl }]}
      >
        <VlossomVerifiedIcon size={16} color={colors.text.muted} aria-hidden />
        <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: 8, flex: 1 }]} aria-hidden>
          All funds are secured by audited smart contracts. Withdraw anytime (subject to lock periods).
        </Text>
      </View>
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
  overviewCard: {
    padding: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  apyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    marginTop: 24,
  },
  overviewStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  overviewDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  infoCard: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  section: {
    marginTop: 24,
  },
  poolCard: {
    padding: 16,
    marginBottom: 16,
  },
  poolHeader: {},
  poolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  poolStatItem: {
    alignItems: 'center',
  },
  userPosition: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poolActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  poolActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsSection: {},
  earningsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  earningsAmount: {
    alignItems: 'flex-end',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
