/**
 * Stylist Detail Screen (V7.2.0)
 *
 * Full profile view with:
 * - Cover image and avatar
 * - TPS/Reputation breakdown
 * - Services list with pricing
 * - Portfolio gallery
 * - Message and Book action buttons
 *
 * V7.2.0: Full accessibility support with semantic roles
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, textStyles } from '../../../src/styles/theme';
import {
  VlossomBackIcon,
  VlossomFavoriteIcon,
  VlossomLocationIcon,
  VlossomCalendarIcon,
} from '../../../src/components/icons/VlossomIcons';
import { useEffect, useState } from 'react';
import { useStylistsStore, selectSelectedStylist } from '../../../src/stores';
import { useDemoModeStore, selectIsDemoMode } from '../../../src/stores/demo-mode';
import {
  formatPrice,
  formatDistance,
  getOperatingModeLabel,
  getPinColor,
  type StylistService,
} from '../../../src/api/stylists';
import { TPSBreakdown, type ReputationScoreData } from '../../../src/components/ui/TPSBreakdown';
import { MOCK_STYLIST_REPUTATION } from '../../../src/data/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PORTFOLIO_ITEM_SIZE = (SCREEN_WIDTH - 48 - 8) / 3; // 3 columns with gaps

export default function StylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, shadows } = useTheme();

  // Store state
  const stylist = useStylistsStore(selectSelectedStylist);
  const { selectedStylistLoading, selectStylist, clearSelectedStylist } = useStylistsStore();

  // Local state
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio'>('services');

  // Demo mode for mock reputation data
  const isDemoMode = useDemoModeStore(selectIsDemoMode);

  // Mock reputation data for demo mode (TODO: fetch from API when real endpoint available)
  const reputationScore: ReputationScoreData = isDemoMode
    ? MOCK_STYLIST_REPUTATION
    : {
        totalScore: 8500,
        tpsScore: 8800,
        reliabilityScore: 8200,
        feedbackScore: 8500,
        disputeScore: 9000,
        completedBookings: 32,
        cancelledBookings: 2,
        isVerified: true,
      };

  // Fetch stylist on mount
  useEffect(() => {
    if (id) {
      selectStylist(id);
    }

    return () => {
      clearSelectedStylist();
    };
  }, [id, selectStylist, clearSelectedStylist]);

  const handleBack = () => {
    router.back();
  };

  const handleMessage = () => {
    if (stylist) {
      router.push(`/messages/${stylist.userId}`);
    }
  };

  const handleBook = () => {
    // TODO: Navigate to booking flow
    // For now, show an alert or navigate to a placeholder
    if (stylist) {
      router.push(`/stylists/${stylist.id}/book`);
    }
  };

  // Loading state
  if (selectedStylistLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Loading stylist profile"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={colors.primary} accessibilityElementsHidden />
        <Text style={[textStyles.body, { color: colors.text.tertiary, marginTop: spacing.md }]} aria-hidden>
          Loading stylist...
        </Text>
      </View>
    );
  }

  // Not found state
  if (!stylist) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel="Stylist not found"
        accessibilityLiveRegion="assertive"
      >
        <Text style={[textStyles.h3, { color: colors.text.primary }]} aria-hidden>Stylist not found</Text>
        <Pressable
          onPress={handleBack}
          style={[
            styles.backButton,
            { backgroundColor: colors.primary, borderRadius: borderRadius.md },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
          accessibilityHint="Returns to previous screen"
        >
          <Text style={[textStyles.body, { color: colors.white }]} aria-hidden>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const operatingModeColor = getPinColor(stylist.operatingMode);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Cover Image */}
        <View style={styles.headerContainer}>
          {/* Cover placeholder */}
          <View
            style={[
              styles.coverImage,
              { backgroundColor: colors.surface.light },
            ]}
          />

          {/* Back Button */}
          <Pressable
            onPress={handleBack}
            style={[
              styles.headerButton,
              styles.backButtonHeader,
              {
                top: insets.top + spacing.sm,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: borderRadius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to previous screen"
          >
            <VlossomBackIcon size={24} color={colors.white} />
          </Pressable>

          {/* Favorite Button */}
          <Pressable
            style={[
              styles.headerButton,
              styles.favoriteButtonHeader,
              {
                top: insets.top + spacing.sm,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: borderRadius.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add to favorites"
            accessibilityHint="Saves this stylist to your favorites"
          >
            <VlossomFavoriteIcon size={24} color={colors.white} />
          </Pressable>

          {/* Avatar */}
          <View
            style={[
              styles.avatarContainer,
              {
                borderColor: colors.background.primary,
                backgroundColor: colors.background.primary,
              },
            ]}
          >
            {stylist.avatarUrl ? (
              <Image source={{ uri: stylist.avatarUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.surface.light },
                ]}
              >
                <Text style={[textStyles.h1, { color: colors.text.tertiary }]}>
                  {stylist.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileSection, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[textStyles.h2, { color: colors.text.primary, textAlign: 'center' }]}
            accessibilityRole="header"
          >
            {stylist.displayName}
          </Text>

          {/* Operating Mode Badge */}
          <View
            style={styles.badgesRow}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${getOperatingModeLabel(stylist.operatingMode)}${stylist.verificationStatus === 'VERIFIED' ? ', Verified stylist' : ''}`}
          >
            <View
              style={[
                styles.modeBadge,
                {
                  backgroundColor: operatingModeColor + '20',
                  borderRadius: borderRadius.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
              aria-hidden
            >
              <Text style={[textStyles.bodySmall, { color: operatingModeColor }]}>
                {getOperatingModeLabel(stylist.operatingMode)}
              </Text>
            </View>
            {stylist.verificationStatus === 'VERIFIED' && (
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: colors.tertiary + '20',
                    borderRadius: borderRadius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginLeft: spacing.sm,
                  },
                ]}
                aria-hidden
              >
                <Text style={[textStyles.bodySmall, { color: colors.tertiary }]}>Verified</Text>
              </View>
            )}
          </View>

          {/* Specialties */}
          {stylist.specialties.length > 0 && (
            <Text
              style={[
                textStyles.body,
                { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
              ]}
              accessibilityLabel={`Specialties: ${stylist.specialties.join(', ')}`}
            >
              {stylist.specialties.join(' · ')}
            </Text>
          )}

          {/* Bio */}
          {stylist.bio && (
            <Text
              style={[
                textStyles.body,
                { color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.md },
              ]}
              accessibilityLabel={`About: ${stylist.bio}`}
            >
              {stylist.bio}
            </Text>
          )}

          {/* Location & Distance */}
          {stylist.baseLocation && (
            <View
              style={[styles.locationRow, { marginTop: spacing.md }]}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Location: ${stylist.baseLocation.address || 'Location available'}${stylist.distance !== null ? `, ${formatDistance(stylist.distance)} away` : ''}`}
            >
              <VlossomLocationIcon size={16} color={colors.text.tertiary} />
              <Text style={[textStyles.bodySmall, { color: colors.text.tertiary, marginLeft: spacing.xs }]} aria-hidden>
                {stylist.baseLocation.address || 'Location available'}
                {stylist.distance !== null && ` · ${formatDistance(stylist.distance)}`}
              </Text>
            </View>
          )}

          {/* Member Since */}
          <View
            style={[styles.memberSinceRow, { marginTop: spacing.sm }]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Member since ${new Date(stylist.memberSince).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`}
          >
            <VlossomCalendarIcon size={16} color={colors.text.muted} />
            <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: spacing.xs }]} aria-hidden>
              Member since {new Date(stylist.memberSince).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* TPS / Reputation Breakdown */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <TPSBreakdown score={reputationScore} variant="compact" />
        </View>

        {/* Tabs */}
        <View
          style={[styles.tabsContainer, { borderBottomColor: colors.border.default }]}
          accessibilityRole="tablist"
          accessibilityLabel="Profile sections"
        >
          <Pressable
            onPress={() => setActiveTab('services')}
            style={[
              styles.tab,
              activeTab === 'services' && {
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={`Services, ${stylist.services.length} available`}
            accessibilityState={{ selected: activeTab === 'services' }}
            accessibilityHint={activeTab === 'services' ? 'Currently selected' : 'Double tap to view services'}
          >
            <Text
              style={[
                textStyles.body,
                {
                  color: activeTab === 'services' ? colors.primary : colors.text.tertiary,
                  fontWeight: activeTab === 'services' ? '600' : '400',
                },
              ]}
              aria-hidden
            >
              Services ({stylist.services.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('portfolio')}
            style={[
              styles.tab,
              activeTab === 'portfolio' && {
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              },
            ]}
            accessibilityRole="tab"
            accessibilityLabel={`Portfolio, ${stylist.portfolioImages.length} images`}
            accessibilityState={{ selected: activeTab === 'portfolio' }}
            accessibilityHint={activeTab === 'portfolio' ? 'Currently selected' : 'Double tap to view portfolio'}
          >
            <Text
              style={[
                textStyles.body,
                {
                  color: activeTab === 'portfolio' ? colors.primary : colors.text.tertiary,
                  fontWeight: activeTab === 'portfolio' ? '600' : '400',
                },
              ]}
              aria-hidden
            >
              Portfolio ({stylist.portfolioImages.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={[styles.tabContent, { paddingHorizontal: spacing.lg }]}>
          {activeTab === 'services' ? (
            <ServicesTab
              services={stylist.services}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
              shadows={shadows}
            />
          ) : (
            <PortfolioTab
              images={stylist.portfolioImages}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
          )}
        </View>

        {/* Bottom Padding for Action Buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View
        style={[
          styles.actionButtonsContainer,
          {
            paddingBottom: insets.bottom + spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.default,
            ...shadows.card,
          },
        ]}
      >
        <Pressable
          onPress={handleMessage}
          style={[
            styles.actionButton,
            styles.messageButton,
            {
              borderColor: colors.primary,
              borderRadius: borderRadius.lg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Message ${stylist.displayName}`}
          accessibilityHint="Opens conversation with this stylist"
        >
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]} aria-hidden>
            Message
          </Text>
        </Pressable>
        <Pressable
          onPress={handleBook}
          style={[
            styles.actionButton,
            styles.bookButton,
            {
              backgroundColor: stylist.isAcceptingBookings ? colors.primary : colors.text.muted,
              borderRadius: borderRadius.lg,
            },
          ]}
          disabled={!stylist.isAcceptingBookings}
          accessibilityRole="button"
          accessibilityLabel={stylist.isAcceptingBookings ? `Book ${stylist.displayName}` : 'Stylist not available for booking'}
          accessibilityState={{ disabled: !stylist.isAcceptingBookings }}
          accessibilityHint={stylist.isAcceptingBookings ? 'Opens booking flow' : 'This stylist is currently not accepting bookings'}
        >
          <Text style={[textStyles.body, { color: colors.white, fontWeight: '600' }]} aria-hidden>
            {stylist.isAcceptingBookings ? 'Book Now' : 'Not Available'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Services Tab Component
interface ServicesTabProps {
  services: StylistService[];
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function ServicesTab({ services, colors, spacing, borderRadius, shadows }: ServicesTabProps) {
  if (services.length === 0) {
    return (
      <View
        style={[styles.emptyTab, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg }]}
        accessible
        accessibilityRole="text"
        accessibilityLabel="No services listed yet"
      >
        <Text style={[textStyles.body, { color: colors.text.tertiary }]} aria-hidden>
          No services listed yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.servicesContainer} accessibilityRole="list" accessibilityLabel="Services offered">
      {services.map((service) => {
        const serviceLabel = `${service.name}, ${service.category}, ${formatPrice(service.priceAmountCents)}, ${service.estimatedDurationMin} minutes${service.description ? `. ${service.description}` : ''}`;

        return (
          <View
            key={service.id}
            style={[
              styles.serviceCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.md,
                ...shadows.card,
              },
            ]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={serviceLabel}
          >
            <View style={styles.serviceHeader} aria-hidden>
              <View style={styles.serviceInfo}>
                <Text style={[textStyles.body, { color: colors.text.primary, fontWeight: '600' }]}>
                  {service.name}
                </Text>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: colors.surface.light,
                      borderRadius: borderRadius.sm,
                      paddingHorizontal: spacing.xs,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    {service.category}
                  </Text>
                </View>
              </View>
              <View style={styles.servicePricing}>
                <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]}>
                  {formatPrice(service.priceAmountCents)}
                </Text>
                <Text style={[textStyles.caption, { color: colors.text.tertiary }]}>
                  {service.estimatedDurationMin} min
                </Text>
              </View>
            </View>
            {service.description && (
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.text.tertiary, marginTop: spacing.sm },
                ]}
                aria-hidden
              >
                {service.description}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Portfolio Tab Component
interface PortfolioTabProps {
  images: string[];
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function PortfolioTab({ images, colors, spacing, borderRadius }: PortfolioTabProps) {
  if (images.length === 0) {
    return (
      <View
        style={[styles.emptyTab, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg }]}
        accessible
        accessibilityRole="text"
        accessibilityLabel="No portfolio images yet"
      >
        <Text style={[textStyles.body, { color: colors.text.tertiary }]} aria-hidden>
          No portfolio images yet
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.portfolioGrid}
      accessibilityRole="list"
      accessibilityLabel={`Portfolio gallery, ${images.length} images`}
    >
      {images.map((uri, index) => (
        <Pressable
          key={index}
          style={styles.portfolioItem}
          accessibilityRole="image"
          accessibilityLabel={`Portfolio image ${index + 1} of ${images.length}`}
          accessibilityHint="Double tap to view full size"
        >
          <Image
            source={{ uri }}
            style={[
              styles.portfolioImage,
              { borderRadius: borderRadius.md },
            ]}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  headerButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonHeader: {
    left: 16,
  },
  favoriteButtonHeader: {
    right: 16,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -48,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    marginTop: 56,
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modeBadge: {},
  verifiedBadge: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabContent: {
    paddingTop: 16,
  },
  emptyTab: {
    padding: 24,
    alignItems: 'center',
  },
  servicesContainer: {},
  serviceCard: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
  },
  categoryBadge: {},
  servicePricing: {
    alignItems: 'flex-end',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  portfolioItem: {
    width: PORTFOLIO_ITEM_SIZE,
    height: PORTFOLIO_ITEM_SIZE,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    borderWidth: 2,
    marginRight: 8,
  },
  bookButton: {
    marginLeft: 8,
  },
});
