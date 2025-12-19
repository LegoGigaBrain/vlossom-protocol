/**
 * Property Owner Requests Screen (V6.5.2)
 *
 * Review and manage chair rental requests from stylists
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomProfileIcon,
  VlossomVerifiedIcon,
} from '../../src/components/icons/VlossomIcons';

// Mock data
const mockRequests = [
  {
    id: '1',
    status: 'PENDING' as const,
    chairName: 'Station #1',
    propertyName: 'Glamour Studios',
    rentalMode: 'PER_DAY',
    startDate: '2025-12-22',
    message: 'Hi! I am a professional braider with 5 years of experience. Looking for a station for the holiday season.',
    createdAt: '2025-12-19T10:30:00Z',
    stylist: {
      id: '1',
      displayName: 'Thandi Mbeki',
      avatarUrl: null,
      rating: 4.8,
      verified: true,
    },
  },
  {
    id: '2',
    status: 'PENDING' as const,
    chairName: 'Station #2',
    propertyName: 'Glamour Studios',
    rentalMode: 'PER_WEEK',
    startDate: '2025-12-23',
    message: null,
    createdAt: '2025-12-18T15:45:00Z',
    stylist: {
      id: '2',
      displayName: 'Zanele Nkosi',
      avatarUrl: null,
      rating: 4.5,
      verified: false,
    },
  },
  {
    id: '3',
    status: 'APPROVED' as const,
    chairName: 'Luxury Suite 1',
    propertyName: 'Style Haven',
    rentalMode: 'PER_MONTH',
    startDate: '2025-12-01',
    message: 'Thank you for approving!',
    createdAt: '2025-11-28T09:00:00Z',
    stylist: {
      id: '3',
      displayName: 'Precious Dlamini',
      avatarUrl: null,
      rating: 4.9,
      verified: true,
    },
  },
];

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

type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [filter, setFilter] = useState<RequestStatus | 'all'>('PENDING');

  // Filter requests
  const filteredRequests =
    filter === 'all' ? mockRequests : mockRequests.filter((r) => r.status === filter);

  const pendingCount = mockRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { paddingHorizontal: spacing.lg }]}
      >
        {[
          { value: 'PENDING', label: 'Pending', count: pendingCount },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'DECLINED', label: 'Declined' },
          { value: 'all', label: 'All' },
        ].map((tab) => {
          const isActive = filter === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setFilter(tab.value as RequestStatus | 'all')}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.background.tertiary,
                  borderRadius: borderRadius.pill,
                  marginRight: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.caption,
                  { color: isActive ? colors.white : colors.text.secondary },
                ]}
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
          >
            <Text style={[textStyles.body, { color: colors.text.secondary, textAlign: 'center' }]}>
              {filter === 'PENDING'
                ? 'No pending requests'
                : filter === 'APPROVED'
                  ? 'No approved requests'
                  : filter === 'DECLINED'
                    ? 'No declined requests'
                    : 'No requests yet'}
            </Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View
              key={request.id}
              style={[
                styles.requestCard,
                {
                  backgroundColor: colors.background.primary,
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing.md,
                  ...shadows.card,
                },
              ]}
            >
              {/* Stylist Header */}
              <View style={[styles.cardHeader, { borderBottomColor: colors.border.default }]}>
                <View style={styles.stylistRow}>
                  {/* Avatar */}
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.circle },
                    ]}
                  >
                    {request.stylist.avatarUrl ? (
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
                        {request.stylist.displayName}
                      </Text>
                      {request.stylist.verified && (
                        <VlossomVerifiedIcon size={14} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                        ⭐ {request.stylist.rating.toFixed(1)} • {formatTimeAgo(request.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Message */}
                {request.message && (
                  <View
                    style={[
                      styles.messageBox,
                      {
                        backgroundColor: colors.background.tertiary,
                        borderRadius: borderRadius.md,
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[textStyles.caption, { color: colors.text.secondary }]}
                      numberOfLines={3}
                    >
                      &ldquo;{request.message}&rdquo;
                    </Text>
                  </View>
                )}
              </View>

              {/* Request Details */}
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Chair</Text>
                  <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                    {request.chairName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Property</Text>
                  <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                    {request.propertyName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Type</Text>
                  <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                    {RENTAL_MODE_LABELS[request.rentalMode]}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Start</Text>
                  <Text style={[textStyles.caption, { color: colors.text.primary }]}>
                    {formatDate(request.startDate)}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              {request.status === 'PENDING' && (
                <View style={[styles.actions, { borderTopColor: colors.border.default }]}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.declineButton,
                      { borderColor: colors.border.default, borderRadius: borderRadius.md },
                    ]}
                  >
                    <Text style={[textStyles.button, { color: colors.text.secondary }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.approveButton,
                      { backgroundColor: colors.primary, borderRadius: borderRadius.md },
                    ]}
                  >
                    <Text style={[textStyles.button, { color: colors.white }]}>Approve</Text>
                  </Pressable>
                </View>
              )}

              {request.status === 'APPROVED' && (
                <View style={[styles.statusBar, { backgroundColor: colors.status.success + '20' }]}>
                  <Text style={[textStyles.caption, { color: colors.status.success }]}>
                    ✓ Approved
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
