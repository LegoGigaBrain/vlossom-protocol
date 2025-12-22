/**
 * Profile Tab - Identity + Dashboards (V7.0.0)
 *
 * Purpose: User identity, hair health, schedule, role-based dashboards
 * Dynamic tabs based on user roles
 * Connected to auth store for real user data
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomSettingsIcon,
  VlossomHealthyIcon,
  VlossomCalendarIcon,
  VlossomFavoriteIcon,
  VlossomWalletIcon,
  VlossomGrowingIcon,
  VlossomHomeIcon,
} from '../../src/components/icons/VlossomIcons';
import {
  useAuthStore,
  useBookingsStore,
  selectBookings,
  selectNextBooking,
  usePropertyOwnerStore,
  selectProperties,
  selectStats as selectPropertyStats,
  selectPendingCount,
  useDemoModeStore,
  selectIsDemoMode,
} from '../../src/stores';
import { MOCK_BOOKINGS, getUpcomingMockBookings } from '../../src/data/mock-data';
import { formatPrice } from '../../src/api/stylists';
import { getBookingStatusLabel, getBookingStatusColor } from '../../src/api/bookings';

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
    router.push('/settings');
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
          <StylistDashboardTab
            router={router}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
          />
        )}
        {activeTab === 'salon' && (
          <PropertiesDashboardTab
            router={router}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
          />
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

// Stylist Dashboard Tab
interface StylistDashboardTabProps {
  router: ReturnType<typeof useRouter>;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function StylistDashboardTab({ router, colors, spacing, borderRadius, shadows }: StylistDashboardTabProps) {
  // TODO: Connect to real stylist earnings API when available
  const mockEarnings = {
    thisMonth: 245000, // R2,450.00
    pending: 35000, // R350.00
  };

  return (
    <View>
      {/* Earnings Summary */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <VlossomWalletIcon size={24} color={colors.white} />
          <Text style={[textStyles.h3, { color: colors.white, marginLeft: spacing.sm }]}>
            Earnings
          </Text>
        </View>
        <View style={[styles.earningsRow, { marginTop: spacing.md }]}>
          <View>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>
              This Month
            </Text>
            <Text style={[textStyles.h2, { color: colors.white }]}>
              {formatPrice(mockEarnings.thisMonth)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>
              Pending
            </Text>
            <Text style={[textStyles.h4, { color: colors.white }]}>
              {formatPrice(mockEarnings.pending)}
            </Text>
          </View>
        </View>
      </View>

      {/* Pending Requests */}
      <Pressable
        onPress={() => {
          // TODO: Navigate to stylist requests
          Alert.alert('Coming Soon', 'Stylist requests view will be available soon.');
        }}
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
            Pending Requests
          </Text>
        </View>
        <View style={[styles.pendingBadge, { backgroundColor: colors.status.warning + '20', borderRadius: borderRadius.pill, marginTop: spacing.sm }]}>
          <Text style={[textStyles.body, { color: colors.status.warning }]}>
            3 requests awaiting response
          </Text>
        </View>
      </Pressable>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <Pressable
          onPress={() => {
            // TODO: Navigate to manage services
            Alert.alert('Coming Soon', 'Service management will be available soon.');
          }}
          style={[
            styles.quickActionButton,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              marginRight: spacing.sm,
            },
          ]}
        >
          <VlossomGrowingIcon size={24} color={colors.primary} />
          <Text style={[textStyles.bodySmall, { color: colors.text.primary, marginTop: spacing.xs }]}>
            Manage Services
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            // TODO: Navigate to calendar
            Alert.alert('Coming Soon', 'Calendar view will be available soon.');
          }}
          style={[
            styles.quickActionButton,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              marginLeft: spacing.sm,
            },
          ]}
        >
          <VlossomCalendarIcon size={24} color={colors.primary} />
          <Text style={[textStyles.bodySmall, { color: colors.text.primary, marginTop: spacing.xs }]}>
            View Calendar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Properties Dashboard Tab
interface PropertiesDashboardTabProps {
  router: ReturnType<typeof useRouter>;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function PropertiesDashboardTab({ router, colors, spacing, borderRadius, shadows }: PropertiesDashboardTabProps) {
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const properties = usePropertyOwnerStore(selectProperties);
  const stats = usePropertyOwnerStore(selectPropertyStats);
  const pendingCount = usePropertyOwnerStore(selectPendingCount);
  const { fetchProperties } = usePropertyOwnerStore();

  useEffect(() => {
    if (!isDemoMode) {
      fetchProperties();
    }
  }, [isDemoMode, fetchProperties]);

  // Mock data for demo mode
  const displayStats = isDemoMode ? {
    totalProperties: 2,
    totalChairs: 5,
    occupancyRate: 60,
  } : {
    totalProperties: properties.length,
    totalChairs: stats?.totalChairs || 0,
    occupancyRate: stats?.occupancyRate || 0,
  };

  const displayPendingCount = isDemoMode ? 2 : pendingCount;

  return (
    <View>
      {/* Properties Overview */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.tertiary,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <VlossomHomeIcon size={24} color={colors.white} />
          <Text style={[textStyles.h3, { color: colors.white, marginLeft: spacing.sm }]}>
            Properties Overview
          </Text>
        </View>
        <View style={[styles.propertiesStatsRow, { marginTop: spacing.md }]}>
          <View>
            <Text style={[textStyles.h2, { color: colors.white }]}>
              {displayStats.totalProperties}
            </Text>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>
              Properties
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[textStyles.h2, { color: colors.white }]}>
              {displayStats.totalChairs}
            </Text>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>
              Chairs
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[textStyles.h2, { color: colors.white }]}>
              {displayStats.occupancyRate}%
            </Text>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>
              Occupancy
            </Text>
          </View>
        </View>
      </View>

      {/* Pending Rentals */}
      <Pressable
        onPress={() => {
          // TODO: Navigate to rental requests
          router.push('/property-owner');
        }}
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
            Rental Requests
          </Text>
        </View>
        {displayPendingCount > 0 ? (
          <View style={[styles.pendingBadge, { backgroundColor: colors.status.warning + '20', borderRadius: borderRadius.pill, marginTop: spacing.sm }]}>
            <Text style={[textStyles.body, { color: colors.status.warning }]}>
              {displayPendingCount} pending request{displayPendingCount !== 1 ? 's' : ''}
            </Text>
          </View>
        ) : (
          <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
            No pending requests
          </Text>
        )}
      </Pressable>

      {/* Quick Action */}
      <Pressable
        onPress={() => router.push('/property-owner')}
        style={[
          styles.cardAction,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <Text style={[textStyles.button, { color: colors.white }]}>
          Manage Properties
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
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  quickActionsRow: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  propertiesStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
