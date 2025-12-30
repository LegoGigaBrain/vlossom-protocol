/**
 * Property Owner Requests Screen (V7.2.0)
 *
 * Review and manage chair rental requests from stylists.
 * V6.10: Wired to real API with approve/reject actions.
 * V7.2.0: Full accessibility support with semantic roles
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomProfileIcon,
  VlossomVerifiedIcon,
} from '../../src/components/icons/VlossomIcons';
import { usePropertyOwnerStore } from '../../src/stores/property-owner';
import type { RentalStatus } from '../../src/api/property-owner';

// Rental mode labels
const RENTAL_MODE_LABELS: Record<string, string> = {
  PER_BOOKING: 'Per Booking',
  PER_HOUR: 'Hourly',
  PER_DAY: 'Daily',
  PER_WEEK: 'Weekly',
  PER_MONTH: 'Monthly',
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
};

// Map API status to display status
type DisplayStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'all';

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [filter, setFilter] = useState<DisplayStatus>('PENDING_APPROVAL');
  const [refreshing, setRefreshing] = useState(false);

  const {
    rentalRequests,
    rentalRequestsLoading,
    decisionLoading,
    fetchRentalRequests,
    setRentalRequestsFilter,
    approveRequest,
    rejectRequest,
  } = usePropertyOwnerStore();

  // Fetch requests on mount
  useEffect(() => {
    fetchRentalRequests();
  }, [fetchRentalRequests]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRentalRequests();
    setRefreshing(false);
  }, [fetchRentalRequests]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: DisplayStatus) => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      setRentalRequestsFilter(null);
    } else {
      setRentalRequestsFilter(newFilter as RentalStatus);
    }
  }, [setRentalRequestsFilter]);

  // Handle approve
  const handleApprove = useCallback(async (rentalId: string) => {
    const success = await approveRequest(rentalId);
    if (success) {
      Alert.alert('Request Approved', 'The stylist has been notified.');
    } else {
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    }
  }, [approveRequest]);

  // Handle reject
  const handleReject = useCallback((rentalId: string) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const success = await rejectRequest(rentalId);
            if (success) {
              Alert.alert('Request Declined', 'The stylist has been notified.');
            } else {
              Alert.alert('Error', 'Failed to decline request. Please try again.');
            }
          },
        },
      ]
    );
  }, [rejectRequest]);

  // Filter requests locally
  const filteredRequests =
    filter === 'all' ? rentalRequests : rentalRequests.filter((r) => r.status === filter);

  const pendingCount = rentalRequests.filter((r) => r.status === 'PENDING_APPROVAL').length;

  // Loading state
  if (rentalRequestsLoading && rentalRequests.length === 0) {
    return (
      <View
        style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background.secondary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Loading requests, please wait"
      >
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]} aria-hidden>
          Loading requests...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { paddingHorizontal: spacing.lg }]}
        accessibilityRole="tablist"
        accessibilityLabel="Filter requests by status"
      >
        {[
          { value: 'PENDING_APPROVAL', label: 'Pending', count: pendingCount },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Declined' },
          { value: 'all', label: 'All' },
        ].map((tab) => {
          const isActive = filter === tab.value;
          const tabLabel = tab.count !== undefined && tab.count > 0
            ? `${tab.label}, ${tab.count} requests`
            : tab.label;
          return (
            <Pressable
              key={tab.value}
              onPress={() => handleFilterChange(tab.value as DisplayStatus)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.background.tertiary,
                  borderRadius: borderRadius.pill,
                  marginRight: spacing.sm,
                },
              ]}
              accessibilityRole="tab"
              accessibilityLabel={tabLabel}
              accessibilityState={{ selected: isActive }}
              accessibilityHint={isActive ? 'Currently selected' : `Double tap to filter by ${tab.label.toLowerCase()}`}
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: isActive ? colors.white : colors.text.secondary },
                ]}
                aria-hidden
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && ` (${tab.count})`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Requests List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={
              filter === 'PENDING_APPROVAL'
                ? 'No pending requests'
                : filter === 'APPROVED'
                  ? 'No approved requests'
                  : filter === 'REJECTED'
                    ? 'No declined requests'
                    : 'No requests yet'
            }
          >
            <Text style={[textStyles.body, { color: colors.text.secondary, textAlign: 'center' }]} aria-hidden>
              {filter === 'PENDING_APPROVAL'
                ? 'No pending requests'
                : filter === 'APPROVED'
                  ? 'No approved requests'
                  : filter === 'REJECTED'
                    ? 'No declined requests'
                    : 'No requests yet'}
            </Text>
          </View>
        ) : (
          <View accessibilityRole="list" accessibilityLabel={`${filteredRequests.length} rental requests`}>
            {filteredRequests.map((request) => {
              const isProcessing = decisionLoading === request.id;
              const stylistName = request.stylist?.displayName || 'Unknown Stylist';
              const chairName = request.chair?.name || 'Unknown';
              const rentalType = RENTAL_MODE_LABELS[request.rentalMode] || request.rentalMode;
              const amount = `R ${(request.totalAmountCents / 100).toFixed(2)}`;
              const statusText = request.status === 'APPROVED' ? 'approved' : request.status === 'REJECTED' ? 'declined' : 'pending';

              return (
                <View
                  key={request.id}
                  style={[
                    styles.requestCard,
                    {
                      backgroundColor: colors.background.primary,
                      borderRadius: borderRadius.lg,
                      marginBottom: spacing.md,
                      opacity: isProcessing ? 0.7 : 1,
                      ...shadows.card,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`${stylistName} requesting ${chairName}, ${rentalType} rental starting ${formatDate(request.startTime)}, ${amount}, ${statusText}${isProcessing ? ', processing' : ''}`}
                >
                  {/* Stylist Header */}
                  <View style={[styles.cardHeader, { borderBottomColor: colors.border.default }]} aria-hidden>
                    <View style={styles.stylistRow}>
                      {/* Avatar */}
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.circle },
                        ]}
                      >
                        {request.stylist?.avatarUrl ? (
                          <Image
                            source={{ uri: request.stylist.avatarUrl }}
                            style={styles.avatarImage}
                          />
                        ) : (
                          <VlossomProfileIcon size={24} color={colors.text.muted} />
                        )}
                      </View>

                      {/* Info */}
                      <View style={styles.stylistInfo}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[
                              textStyles.bodySmall,
                              { color: colors.text.primary, fontWeight: '600' },
                            ]}
                          >
                            {request.stylist?.displayName || 'Unknown Stylist'}
                          </Text>
                          <VlossomVerifiedIcon size={14} color={colors.primary} />
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                            {formatTimeAgo(request.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Request Details */}
                  <View style={styles.details} aria-hidden>
                    <View style={styles.detailRow}>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Chair</Text>
                      <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                        {request.chair?.name || 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Type</Text>
                      <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                        {RENTAL_MODE_LABELS[request.rentalMode] || request.rentalMode}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Start</Text>
                      <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                        {formatDate(request.startTime)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Amount</Text>
                      <Text style={[textStyles.caption, { color: colors.primary, fontWeight: '600' }]}>
                        {amount}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {request.status === 'PENDING_APPROVAL' && (
                    <View style={[styles.actions, { borderTopColor: colors.border.default }]}>
                      <Pressable
                        style={[
                          styles.actionButton,
                          styles.declineButton,
                          { borderColor: colors.border.default, borderRadius: borderRadius.md },
                        ]}
                        onPress={() => handleReject(request.id)}
                        disabled={isProcessing}
                        accessibilityRole="button"
                        accessibilityLabel={`Decline request from ${stylistName}`}
                        accessibilityHint="Double tap to decline this rental request"
                        accessibilityState={{ disabled: isProcessing }}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color={colors.text.secondary} accessibilityLabel="Processing" />
                        ) : (
                          <Text style={[textStyles.button, { color: colors.text.secondary }]} aria-hidden>Decline</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionButton,
                          styles.approveButton,
                          { backgroundColor: colors.primary, borderRadius: borderRadius.md },
                        ]}
                        onPress={() => handleApprove(request.id)}
                        disabled={isProcessing}
                        accessibilityRole="button"
                        accessibilityLabel={`Approve request from ${stylistName}`}
                        accessibilityHint="Double tap to approve this rental request"
                        accessibilityState={{ disabled: isProcessing }}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color={colors.white} accessibilityLabel="Processing" />
                        ) : (
                          <Text style={[textStyles.button, { color: colors.white }]} aria-hidden>Approve</Text>
                        )}
                      </Pressable>
                    </View>
                  )}

                  {request.status === 'APPROVED' && (
                    <View
                      style={[styles.statusBar, { backgroundColor: colors.status.success + '20' }]}
                      aria-hidden
                    >
                      <Text style={[textStyles.caption, { color: colors.status.success }]}>
                        ✓ Approved
                      </Text>
                    </View>
                  )}

                  {request.status === 'REJECTED' && (
                    <View
                      style={[styles.statusBar, { backgroundColor: colors.status.error + '20' }]}
                      aria-hidden
                    >
                      <Text style={[textStyles.caption, { color: colors.status.error }]}>
                        ✗ Declined
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  requestCard: {
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  stylistInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  messageBox: {
    padding: 12,
  },
  details: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButton: {
    borderWidth: 1,
  },
  approveButton: {},
  statusBar: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});
