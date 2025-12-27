/**
 * Wallet Flow Layout (V7.1.0)
 *
 * Stack navigation for wallet-related screens:
 * - Fund (Kotani Pay onramp)
 * - Withdraw (Kotani Pay offramp)
 * - Send (P2P transfer)
 * - Receive (QR code display)
 * - History (Full transaction history)
 * - Transaction Details (Individual transaction)
 * - Rewards (XP, badges, streaks)
 * - DeFi (Staking pools)
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function WalletLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 17,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="fund"
        options={{
          title: 'Add Money',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="withdraw"
        options={{
          title: 'Withdraw',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="send"
        options={{
          title: 'Send Money',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="receive"
        options={{
          title: 'Receive Money',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Transaction History',
        }}
      />
      <Stack.Screen
        name="transaction/[id]"
        options={{
          title: 'Transaction Details',
        }}
      />
      <Stack.Screen
        name="rewards"
        options={{
          title: 'Rewards',
        }}
      />
      <Stack.Screen
        name="defi"
        options={{
          title: 'DeFi',
        }}
      />
    </Stack>
  );
}
