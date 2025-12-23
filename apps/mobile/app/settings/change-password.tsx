/**
 * Change Password Screen (V7.2.0)
 *
 * Allow users to change their password:
 * - Current password
 * - New password
 * - Confirm new password
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomBackIcon } from '../../src/components/icons/VlossomIcons';
import { TextInput, Button } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();

  const { changePassword, changePasswordLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.newPassword.length > 128) {
      newErrors.newPassword = 'Password must be less than 128 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must include uppercase, lowercase, and a number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword && formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to change password. Please try again.'
      );
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Text style={{ fontSize: 16 }}>{visible ? '👁️' : '👁️‍🗨️'}</Text>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing.sm,
              paddingHorizontal: spacing.lg,
              borderBottomColor: colors.border.default,
            },
          ]}
        >
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to settings"
          >
            <VlossomBackIcon size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={[textStyles.h3, { color: colors.text.primary }]}
            accessibilityRole="header"
          >
            Change Password
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info */}
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel="Password requirements: Your password must be at least 8 characters and include uppercase, lowercase, and a number."
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.primary + '10',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
              Your password must be at least 8 characters and include uppercase,
              lowercase, and a number.
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: spacing.xl }}>
            <TextInput
              label="Current Password"
              placeholder="Enter your current password"
              value={formData.currentPassword}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, currentPassword: text }))
              }
              error={errors.currentPassword}
              secureTextEntry={!showPasswords.current}
              rightIcon={<EyeIcon visible={showPasswords.current} />}
              onRightIconPress={() =>
                setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
              }
              autoCapitalize="none"
            />

            <TextInput
              label="New Password"
              placeholder="Enter your new password"
              value={formData.newPassword}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, newPassword: text }))
              }
              error={errors.newPassword}
              secureTextEntry={!showPasswords.new}
              rightIcon={<EyeIcon visible={showPasswords.new} />}
              onRightIconPress={() =>
                setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
              }
              autoCapitalize="none"
            />

            <TextInput
              label="Confirm New Password"
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, confirmPassword: text }))
              }
              error={errors.confirmPassword}
              secureTextEntry={!showPasswords.confirm}
              rightIcon={<EyeIcon visible={showPasswords.confirm} />}
              onRightIconPress={() =>
                setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
              }
              autoCapitalize="none"
            />
          </View>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <View
              style={{ marginTop: spacing.md }}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Password strength: ${getStrengthLabel(formData.newPassword)}`}
              accessibilityValue={{
                min: 0,
                max: 100,
                now: getStrengthPercentage(formData.newPassword),
              }}
              accessibilityLiveRegion="polite"
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: colors.text.secondary, marginBottom: spacing.xs },
                ]}
              >
                Password Strength
              </Text>
              <View style={styles.strengthBar} aria-hidden>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      backgroundColor: getStrengthColor(formData.newPassword, colors),
                      width: `${getStrengthPercentage(formData.newPassword)}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  textStyles.caption,
                  {
                    color: getStrengthColor(formData.newPassword, colors),
                    marginTop: spacing.xs,
                  },
                ]}
                aria-hidden
              >
                {getStrengthLabel(formData.newPassword)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.lg,
              paddingBottom: insets.bottom + spacing.md,
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.default,
            },
          ]}
        >
          <Button
            title="Update Password"
            variant="primary"
            fullWidth
            onPress={handleSave}
            loading={changePasswordLoading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Password strength helpers
function getStrengthPercentage(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z\d]/.test(password)) score += 15;
  return Math.min(score, 100);
}

function getStrengthLabel(password: string): string {
  const percentage = getStrengthPercentage(password);
  if (percentage < 40) return 'Weak';
  if (percentage < 70) return 'Fair';
  if (percentage < 90) return 'Good';
  return 'Strong';
}

function getStrengthColor(password: string, colors: any): string {
  const percentage = getStrengthPercentage(password);
  if (percentage < 40) return colors.status.error;
  if (percentage < 70) return colors.status.warning;
  return colors.status.success;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoBox: {},
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
