/**
 * Search Tab - Intentional Exploration (V6.0)
 *
 * Purpose: Feed + search for stylists, salons, services
 * Following feed, filters, recommendations
 */

import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles } from '../../src/styles/theme';
import { VlossomSearchIcon, VlossomFavoriteIcon } from '../../src/components/icons/VlossomIcons';
import { useState } from 'react';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[textStyles.h2, { color: colors.text.primary }]}>Discover</Text>
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
          />
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      >
        {['All', 'Natural Hair', 'Braids', 'Locs', 'Protective', 'Treatments'].map((cat, i) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryChip,
              {
                backgroundColor: i === 0 ? colors.primary : colors.background.secondary,
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
                { color: i === 0 ? colors.white : colors.text.secondary },
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.results} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Popular Near You
        </Text>

        {/* Placeholder cards */}
        {[1, 2, 3].map((i) => (
          <StylistCard key={i} colors={colors} borderRadius={borderRadius} shadows={shadows} spacing={spacing} />
        ))}

        <Text
          style={[
            textStyles.h3,
            { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
          ]}
        >
          Recently Viewed
        </Text>

        <View style={[styles.emptyState, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg }]}>
          <Text style={[textStyles.body, { color: colors.text.tertiary }]}>
            No recent searches yet
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
            Your history will appear here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StylistCard({ colors, borderRadius, shadows, spacing }: any) {
  return (
    <Pressable
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
      <View
        style={[
          styles.avatarPlaceholder,
          {
            backgroundColor: colors.surface.light,
            borderRadius: borderRadius.md,
          },
        ]}
      />
      <View style={styles.cardContent}>
        <Text style={[textStyles.h3, { color: colors.text.primary }]}>Stylist Name</Text>
        <Text style={[textStyles.bodySmall, { color: colors.text.secondary }]}>Natural Hair Specialist</Text>
        <View style={styles.cardMeta}>
          <Text style={[textStyles.caption, { color: colors.tertiary }]}>4.9 rating</Text>
          <Text style={[textStyles.caption, { color: colors.text.tertiary }]}> · 2.3 mi</Text>
        </View>
      </View>
      <Pressable style={styles.favoriteButton}>
        <VlossomFavoriteIcon size={20} color={colors.text.tertiary} />
      </Pressable>
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
  results: {
    flex: 1,
  },
  stylistCard: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  favoriteButton: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
});
