/**
 * Transaction History Screen (V7.1.0)
 *
 * Purpose: Full paginated transaction history
 * - Filter by type: All | Sent | Received | Deposits | Withdrawals
 * - Date range filter: This Week, This Month, All Time
 * - Pull-to-refresh
 * - Tap transaction → detail view
 *
 * V7.2.0: Added accessibility labels for screen reader support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomWalletIcon,
  VlossomCalendarIcon,
} from '../../src/components/icons/VlossomIcons';
import { useWalletStore, selectTransactions } from '../../src/stores/wallet';
import { EmptyState } from '../../src/components/ui/EmptyState';
import type { Transaction } from '../../src/api/wallet';

// ============================================================================
// Types & Constants
// ============================================================================

type TransactionFilter = 'ALL' | 'SEND' | 'RECEIVE' | 'DEPOSIT' | 'WITHDRAWAL';
type DateRange = 'WEEK' | 'MONTH' | 'ALL';

const FILTER_OPTIONS: { key: TransactionFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'SEND', label: 'Sent' },
  { key: 'RECEIVE', label: 'Received' },
  { key: 'DEPOSIT', label: 'Deposits' },
  { key: 'WITHDRAWAL', label: 'Withdrawals' },
];

const DATE_RANGE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: 'WEEK', label: 'This Week' },
  { key: 'MONTH', label: 'This Month' },
  { key: 'ALL', label: 'All Time' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getTransactionIcon(type: Transaction['type']) {
  switch (type) {
    case 'SEND':
      return '↑';
    case 'RECEIVE':
      return '↓';
    case 'DEPOSIT':
      return '+';
    case 'WITHDRAWAL':
      return '-';
    case 'PAYMENT':
      return '→';
    case 'REFUND':
      return '←';
    default:
      return '•';
  }
}

function getTransactionLabel(type: Transaction['type']) {
  switch (type) {
    case 'SEND':
      return 'Sent';
    case 'RECEIVE':
      return 'Received';
    case 'DEPOSIT':
      return 'Deposit';
    case 'WITHDRAWAL':
      return 'Withdrawal';
    case 'PAYMENT':
      return 'Payment';
    case 'REFUND':
      return 'Refund';
    default:
      return type;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function isWithinDateRange(dateString: string, range: DateRange): boolean {
  if (range === 'ALL') return true;

  const date = new Date(dateString);
  const now = new Date();

  if (range === 'WEEK') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }

  if (range === 'MONTH') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= monthAgo;
  }

  return true;
}

// ============================================================================
// Components
// ============================================================================

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function TransactionItem({
  transaction,
  onPress,
  colors,
  spacing,
  borderRadius,
}: TransactionItemProps) {
  const isPositive =
    transaction.type === 'RECEIVE' ||
    transaction.type === 'DEPOSIT' ||
    transaction.type === 'REFUND';

  const iconBgColor = isPositive
    ? colors.status.successLight
    : colors.background.secondary;

  const iconColor = isPositive ? colors.status.success : colors.text.secondary;

  const amountColor = isPositive ? colors.status.success : colors.text.primary;

  const counterpartyDisplay = transaction.counterparty
    ? `${transaction.counterparty.slice(0, 6)}...${transaction.counterparty.slice(-4)}`
    : transaction.memo || 'No details';

  return (
    <Pressable
      style={[
        styles.transactionItem,
        {
          backgroundColor: colors.background.primary,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${getTransactionLabel(transaction.type)}, ${isPositive ? 'plus' : 'minus'} ${transaction.amountFormatted} dollars, ${counterpartyDisplay}, ${formatDate(transaction.createdAt)}`}
      accessibilityHint="Double tap to view transaction details"
    >
      {/* Icon */}
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: iconBgColor,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Text style={[styles.transactionIconText, { color: iconColor }]} aria-hidden>
          {getTransactionIcon(transaction.type)}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.transactionDetails}>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
          {getTransactionLabel(transaction.type)}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
          {counterpartyDisplay}
        </Text>
      </View>

      {/* Amount & Date */}
      <View style={styles.transactionAmountContainer}>
        <Text
          style={[
            textStyles.body,
            { color: amountColor, fontWeight: '600', textAlign: 'right' },
          ]}
        >
          {isPositive ? '+' : '-'}${transaction.amountFormatted}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.muted, textAlign: 'right' }]}>
          {formatDate(transaction.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TransactionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();

  const transactions = useWalletStore(selectTransactions);
  const {
    transactionsLoading,
    transactionsError,
    hasMoreTransactions,
    fetchTransactions,
  } = useWalletStore();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('ALL');
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!transactionsLoading && hasMoreTransactions) {
      fetchTransactions(false);
    }
  }, [transactionsLoading, hasMoreTransactions, fetchTransactions]);

  // Navigate to transaction detail
  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      router.push({
        pathname: '/wallet/transaction/[id]',
        params: { id: transaction.id },
      });
    },
    [router]
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'DEPOSIT' && tx.type !== 'DEPOSIT') return false;
        if (typeFilter === 'WITHDRAWAL' && tx.type !== 'WITHDRAWAL') return false;
        if (typeFilter === 'SEND' && tx.type !== 'SEND') return false;
        if (typeFilter === 'RECEIVE' && tx.type !== 'RECEIVE' && tx.type !== 'REFUND')
          return false;
      }

      // Date range filter
      if (!isWithinDateRange(tx.createdAt, dateRange)) return false;

      return true;
    });
  }, [transactions, typeFilter, dateRange]);

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem
        transaction={item}
        onPress={() => handleTransactionPress(item)}
        colors={colors}
        spacing={spacing}
        borderRadius={borderRadius}
      />
    ),
    [colors, spacing, borderRadius, handleTransactionPress]
  );

  // Render footer (loading indicator)
  const renderFooter = useCallback(() => {
    if (!transactionsLoading || transactions.length === 0) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [transactionsLoading, transactions.length, colors.primary]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (transactionsLoading) return null;

    return (
      <EmptyState
        preset="wallet-history"
        title="No Transactions Yet"
        description="Your transaction history will appear here once you start sending or receiving funds."
      />
    );
  }, [transactionsLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Filter Chips */}
      <View style={styles.filterSection}>
        {/* Type Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.filterList, { paddingHorizontal: spacing.lg }]}
          accessibilityRole="radiogroup"
          accessibilityLabel="Filter transactions by type"
          renderItem={({ item }) => {
            const isSelected = typeFilter === item.key;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                    borderRadius: borderRadius.full,
                  },
                ]}
                onPress={() => setTypeFilter(item.key)}
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: isSelected }}
              >
                <Text
                  style={[
                    textStyles.caption,
                    {
                      color: isSelected ? colors.white : colors.text.primary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Date Range Picker */}
        <View style={[styles.dateRangeContainer, { paddingHorizontal: spacing.lg }]}>
          <Pressable
            style={[
              styles.dateRangeButton,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => setShowDatePicker(!showDatePicker)}
            accessibilityRole="button"
            accessibilityLabel={`Date range: ${DATE_RANGE_OPTIONS.find((o) => o.key === dateRange)?.label || 'All Time'}`}
            accessibilityHint="Double tap to change date range filter"
            accessibilityState={{ expanded: showDatePicker }}
          >
            <VlossomCalendarIcon size={16} color={colors.text.secondary} />
            <Text style={[textStyles.caption, { color: colors.text.primary, marginLeft: 6 }]}>
              {DATE_RANGE_OPTIONS.find((o) => o.key === dateRange)?.label || 'All Time'}
            </Text>
          </Pressable>
        </View>

        {/* Date Range Options (Dropdown) */}
        {showDatePicker && (
          <View
            style={[
              styles.dateRangeDropdown,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                marginHorizontal: spacing.lg,
              },
            ]}
            accessibilityRole="radiogroup"
            accessibilityLabel="Date range options"
          >
            {DATE_RANGE_OPTIONS.map((option) => {
              const isSelected = dateRange === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.dateRangeOption,
                    {
                      backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setDateRange(option.key);
                    setShowDatePicker(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text
                    style={[
                      textStyles.body,
                      {
                        color: isSelected ? colors.primary : colors.text.primary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Transaction Count */}
      <View
        style={[styles.countContainer, { paddingHorizontal: spacing.lg }]}
        accessible
        accessibilityLabel={`${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} found`}
        accessibilityLiveRegion="polite"
      >
        <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={transactionsLoading && transactions.length > 0}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: colors.border.default, marginLeft: 72 },
            ]}
          />
        )}
      />

      {/* Error Banner */}
      {transactionsError && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.status.errorLight,
              paddingHorizontal: spacing.lg,
            },
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={[textStyles.bodySmall, { color: colors.status.error }]}>
            {transactionsError}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingTop: 12,
  },
  filterList: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateRangeDropdown: {
    marginTop: 8,
    overflow: 'hidden',
  },
  dateRangeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countContainer: {
    paddingVertical: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconText: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
});
