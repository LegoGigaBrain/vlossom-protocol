/**
 * Stylist Dashboard (V7.2.0)
 *
 * Full dashboard for stylists showing:
 * - Earnings summary with charts
 * - Pending booking requests with approve/decline
 * - Upcoming appointments
 * - Quick actions
 *
 * Accessibility: Full screen reader support with semantic roles
 */

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomWalletIcon,
  VlossomCalendarIcon,
  VlossomGrowingIcon,
  VlossomNotificationsIcon,
  VlossomSettingsIcon,
} from '../../src/components/icons/VlossomIcons';
import { Card, Badge, Avatar, Button, EmptyState } from '../../src/components/ui';
import {
  useStylistsStore,
  useDemoModeStore,
  selectIsDemoMode,
} from '../../src/stores';
import { formatPrice } from '../../src/api/stylists';

export default function StylistDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const isDemoMode = useDemoModeStore(selectIsDemoMode);
  const {
    dashboard,
    dashboardLoading,
    dashboardError,
    fetchDashboard,
    approveRequest,
    declineRequest,
  } = useStylistsStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleBack = () => {
    router.back();
  };

  const handleApprove = async (requestId: string, customerName: string) => {
    Alert.alert(
      'Approve Request',
      `Accept booking request from ${customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approveRequest(requestId);
              Alert.alert('Success', 'Booking request approved!');
            } catch {
              Alert.alert('Error', 'Failed to approve request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDecline = async (requestId: string, customerName: string) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the request from ${customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineRequest(requestId, 'Schedule conflict');
              Alert.alert('Declined', 'Booking request has been declined.');
            } catch {
              Alert.alert('Error', 'Failed to decline request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewCalendar = () => {
    router.push('/stylist/calendar');
  };

  const handleViewEarnings = () => {
    router.push('/stylist/earnings');
  };

  const stats = dashboard?.stats;
  const pendingRequests = dashboard?.pendingRequests || [];

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
            backgroundColor: colors.background.primary,
          },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to previous screen"
        >
          <VlossomBackIcon size={24} color={colors.text.primary} />
        </Pressable>
        <Text
          style={[textStyles.h3, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          Stylist Dashboard
        </Text>
        <Pressable
          onPress={handleViewCalendar}
          accessibilityRole="button"
          accessibilityLabel="View calendar"
          accessibilityHint="Opens your booking calendar"
        >
          <VlossomCalendarIcon size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashboardLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats Cards */}
        <View
          style={[styles.statsGrid, { padding: spacing.lg }]}
          accessibilityRole="summary"
          accessibilityLabel={`Earnings this month: ${stats ? formatPrice(stats.thisMonthEarnings) : 'R0'}. Upcoming bookings: ${stats?.upcomingBookings || 0}`}
        >
          <Card
            variant="filled"
            style={{ flex: 1, marginRight: spacing.sm }}
            onPress={handleViewEarnings}
            accessibilityRole="button"
            accessibilityLabel={`This month earnings: ${stats ? formatPrice(stats.thisMonthEarnings) : 'R0'}`}
            accessibilityHint="Double tap to view earnings details"
          >
            <View style={styles.statCard} aria-hidden>
              <VlossomWalletIcon size={24} color={colors.status.success} />
              <Text
                style={[
                  textStyles.h3,
                  { color: colors.text.primary, marginTop: spacing.sm },
                ]}
              >
                {stats ? formatPrice(stats.thisMonthEarnings) : 'R0'}
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                This Month
              </Text>
            </View>
          </Card>

          <Card
            variant="filled"
            style={{ flex: 1, marginLeft: spacing.sm }}
            accessible
            accessibilityLabel={`Upcoming bookings: ${stats?.upcomingBookings || 0}`}
          >
            <View style={styles.statCard} aria-hidden>
              <VlossomCalendarIcon size={24} color={colors.primary} />
              <Text
                style={[
                  textStyles.h3,
                  { color: colors.text.primary, marginTop: spacing.sm },
                ]}
              >
                {stats?.upcomingBookings || 0}
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                Upcoming
              </Text>
            </View>
          </Card>
        </View>

        {/* Additional Stats Row */}
        <View
          style={[styles.statsRow, { paddingHorizontal: spacing.lg }]}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Completed bookings: ${stats?.completedBookings || 0}. Rating: ${stats?.averageRating?.toFixed(1) || '0.0'} stars. Total earned: ${stats ? formatPrice(stats.totalEarnings) : 'R0'}`}
        >
          <View style={styles.miniStat} aria-hidden>
            <Text style={[textStyles.h4, { color: colors.text.primary }]}>
              {stats?.completedBookings || 0}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Completed
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.border.default }]}
            aria-hidden
          />
          <View style={styles.miniStat} aria-hidden>
            <Text style={[textStyles.h4, { color: colors.text.primary }]}>
              {stats?.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Rating
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.border.default }]}
            aria-hidden
          />
          <View style={styles.miniStat} aria-hidden>
            <Text style={[textStyles.h4, { color: colors.text.primary }]}>
              {stats ? formatPrice(stats.totalEarnings) : 'R0'}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
              Total Earned
            </Text>
          </View>
        </View>

        {/* Pending Requests */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text
              style={[textStyles.h4, { color: colors.text.primary }]}
              accessibilityRole="header"
            >
              Pending Requests
            </Text>
            {pendingRequests.length > 0 && (
              <Badge
                label={pendingRequests.length.toString()}
                variant="warning"
                size="sm"
                accessibilityLabel={`${pendingRequests.length} pending requests`}
              />
            )}
          </View>

          {pendingRequests.length === 0 ? (
            <Card variant="outlined" style={{ marginTop: spacing.sm }}>
              <View
                style={styles.emptyRequests}
                accessible
                accessibilityLabel="No pending requests. New booking requests will appear here."
              >
                <VlossomNotificationsIcon size={32} color={colors.text.muted} aria-hidden />
                <Text
                  style={[
                    textStyles.body,
                    { color: colors.text.secondary, marginTop: spacing.sm },
                  ]}
                  aria-hidden
                >
                  No pending requests
                </Text>
                <Text
                  style={[
                    textStyles.caption,
                    { color: colors.text.muted, textAlign: 'center' },
                  ]}
                  aria-hidden
                >
                  New booking requests will appear here
                </Text>
              </View>
            </Card>
          ) : (
            <View accessibilityRole="list" accessibilityLabel={`Pending requests, ${pendingRequests.length} items`}>
              {pendingRequests.map((request) => (
                <Card
                  key={request.id}
                  variant="outlined"
                  style={{ marginTop: spacing.sm }}
                  accessible
                  accessibilityLabel={`Booking request from ${request.customerName} for ${request.serviceName} on ${new Date(request.requestedDate).toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })} at ${request.requestedTime}. Price: ${formatPrice(parseInt(request.priceAmountCents))}`}
                >
                  <View style={styles.requestCard} aria-hidden>
                    <Avatar name={request.customerName} size="md" />
                    <View style={styles.requestInfo}>
                      <Text
                        style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}
                      >
                        {request.customerName}
                      </Text>
                      <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>
                        {request.serviceName}
                      </Text>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                        {new Date(request.requestedDate).toLocaleDateString('en-ZA', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {request.requestedTime}
                      </Text>
                    </View>
                    <Text
                      style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]}
                    >
                      {formatPrice(parseInt(request.priceAmountCents))}
                    </Text>
                  </View>

                  <View style={styles.requestActions}>
                    <Button
                      title="Decline"
                      variant="outline"
                      size="sm"
                      onPress={() => handleDecline(request.id, request.customerName)}
                      style={{ flex: 1, marginRight: spacing.sm }}
                      accessibilityLabel={`Decline request from ${request.customerName}`}
                      accessibilityHint="Double tap to decline this booking request"
                    />
                    <Button
                      title="Approve"
                      variant="primary"
                      size="sm"
                      onPress={() => handleApprove(request.id, request.customerName)}
                      style={{ flex: 1 }}
                      accessibilityLabel={`Approve request from ${request.customerName}`}
                      accessibilityHint="Double tap to approve this booking request"
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h4, { color: colors.text.primary, marginBottom: spacing.sm }]}
            accessibilityRole="header"
          >
            Quick Actions
          </Text>

          <View style={styles.actionsGrid} accessibilityRole="list" accessibilityLabel="Quick actions menu">
            <Pressable
              onPress={handleViewCalendar}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="My Calendar"
              accessibilityHint="Double tap to view your booking calendar"
            >
              <VlossomCalendarIcon size={28} color={colors.primary} />
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.primary, marginTop: spacing.xs },
                ]}
                aria-hidden
              >
                My Calendar
              </Text>
            </Pressable>

            <Pressable
              onPress={handleViewEarnings}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Earnings"
              accessibilityHint="Double tap to view your earnings details"
            >
              <VlossomGrowingIcon size={28} color={colors.status.success} />
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.primary, marginTop: spacing.xs },
                ]}
                aria-hidden
              >
                Earnings
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/stylist/services')}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Services"
              accessibilityHint="Double tap to manage your services and pricing"
            >
              <VlossomWalletIcon size={28} color={colors.tertiary} />
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.primary, marginTop: spacing.xs },
                ]}
                aria-hidden
              >
                Services
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/stylist/availability')}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.lg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Availability"
              accessibilityHint="Double tap to manage your weekly schedule"
            >
              <VlossomSettingsIcon size={28} color={colors.text.secondary} />
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.primary, marginTop: spacing.xs },
                ]}
                aria-hidden
              >
                Availability
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Demo Mode Indicator */}
        {isDemoMode && (
          <View
            style={[
              styles.demoIndicator,
              {
                backgroundColor: colors.status.warning + '20',
                marginHorizontal: spacing.lg,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
              },
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLabel="Demo Mode active. Showing sample data."
            accessibilityLiveRegion="polite"
          >
            <Text style={[textStyles.caption, { color: colors.status.warning }]} aria-hidden>
              Demo Mode - Showing sample data
            </Text>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  miniStat: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptyRequests: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionCard: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  demoIndicator: {
    alignItems: 'center',
    marginTop: 24,
  },
});
