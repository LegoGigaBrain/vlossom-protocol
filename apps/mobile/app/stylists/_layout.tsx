/**
 * Stylists Layout (V6.8.0)
 *
 * Stack navigator for stylist detail and booking screens
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function StylistsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/book" />
    </Stack>
  );
}
