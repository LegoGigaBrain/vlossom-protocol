/**
 * Reset Password Screen (V6.10.0)
 *
 * Password reset form with token from deep link or email.
 * Includes password validation and strength indicator.
 * Deep link: vlossom://reset-password?token=...
 *
 * V7.0.0: Added token format validation (H-6 security fix)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../src/styles/tokens';
import { resetPassword, validateResetToken } from '../../src/api/auth';
import {
  VlossomCheckIcon,
  VlossomBackIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import { INPUT_LIMITS } from '../../src/utils/input-validation';

/**
 * V7.0.0 (H-6): Validate reset token format
 * Token must be exactly 64 hex characters (32 bytes as hex)
 */
function isValidTokenFormat(token: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(token);
}

// Token validation states
type TokenValidationState = 'validating' | 'valid' | 'invalid' | 'expired';

// Password strength levels
type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(password: string): {
  level: PasswordStrengthLevel;
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { level: 'weak', score, label: 'Weak', color: colors.status.error };
  } else if (score <= 3) {
    return { level: 'fair', score, label: 'Fair', color: colors.status.warning };
  } else if (score <= 4) {
    return { level: 'good', score, label: 'Good', color: colors.status.success };
  } else {
    return { level: 'strong', score, label: 'Strong', color: colors.status.success };
  }
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // V7.0.0 (H-6): Token validation state
  const [tokenState, setTokenState] = useState<TokenValidationState>('validating');

  // V7.0.0 (H-6): Validate token format and server-side validity on mount
  useEffect(() => {
    async function validateToken() {
      // Check if token exists
      if (!token) {
        setTokenState('invalid');
        setError('Invalid reset link. Please request a new password reset.');
        return;
      }

      // V7.0.0 (H-6): Client-side format validation first
      if (!isValidTokenFormat(token)) {
        setTokenState('invalid');
        setError('Invalid reset link format. Please request a new password reset.');
        return;
      }

      // V7.0.0 (H-6): Server-side token validation
      try {
        const result = await validateResetToken(token);
        if (result.valid) {
          setTokenState('valid');
        } else if (result.expired) {
          setTokenState('expired');
          setError('This reset link has expired. Please request a new one.');
        } else {
          setTokenState('invalid');
          setError('Invalid reset link. Please request a new password reset.');
        }
      } catch (err) {
        // If server validation fails, still allow form if format is valid
        // The actual reset will fail with appropriate error
        setTokenState('valid');
      }
    }

    validateToken();
  }, [token]);

  // Password validation
  const passwordValidation = useMemo(() => {
    const issues: string[] = [];
    if (password.length < 8) issues.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) issues.push('One uppercase letter');
    if (!/[a-z]/.test(password)) issues.push('One lowercase letter');
    if (!/[0-9]/.test(password)) issues.push('One number');
    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [password]);

  const passwordStrength = useMemo(
    () => (password.length > 0 ? getPasswordStrength(password) : null),
    [password]
  );

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  // V7.0.0 (H-6): Form valid only if token validated successfully
  const isFormValid = passwordValidation.isValid && passwordsMatch && tokenState === 'valid';

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [password, token, isFormValid]);

  // Success state
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.stateContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <VlossomCheckIcon size={32} color={colors.status.success} />
          </View>

          {/* Message */}
          <Text style={styles.stateTitle}>Password reset successful</Text>
          <Text style={styles.stateMessage}>
            Your password has been updated. You can now log in with your new
            password.
          </Text>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Go to login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // V7.0.0 (H-6): Loading state while validating token
  if (tokenState === 'validating') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.stateContent}>
          <ActivityIndicator size="large" color={colors.brand.rose} />
          <Text style={[styles.stateMessage, { marginTop: spacing.lg }]}>
            Validating reset link...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // V7.0.0 (H-6): Invalid or expired token state
  if (tokenState === 'invalid' || tokenState === 'expired') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.stateContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Error Icon */}
          <View style={styles.errorIconContainer}>
            <VlossomCloseIcon size={32} color={colors.status.error} />
          </View>

          {/* Message */}
          <Text style={styles.stateTitle}>
            {tokenState === 'expired' ? 'Link expired' : 'Invalid or expired link'}
          </Text>
          <Text style={styles.stateMessage}>
            {tokenState === 'expired'
              ? 'This password reset link has expired. Please request a new one.'
              : 'This password reset link is invalid or has expired. Please request a new one.'}
          </Text>

          {/* Actions */}
          <View style={styles.stateActions}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/(auth)/forgot-password')}
            >
              <Text style={styles.buttonText}>Request new reset link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => router.replace('/(auth)/login')}
            >
              <VlossomBackIcon size={16} color={colors.text.secondary} />
              <Text style={styles.ghostButtonText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Form state
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
          <View style={styles.header}>
            <Text style={styles.logo}>Vlossom</Text>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Error Message */}
            {error && !error.includes('Invalid reset link') && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text.slice(0, INPUT_LIMITS.PASSWORD));
                    if (error) setError(null);
                  }}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="next"
                  editable={!isLoading}
                  maxLength={INPUT_LIMITS.PASSWORD}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Password Strength */}
              {passwordStrength && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              level <= Math.ceil(passwordStrength.score / 1.5)
                                ? passwordStrength.color
                                : colors.border.default,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              {/* Password Requirements */}
              {password.length > 0 && !passwordValidation.isValid && (
                <View style={styles.requirementsList}>
                  {passwordValidation.issues.map((issue, index) => (
                    <Text key={index} style={styles.requirementItem}>
                      • {issue}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm new password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text.slice(0, INPUT_LIMITS.PASSWORD));
                    if (error) setError(null);
                  }}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isLoading}
                  maxLength={INPUT_LIMITS.PASSWORD}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  {passwordsMatch ? (
                    <>
                      <VlossomCheckIcon size={14} color={colors.status.success} />
                      <Text style={[styles.matchText, { color: colors.status.success }]}>
                        Passwords match
                      </Text>
                    </>
                  ) : (
                    <>
                      <VlossomCloseIcon size={14} color={colors.status.error} />
                      <Text style={[styles.matchText, { color: colors.status.error }]}>
                        Passwords don't match
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Reset password</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.replace('/(auth)/login')}
            >
              <VlossomBackIcon size={16} color={colors.brand.rose} />
              <Text style={styles.backLinkText}>Back to login</Text>
            </TouchableOpacity>
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    width: 48,
    textAlign: 'right',
  },
  requirementsList: {
    marginTop: spacing.xs,
  },
  requirementItem: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  matchText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.brand.rose,
  },
  // State screens (success/error)
  stateContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stateTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  stateMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  stateActions: {
    width: '100%',
    gap: spacing.md,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  ghostButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
