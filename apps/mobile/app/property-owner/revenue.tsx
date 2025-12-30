/**
 * Property Owner Revenue Screen (V7.2.0)
 *
 * Track earnings from chair rentals with visual charts.
 * V7.1.2: Added revenue chart visualization.
 * V7.2.0: Full accessibility support with semantic roles
 */

import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomWalletIcon,
  VlossomGrowingIcon,
} from '../../src/components/icons/VlossomIcons';
import { usePropertyOwnerStore } from '../../src/stores/property-owner';
import { RevenueChart, type RevenueDataPoint } from '../../src/components/charts';


// Format price
const formatPrice = (cents: number) => {
  return `R ${(cents / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  });
};

export default function RevenueScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const {
    revenueStats,
    revenueLoading,
    revenuePeriod,
    transactions,
    revenueChartData,
    fetchRevenue,
    setRevenuePeriod,
  } = usePropertyOwnerStore();

  // Fetch revenue on mount
  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRevenue(revenuePeriod);
    setRefreshing(false);
  }, [fetchRevenue, revenuePeriod]);

  // Handle period change
  const handlePeriodChange = useCallback((newPeriod: 'week' | 'month' | 'year') => {
    setRevenuePeriod(newPeriod);
    fetchRevenue(newPeriod);
  }, [setRevenuePeriod, fetchRevenue]);

  // Calculate month-over-month change
  const monthChange = revenueStats
    ? revenueStats.lastPeriodEarningsCents > 0
      ? Math.round(
          ((revenueStats.thisPeriodEarningsCents - revenueStats.lastPeriodEarningsCents) /
            revenueStats.lastPeriodEarningsCents) *
            100
        )
      : 0
    : 0;

  // Loading state
  if (revenueLoading && !revenueStats) {
    return (
      <View
        style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background.secondary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Loading revenue, please wait"
      >
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]} aria-hidden>
          Loading revenue...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Stats Cards */}
      <View
        style={[styles.statsSection, { padding: spacing.lg }]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Revenue summary: Total earnings ${formatPrice(revenueStats?.totalEarningsCents || 0)}, This ${revenuePeriod} ${formatPrice(revenueStats?.thisPeriodEarningsCents || 0)}${monthChange !== 0 ? `, ${monthChange > 0 ? 'up' : 'down'} ${Math.abs(monthChange)}%` : ''}, Pending payout ${formatPrice(revenueStats?.pendingPayoutCents || 0)}`}
      >
        {/* Total Earnings */}
        <View
          style={[
            styles.mainStatCard,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
          aria-hidden
        >
          <VlossomWalletIcon size={24} color={colors.white} />
          <Text style={[textStyles.caption, { color: colors.white + 'CC', marginTop: spacing.sm }]}>
            Total Earnings
          </Text>
          <Text style={[textStyles.h1, { color: colors.white }]}>
            {formatPrice(revenueStats?.totalEarningsCents || 0)}
          </Text>
        </View>

        {/* Secondary Stats */}
        <View style={[styles.statsRow, { marginTop: spacing.md }]} aria-hidden>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>This {revenuePeriod}</Text>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>
              {formatPrice(revenueStats?.thisPeriodEarningsCents || 0)}
            </Text>
            {monthChange !== 0 && (
              <View style={styles.changeRow}>
                <View style={monthChange < 0 ? { transform: [{ rotate: '180deg' }] } : undefined}>
                  <VlossomGrowingIcon
                    size={12}
                    color={monthChange > 0 ? colors.status.success : colors.status.error}
                  />
                </View>
                <Text
                  style={[
                    textStyles.caption,
                    { color: monthChange > 0 ? colors.status.success : colors.status.error },
                  ]}
                >
                  {monthChange > 0 ? '+' : ''}
                  {monthChange}%
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Pending</Text>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>
              {formatPrice(revenueStats?.pendingPayoutCents || 0)}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.muted }]}>payout</Text>
          </View>
        </View>
      </View>

      {/* Period Toggle */}
      <View
        style={[styles.periodToggle, { paddingHorizontal: spacing.lg }]}
        accessibilityRole="tablist"
        accessibilityLabel="Select time period"
      >
        {[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
        ].map((p) => {
          const isActive = revenuePeriod === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => handlePeriodChange(p.value as typeof revenuePeriod)}
              style={[
                styles.periodChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.background.tertiary,
                  borderRadius: borderRadius.pill,
                },
              ]}
              accessibilityRole="tab"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: isActive }}
              accessibilityHint={isActive ? 'Currently selected' : `Double tap to view ${p.label.toLowerCase()}ly revenue`}
            >
              <Text
                style={[textStyles.caption, { color: isActive ? colors.white : colors.text.secondary }]}
                aria-hidden
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Revenue Chart */}
      {revenueChartData.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text
            style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Revenue Trend
          </Text>
          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Revenue trend chart showing ${revenuePeriod}ly data with ${revenueChartData.length} data points`}
          >
            <RevenueChart
              data={revenueChartData as RevenueDataPoint[]}
              height={200}
              showLabels
              showGrid
              showComparison={revenuePeriod !== 'year'}
              animated
              formatValue={(cents) => {
                if (cents >= 100000) return `R${(cents / 100000).toFixed(1)}K`;
                return `R${(cents / 100).toFixed(0)}`;
              }}
            />
          </View>
        </View>
      )}

      {/* Transactions */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
        <Text
          style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}
          accessibilityRole="header"
        >
          Recent Transactions
        </Text>

        <View
          style={[
            styles.transactionsCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          {transactions.length === 0 ? (
            <View
              style={styles.emptyState}
              accessible
              accessibilityRole="text"
              accessibilityLabel="No transactions yet"
            >
              <Text style={[textStyles.body, { color: colors.text.secondary }]} aria-hidden>
                No transactions yet
              </Text>
            </View>
          ) : (
            <View accessibilityRole="list" accessibilityLabel={`${transactions.length} recent transactions`}>
              {transactions.map((tx, index) => {
                const isIncome = tx.type !== 'PAYOUT';
                const isLast = index === transactions.length - 1;
                const txDescription = tx.type === 'PAYOUT'
                  ? 'Payout to Bank'
                  : `${tx.chairName || 'Chair'} rental from ${tx.stylistName || 'Stylist'}`;

                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.transactionRow,
                      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth },
                      { borderBottomColor: colors.border.default },
                    ]}
                    accessible
                    accessibilityLabel={`${txDescription}, ${isIncome ? 'income' : 'payout'} ${formatPrice(tx.amountCents || 0)}, ${formatDate(tx.createdAt)}, ${tx.status.toLowerCase()}`}
                  >
                    <View
                      style={[
                        styles.txIcon,
                        {
                          backgroundColor: isIncome
                            ? colors.status.success + '20'
                            : colors.primary + '20',
                          borderRadius: borderRadius.circle,
                        },
                      ]}
                      aria-hidden
                    >
                      {isIncome ? (
                        <VlossomGrowingIcon size={16} color={colors.status.success} />
                      ) : (
                        <VlossomWalletIcon size={16} color={colors.primary} />
                      )}
                    </View>

                    <View style={styles.txInfo} aria-hidden>
                      <Text
                        style={[textStyles.bodySmall, { color: colors.text.primary }]}
                        numberOfLines={1}
                      >
                        {tx.type === 'PAYOUT'
                          ? 'Payout to Bank'
                          : `${tx.chairName || 'Chair'} - ${tx.stylistName || 'Stylist'}`}
                      </Text>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                        {tx.propertyName || 'Completed'} • {formatDate(tx.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.txAmount} aria-hidden>
                      <Text
                        style={[
                          textStyles.bodySmall,
                          {
                            color: isIncome ? colors.status.success : colors.text.primary,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {isIncome ? '+' : '-'}
                        {formatPrice(tx.amountCents || 0)}
                      </Text>
                      <Text
                        style={[
                          textStyles.caption,
                          {
                            color:
                              tx.status === 'COMPLETED'
                                ? colors.status.success
                                : colors.status.warning,
                          },
                        ]}
                      >
                        {tx.status.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Payout Info */}
      {revenueStats && revenueStats.pendingPayoutCents > 0 && (
        <View
          style={[
            styles.payoutBanner,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '30',
              marginHorizontal: spacing.lg,
              marginTop: spacing.lg,
              borderRadius: borderRadius.lg,
            },
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Pending payout: ${formatPrice(revenueStats?.pendingPayoutCents || 0)}. Payouts are processed every Friday.`}
        >
          <VlossomWalletIcon size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }} aria-hidden>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
              Pending: {formatPrice(revenueStats?.pendingPayoutCents || 0)}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              Payouts are processed every Friday
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {},
  mainStatCard: {
    padding: 20,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chartCard: {
    padding: 16,
    overflow: 'hidden',
  },
  transactionsCard: {
    overflow: 'hidden',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  txIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txAmount: {
    alignItems: 'flex-end',
  },
  payoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
});
