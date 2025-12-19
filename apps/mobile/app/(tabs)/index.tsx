/**
 * Home Tab - Map-First Discovery (V6.6.0)
 *
 * Purpose: Discovery + booking via full-screen map
 * Features:
 * - Map with stylist markers
 * - Search bar overlay
 * - Quick filters
 * - Quick action cards (Special Events, Near Me, Popular)
 */

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomSearchIcon,
  VlossomCalendarIcon,
  VlossomGrowingIcon,
  VlossomFavoriteIcon,
} from '../../src/components/icons/VlossomIcons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Map placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface.light }]}>
        <Text style={[textStyles.body, { color: colors.text.secondary }]}>
          Map View Coming Soon
        </Text>
        <Text style={[textStyles.caption, { color: colors.text.tertiary, marginTop: spacing.sm }]}>
          Discover stylists and salons near you
        </Text>
      </View>

      {/* Search overlay */}
      <View
        style={[
          styles.searchOverlay,
          {
            top: insets.top + spacing.lg,
            marginHorizontal: spacing.lg,
          },
        ]}
      >
        <Pressable
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.pill,
              ...shadows.card,
            },
          ]}
        >
          <VlossomSearchIcon size={20} color={colors.text.secondary} />
          <Text style={[textStyles.body, { color: colors.text.tertiary, marginLeft: spacing.sm }]}>
            Search stylists, salons, services...
          </Text>
        </Pressable>
      </View>

      {/* Quick filters */}
      <View
        style={[
          styles.filtersRow,
          {
            top: insets.top + spacing.lg + 60,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <FilterChip label="Near Me" active colors={colors} borderRadius={borderRadius} spacing={spacing} />
        <FilterChip label="Available Now" colors={colors} borderRadius={borderRadius} spacing={spacing} />
        <FilterChip label="Mobile" colors={colors} borderRadius={borderRadius} spacing={spacing} />
      </View>

      {/* Bottom Quick Actions */}
      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.background.primary,
            paddingBottom: insets.bottom + 80, // Account for tab bar
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            ...shadows.elevated,
          },
        ]}
      >
        {/* Drag handle */}
        <View
          style={[
            styles.dragHandle,
            { backgroundColor: colors.border.default, borderRadius: borderRadius.pill },
          ]}
        />

        {/* Quick Actions Title */}
        <Text
          style={[
            textStyles.h3,
            { color: colors.text.primary, marginTop: spacing.md, marginBottom: spacing.md },
          ]}
        >
          Quick Actions
        </Text>

        {/* Horizontal scroll of action cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md }}
        >
          {/* Special Events Card - Prominent placement */}
          <Pressable
            onPress={() => router.push('/special-events')}
            style={[
              styles.actionCard,
              styles.specialEventCard,
              {
                backgroundColor: colors.accent + '15',
                borderColor: colors.accent + '30',
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.accent + '20', borderRadius: borderRadius.circle },
              ]}
            >
              <VlossomGrowingIcon size={24} color={colors.accent} accent />
            </View>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
              Special Events
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              Weddings, photoshoots & more
            </Text>
          </Pressable>

          {/* Book Now Card */}
          <Pressable
            onPress={() => router.push('/search')}
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.default,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.primary + '15', borderRadius: borderRadius.circle },
              ]}
            >
              <VlossomCalendarIcon size={24} color={colors.primary} />
            </View>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
              Book Now
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              Find available stylists
            </Text>
          </Pressable>

          {/* Favorites Card */}
          <Pressable
            onPress={() => router.push('/profile')}
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.default,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: colors.primary + '15', borderRadius: borderRadius.circle },
              ]}
            >
              <VlossomFavoriteIcon size={24} color={colors.primary} />
            </View>
            <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
              Favorites
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              Your saved stylists
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  colors,
  borderRadius,
  spacing,
}: {
  label: string;
  active?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? colors.primary : colors.background.primary,
          borderRadius: borderRadius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          marginRight: spacing.sm,
        },
      ]}
    >
      <Text
        style={[
          textStyles.caption,
          {
            color: active ? colors.white : colors.text.secondary,
            fontWeight: active ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  filtersRow: {
    position: 'absolute',
    flexDirection: 'row',
    zIndex: 10,
  },
  filterChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dragHandle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
  },
  actionCard: {
    width: 140,
    padding: 16,
    borderWidth: 1,
  },
  specialEventCard: {
    width: 160,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
