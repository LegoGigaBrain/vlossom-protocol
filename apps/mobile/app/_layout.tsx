/**
 * Vlossom Mobile Root Layout (V7.0.0)
 *
 * Provides:
 * - Theme provider
 * - Font loading
 * - Auth state initialization
 * - Navigation stack with auth routing
 * - Splash screen management
 * - Deep link validation
 * - Demo mode indicator banner
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/styles/theme';
import { colors, typography, spacing } from '../src/styles/tokens';
import { useAuthStore } from '../src/stores/auth';
import { useDemoModeStore, selectIsDemoMode, selectIsHydrated } from '../src/stores/demo-mode';
import { validateDeepLink } from '../src/utils/deep-link-validator';

// Google Fonts - bundled at build time
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Demo Mode Banner Component
 * Shows a subtle banner when demo mode is enabled
 * Tapping navigates to settings
 */
function DemoModeBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const isHydrated = useDemoModeStore(selectIsHydrated);

  // Don't show banner until hydrated or if demo mode is off
  if (!isHydrated || !isDemoMode) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={[
        styles.demoBanner,
        { paddingTop: insets.top > 0 ? insets.top + 4 : 8 },
      ]}
    >
      <Text style={styles.demoBannerText}>
        Demo Mode - Using Sample Data
      </Text>
      <Text style={styles.demoBannerTapHint}>Tap to disable</Text>
    </Pressable>
  );
}

/**
 * Auth Guard Component
 * Handles routing based on authentication state
 * V7.0.0 (M-11): Added deep link validation
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // V7.0.0 (M-11): Deep link validation handler
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const result = validateDeepLink(event.url);

      if (!result.isValid) {
        console.warn('[DeepLink] Blocked invalid deep link:', event.url, result.error);
        // Don't navigate for invalid links
        return;
      }

      // Link is valid, Expo Router will handle navigation
      console.log('[DeepLink] Validated:', result.path, result.params);
    };

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        const result = validateDeepLink(url);
        if (!result.isValid) {
          console.warn('[DeepLink] Initial URL blocked:', url, result.error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle auth routing
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and trying to access protected route
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screen, redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.rose} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // UI Font
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    // Editorial Font
    'PlayfairDisplay': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    // Mono Font (for wallet addresses, etc.)
    'SpaceMono': SpaceMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <DemoModeBanner />
          <AuthGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background.primary },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="booking/[id]"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="wallet"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="bookings" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
          </AuthGuard>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  demoBanner: {
    backgroundColor: colors.status.warning,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  demoBannerText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  demoBannerTapHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    opacity: 0.8,
  },
});
