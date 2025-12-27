/**
 * Bookings Layout (V7.0.0)
 *
 * Stack navigator for booking routes.
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function BookingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
