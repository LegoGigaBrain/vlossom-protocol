/**
 * Wallet Tab - Financial Hub (V6.0)
 *
 * Purpose: Balance, DeFi, rewards, transactions
 * Center position emphasizes importance
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomAddIcon, VlossomSettingsIcon } from '../../src/components/icons/VlossomIcons';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[textStyles.h2, { color: colors.text.primary }]}>Wallet</Text>
        <Pressable>
          <VlossomSettingsIcon size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

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
          <Text style={[styles.balanceAmount, { color: colors.white }]}>$0.00</Text>
          <Text style={[textStyles.bodySmall, { color: colors.primarySoft }]}>VLSM</Text>

          {/* Action buttons */}
          <View style={styles.balanceActions}>
            <BalanceButton label="Send" colors={colors} borderRadius={borderRadius} spacing={spacing} />
            <BalanceButton label="Receive" colors={colors} borderRadius={borderRadius} spacing={spacing} />
            <BalanceButton label="Buy" colors={colors} borderRadius={borderRadius} spacing={spacing} />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            icon="rewards"
            label="Rewards"
            value="0 VLSM"
            colors={colors}
            borderRadius={borderRadius}
            shadows={shadows}
            spacing={spacing}
          />
          <QuickActionCard
            icon="stake"
            label="Staking"
            value="0%"
            colors={colors}
            borderRadius={borderRadius}
            shadows={shadows}
            spacing={spacing}
          />
        </View>
      </View>

      {/* Transactions */}
      <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.sectionHeader}>
          <Text style={[textStyles.h3, { color: colors.text.primary }]}>Recent Activity</Text>
          <Pressable>
            <Text style={[textStyles.bodySmall, { color: colors.primary }]}>View All</Text>
          </Pressable>
        </View>

        {/* Empty state */}
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[textStyles.body, { color: colors.text.tertiary }]}>No transactions yet</Text>
          <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
            Your activity will appear here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function BalanceButton({ label, colors, borderRadius, spacing }: any) {
  return (
    <Pressable
      style={[
        styles.balanceButton,
        {
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: borderRadius.md,
        },
      ]}
    >
      <VlossomAddIcon size={20} color={colors.white} />
      <Text style={[textStyles.caption, { color: colors.white, marginTop: spacing.xs }]}>{label}</Text>
    </Pressable>
  );
}

function QuickActionCard({ icon, label, value, colors, borderRadius, shadows, spacing }: any) {
  return (
    <Pressable
      style={[
        styles.quickActionCard,
        {
          backgroundColor: colors.background.primary,
          borderRadius: borderRadius.lg,
          ...shadows.card,
        },
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: colors.surface.light,
            borderRadius: borderRadius.md,
          },
        ]}
      />
      <Text style={[textStyles.bodySmall, { color: colors.text.secondary, marginTop: spacing.sm }]}>
        {label}
      </Text>
      <Text style={[textStyles.h3, { color: colors.text.primary, marginTop: spacing.xs }]}>{value}</Text>
    </Pressable>
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
    gap: 16,
  },
  balanceButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 72,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
});
