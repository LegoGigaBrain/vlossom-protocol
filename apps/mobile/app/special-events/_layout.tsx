/**
 * Special Events Layout (V6.6.0)
 *
 * Stack navigation for special event booking flow
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function SpecialEventsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background.secondary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Special Events',
          headerBackTitle: 'Home',
        }}
      />
      <Stack.Screen
        name="request"
        options={{
          title: 'Request Quote',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
