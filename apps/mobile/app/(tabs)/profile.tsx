/**
 * Profile Tab - Identity + Dashboards (V6.8.0)
 *
 * Purpose: User identity, hair health, schedule, role-based dashboards
 * Dynamic tabs based on user roles
 * Connected to auth store for real user data
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomSettingsIcon,
  VlossomHealthyIcon,
  VlossomCalendarIcon,
  VlossomFavoriteIcon,
} from '../../src/components/icons/VlossomIcons';
import { useState } from 'react';
import { useAuthStore } from '../../src/stores/auth';

type ProfileTab = 'overview' | 'stylist' | 'salon';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const { user, logout, logoutLoading } = useAuthStore();

  // Get user roles from auth store
  const userRole = user?.role || 'CUSTOMER';
  const userRoles = [userRole];

  const tabs = [
    { id: 'overview' as ProfileTab, label: 'Overview' },
    ...(userRoles.includes('STYLIST') ? [{ id: 'stylist' as ProfileTab, label: 'Stylist' }] : []),
    ...(userRoles.includes('PROPERTY_OWNER') ? [{ id: 'salon' as ProfileTab, label: 'Properties' }] : []),
  ];

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
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    // Navigate to settings
    // TODO: Implement settings screen
  };

  // Get display name and initial
  const displayName = user?.displayName || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const email = user?.email || '';
  const username = email ? `@${email.split('@')[0]}` : '';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header gradient */}
      <View
        style={[
          styles.headerGradient,
          {
            backgroundColor: colors.surface.light,
            paddingTop: insets.top + spacing.lg,
          },
        ]}
      >
        {/* Settings button */}
        <View style={styles.headerActions}>
          <Pressable onPress={handleSettings}>
            <VlossomSettingsIcon size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={[
                styles.avatarImage,
                { borderRadius: borderRadius.circle },
              ]}
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
              <Text style={[styles.avatarText, { color: colors.white }]}>{initial}</Text>
            </View>
          )}
          <Text style={[textStyles.h2, { color: colors.text.primary, marginTop: spacing.md }]}>
            {displayName}
          </Text>
          {username && (
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>{username}</Text>
          )}

          {/* Role badge */}
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: colors.primary + '15',
                borderRadius: borderRadius.pill,
                marginTop: spacing.sm,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: colors.primary }]}>
              {userRole === 'STYLIST' ? 'Stylist' : userRole === 'PROPERTY_OWNER' ? 'Property Owner' : 'Customer'}
            </Text>
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { marginTop: spacing.lg }]}>
            <View style={styles.statItem}>
              <Text style={[textStyles.h3, { color: colors.text.primary }]}>0</Text>
              <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[textStyles.h3, { color: colors.text.primary }]}>0</Text>
              <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Bookings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[textStyles.h3, { color: colors.text.primary }]}>0</Text>
              <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Reviews</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Role tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border.default }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              {
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                textStyles.bodySmall,
                {
                  color: activeTab === tab.id ? colors.primary : colors.text.secondary,
                  fontWeight: activeTab === tab.id ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ padding: spacing.lg }}>
        {activeTab === 'overview' && (
          <OverviewTab
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
            onLogout={handleLogout}
            logoutLoading={logoutLoading}
          />
        )}
        {activeTab === 'stylist' && (
          <Text style={[textStyles.body, { color: colors.text.secondary }]}>Stylist Dashboard</Text>
        )}
        {activeTab === 'salon' && (
          <Text style={[textStyles.body, { color: colors.text.secondary }]}>Properties Dashboard</Text>
        )}
      </View>
    </ScrollView>
  );
}

interface OverviewTabProps {
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
  onLogout: () => void;
  logoutLoading: boolean;
}

function OverviewTab({ colors, spacing, borderRadius, shadows, onLogout, logoutLoading }: OverviewTabProps) {
  return (
    <View>
      {/* Hair Health Card */}
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.lg,
            ...shadows.card,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <VlossomHealthyIcon size={24} color={colors.primary} />
          <Text style={[textStyles.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
            Hair Health
          </Text>
        </View>
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
          Set up your hair profile to get personalized recommendations
        </Text>
        <Pressable
          style={[
            styles.cardAction,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Text style={[textStyles.button, { color: colors.white }]}>Get Started</Text>
        </Pressable>
      </Pressable>

      {/* Schedule Card */}
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.lg,
            ...shadows.card,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <VlossomCalendarIcon size={24} color={colors.primary} />
          <Text style={[textStyles.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
            Upcoming
          </Text>
        </View>
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
          No upcoming appointments
        </Text>
      </Pressable>

      {/* Favorites Card */}
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.lg,
            ...shadows.card,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <VlossomFavoriteIcon size={24} color={colors.primary} />
          <Text style={[textStyles.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
            Favorites
          </Text>
        </View>
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
          No favorite stylists yet
        </Text>
      </Pressable>

      {/* Logout Button */}
      <Pressable
        style={[
          styles.logoutButton,
          {
            borderColor: colors.status.error,
            borderRadius: borderRadius.md,
          },
        ]}
        onPress={onLogout}
        disabled={logoutLoading}
      >
        <Text
          style={[
            textStyles.button,
            {
              color: colors.status.error,
              opacity: logoutLoading ? 0.5 : 1,
            },
          ]}
        >
          {logoutLoading ? 'Signing out...' : 'Sign Out'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAction: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    marginTop: 8,
  },
});
