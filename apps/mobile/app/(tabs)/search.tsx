/**
 * Search Tab - Stylist Discovery (V6.8.0)
 *
 * Purpose: Search and filter stylists with real API integration
 * Features: Text search, category filters, sort options, real-time results
 */

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomSearchIcon,
  VlossomFavoriteIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useStylistsStore, selectStylists, selectFilters, selectUserLocation } from '../../src/stores';
import {
  formatPrice,
  formatPriceRange,
  formatDistance,
  getOperatingModeLabel,
  type ServiceCategory,
  type SortOption,
  type StylistSummary,
} from '../../src/api/stylists';
import * as Location from 'expo-location';

// Service categories matching backend
const SERVICE_CATEGORIES: { label: string; value: ServiceCategory | null }[] = [
  { label: 'All', value: null },
  { label: 'Hair', value: 'Hair' },
  { label: 'Nails', value: 'Nails' },
  { label: 'Makeup', value: 'Makeup' },
  { label: 'Lashes', value: 'Lashes' },
  { label: 'Facials', value: 'Facials' },
];

// Sort options
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Nearest', value: 'distance' },
  { label: 'Price: Low', value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const router = useRouter();

  // Store state
  const stylists = useStylistsStore(selectStylists);
  const filters = useStylistsStore(selectFilters);
  const userLocation = useStylistsStore(selectUserLocation);
  const {
    stylistsLoading,
    stylistsError,
    hasMore,
    total,
    searchStylists,
    loadMoreStylists,
    setFilter,
    clearFilters,
    setUserLocation,
  } = useStylistsStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Request location and fetch stylists on mount
  useEffect(() => {
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location.coords.latitude, location.coords.longitude);
        }
      } catch (error) {
        console.warn('Location error:', error);
      }
    };

    initLocation();
  }, [setUserLocation]);

  // Fetch stylists when location or filters change
  useEffect(() => {
    if (userLocation) {
      searchStylists();
    }
  }, [userLocation, searchStylists]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.query) {
        setFilter('query', searchQuery);
        searchStylists({ query: searchQuery });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters.query, setFilter, searchStylists]);

  const handleCategorySelect = (category: ServiceCategory | null) => {
    setFilter('serviceCategory', category);
    searchStylists({ serviceCategory: category ?? undefined });
  };

  const handleSortSelect = (sortBy: SortOption) => {
    setFilter('sortBy', sortBy);
    searchStylists({ sortBy });
    setShowSortOptions(false);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await searchStylists();
    setIsRefreshing(false);
  }, [searchStylists]);

  const handleStylistPress = (stylist: StylistSummary) => {
    router.push(`/stylists/${stylist.id}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilter('query', '');
    searchStylists({ query: undefined });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[textStyles.h2, { color: colors.text.primary }]}>Discover</Text>
        {total > 0 && (
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
            {total} stylists found
          </Text>
        )}
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing.lg }]}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <VlossomSearchIcon size={20} color={colors.text.tertiary} />
          <TextInput
            style={[
              styles.searchInput,
              textStyles.body,
              { color: colors.text.primary, marginLeft: spacing.sm },
            ]}
            placeholder="Search stylists, services..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <VlossomCloseIcon size={18} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      >
        {SERVICE_CATEGORIES.map((cat) => {
          const isSelected = filters.serviceCategory === cat.value;
          return (
            <Pressable
              key={cat.label}
              onPress={() => handleCategorySelect(cat.value)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background.secondary,
                  borderRadius: borderRadius.pill,
                  marginRight: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: isSelected ? colors.white : colors.text.secondary },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort Options */}
      <View style={[styles.sortRow, { paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
        <Text style={[textStyles.bodySmall, { color: colors.text.tertiary }]}>
          Sort by:
        </Text>
        <Pressable
          onPress={() => setShowSortOptions(!showSortOptions)}
          style={[
            styles.sortButton,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              marginLeft: spacing.sm,
            },
          ]}
        >
          <Text style={[textStyles.bodySmall, { color: colors.primary }]}>
            {SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label || 'Nearest'}
          </Text>
        </Pressable>
      </View>

      {/* Sort Dropdown */}
      {showSortOptions && (
        <View
          style={[
            styles.sortDropdown,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.md,
              marginHorizontal: spacing.lg,
              marginBottom: spacing.md,
              ...shadows.card,
            },
          ]}
        >
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleSortSelect(option.value)}
              style={[
                styles.sortOption,
                {
                  backgroundColor:
                    filters.sortBy === option.value
                      ? colors.surface.light
                      : colors.background.primary,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  textStyles.body,
                  {
                    color:
                      filters.sortBy === option.value ? colors.primary : colors.text.primary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Results */}
      <ScrollView
        style={styles.results}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          if (isCloseToBottom && hasMore && !stylistsLoading) {
            loadMoreStylists();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Error State */}
        {stylistsError && (
          <View
            style={[
              styles.errorState,
              { backgroundColor: colors.surface.light, borderRadius: borderRadius.lg },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.status.error }]}>
              {stylistsError}
            </Text>
            <Pressable
              onPress={handleRefresh}
              style={[
                styles.retryButton,
                { backgroundColor: colors.primary, borderRadius: borderRadius.md },
              ]}
            >
              <Text style={[textStyles.bodySmall, { color: colors.white }]}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Loading State */}
        {stylistsLoading && stylists.length === 0 && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]}
            >
              Finding stylists near you...
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!stylistsLoading && stylists.length === 0 && !stylistsError && (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg },
            ]}
          >
            <Text style={[textStyles.body, { color: colors.text.tertiary }]}>
              No stylists found
            </Text>
            <Text
              style={[
                textStyles.caption,
                { color: colors.text.muted, marginTop: spacing.xs, textAlign: 'center' },
              ]}
            >
              Try adjusting your filters or search in a different area
            </Text>
            {(filters.query || filters.serviceCategory) && (
              <Pressable
                onPress={() => {
                  clearFilters();
                  setSearchQuery('');
                  searchStylists();
                }}
                style={[
                  styles.clearFiltersButton,
                  { borderColor: colors.primary, borderRadius: borderRadius.md },
                ]}
              >
                <Text style={[textStyles.bodySmall, { color: colors.primary }]}>
                  Clear Filters
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Stylist Cards */}
        {stylists.map((stylist) => (
          <StylistCard
            key={stylist.id}
            stylist={stylist}
            colors={colors}
            borderRadius={borderRadius}
            shadows={shadows}
            spacing={spacing}
            onPress={() => handleStylistPress(stylist)}
          />
        ))}

        {/* Load More Indicator */}
        {stylistsLoading && stylists.length > 0 && (
          <View style={styles.loadMoreIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* End of List */}
        {!hasMore && stylists.length > 0 && (
          <Text
            style={[
              textStyles.caption,
              { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            You've seen all {total} stylists
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

interface StylistCardProps {
  stylist: StylistSummary;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  onPress: () => void;
}

function StylistCard({ stylist, colors, borderRadius, shadows, spacing, onPress }: StylistCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.stylistCard,
        {
          backgroundColor: colors.background.primary,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.md,
          ...shadows.card,
        },
      ]}
    >
      {/* Avatar */}
      {stylist.avatarUrl ? (
        <Image
          source={{ uri: stylist.avatarUrl }}
          style={[
            styles.avatar,
            {
              borderRadius: borderRadius.md,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            {
              backgroundColor: colors.surface.light,
              borderRadius: borderRadius.md,
            },
          ]}
        >
          <Text style={[textStyles.h2, { color: colors.text.tertiary }]}>
            {stylist.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]} numberOfLines={1}>
          {stylist.displayName}
        </Text>
        <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]} numberOfLines={1}>
          {stylist.specialties.slice(0, 2).join(' · ') || 'Beauty Professional'}
        </Text>
        <View style={styles.cardMeta}>
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor: colors.surface.light,
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.xs,
                paddingVertical: 2,
              },
            ]}
          >
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              {getOperatingModeLabel(stylist.operatingMode)}
            </Text>
          </View>
          {stylist.distance !== null && (
            <Text style={[textStyles.caption, { color: colors.text.tertiary, marginLeft: spacing.sm }]}>
              {formatDistance(stylist.distance)}
            </Text>
          )}
        </View>
      </View>

      {/* Price & Favorite */}
      <View style={styles.cardActions}>
        <Text style={[textStyles.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
          {formatPriceRange(stylist.priceRange.min, stylist.priceRange.max)}
        </Text>
        <Pressable style={styles.favoriteButton} hitSlop={8}>
          <VlossomFavoriteIcon size={20} color={colors.text.tertiary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
  },
  categoriesScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  categoryChip: {},
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {},
  sortDropdown: {
    overflow: 'hidden',
  },
  sortOption: {},
  results: {
    flex: 1,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorState: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  clearFiltersButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  stylistCard: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modeBadge: {},
  cardActions: {
    alignItems: 'flex-end',
  },
  favoriteButton: {
    padding: 8,
    marginTop: 4,
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
