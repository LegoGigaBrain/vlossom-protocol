/**
 * Login Screen (V6.8.0)
 *
 * Email/password login with error handling.
 * Uses Vlossom design tokens and botanical iconography.
 *
 * V7.0.0 (M-4): Added input length limits for security
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../src/styles/tokens';
import { useAuthStore } from '../../src/stores/auth';
import { INPUT_LIMITS } from '../../src/utils/input-validation';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginLoading, loginError, clearErrors } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    const success = await login({
      email: email.trim().toLowerCase(),
      password,
    });

    if (success) {
      router.replace('/(tabs)');
    }
  };

  const isFormValid = email.trim().length > 0 && password.length >= 8;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header} accessible accessibilityRole="header">
            <Text style={styles.logo}>Vlossom</Text>
            <Text style={styles.title} accessibilityRole="header">Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your hair journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label} nativeID="emailLabel">Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text.slice(0, INPUT_LIMITS.EMAIL));
                  if (loginError) clearErrors();
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loginLoading}
                maxLength={INPUT_LIMITS.EMAIL}
                accessibilityLabel="Email address"
                accessibilityLabelledBy="emailLabel"
                accessibilityHint="Enter your email address to sign in"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label} nativeID="passwordLabel">Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text.slice(0, INPUT_LIMITS.PASSWORD));
                    if (loginError) clearErrors();
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!loginLoading}
                  maxLength={INPUT_LIMITS.PASSWORD}
                  accessibilityLabel="Password"
                  accessibilityLabelledBy="passwordLabel"
                  accessibilityHint="Enter your password, minimum 8 characters"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityHint="Double tap to toggle password visibility"
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {loginError && (
              <View
                style={styles.errorContainer}
                accessible
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || loginLoading) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!isFormValid || loginLoading}
              accessibilityRole="button"
              accessibilityLabel={loginLoading ? 'Signing in' : 'Sign in'}
              accessibilityState={{ disabled: !isFormValid || loginLoading }}
              accessibilityHint="Double tap to sign in to your account"
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFFFFF" accessibilityLabel="Loading" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity
                style={styles.forgotPassword}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
                accessibilityHint="Double tap to reset your password"
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Link href="/(auth)/signup" asChild>
                <Text
                  style={styles.footerLink}
                  accessibilityRole="link"
                  accessibilityLabel="Sign up"
                  accessibilityHint="Double tap to create a new account"
                >
                  Sign up
                </Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontFamily: typography.fontFamily.display,
    fontSize: 32,
    color: colors.brand.rose,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  passwordInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  showPasswordButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  showPasswordText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.brand.rose,
  },
  errorContainer: {
    backgroundColor: colors.status.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.status.error,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.brand.rose,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.text.muted,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.brand.rose,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  footerLink: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.brand.rose,
  },
});
