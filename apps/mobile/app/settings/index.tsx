/**
 * Settings Screen (V7.2.0)
 *
 * App settings with sections:
 * - Account: Edit Profile, Change Password
 * - Partner Programs: Become a Stylist, List a Property (V7.1)
 * - Preferences: Currency, Theme, Demo Mode
 * - Notifications: Toggle by type
 * - Security: Biometric Login
 * - Support: Help Center, Contact Us
 * - About: Version, Terms, Privacy
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomSettingsIcon,
  VlossomProfileIcon,
  VlossomNotificationsIcon,
  VlossomWalletIcon,
  VlossomHomeIcon,
  VlossomCalendarIcon,
} from '../../src/components/icons/VlossomIcons';
import { VlossomWordmark } from '../../src/components/branding';
import {
  useAuthStore,
  selectUser,
  selectUserRoles,
  selectAddRoleLoading,
  useDemoModeStore,
  selectIsDemoMode,
} from '../../src/stores';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const user = useAuthStore(selectUser);
  const userRoles = useAuthStore(selectUserRoles);
  const addRoleLoading = useAuthStore(selectAddRoleLoading);
  const { logout, addRole } = useAuthStore();
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const { toggleDemoMode } = useDemoModeStore();

  // Check current roles
  const isStylist = userRoles.includes('STYLIST');
  const isPropertyOwner = userRoles.includes('PROPERTY_OWNER');

  // Local state for toggles
  const [notifications, setNotifications] = useState({
    bookings: true,
    messages: true,
    promotions: false,
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleEditProfile = () => {
    router.push('/settings/edit-profile');
  };

  const handleChangePassword = () => {
    router.push('/settings/change-password');
  };

  const handleBecomeStylist = async () => {
    Alert.alert(
      'Become a Stylist',
      'Join Vlossom as a professional stylist to offer your services to clients.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Started',
          onPress: async () => {
            const success = await addRole('STYLIST');
            if (success) {
              Alert.alert(
                'Welcome, Stylist!',
                'Your stylist role has been added. Set up your profile to start receiving bookings.',
                [
                  {
                    text: 'Set Up Profile',
                    onPress: () => router.push('/stylist/onboarding'),
                  },
                  { text: 'Later', style: 'cancel' },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const handleBecomePropertyOwner = async () => {
    Alert.alert(
      'List Your Space',
      'List your salon or beauty space on Vlossom to rent chairs to stylists.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Started',
          onPress: async () => {
            const success = await addRole('PROPERTY_OWNER');
            if (success) {
              Alert.alert(
                'Welcome, Property Owner!',
                'Your property owner role has been added. Add your first property to start receiving rental requests.',
                [
                  {
                    text: 'Add Property',
                    onPress: () => router.push('/property-owner/add-property'),
                  },
                  { text: 'Later', style: 'cancel' },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const handleCurrency = () => {
    Alert.alert(
      'Currency',
      'Select your preferred display currency',
      [
        { text: 'ZAR (R)', onPress: () => {} },
        { text: 'USD ($)', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTheme = () => {
    Alert.alert(
      'Theme',
      'Select your preferred theme',
      [
        { text: 'System', onPress: () => {} },
        { text: 'Light', onPress: () => {} },
        { text: 'Dark', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleHelpCenter = () => {
    Linking.openURL('https://vlossom.io/help');
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:support@vlossom.io');
  };

  const handleTerms = () => {
    Linking.openURL('https://vlossom.io/terms');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://vlossom.io/privacy');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '7.0.0';

  return (
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
          accessibilityHint="Returns to the previous screen"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <VlossomWordmark height={24} variant="auto" accessibilityRole="header" />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Account
          </Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <SettingsRow
              icon={<VlossomProfileIcon size={20} color={colors.text.tertiary} />}
              title="Edit Profile"
              onPress={handleEditProfile}
              colors={colors}
              spacing={spacing}
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              icon={<VlossomSettingsIcon size={20} color={colors.text.tertiary} />}
              title="Change Password"
              onPress={handleChangePassword}
              colors={colors}
              spacing={spacing}
            />
          </View>
        </View>

        {/* Partner Programs Section (V7.1) */}
        {(!isStylist || !isPropertyOwner) && (
          <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
            <Text
              style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
              accessibilityRole="header"
            >
              Partner Programs
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.background.primary,
                  borderRadius: borderRadius.lg,
                  ...shadows.card,
                },
              ]}
            >
              {!isStylist && (
                <>
                  <SettingsRow
                    icon={<VlossomCalendarIcon size={20} color={colors.primary} />}
                    title="Become a Stylist"
                    subtitle="Offer your services on Vlossom"
                    onPress={handleBecomeStylist}
                    rightElement={
                      addRoleLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Loading" />
                      ) : undefined
                    }
                    colors={colors}
                    spacing={spacing}
                    accessibilityHint="Double tap to start the stylist registration process"
                  />
                  {!isPropertyOwner && (
                    <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
                  )}
                </>
              )}
              {!isPropertyOwner && (
                <SettingsRow
                  icon={<VlossomHomeIcon size={20} color={colors.primary} />}
                  title="List Your Space"
                  subtitle="Rent chairs to stylists at your salon"
                  onPress={handleBecomePropertyOwner}
                  rightElement={
                    addRoleLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Loading" />
                    ) : undefined
                  }
                  colors={colors}
                  spacing={spacing}
                  accessibilityHint="Double tap to start listing your property"
                />
              )}
            </View>
            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel="You can have multiple roles. Your customer account remains active."
              style={[
                styles.partnerNote,
                {
                  backgroundColor: colors.primary + '10',
                  borderRadius: borderRadius.md,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                You can have multiple roles. Your customer account remains active.
              </Text>
            </View>
          </View>
        )}

        {/* Preferences Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Preferences
          </Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <SettingsRow
              icon={<VlossomWalletIcon size={20} color={colors.text.tertiary} />}
              title="Currency"
              subtitle="ZAR (R)"
              onPress={handleCurrency}
              colors={colors}
              spacing={spacing}
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Theme"
              subtitle="System"
              onPress={handleTheme}
              colors={colors}
              spacing={spacing}
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Demo Mode"
              subtitle="Use sample data for testing"
              rightElement={
                <Switch
                  value={isDemoMode}
                  onValueChange={toggleDemoMode}
                  trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                  thumbColor={isDemoMode ? colors.primary : colors.text.muted}
                />
              }
              colors={colors}
              spacing={spacing}
            />
          </View>
          {isDemoMode && (
            <View
              accessible
              accessibilityRole="alert"
              accessibilityLabel="Demo mode is enabled. You'll see sample data instead of real API data."
              accessibilityLiveRegion="polite"
              style={[
                styles.demoModeNote,
                {
                  backgroundColor: colors.status.warning + '20',
                  borderRadius: borderRadius.md,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text style={[textStyles.bodySmall, { color: colors.status.warning }]}>
                Demo mode is enabled. You'll see sample data instead of real API data.
              </Text>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Notifications
          </Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <SettingsRow
              icon={<VlossomNotificationsIcon size={20} color={colors.text.tertiary} />}
              title="Booking Updates"
              subtitle="Get notified about your appointments"
              rightElement={
                <Switch
                  value={notifications.bookings}
                  onValueChange={(value) => setNotifications({ ...notifications, bookings: value })}
                  trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                  thumbColor={notifications.bookings ? colors.primary : colors.text.muted}
                />
              }
              colors={colors}
              spacing={spacing}
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Messages"
              subtitle="Get notified about new messages"
              rightElement={
                <Switch
                  value={notifications.messages}
                  onValueChange={(value) => setNotifications({ ...notifications, messages: value })}
                  trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                  thumbColor={notifications.messages ? colors.primary : colors.text.muted}
                />
              }
              colors={colors}
              spacing={spacing}
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Promotions"
              subtitle="Receive special offers and updates"
              rightElement={
                <Switch
                  value={notifications.promotions}
                  onValueChange={(value) => setNotifications({ ...notifications, promotions: value })}
                  trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                  thumbColor={notifications.promotions ? colors.primary : colors.text.muted}
                />
              }
              colors={colors}
              spacing={spacing}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Security
          </Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <SettingsRow
              title="Biometric Login"
              subtitle="Use Face ID or fingerprint to sign in"
              rightElement={
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: colors.border.default, true: colors.primary + '60' }}
                  thumbColor={biometricEnabled ? colors.primary : colors.text.muted}
                />
              }
              colors={colors}
              spacing={spacing}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            Support
          </Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <SettingsRow
              title="Help Center"
              onPress={handleHelpCenter}
              colors={colors}
              spacing={spacing}
              accessibilityHint="Opens the help center in your browser"
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Contact Us"
              onPress={handleContactUs}
              colors={colors}
              spacing={spacing}
              accessibilityHint="Opens your email app to contact support"
            />
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.md }]}
            accessibilityRole="header"
          >
            About
          </Text>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <SettingsRow
              title="Version"
              subtitle={appVersion}
              colors={colors}
              spacing={spacing}
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Terms of Service"
              onPress={handleTerms}
              colors={colors}
              spacing={spacing}
              accessibilityHint="Opens terms of service in your browser"
            />
            <View style={[styles.rowDivider, { backgroundColor: colors.border.default }]} />
            <SettingsRow
              title="Privacy Policy"
              onPress={handlePrivacy}
              colors={colors}
              spacing={spacing}
              accessibilityHint="Opens privacy policy in your browser"
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Pressable
            onPress={handleLogout}
            style={[
              styles.signOutButton,
              {
                backgroundColor: colors.status.error + '10',
                borderRadius: borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
            accessibilityHint="Double tap to sign out of your account"
          >
            <Text style={[textStyles.body, { color: colors.status.error, fontWeight: '600' }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// Settings Row Component
interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  accessibilityHint?: string;
}

function SettingsRow({ icon, title, subtitle, rightElement, onPress, colors, spacing, accessibilityHint }: SettingsRowProps) {
  // Determine if this row has a switch (for accessibility state)
  const hasSwitch = rightElement && React.isValidElement(rightElement) && rightElement.type === Switch;
  const switchValue = hasSwitch ? (rightElement as React.ReactElement<{ value: boolean }>).props.value : undefined;

  // Build accessibility label
  const accessibilityLabel = subtitle ? `${title}, ${subtitle}` : title;

  const content = (
    <View style={[styles.settingsRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      {icon && <View style={styles.rowIcon} aria-hidden>{icon}</View>}
      <View style={[styles.rowContent, icon ? { marginLeft: spacing.md } : {}]}>
        <Text style={[textStyles.body, { color: colors.text.primary }]}>{title}</Text>
        {subtitle && (
          <Text style={[textStyles.caption, { color: colors.text.tertiary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onPress && (
          <VlossomBackIcon
            size={16}
            color={colors.text.muted}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        )
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint || `Double tap to ${title.toLowerCase()}`}
      >
        {content}
      </Pressable>
    );
  }

  // Non-pressable rows (with switches or static info)
  if (hasSwitch) {
    return (
      <View
        accessible
        accessibilityRole="switch"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ checked: switchValue }}
        accessibilityHint={accessibilityHint || `Double tap to ${switchValue ? 'disable' : 'enable'}`}
      >
        {content}
      </View>
    );
  }

  // Static info row (like Version)
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </View>
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
  section: {
    marginTop: 24,
  },
  sectionCard: {},
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowDivider: {
    height: 1,
    marginLeft: 56,
  },
  demoModeNote: {
    padding: 12,
  },
  partnerNote: {
    padding: 12,
  },
  signOutButton: {
    padding: 16,
    alignItems: 'center',
  },
});
