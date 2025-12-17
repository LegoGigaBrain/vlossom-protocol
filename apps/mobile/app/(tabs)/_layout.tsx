/**
 * Vlossom Mobile Tab Navigation (V6.0)
 *
 * 5-Tab Navigation Structure:
 * - Home: Map-first discovery + booking
 * - Search: Intentional exploration, following feed
 * - Wallet: Financial hub (center position)
 * - Notifications: Global inbox
 * - Profile: Identity, hair health, role dashboards
 *
 * Uses botanical iconography from Vlossom icon system
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/styles/theme';
import {
  VlossomHomeIcon,
  VlossomSearchIcon,
  VlossomWalletIcon,
  VlossomNotificationsIcon,
  VlossomProfileIcon,
} from '../../src/components/icons/VlossomIcons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.default,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: insets.bottom || spacing.sm,
          paddingTop: spacing.sm,
          height: 60 + (insets.bottom || spacing.sm),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 10,
          marginTop: 4,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <VlossomHomeIcon size={22} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <VlossomSearchIcon size={22} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => (
            <WalletTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <VlossomNotificationsIcon size={22} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <VlossomProfileIcon size={22} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// Center wallet tab with elevated styling
function WalletTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { colors, spacing, borderRadius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.walletIconContainer,
        {
          backgroundColor: focused ? colors.primary : colors.background.secondary,
          borderRadius: borderRadius.pill,
          ...shadows.soft,
        },
      ]}
    >
      <VlossomWalletIcon
        size={24}
        color={focused ? colors.white : color}
        focused={focused}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  walletIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
});
