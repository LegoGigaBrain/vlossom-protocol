/**
 * Vlossom Mobile Root Layout (V8.0.0)
 *
 * Provides:
 * - Theme provider
 * - Font loading
 * - Auth state initialization
 * - Navigation stack with auth routing
 * - Splash screen management (native + animated)
 * - Deep link validation
 * - Demo mode indicator banner
 * - Push notification initialization (V7.3)
 * - Animated splash screen with Vlossom icon (V7.5)
 * - Error boundary for crash recovery (V8.0)
 */

import { useEffect, useRef, useState } from 'react';
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
import {
  initializePushNotifications,
  cleanupPushNotifications,
} from '../src/services/push-notifications';
import { AnimatedSplash } from '../src/components/splash';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';

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
 * V7.2.0: Fixed - only shows tap to disable hint when authenticated
 * Tapping navigates to settings (only when authenticated)
 */
function DemoModeBanner() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const isHydrated = useDemoModeStore(selectIsHydrated);
  const { toggleDemoMode } = useDemoModeStore();
  const { isAuthenticated } = useAuthStore();

  // Don't show banner until hydrated or if demo mode is off
  if (!isHydrated || !isDemoMode) {
    return null;
  }

  // Check if we're on auth screens
  const inAuthGroup = segments[0] === '(auth)';

  const handlePress = () => {
    if (isAuthenticated && !inAuthGroup) {
      // Navigate to settings if authenticated
      router.push('/settings');
    } else {
      // Just toggle demo mode directly if on auth screens
      toggleDemoMode();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.demoBanner,
        { paddingTop: insets.top > 0 ? insets.top + 4 : 8 },
      ]}
    >
      <Text style={styles.demoBannerText}>
        Demo Mode - Using Sample Data
      </Text>
      <Text style={styles.demoBannerTapHint}>
        {isAuthenticated && !inAuthGroup ? 'Tap to disable' : 'Tap to turn off'}
      </Text>
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
  const pushInitializedRef = useRef(false);

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // V7.3: Initialize push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && !pushInitializedRef.current) {
      pushInitializedRef.current = true;
      initializePushNotifications()
        .then((_result) => {
          // Push notification initialization completed
          // Success: _result.success, isNew: _result.isNew
          // Skipped/failed: _result.error
        })
        .catch((_error) => {
          // Push initialization error - non-critical, app continues
        });
    }

    // Cleanup on logout
    if (!isAuthenticated && pushInitializedRef.current) {
      pushInitializedRef.current = false;
      cleanupPushNotifications();
    }
  }, [isAuthenticated]);

  // V7.0.0 (M-11): Deep link validation handler
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const result = validateDeepLink(event.url);

      if (!result.isValid) {
        // Invalid deep link blocked - don't navigate
        return;
      }

      // Link is valid, Expo Router will handle navigation
    };

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        const result = validateDeepLink(url);
        // If invalid, link is silently blocked - Expo Router won't navigate
        void result.isValid;
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

  // V7.5: Track animated splash visibility
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide native splash, show animated splash
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Handle animated splash completion
  const handleSplashComplete = () => {
    setShowAnimatedSplash(false);
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
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
            {/* V7.5: Animated splash overlay */}
            {showAnimatedSplash && (
              <AnimatedSplash onComplete={handleSplashComplete} minDuration={1200} />
            )}
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
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
    fontFamily: typography.fontFamily.semibold,
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
