/**
 * Messages Stack Layout (V6.7.0)
 *
 * Navigation stack for messaging screens.
 */

import { Stack } from 'expo-router';
import { colors } from '../../src/styles/tokens';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 17,
        },
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Messages',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Conversation',
          headerBackTitle: 'Messages',
        }}
      />
    </Stack>
  );
}
