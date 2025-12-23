/**
 * Stylist Routes Layout (V7.1)
 *
 * Stack navigator for stylist-specific routes:
 * - /stylist/dashboard - Main dashboard with earnings and requests
 * - /stylist/onboarding - Setup wizard
 * - /stylist/calendar - Stylist schedule
 * - /stylist/earnings - Detailed earnings view
 * - /stylist/services - Manage services
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function StylistLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="services" />
    </Stack>
  );
}
