/**
 * Signup Screen (V8.0.0)
 *
 * Create account with email, password, and role selection.
 * Uses Vlossom design tokens and botanical iconography.
 *
 * V7.0.0 (M-4): Added input length limits for security
 * V8.0.0: Password complexity validation (uppercase, lowercase, number)
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
import { INPUT_LIMITS, validatePassword } from '../../src/utils/input-validation';
import { VlossomWordmark } from '../../src/components/branding';

type RoleType = 'CUSTOMER' | 'STYLIST';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, signupLoading, signupError, clearErrors } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RoleType>('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignup = async () => {
    setLocalError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // V8.0.0: Password complexity validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setLocalError(`Password needs: ${passwordValidation.issues.join(', ')}`);
      return;
    }

    const success = await signup({
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName.trim() || undefined,
      role,
    });

    if (success) {
      router.replace('/(tabs)');
    }
  };

  // V8.0.0: Form valid only when password meets complexity requirements
  const isFormValid =
    email.trim().length > 0 &&
    validatePassword(password).isValid &&
    password === confirmPassword;

  const displayError = localError || signupError;

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
            <VlossomWordmark height={32} variant="purple" style={styles.logo} />
            <Text style={styles.title} accessibilityRole="header">Create your account</Text>
            <Text style={styles.subtitle}>
              Join the community and start your journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Role Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.label} nativeID="roleLabel">I want to</Text>
              <View style={styles.roleContainer} accessibilityRole="radiogroup" accessibilityLabelledBy="roleLabel">
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'CUSTOMER' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('CUSTOMER')}
                  disabled={signupLoading}
                  accessibilityRole="radio"
                  accessibilityLabel="Book Stylists, Find and book hair services"
                  accessibilityState={{ checked: role === 'CUSTOMER', disabled: signupLoading }}
                  accessibilityHint="Double tap to select customer account type"
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'CUSTOMER' && styles.roleButtonTextActive,
                    ]}
                  >
                    Book Stylists
                  </Text>
                  <Text style={styles.roleDescription}>
                    Find and book hair services
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'STYLIST' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('STYLIST')}
                  disabled={signupLoading}
                  accessibilityRole="radio"
                  accessibilityLabel="Offer Services, Get booked as a stylist"
                  accessibilityState={{ checked: role === 'STYLIST', disabled: signupLoading }}
                  accessibilityHint="Double tap to select stylist account type"
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'STYLIST' && styles.roleButtonTextActive,
                    ]}
                  >
                    Offer Services
                  </Text>
                  <Text style={styles.roleDescription}>
                    Get booked as a stylist
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Display Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label} nativeID="displayNameLabel">Display Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(text) => setDisplayName(text.slice(0, INPUT_LIMITS.DISPLAY_NAME))}
                placeholder="How should we call you?"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                editable={!signupLoading}
                maxLength={INPUT_LIMITS.DISPLAY_NAME}
                accessibilityLabel="Display name, optional"
                accessibilityLabelledBy="displayNameLabel"
                accessibilityHint="Enter the name you want others to see"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label} nativeID="emailLabel">Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text.slice(0, INPUT_LIMITS.EMAIL));
                  if (displayError) {
                    setLocalError(null);
                    clearErrors();
                  }
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
                editable={!signupLoading}
                maxLength={INPUT_LIMITS.EMAIL}
                accessibilityLabel="Email address"
                accessibilityLabelledBy="emailLabel"
                accessibilityHint="Enter your email address for your account"
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
                    if (displayError) {
                      setLocalError(null);
                      clearErrors();
                    }
                  }}
                  placeholder="8+ chars, uppercase, lowercase, number"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  returnKeyType="next"
                  editable={!signupLoading}
                  maxLength={INPUT_LIMITS.PASSWORD}
                  accessibilityLabel="Password"
                  accessibilityLabelledBy="passwordLabel"
                  accessibilityHint="Create a password with at least 8 characters, one uppercase, one lowercase, and one number"
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label} nativeID="confirmPasswordLabel">Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text.slice(0, INPUT_LIMITS.PASSWORD));
                  if (displayError) {
                    setLocalError(null);
                    clearErrors();
                  }
                }}
                placeholder="Enter password again"
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                editable={!signupLoading}
                maxLength={INPUT_LIMITS.PASSWORD}
                accessibilityLabel="Confirm password"
                accessibilityLabelledBy="confirmPasswordLabel"
                accessibilityHint="Re-enter your password to confirm"
              />
            </View>

            {/* Error Message */}
            {displayError && (
              <View
                style={styles.errorContainer}
                accessible
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || signupLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!isFormValid || signupLoading}
              accessibilityRole="button"
              accessibilityLabel={signupLoading ? 'Creating account' : 'Create Account'}
              accessibilityState={{ disabled: !isFormValid || signupLoading }}
              accessibilityHint="Double tap to create your account"
            >
              {signupLoading ? (
                <ActivityIndicator color="#FFFFFF" accessibilityLabel="Creating account, please wait" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText} accessibilityRole="text">
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink} accessibilityRole="link">Terms of Service</Text> and{' '}
              <Text style={styles.termsLink} accessibilityRole="link">Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Link href="/(auth)/login" asChild>
                <Text
                  style={styles.footerLink}
                  accessibilityRole="link"
                  accessibilityLabel="Sign in"
                  accessibilityHint="Double tap to go to the sign in screen"
                >
                  Sign in
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
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
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.brand.rose,
    backgroundColor: colors.brand.roseLight,
  },
  roleButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  roleButtonTextActive: {
    color: colors.brand.rose,
  },
  roleDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
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
  termsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.brand.rose,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
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
