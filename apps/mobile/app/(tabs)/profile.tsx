/**
 * Profile Tab - Identity + Dashboards (V7.1.0)
 *
 * Purpose: User identity, hair health, schedule, role-based dashboards
 * Dynamic tabs based on user roles array (V7.1: multi-role support)
 * Connected to auth store for real user data
 *
 * V7.1: Uses user.roles array instead of single role for multi-role support
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
  useStylistsStore,
} from '../../src/stores';
import { MOCK_BOOKINGS, getUpcomingMockBookings, MOCK_HAIR_PROFILE, getMockCalendarSummary } from '../../src/data/mock-data';
import { formatPrice } from '../../src/api/stylists';
import { getBookingStatusLabel, getBookingStatusColor } from '../../src/api/bookings';
import {
  HairHealthSummaryCard,
  HairHealthEmptyCard,
} from '../../src/components/hair-health/HairHealthSummaryCard';
import {
  useHairHealthStore,
  selectHairProfile,
  selectHasProfile,
  selectNextRitual,
  selectStreakDays,
  selectOverdueCount,
} from '../../src/stores';

type ProfileTab = 'overview' | 'stylist' | 'salon';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const { user, logout, logoutLoading } = useAuthStore();

  // Get user roles from auth store - V7.1: Use roles array for multi-role support
  const userRole = user?.role || 'CUSTOMER';
  const userRoles = user?.roles || [userRole]; // Use roles array if available, fallback to single role

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
          <Pressable
            onPress={handleSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Opens settings screen"
          >
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

          {/* Role badges - V7.1: Show all user roles */}
          <View style={[styles.roleBadgesContainer, { marginTop: spacing.sm }]}>
            {userRoles.map((role) => (
              <View
                key={role}
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: colors.primary + '15',
                    borderRadius: borderRadius.pill,
                    marginRight: spacing.xs,
                    marginBottom: spacing.xs,
                  },
                ]}
              >
                <Text style={[textStyles.caption, { color: colors.primary }]}>
                  {role === 'STYLIST'
                    ? 'Stylist'
                    : role === 'PROPERTY_OWNER'
                    ? 'Property Owner'
                    : role === 'ADMIN'
                    ? 'Admin'
                    : 'Customer'}
                </Text>
              </View>
            ))}
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
      <View
        style={[styles.tabBar, { borderBottomColor: colors.border.default }]}
        accessibilityRole="tablist"
        accessibilityLabel="Profile sections"
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab${isSelected ? ', Selected' : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  textStyles.bodySmall,
                  {
                    color: isSelected ? colors.primary : colors.text.secondary,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
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
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const bookings = useBookingsStore(selectBookings);
  const nextBooking = useBookingsStore(selectNextBooking);
  const { fetchBookings, fetchStats } = useBookingsStore();

  // Hair Health store
  const hairProfile = useHairHealthStore(selectHairProfile);
  const hasProfile = useHairHealthStore(selectHasProfile);
  const nextRitual = useHairHealthStore(selectNextRitual);
  const streakDays = useHairHealthStore(selectStreakDays);
  const overdueCount = useHairHealthStore(selectOverdueCount);
  const { fetchProfile, fetchCalendarSummary, fetchUpcomingRituals } = useHairHealthStore();

  // Fetch data on mount and when demo mode changes
  useEffect(() => {
    fetchBookings(true);
    fetchStats();
    if (!isDemoMode) {
      fetchProfile();
      fetchCalendarSummary();
      fetchUpcomingRituals();
    }
  }, [fetchBookings, fetchStats, fetchProfile, fetchCalendarSummary, fetchUpcomingRituals, isDemoMode]);

  // Get upcoming bookings for display
  const upcomingBookings = isDemoMode
    ? getUpcomingMockBookings()
    : bookings.filter(
        (b) =>
          ['CONFIRMED', 'PENDING_PAYMENT'].includes(b.status) &&
          new Date(b.scheduledStartTime) >= new Date()
      );

  // Get hair health data - use mock in demo mode
  const displayHasProfile = isDemoMode ? true : hasProfile;
  const displayProfile = isDemoMode ? MOCK_HAIR_PROFILE : hairProfile;
  const mockCalendarSummary = isDemoMode ? getMockCalendarSummary() : null;
  const displayNextRitual = isDemoMode
    ? mockCalendarSummary?.nextRitual
      ? {
          type: mockCalendarSummary.nextRitual.type,
          title: mockCalendarSummary.nextRitual.title,
          date: mockCalendarSummary.nextRitual.date,
          daysUntil: mockCalendarSummary.nextRitual.daysUntil,
        }
      : null
    : nextRitual
    ? {
        type: nextRitual.eventType ?? 'RITUAL',
        title: nextRitual.name,
        date: nextRitual.scheduledStart ?? new Date().toISOString(),
        daysUntil: nextRitual.daysUntil,
      }
    : null;
  const displayStreakDays = isDemoMode ? mockCalendarSummary?.streakDays ?? 0 : streakDays;
  const displayOverdueCount = isDemoMode ? mockCalendarSummary?.overdueCount ?? 0 : overdueCount;

  return (
    <View>
      {/* Hair Health Card */}
      <View style={{ marginBottom: spacing.lg }}>
        {displayHasProfile && displayProfile ? (
          <HairHealthSummaryCard
            profile={displayProfile as Parameters<typeof HairHealthSummaryCard>[0]['profile']}
            nextRitual={displayNextRitual}
            streakDays={displayStreakDays}
            overdueCount={displayOverdueCount}
          />
        ) : (
          <HairHealthEmptyCard />
        )}
      </View>

      {/* Schedule Card */}
      <View
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
        {upcomingBookings.length > 0 ? (
          <View style={{ marginTop: spacing.sm }}>
            {upcomingBookings.slice(0, 2).map((booking) => (
              <View
                key={booking.id}
                style={[
                  styles.bookingPreview,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                <View style={styles.bookingPreviewContent}>
                  <Text style={[textStyles.body, { color: colors.text.primary }]} numberOfLines={1}>
                    {booking.service.name}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    {new Date(booking.scheduledStartTime).toLocaleDateString('en-ZA', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(booking.scheduledStartTime).toLocaleTimeString('en-ZA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getBookingStatusColor(booking.status) + '20',
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      textStyles.caption,
                      { color: getBookingStatusColor(booking.status) },
                    ]}
                  >
                    {getBookingStatusLabel(booking.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
            No upcoming appointments
          </Text>
        )}
      </View>

      {/* Favorites Card */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Favorites, No favorite stylists yet"
        accessibilityHint="View and manage your favorite stylists"
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
        accessibilityRole="button"
        accessibilityLabel={logoutLoading ? 'Signing out' : 'Sign out'}
        accessibilityState={{ disabled: logoutLoading, busy: logoutLoading }}
        accessibilityHint="Signs you out of your account"
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
  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const {
    dashboard,
    dashboardLoading,
    dashboardError,
    fetchDashboard,
    approveRequest,
    declineRequest,
  } = useStylistsStore();

  // Fetch dashboard on mount and when demo mode changes
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, isDemoMode]);

  // Get dashboard stats with fallback
  const stats = dashboard?.stats || {
    pendingRequests: 0,
    upcomingBookings: 0,
    thisMonthEarnings: 0,
    totalEarnings: 0,
    completedBookings: 0,
    averageRating: 0,
  };

  const pendingRequests = dashboard?.pendingRequests || [];

  const handleApproveRequest = async (requestId: string) => {
    try {
      await approveRequest(requestId);
    } catch {
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineRequest(requestId);
            } catch {
              Alert.alert('Error', 'Failed to decline request. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Error State */}
      {dashboardError && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.status.errorLight,
              borderRadius: borderRadius.md,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={[textStyles.bodySmall, { color: colors.status.error, flex: 1 }]}>
            {dashboardError}
          </Text>
          <Pressable onPress={fetchDashboard}>
            <Text style={[textStyles.bodySmall, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      )}

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
              {formatPrice(stats.thisMonthEarnings)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>
              Total
            </Text>
            <Text style={[textStyles.h4, { color: colors.white }]}>
              {formatPrice(stats.totalEarnings)}
            </Text>
          </View>
        </View>
        <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
          <View style={styles.statBadge}>
            <Text style={[textStyles.h4, { color: colors.white }]}>{stats.completedBookings}</Text>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>Completed</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[textStyles.h4, { color: colors.white }]}>{stats.upcomingBookings}</Text>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>Upcoming</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[textStyles.h4, { color: colors.white }]}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={[textStyles.caption, { color: colors.white, opacity: 0.8 }]}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Pending Requests */}
      <View
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
          {stats.pendingRequests > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.status.warning, borderRadius: borderRadius.circle, marginLeft: spacing.sm },
              ]}
            >
              <Text style={[textStyles.caption, { color: colors.white }]}>{stats.pendingRequests}</Text>
            </View>
          )}
        </View>

        {dashboardLoading && pendingRequests.length === 0 ? (
          <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
            Loading...
          </Text>
        ) : pendingRequests.length === 0 ? (
          <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
            No pending requests
          </Text>
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {pendingRequests.slice(0, 3).map((request) => (
              <View
                key={request.id}
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                <View style={styles.requestInfo}>
                  <Text style={[textStyles.body, { color: colors.text.primary }]} numberOfLines={1}>
                    {request.serviceName}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    {request.customerName} • {new Date(request.requestedDate).toLocaleDateString('en-ZA', {
                      month: 'short',
                      day: 'numeric',
                    })} at {request.requestedTime}
                  </Text>
                  <Text style={[textStyles.bodySmall, { color: colors.primary, marginTop: 2 }]}>
                    {formatPrice(request.priceAmountCents)}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => handleApproveRequest(request.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Accept booking request from ${request.customerName} for ${request.serviceName}`}
                    accessibilityHint="Confirms this booking request"
                    style={[
                      styles.requestButton,
                      { backgroundColor: colors.status.success, borderRadius: borderRadius.sm },
                    ]}
                  >
                    <Text style={[textStyles.caption, { color: colors.white }]}>Accept</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeclineRequest(request.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Decline booking request from ${request.customerName}`}
                    accessibilityHint="Opens confirmation to decline this request"
                    style={[
                      styles.requestButton,
                      {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: colors.status.error,
                        borderRadius: borderRadius.sm,
                        marginTop: 4,
                      },
                    ]}
                  >
                    <Text style={[textStyles.caption, { color: colors.status.error }]}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {pendingRequests.length > 3 && (
              <Pressable
                onPress={() => router.push('/stylist/requests')}
                style={{ marginTop: spacing.sm, alignItems: 'center' }}
              >
                <Text style={[textStyles.bodySmall, { color: colors.primary }]}>
                  View all {pendingRequests.length} requests
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <Pressable
          onPress={() => {
            router.push('/stylist/services');
          }}
          accessibilityRole="button"
          accessibilityLabel="Manage Services"
          accessibilityHint="Opens your services management screen"
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
            router.push('/stylist/calendar');
          }}
          accessibilityRole="button"
          accessibilityLabel="View Calendar"
          accessibilityHint="Opens your booking calendar"
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

      {/* Full Dashboard Link */}
      <Pressable
        onPress={() => router.push('/stylist/dashboard')}
        accessibilityRole="link"
        accessibilityLabel="Open full stylist dashboard"
        accessibilityHint="Navigate to the complete stylist dashboard"
        style={[
          styles.fullDashboardLink,
          {
            borderTopWidth: 1,
            borderTopColor: colors.border.default,
            marginTop: spacing.lg,
            paddingTop: spacing.md,
          },
        ]}
      >
        <Text style={[textStyles.body, { color: colors.primary }]}>
          Open Full Dashboard →
        </Text>
      </Pressable>
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
        accessibilityRole="button"
        accessibilityLabel={`Rental Requests, ${displayPendingCount > 0 ? `${displayPendingCount} pending` : 'No pending requests'}`}
        accessibilityHint="View and manage rental requests"
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
        accessibilityRole="button"
        accessibilityLabel="Manage Properties"
        accessibilityHint="Opens property management dashboard"
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
  roleBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  fullDashboardLink: {
    alignItems: 'center',
  },
  propertiesStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  bookingPreviewContent: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Stylist Dashboard styles
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statBadge: {
    alignItems: 'center',
  },
  countBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestActions: {
    alignItems: 'flex-end',
  },
  requestButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
