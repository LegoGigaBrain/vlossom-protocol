/**
 * Home Tab - Map-First Discovery (V6.0)
 *
 * Purpose: Discovery + booking via full-screen map
 * Never leave the map during booking initiation
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomSearchIcon } from '../../src/components/icons/VlossomIcons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
  colors: any;
  borderRadius: any;
  spacing: any;
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
});
