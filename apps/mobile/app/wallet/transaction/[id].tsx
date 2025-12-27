/**
 * Transaction Details Screen (V7.2.0)
 *
 * Purpose: Show full details for a single transaction
 * - Transaction type icon + status badge
 * - Amount (USDC + ZAR equivalent)
 * - Counterparty info (address/name)
 * - Timestamp
 * - Transaction hash with copy button
 * - "View on Explorer" link (if on-chain)
 * - Memo/note if present
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme, textStyles } from '../../../src/styles/theme';
import {
  VlossomWalletIcon,
  VlossomCommunityIcon,
} from '../../../src/components/icons/VlossomIcons';
import { useWalletStore, selectTransactions } from '../../../src/stores/wallet';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { Transaction } from '../../../src/api/wallet';

// ============================================================================
// Constants
// ============================================================================

const EXPLORER_BASE_URL = 'https://basescan.org/tx/';

// ============================================================================
// Helper Functions
// ============================================================================

function getTransactionTitle(type: Transaction['type']) {
  switch (type) {
    case 'SEND':
      return 'Sent Money';
    case 'RECEIVE':
      return 'Received Money';
    case 'DEPOSIT':
      return 'Wallet Funded';
    case 'WITHDRAWAL':
      return 'Withdrawal';
    case 'PAYMENT':
      return 'Payment';
    case 'REFUND':
      return 'Refund';
    default:
      return 'Transaction';
  }
}

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

function getStatusLabel(status: Transaction['status']) {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'FAILED':
      return 'Failed';
    default:
      return status;
  }
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

// ============================================================================
// Components
// ============================================================================

interface DetailRowProps {
  label: string;
  value: string;
  isMono?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function DetailRow({ label, value, isMono, copyable, onCopy, colors }: DetailRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={styles.detailRow}
    >
      <Text style={[textStyles.caption, { color: colors.text.secondary }]} aria-hidden>
        {label}
      </Text>
      <View style={styles.detailValueContainer}>
        <Text
          style={[
            isMono ? textStyles.mono : textStyles.body,
            { color: colors.text.primary, flexShrink: 1 },
          ]}
          numberOfLines={1}
          aria-hidden
        >
          {value}
        </Text>
        {copyable && onCopy && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copy ${label} to clipboard`}
            accessibilityHint="Double tap to copy"
            onPress={onCopy}
            style={styles.copyButton}
          >
            <Text style={[textStyles.caption, { color: colors.primary }]} aria-hidden>
              Copy
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TransactionDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const transactions = useWalletStore(selectTransactions);
  const { fetchTransactions, transactionsLoading } = useWalletStore();

  // Find transaction by ID
  const transaction = useMemo(() => {
    return transactions.find((tx) => tx.id === id);
  }, [transactions, id]);

  // Fetch transactions if not loaded
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions(true);
    }
  }, [transactions.length, fetchTransactions]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  }, []);

  // Open block explorer
  const openExplorer = useCallback(() => {
    if (transaction?.txHash) {
      Linking.openURL(`${EXPLORER_BASE_URL}${transaction.txHash}`);
    }
  }, [transaction?.txHash]);

  // Transaction not found
  if (!transaction && !transactionsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <EmptyState
          preset="error"
          title="Transaction Not Found"
          description="This transaction could not be found."
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // Loading state
  if (!transaction) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background.primary }]}>
        <Text style={[textStyles.body, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  const isPositive =
    transaction.type === 'RECEIVE' ||
    transaction.type === 'DEPOSIT' ||
    transaction.type === 'REFUND';

  const iconBgColor = isPositive
    ? colors.status.successLight
    : colors.background.secondary;
  const iconColor = isPositive ? colors.status.success : colors.text.secondary;
  const amountColor = isPositive ? colors.status.success : colors.text.primary;

  const statusColor =
    transaction.status === 'CONFIRMED'
      ? colors.status.success
      : transaction.status === 'FAILED'
        ? colors.status.error
        : colors.status.warning;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* Header Card */}
      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${getTransactionTitle(transaction.type)}, ${isPositive ? 'plus' : 'minus'} $${transaction.amountFormatted} USDC, Status: ${getStatusLabel(transaction.status)}`}
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.background.secondary,
            marginHorizontal: spacing.lg,
            marginTop: spacing.lg,
            borderRadius: borderRadius.xl,
            ...shadows.soft,
          },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: iconBgColor,
              borderRadius: borderRadius.full,
            },
          ]}
          aria-hidden
        >
          <Text style={[styles.iconText, { color: iconColor }]}>
            {getTransactionIcon(transaction.type)}
          </Text>
        </View>

        {/* Title */}
        <Text style={[textStyles.h3, { color: colors.text.primary, marginTop: 16 }]} aria-hidden>
          {getTransactionTitle(transaction.type)}
        </Text>

        {/* Amount */}
        <Text style={[styles.amount, { color: amountColor }]} aria-hidden>
          {isPositive ? '+' : '-'}${transaction.amountFormatted}
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.secondary, marginTop: 4 }]} aria-hidden>
          USDC
        </Text>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusColor + '20',
              borderRadius: borderRadius.full,
            },
          ]}
          aria-hidden
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor,
                borderRadius: borderRadius.full,
              },
            ]}
          />
          <Text style={[textStyles.caption, { color: statusColor, fontWeight: '600' }]}>
            {getStatusLabel(transaction.status)}
          </Text>
        </View>
      </View>

      {/* Details Card */}
      <View
        style={[
          styles.detailsCard,
          {
            backgroundColor: colors.background.secondary,
            marginHorizontal: spacing.lg,
            marginTop: spacing.lg,
            borderRadius: borderRadius.xl,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        {/* Date */}
        <DetailRow
          label="Date & Time"
          value={formatFullDate(transaction.createdAt)}
          colors={colors}
        />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border.default }]} />

        {/* Counterparty */}
        {transaction.counterparty && (
          <>
            <DetailRow
              label={isPositive ? 'From' : 'To'}
              value={formatAddress(transaction.counterparty)}
              isMono
              copyable
              onCopy={() => copyToClipboard(transaction.counterparty!, 'Address')}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />
          </>
        )}

        {/* Transaction Hash */}
        {transaction.txHash && (
          <>
            <DetailRow
              label="Transaction Hash"
              value={formatAddress(transaction.txHash)}
              isMono
              copyable
              onCopy={() => copyToClipboard(transaction.txHash!, 'Transaction hash')}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />
          </>
        )}

        {/* Memo */}
        {transaction.memo && (
          <>
            <DetailRow label="Note" value={transaction.memo} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />
          </>
        )}

        {/* Network Fee */}
        <View
          accessible
          accessibilityLabel="Network Fee: Free, no charges"
          style={styles.detailRow}
        >
          <Text style={[textStyles.caption, { color: colors.text.secondary }]} aria-hidden>
            Network Fee
          </Text>
          <Text style={[textStyles.body, { color: colors.status.success, fontWeight: '600' }]} aria-hidden>
            FREE
          </Text>
        </View>
      </View>

      {/* Actions */}
      {transaction.txHash && (
        <View style={[styles.actionsContainer, { marginHorizontal: spacing.lg }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View on Block Explorer"
            accessibilityHint="Opens the blockchain explorer in your browser to view transaction details"
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
            onPress={openExplorer}
          >
            <VlossomCommunityIcon size={20} color={colors.primary} aria-hidden />
            <Text style={[textStyles.body, { color: colors.primary, marginLeft: 8 }]} aria-hidden>
              View on Block Explorer
            </Text>
          </Pressable>
        </View>
      )}

      {/* Gasless Note */}
      <View
        accessible
        accessibilityLabel="This transaction was processed gaslessly, no network fees charged"
        style={[styles.noteContainer, { marginHorizontal: spacing.lg }]}
      >
        <VlossomWalletIcon size={16} color={colors.text.muted} aria-hidden />
        <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: 8, flex: 1 }]} aria-hidden>
          This transaction was processed gaslessly - no network fees charged!
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
    fontWeight: '600',
  },
  amount: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: 6,
  },
  detailsCard: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginLeft: 16,
  },
  copyButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionsContainer: {
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
