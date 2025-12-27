/**
 * Stylist Routes Layout (V7.3.0)
 *
 * Stack navigator for stylist-specific routes:
 * - /stylist/dashboard - Main dashboard with earnings and requests
 * - /stylist/onboarding - Setup wizard
 * - /stylist/calendar - Stylist schedule
 * - /stylist/earnings - Detailed earnings view
 * - /stylist/services - Manage services
 * - /stylist/availability - Manage weekly availability (V7.3.0)
 * - /stylist/profile - Edit stylist profile (V7.3.0)
 * - /stylist/requests - Booking requests queue (V7.3.0)
 * - /stylist/session/[id] - Active session control (V7.3.0)
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
      <Stack.Screen name="availability" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="session/[id]" />
    </Stack>
  );
}
