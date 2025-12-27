/**
 * Special Events Landing Screen (V7.2.0)
 *
 * Entry point for special event booking requests
 * Features:
 * - Event category selection
 * - Recent special events from stylists
 * - Quick start request flow
 *
 * V7.2.0: Full accessibility support with semantic roles
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomGrowingIcon,
  VlossomCalendarIcon,
  VlossomProfileIcon,
  VlossomFavoriteIcon,
} from '../../src/components/icons/VlossomIcons';

// Event categories based on spec
const EVENT_CATEGORIES = [
  {
    id: 'bridal',
    label: 'Bridal',
    description: 'Wedding day hair styling',
    icon: 'favorite',
    popular: true,
  },
  {
    id: 'photoshoot',
    label: 'Photoshoot',
    description: 'Editorial & portrait styling',
    icon: 'growing',
    popular: true,
  },
  {
    id: 'corporate',
    label: 'Corporate Event',
    description: 'Professional styling for teams',
    icon: 'profile',
    popular: false,
  },
  {
    id: 'party',
    label: 'Party',
    description: 'Special occasion styling',
    icon: 'calendar',
    popular: false,
  },
  {
    id: 'matric',
    label: 'Matric Dance',
    description: 'Prom & graduation styling',
    icon: 'growing',
    popular: true,
  },
  {
    id: 'other',
    label: 'Other Event',
    description: 'Custom event requests',
    icon: 'growing',
    popular: false,
  },
];

// Mock featured stylists for special events
const FEATURED_STYLISTS = [
  {
    id: '1',
    name: 'Thandi Mbeki',
    specialty: 'Bridal Specialist',
    rating: 4.9,
    completedEvents: 48,
    avatarUrl: null,
  },
  {
    id: '2',
    name: 'Precious Dlamini',
    specialty: 'Editorial Stylist',
    rating: 4.8,
    completedEvents: 32,
    avatarUrl: null,
  },
  {
    id: '3',
    name: 'Zanele Nkosi',
    specialty: 'Event Specialist',
    rating: 4.7,
    completedEvents: 25,
    avatarUrl: null,
  },
];

export default function SpecialEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const handleCategorySelect = (categoryId: string) => {
    router.push({
      pathname: '/special-events/request',
      params: { category: categoryId },
    });
  };

  const handleStartRequest = () => {
    router.push('/special-events/request');
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'favorite':
        return <VlossomFavoriteIcon size={24} color={colors.accent} focused />;
      case 'growing':
        return <VlossomGrowingIcon size={24} color={colors.accent} accent />;
      case 'profile':
        return <VlossomProfileIcon size={24} color={colors.primary} />;
      case 'calendar':
        return <VlossomCalendarIcon size={24} color={colors.primary} />;
      default:
        return <VlossomGrowingIcon size={24} color={colors.primary} />;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
    >
      {/* Hero Section */}
      <View
        style={[
          styles.heroSection,
          {
            backgroundColor: colors.accent + '15',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xl,
          },
        ]}
        accessible
        accessibilityRole="header"
        accessibilityLabel="Special Events. Custom styling for weddings, photoshoots, and special occasions"
      >
        <VlossomGrowingIcon size={40} color={colors.accent} accent />
        <Text
          style={[
            textStyles.h2,
            { color: colors.text.primary, marginTop: spacing.md, textAlign: 'center' },
          ]}
          aria-hidden
        >
          Special Events
        </Text>
        <Text
          style={[
            textStyles.body,
            { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
          aria-hidden
        >
          Custom styling for weddings, photoshoots, and special occasions
        </Text>

        <Pressable
          onPress={handleStartRequest}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.accent,
              borderRadius: borderRadius.pill,
              marginTop: spacing.lg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Request a Quote"
          accessibilityHint="Opens the special event request form"
        >
          <Text style={[textStyles.button, { color: colors.white }]} aria-hidden>Request a Quote</Text>
        </Pressable>
      </View>

      {/* Popular Categories */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <Text
          style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}
          accessibilityRole="header"
        >
          Popular Categories
        </Text>

        <View
          style={styles.categoriesGrid}
          accessibilityRole="list"
          accessibilityLabel="Popular event categories"
        >
          {EVENT_CATEGORIES.filter((c) => c.popular).map((category) => (
            <Pressable
              key={category.id}
              onPress={() => handleCategorySelect(category.id)}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: colors.background.primary,
                  borderRadius: borderRadius.lg,
                  ...shadows.card,
                },
              ]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${category.label}: ${category.description}`}
              accessibilityHint="Opens request form for this category"
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor: colors.accent + '15',
                    borderRadius: borderRadius.circle,
                  },
                ]}
                aria-hidden
              >
                {getIcon(category.icon)}
              </View>
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.primary, fontWeight: '600', marginTop: spacing.sm },
                ]}
                aria-hidden
              >
                {category.label}
              </Text>
              <Text
                style={[textStyles.caption, { color: colors.text.tertiary, textAlign: 'center' }]}
                numberOfLines={2}
                aria-hidden
              >
                {category.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* All Categories */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <Text
          style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}
          accessibilityRole="header"
        >
          All Event Types
        </Text>

        <View
          style={[
            styles.allCategoriesCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
          accessibilityRole="list"
          accessibilityLabel="All event types"
        >
          {EVENT_CATEGORIES.map((category, index) => {
            const isLast = index === EVENT_CATEGORIES.length - 1;
            return (
              <Pressable
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                style={[
                  styles.categoryRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth },
                  { borderBottomColor: colors.border.default },
                ]}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${category.label}: ${category.description}`}
                accessibilityHint="Opens request form for this category"
              >
                <View
                  style={[
                    styles.rowIcon,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  aria-hidden
                >
                  {getIcon(category.icon)}
                </View>
                <View style={styles.rowInfo} aria-hidden>
                  <Text style={[textStyles.bodySmall, { color: colors.text.primary }]}>
                    {category.label}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                    {category.description}
                  </Text>
                </View>
                <Text style={[textStyles.caption, { color: colors.text.muted }]} aria-hidden>→</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Featured Stylists */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <Text
          style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}
          accessibilityRole="header"
        >
          Top Event Stylists
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md }}
          accessibilityRole="list"
          accessibilityLabel="Top event stylists"
        >
          {FEATURED_STYLISTS.map((stylist) => (
            <Pressable
              key={stylist.id}
              style={[
                styles.stylistCard,
                {
                  backgroundColor: colors.background.primary,
                  borderRadius: borderRadius.lg,
                  ...shadows.card,
                },
              ]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${stylist.name}, ${stylist.specialty}, ${stylist.rating.toFixed(1)} stars, ${stylist.completedEvents} events completed`}
              accessibilityHint="Double tap to view stylist profile"
            >
              <View
                style={[
                  styles.stylistAvatar,
                  { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.circle },
                ]}
                aria-hidden
              >
                {stylist.avatarUrl ? (
                  <Image source={{ uri: stylist.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <VlossomProfileIcon size={28} color={colors.text.muted} />
                )}
              </View>
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.primary, fontWeight: '600', marginTop: spacing.sm },
                ]}
                aria-hidden
              >
                {stylist.name}
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]} aria-hidden>
                {stylist.specialty}
              </Text>
              <View style={styles.stylistMeta} aria-hidden>
                <Text style={[textStyles.caption, { color: colors.accent }]}>
                  ★ {stylist.rating.toFixed(1)}
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                  {' '}
                  • {stylist.completedEvents} events
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* How It Works */}
      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
        <Text
          style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.md }]}
          accessibilityRole="header"
        >
          How It Works
        </Text>

        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.lg,
              ...shadows.card,
            },
          ]}
          accessibilityRole="list"
          accessibilityLabel="How special event booking works"
        >
          {[
            { step: '1', title: 'Describe Your Event', desc: 'Tell us about your occasion and needs' },
            { step: '2', title: 'Get Custom Quotes', desc: 'Stylists send personalized proposals' },
            { step: '3', title: 'Book & Pay Deposit', desc: 'Secure your stylist with a 30% deposit' },
            { step: '4', title: 'Enjoy Your Event', desc: 'Professional styling for your special day' },
          ].map((item, index) => (
            <View
              key={item.step}
              style={[
                styles.stepRow,
                index < 3 && { borderBottomWidth: StyleSheet.hairlineWidth },
                { borderBottomColor: colors.border.default },
              ]}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Step ${item.step}: ${item.title}. ${item.desc}`}
            >
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: colors.accent + '20', borderRadius: borderRadius.circle },
                ]}
                aria-hidden
              >
                <Text style={[textStyles.bodySmall, { color: colors.accent, fontWeight: '700' }]}>
                  {item.step}
                </Text>
              </View>
              <View style={styles.stepInfo} aria-hidden>
                <Text style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}>
                  {item.title}
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    padding: 16,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCategoriesCard: {
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stylistCard: {
    width: 140,
    padding: 16,
    alignItems: 'center',
  },
  stylistAvatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  stylistMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  stepsCard: {
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
    marginLeft: 12,
  },
});
