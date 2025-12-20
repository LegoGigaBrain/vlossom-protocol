/**
 * Property Owner Dashboard Screen (V6.10.0)
 *
 * Overview of properties, chairs, and pending requests.
 * V6.10: Wired to real API via Zustand store.
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useCallback, useState } from 'react';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomHomeIcon,
  VlossomCalendarIcon,
  VlossomGrowingIcon,
} from '../../src/components/icons/VlossomIcons';
import { usePropertyOwnerStore } from '../../src/stores/property-owner';

export default function PropertyOwnerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const {
    properties,
    propertiesLoading,
    stats,
    fetchProperties,
  } = usePropertyOwnerStore();

  const [refreshing, setRefreshing] = useState(false);

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  }, [fetchProperties]);

  // Calculate display stats
  const totalProperties = stats?.totalProperties || 0;
  const totalChairs = stats?.totalChairs || 0;
  const occupancyRate = stats?.occupancyRate || 0;
  const totalPending = stats?.pendingRequests || 0;

  // Transform properties for display
  const displayProperties = properties.map((property) => {
    const chairs = property.chairs || [];
    const availableChairs = chairs.filter((c) => c.status === 'AVAILABLE').length;
    const occupiedChairs = chairs.filter((c) => c.status === 'OCCUPIED').length;
    return {
      id: property.id,
      name: property.name,
      category: property.category,
      city: property.city,
      coverImage: property.coverImage,
      chairCount: chairs.length,
      availableChairs,
      occupiedChairs,
      pendingRequests: property.pendingRentalCount || 0,
    };
  });

  // Loading state
  if (propertiesLoading && properties.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background.secondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Loading properties...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Stats Cards */}
      <View style={[styles.statsGrid, { padding: spacing.lg }]}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <VlossomHomeIcon size={20} color={colors.text.secondary} />
          <Text style={[textStyles.h2, { color: colors.text.primary }]}>{totalProperties}</Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Properties</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <VlossomCalendarIcon size={20} color={colors.text.secondary} />
          <Text style={[textStyles.h2, { color: colors.text.primary }]}>{totalChairs}</Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Total Chairs</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <VlossomGrowingIcon size={20} color={colors.text.secondary} />
          <Text style={[textStyles.h2, { color: colors.text.primary }]}>{occupancyRate}%</Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>Occupancy</Text>
        </View>
      </View>

      {/* Pending Requests Alert */}
      {totalPending > 0 && (
        <Pressable
          onPress={() => router.push('/property-owner/requests')}
          style={[
            styles.alertBanner,
            {
              backgroundColor: colors.status.warning + '20',
              borderColor: colors.status.warning + '40',
              marginHorizontal: spacing.lg,
              marginBottom: spacing.lg,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
              {totalPending} pending {totalPending === 1 ? 'request' : 'requests'}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              Stylists are waiting for your approval
            </Text>
          </View>
          <Text style={[textStyles.bodySmall, { color: colors.primary }]}>Review →</Text>
        </Pressable>
      )}

      {/* Quick Actions */}
      <View style={[styles.quickActions, { marginHorizontal: spacing.lg, marginBottom: spacing.lg }]}>
        <Pressable
          onPress={() => router.push('/property-owner/chairs')}
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
            Manage Chairs
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
            Add, edit, update status
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/property-owner/revenue')}
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
        >
          <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
            View Revenue
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
            Earnings & payouts
          </Text>
        </Pressable>
      </View>

      {/* Properties List */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Your Properties
        </Text>

        {displayProperties.length === 0 ? (
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
            <VlossomHomeIcon size={48} color={colors.text.muted} />
            <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
              No properties yet
            </Text>
            <Text
              style={[
                textStyles.caption,
                { color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xs },
              ]}
            >
              Add your first property to start renting chairs to stylists
            </Text>
          </View>
        ) : (
          displayProperties.map((property) => (
            <Pressable
              key={property.id}
              onPress={() => router.push(`/property-owner/chairs?property=${property.id}`)}
              style={[
                styles.propertyCard,
                {
                  backgroundColor: colors.background.primary,
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing.md,
                  ...shadows.card,
                },
              ]}
            >
              {/* Cover Image */}
              <View
                style={[
                  styles.propertyImage,
                  { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md },
                ]}
              >
                {property.coverImage ? (
                  <Image source={{ uri: property.coverImage }} style={styles.propertyImage} />
                ) : (
                  <VlossomHomeIcon size={32} color={colors.text.muted} />
                )}
              </View>

              {/* Info */}
              <View style={styles.propertyInfo}>
                <View style={styles.propertyHeader}>
                  <Text
                    style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}
                    numberOfLines={1}
                  >
                    {property.name}
                  </Text>
                  {property.pendingRequests > 0 && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.status.warning, borderRadius: borderRadius.pill },
                      ]}
                    >
                      <Text style={[textStyles.caption, { color: colors.white }]}>
                        {property.pendingRequests}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                  {property.category.replace('_', ' ')} • {property.city}
                </Text>

                {/* Chair Stats */}
                <View style={[styles.chairStats, { marginTop: spacing.sm }]}>
                  <View style={styles.chairStatItem}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: colors.status.success, marginRight: 4 },
                      ]}
                    />
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {property.availableChairs} available
                    </Text>
                  </View>
                  <View style={styles.chairStatItem}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: colors.status.warning, marginRight: 4 },
                      ]}
                    />
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {property.occupiedChairs} occupied
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  propertyCard: {
    flexDirection: 'row',
    padding: 12,
  },
  propertyImage: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chairStats: {
    flexDirection: 'row',
    gap: 16,
  },
  chairStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
