/**
 * Property Owner Stack Layout (V6.5.2)
 *
 * Stack navigation for property owner dashboard screens
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function PropertyOwnerLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
        },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: {
          backgroundColor: colors.background.secondary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Property Dashboard',
          headerLargeTitle: true,
        }}
      />
      <Stack.Screen
        name="chairs"
        options={{
          title: 'Chairs',
        }}
      />
      <Stack.Screen
        name="requests"
        options={{
          title: 'Requests',
        }}
      />
      <Stack.Screen
        name="revenue"
        options={{
          title: 'Revenue',
        }}
      />
    </Stack>
  );
}
