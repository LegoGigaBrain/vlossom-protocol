/**
 * Active Session Routes Layout (V7.3.0)
 *
 * Stack navigator for active session routes:
 * - /bookings/active/[id] - Customer view of active session
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../../src/styles/theme';

export default function ActiveSessionLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
