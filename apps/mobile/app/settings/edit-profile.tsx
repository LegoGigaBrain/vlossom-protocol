/**
 * Edit Profile Screen (V7.2.0)
 *
 * Allow users to edit their profile information:
 * - Display name
 * - Email
 * - Phone number
 * - Avatar (placeholder for now)
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomBackIcon, VlossomProfileIcon } from '../../src/components/icons/VlossomIcons';
import { TextInput, Button } from '../../src/components/ui';
import { useAuthStore, selectUser } from '../../src/stores';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius } = useTheme();

  const user = useAuthStore(selectUser);
  const { updateProfile, updateProfileLoading, updateProfileError } = useAuthStore();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleBack = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (formData.displayName.length > 100) {
      newErrors.displayName = 'Display name must be less than 100 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateProfile({
        displayName: formData.displayName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', updateProfileError || 'Failed to update profile. Please try again.');
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'Change Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => {} },
        { text: 'Choose from Library', onPress: () => {} },
        { text: 'Remove Photo', style: 'destructive', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const initial = formData.displayName.charAt(0).toUpperCase() || '?';

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
            Edit Profile
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
          {/* Avatar Section */}
          <View style={[styles.avatarSection, { marginTop: spacing.xl }]}>
            <Pressable
              onPress={handleChangeAvatar}
              accessibilityRole="button"
              accessibilityLabel={user?.avatarUrl ? 'Profile photo' : `Profile photo showing initial ${initial}`}
              accessibilityHint="Double tap to change your profile photo"
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={[
                    styles.avatar,
                    { borderRadius: borderRadius.circle },
                  ]}
                  accessibilityRole="image"
                  accessibilityLabel="Your profile photo"
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.circle,
                    },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.white }]} aria-hidden>
                    {initial}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.editBadge,
                  {
                    backgroundColor: colors.background.primary,
                    borderRadius: borderRadius.circle,
                    borderColor: colors.border.default,
                  },
                ]}
                aria-hidden
              >
                <VlossomProfileIcon size={16} color={colors.primary} />
              </View>
            </Pressable>
            <Text
              style={[
                textStyles.bodySmall,
                { color: colors.primary, marginTop: spacing.sm },
              ]}
              aria-hidden
            >
              Change Photo
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: spacing.xl }}>
            <TextInput
              label="Display Name"
              placeholder="Your name"
              value={formData.displayName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, displayName: text }))
              }
              error={errors.displayName}
              autoCapitalize="words"
            />

            <TextInput
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, email: text }))
              }
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Phone Number"
              placeholder="+27 123 456 7890"
              value={formData.phone}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, phone: text }))
              }
              error={errors.phone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Wallet Address (read-only) */}
          {user?.walletAddress && (
            <View
              style={{ marginTop: spacing.lg }}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Wallet Address: ${user.walletAddress.slice(0, 10)}...${user.walletAddress.slice(-8)}. This cannot be changed.`}
            >
              <Text
                style={[
                  textStyles.label,
                  { color: colors.text.primary, marginBottom: spacing.xs },
                ]}
              >
                Wallet Address
              </Text>
              <View
                style={[
                  styles.readOnlyField,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[textStyles.bodySmall, { color: colors.text.muted }]}
                  numberOfLines={1}
                >
                  {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                </Text>
              </View>
              <Text
                style={[
                  textStyles.caption,
                  { color: colors.text.muted, marginTop: spacing.xs },
                ]}
              >
                Your wallet address cannot be changed
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
            title="Save Changes"
            variant="primary"
            fullWidth
            onPress={handleSave}
            loading={updateProfileLoading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
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
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  readOnlyField: {},
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
