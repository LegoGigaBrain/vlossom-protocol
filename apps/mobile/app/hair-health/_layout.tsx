/**
 * Hair Health Layout (V6.8.0)
 *
 * Stack navigator for hair health screens
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function HairHealthLayout() {
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
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
