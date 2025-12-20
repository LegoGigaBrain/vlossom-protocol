/**
 * Wallet Tab - Financial Hub (V6.8.0)
 *
 * Purpose: Balance, transactions, fund/withdraw, send/receive
 * Connected to wallet store for real data
 */

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomAddIcon,
  VlossomSettingsIcon,
  VlossomWalletIcon,
} from '../../src/components/icons/VlossomIcons';
import { useWalletStore } from '../../src/stores/wallet';
import { colors as tokenColors } from '../../src/styles/tokens';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const {
    wallet,
    balance,
    transactions,
    walletLoading,
    walletError,
    transactionsLoading,
    fetchWallet,
    fetchTransactions,
    fetchFiatConfig,
  } = useWalletStore();

  // Load wallet data on mount
  useEffect(() => {
    fetchWallet();
    fetchTransactions(true);
    fetchFiatConfig();
  }, [fetchWallet, fetchTransactions, fetchFiatConfig]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    fetchWallet();
    fetchTransactions(true);
  }, [fetchWallet, fetchTransactions]);

  // Format balance for display
  const displayBalance = balance?.usdcFormatted || '0.00';
  const displayFiat = balance?.fiatValue
    ? `R${balance.fiatValue.toFixed(2)}`
    : 'R0.00';

  // Navigation handlers
  const handleSend = () => router.push('/wallet/send');
  const handleReceive = () => router.push('/wallet/receive');
  const handleFund = () => router.push('/wallet/fund');
  const handleWithdraw = () => router.push('/wallet/withdraw');
  const handleViewAllTransactions = () => {
    // TODO: Navigate to full transaction history
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={walletLoading}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[textStyles.h2, { color: colors.text.primary }]}>Wallet</Text>
        <Pressable>
          <VlossomSettingsIcon size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Error State */}
      {walletError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.status.errorLight }]}>
          <Text style={[textStyles.bodySmall, { color: colors.status.error }]}>
            {walletError}
          </Text>
          <Pressable onPress={fetchWallet}>
            <Text style={[textStyles.bodySmall, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Balance Card */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.xl,
              ...shadows.elevated,
            },
          ]}
        >
          <Text style={[textStyles.caption, { color: colors.primarySoft }]}>Total Balance</Text>

          {walletLoading && !balance ? (
            <ActivityIndicator color={colors.white} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={[styles.balanceAmount, { color: colors.white }]}>
                ${displayBalance}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.primarySoft }]}>
                {displayFiat} ZAR
              </Text>
            </>
          )}

          {/* Action buttons */}
          <View style={styles.balanceActions}>
            <BalanceButton
              label="Send"
              onPress={handleSend}
              colors={colors}
              borderRadius={borderRadius}
              spacing={spacing}
            />
            <BalanceButton
              label="Receive"
              onPress={handleReceive}
              colors={colors}
              borderRadius={borderRadius}
              spacing={spacing}
            />
            <BalanceButton
              label="Fund"
              onPress={handleFund}
              colors={colors}
              borderRadius={borderRadius}
              spacing={spacing}
            />
            <BalanceButton
              label="Withdraw"
              onPress={handleWithdraw}
              colors={colors}
              borderRadius={borderRadius}
              spacing={spacing}
            />
          </View>
        </View>
      </View>

      {/* Wallet Address */}
      {wallet?.address && (
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View
            style={[
              styles.addressCard,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.addressHeader}>
              <VlossomWalletIcon size={20} color={colors.primary} />
              <Text style={[textStyles.caption, { color: colors.text.secondary, marginLeft: 8 }]}>
                Wallet Address
              </Text>
            </View>
            <Text
              style={[textStyles.mono, { color: colors.text.primary, marginTop: 4 }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {wallet.address}
            </Text>
          </View>
        </View>
      )}

      {/* Transactions */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.sectionHeader}>
          <Text style={[textStyles.h3, { color: colors.text.primary }]}>Recent Activity</Text>
          {transactions.length > 0 && (
            <Pressable onPress={handleViewAllTransactions}>
              <Text style={[textStyles.bodySmall, { color: colors.primary }]}>View All</Text>
            </Pressable>
          )}
        </View>

        {transactionsLoading && transactions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.text.tertiary }]}>
              No transactions yet
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
              Your activity will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                colors={colors}
                borderRadius={borderRadius}
                spacing={spacing}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

interface BalanceButtonProps {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}

function BalanceButton({ label, onPress, colors, borderRadius, spacing }: BalanceButtonProps) {
  return (
    <Pressable
      style={[
        styles.balanceButton,
        {
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: borderRadius.md,
        },
      ]}
      onPress={onPress}
    >
      <VlossomAddIcon size={20} color={colors.white} />
      <Text style={[textStyles.caption, { color: colors.white, marginTop: spacing.xs }]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface TransactionItemProps {
  transaction: {
    id: string;
    type: string;
    amountFormatted: string;
    counterparty: string | null;
    status: string;
    createdAt: string;
  };
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}

function TransactionItem({ transaction, colors, borderRadius, spacing }: TransactionItemProps) {
  const isReceive = transaction.type === 'RECEIVE' || transaction.type === 'DEPOSIT';
  const sign = isReceive ? '+' : '-';
  const amountColor = isReceive ? tokenColors.status.success : colors.text.primary;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SEND':
        return 'Sent';
      case 'RECEIVE':
        return 'Received';
      case 'DEPOSIT':
        return 'Funded';
      case 'WITHDRAWAL':
        return 'Withdrawn';
      case 'PAYMENT':
        return 'Payment';
      case 'REFUND':
        return 'Refund';
      default:
        return type;
    }
  };

  return (
    <View
      style={[
        styles.transactionItem,
        {
          backgroundColor: colors.background.primary,
          borderBottomColor: colors.border.default,
        },
      ]}
    >
      <View style={styles.transactionLeft}>
        <Text style={[textStyles.body, { color: colors.text.primary }]}>
          {getTypeLabel(transaction.type)}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.muted }]}>
          {formatDate(transaction.createdAt)}
          {transaction.counterparty && ` • ${transaction.counterparty.slice(0, 6)}...`}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[textStyles.body, { color: amountColor, fontWeight: '600' }]}>
          {sign}${transaction.amountFormatted}
        </Text>
        {transaction.status === 'PENDING' && (
          <Text style={[textStyles.caption, { color: colors.status.warning }]}>Pending</Text>
        )}
      </View>
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
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  balanceCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceAmount: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  balanceButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 64,
  },
  section: {
    marginBottom: 24,
  },
  addressCard: {
    padding: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
});
