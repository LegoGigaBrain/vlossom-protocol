/**
 * Auth Stack Layout (V6.8.0)
 *
 * Stack navigator for authentication screens.
 * Includes login, signup screens.
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/styles/theme';

export default function AuthLayout() {
  const { colors, typography } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Log In',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
        }}
      />
    </Stack>
  );
}
