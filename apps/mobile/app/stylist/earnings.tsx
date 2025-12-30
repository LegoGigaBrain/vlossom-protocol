/**
 * Stylist Earnings Screen (V7.2.0)
 *
 * Detailed earnings breakdown with:
 * - Period selector (week, month, year)
 * - Interactive earnings chart with animations
 * - Transaction history
 * - Payout information
 *
 * V7.2.0: Full accessibility support with semantic roles
 * V7.1.2: Added RevenueChart visualization
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomWalletIcon,
  VlossomGrowingIcon,
  VlossomCalendarIcon,
} from '../../src/components/icons/VlossomIcons';
import { Card, Badge } from '../../src/components/ui';
import { RevenueChart, type RevenueDataPoint } from '../../src/components/charts';
import {
  useStylistsStore,
  useDemoModeStore,
  selectIsDemoMode,
  selectEarningsChartData,
  selectEarningsPeriod,
} from '../../src/stores';
import { formatPrice } from '../../src/api/stylists';

type Period = 'week' | 'month' | 'year';

// Mock earnings data for demo mode
const MOCK_EARNINGS_HISTORY = [
  { id: '1', date: new Date().toISOString(), amount: 45000, service: 'Knotless Braids', customer: 'Lerato M.' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), amount: 20000, service: 'Loc Retwist', customer: 'Nandi K.' },
  { id: '3', date: new Date(Date.now() - 172800000).toISOString(), amount: 35000, service: 'Passion Twists', customer: 'Thandi S.' },
  { id: '4', date: new Date(Date.now() - 259200000).toISOString(), amount: 55000, service: 'Box Braids', customer: 'Palesa M.' },
  { id: '5', date: new Date(Date.now() - 345600000).toISOString(), amount: 25000, service: 'Natural Hair Styling', customer: 'Zinhle K.' },
];

export default function StylistEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const { dashboard, fetchDashboard, setEarningsPeriod: setStorePeriod } = useStylistsStore();
  const earningsChartData = useStylistsStore(selectEarningsChartData);
  const storePeriod = useStylistsStore(selectEarningsPeriod);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Initialize chart data on mount and sync with period changes
  useEffect(() => {
    setStorePeriod(selectedPeriod);
  }, [selectedPeriod, setStorePeriod]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboard();
    setIsRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const stats = dashboard?.stats;

  // Calculate period earnings (mock calculation for demo)
  const getPeriodEarnings = () => {
    const base = stats?.thisMonthEarnings || 0;
    switch (selectedPeriod) {
      case 'week':
        return Math.round(base / 4);
      case 'month':
        return base;
      case 'year':
        return base * 12;
    }
  };

  const getPeriodChange = () => {
    // Mock percentage change
    switch (selectedPeriod) {
      case 'week':
        return { value: 12, positive: true };
      case 'month':
        return { value: 8, positive: true };
      case 'year':
        return { value: 24, positive: true };
    }
  };

  const periodEarnings = getPeriodEarnings();
  const periodChange = getPeriodChange();

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
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to stylist dashboard"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.h3, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          Earnings
        </Text>
        <View style={styles.headerSpacer} aria-hidden />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Period Selector */}
        <View
          style={[styles.periodSelector, { padding: spacing.lg }]}
          accessibilityRole="tablist"
          accessibilityLabel="Time period selector"
        >
          {(['week', 'month', 'year'] as Period[]).map((period) => {
            const isSelected = selectedPeriod === period;
            const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
            return (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.background.secondary,
                    borderRadius: borderRadius.md,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityLabel={periodLabel}
                accessibilityState={{ selected: isSelected }}
                accessibilityHint={isSelected ? 'Currently selected' : `Double tap to view ${periodLabel.toLowerCase()} earnings`}
              >
                <Text
                  style={[
                    textStyles.bodySmall,
                    {
                      color: isSelected ? colors.white : colors.text.secondary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                  aria-hidden
                >
                  {periodLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Earnings Summary Card */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Card
            variant="filled"
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} earnings: ${formatPrice(periodEarnings)}. ${periodChange.positive ? 'Up' : 'Down'} ${periodChange.value}% compared to last ${selectedPeriod}.`}
          >
            <View style={styles.earningsSummary} aria-hidden>
              <VlossomWalletIcon size={32} color={colors.status.success} />
              <Text
                style={[
                  textStyles.h1,
                  { color: colors.text.primary, marginTop: spacing.sm },
                ]}
              >
                {formatPrice(periodEarnings)}
              </Text>
              <View style={styles.changeIndicator}>
                <VlossomGrowingIcon
                  size={16}
                  color={periodChange.positive ? colors.status.success : colors.status.error}
                />
                <Text
                  style={[
                    textStyles.bodySmall,
                    {
                      color: periodChange.positive
                        ? colors.status.success
                        : colors.status.error,
                      marginLeft: 4,
                    },
                  ]}
                >
                  {periodChange.positive ? '+' : '-'}
                  {periodChange.value}% vs last {selectedPeriod}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Earnings Chart */}
        {earningsChartData.length > 0 && (
          <View style={[styles.chartCard, { marginHorizontal: spacing.lg, marginTop: spacing.lg }]}>
            <Card variant="outlined">
              <Text
                style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
                accessibilityRole="header"
              >
                Earnings Trend
              </Text>
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Earnings trend chart showing ${selectedPeriod}ly data with ${earningsChartData.length} data points`}
              >
                <RevenueChart
                  data={earningsChartData as RevenueDataPoint[]}
                  height={180}
                  variant="bar"
                  showLabels
                  showValues
                  showComparison
                  formatValue={(value) => formatPrice(value)}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Stats Grid */}
        <View
          style={[styles.statsGrid, { padding: spacing.lg }]}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Statistics: ${stats?.completedBookings || 0} completed bookings, average ${stats?.completedBookings ? formatPrice(Math.round((stats.totalEarnings || 0) / stats.completedBookings)) : 'R0'} per booking, rating ${stats?.averageRating?.toFixed(1) || '0.0'} stars`}
        >
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md },
            ]}
            aria-hidden
          >
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Completed
            </Text>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>
              {stats?.completedBookings || 0}
            </Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md },
            ]}
            aria-hidden
          >
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Avg. per Booking
            </Text>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>
              {stats?.completedBookings
                ? formatPrice(Math.round((stats.totalEarnings || 0) / stats.completedBookings))
                : 'R0'}
            </Text>
          </View>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md },
            ]}
            aria-hidden
          >
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Rating
            </Text>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>
              ⭐ {stats?.averageRating?.toFixed(1) || '0.0'}
            </Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Recent Earnings
          </Text>

          <View accessibilityRole="list" accessibilityLabel={`Recent earnings, ${MOCK_EARNINGS_HISTORY.length} transactions`}>
            {MOCK_EARNINGS_HISTORY.map((earning) => (
              <Card
                key={earning.id}
                variant="outlined"
                style={{ marginBottom: spacing.sm }}
                accessible
                accessibilityLabel={`${earning.service} from ${earning.customer}, ${new Date(earning.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}, earned ${formatPrice(earning.amount)}`}
              >
                <View style={styles.transactionRow} aria-hidden>
                  <View style={styles.transactionInfo}>
                    <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '500' }]}>
                      {earning.service}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {earning.customer} •{' '}
                      {new Date(earning.date).toLocaleDateString('en-ZA', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[textStyles.body, { color: colors.status.success, fontWeight: '600' }]}>
                    +{formatPrice(earning.amount)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Payout Info */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Card
            variant="filled"
            accessible
            accessibilityRole="text"
            accessibilityLabel="Next Payout: Automatic payout every Monday"
          >
            <View style={styles.payoutInfo} aria-hidden>
              <VlossomCalendarIcon size={24} color={colors.primary} />
              <View style={styles.payoutText}>
                <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '500' }]}>
                  Next Payout
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                  Automatic payout every Monday
                </Text>
              </View>
              <Badge label="Auto" variant="primary" size="sm" />
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

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
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  earningsSummary: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionInfo: {
    flex: 1,
  },
  payoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutText: {
    flex: 1,
    marginLeft: 12,
  },
  chartCard: {
    // Chart card styling
  },
});
