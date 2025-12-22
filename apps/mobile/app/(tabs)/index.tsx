/**
 * Home Tab - Uber-like Map Discovery (V6.8.0)
 *
 * Purpose: Full-screen map with stylist pins + bottom sheet booking
 * Features:
 * - Full-screen map with color-coded stylist pins
 * - Search bar overlay
 * - Quick filters (Today, This Week, Mobile, etc.)
 * - Bottom sheet with stylist card and booking flow
 * - Never navigate away from map during booking
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE, type Region } from '../../src/components/MapView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme, textStyles } from '../../src/styles/theme';
import {
  VlossomSearchIcon,
  VlossomLocationIcon,
  VlossomCalendarIcon,
  VlossomCloseIcon,
} from '../../src/components/icons/VlossomIcons';
import { useStylistsStore } from '../../src/stores/stylists';
import {
  formatPrice,
  formatPriceRange,
  formatDistance,
  getPinColor,
  getOperatingModeLabel,
  type StylistSummary,
  type OperatingMode,
} from '../../src/api/stylists';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = 180;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.65;

// Johannesburg default location
const DEFAULT_REGION: Region = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const mapRef = useRef<MapView>(null);

  const {
    stylists,
    stylistsLoading,
    selectedStylist,
    userLocation,
    setUserLocation,
    fetchNearbyStylists,
    selectStylist,
    clearSelectedStylist,
    setFilter,
  } = useStylistsStore();

  // Local state
  const [locationLoading, setLocationLoading] = useState(true);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [activeFilter, setActiveFilter] = useState<string | null>('nearby');

  // Bottom sheet animation
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  // Request location permission and get user location
  useEffect(() => {
    (async () => {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        setLocationLoading(false);
        fetchNearbyStylists(); // Try with default location
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setRegion(newRegion);
        setUserLocation(location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.warn('Error getting location:', error);
      } finally {
        setLocationLoading(false);
      }
    })();
  }, [setUserLocation, fetchNearbyStylists]);

  // Fetch stylists when location changes
  useEffect(() => {
    if (userLocation) {
      fetchNearbyStylists();
    }
  }, [userLocation, fetchNearbyStylists]);

  // Handle marker press
  const handleMarkerPress = useCallback(
    (stylist: StylistSummary) => {
      selectStylist(stylist.id);
      expandSheet();
    },
    [selectStylist]
  );

  // Sheet animation functions
  const expandSheet = useCallback(() => {
    setIsSheetExpanded(true);
    Animated.spring(sheetHeight, {
      toValue: SHEET_MAX_HEIGHT,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [sheetHeight]);

  const collapseSheet = useCallback(() => {
    setIsSheetExpanded(false);
    clearSelectedStylist();
    Animated.spring(sheetHeight, {
      toValue: SHEET_MIN_HEIGHT,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [sheetHeight, clearSelectedStylist]);

  // Pan responder for sheet dragging
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = isSheetExpanded
          ? SHEET_MAX_HEIGHT - gestureState.dy
          : SHEET_MIN_HEIGHT - gestureState.dy;

        if (newHeight >= SHEET_MIN_HEIGHT && newHeight <= SHEET_MAX_HEIGHT) {
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          collapseSheet();
        } else if (gestureState.dy < -50) {
          expandSheet();
        } else {
          // Snap back
          Animated.spring(sheetHeight, {
            toValue: isSheetExpanded ? SHEET_MAX_HEIGHT : SHEET_MIN_HEIGHT,
            useNativeDriver: false,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Handle filter selection
  const handleFilterPress = useCallback((filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
      setFilter('operatingMode', null);
      setFilter('availability', null);
      fetchNearbyStylists();
    } else {
      setActiveFilter(filter);

      switch (filter) {
        case 'mobile':
          setFilter('operatingMode', 'MOBILE');
          break;
        case 'salon':
          setFilter('operatingMode', 'FIXED');
          break;
        case 'today':
          setFilter('availability', new Date().toISOString().split('T')[0]);
          break;
        default:
          break;
      }

      fetchNearbyStylists();
    }
  }, [activeFilter, setFilter, fetchNearbyStylists]);

  // Center on user location
  const handleCenterLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [userLocation]);

  return (
    <View style={styles.container}>
      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
      >
        {stylists.map((stylist) => (
          stylist.baseLocation && (
            <Marker
              key={stylist.id}
              coordinate={{
                latitude: stylist.baseLocation.lat,
                longitude: stylist.baseLocation.lng,
              }}
              onPress={() => handleMarkerPress(stylist)}
            >
              <View
                style={[
                  styles.markerContainer,
                  {
                    backgroundColor: getPinColor(stylist.operatingMode),
                    borderRadius: borderRadius.circle,
                  },
                ]}
              >
                <Text style={styles.markerText}>
                  {formatPrice(stylist.priceRange.min).replace('R', '')}
                </Text>
              </View>
            </Marker>
          )
        ))}
      </MapView>

      {/* Search Overlay */}
      <View
        style={[
          styles.searchOverlay,
          { top: insets.top + spacing.md, marginHorizontal: spacing.lg },
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
          onPress={() => router.push('/search')}
        >
          <VlossomSearchIcon size={20} color={colors.text.secondary} />
          <Text
            style={[textStyles.body, { color: colors.text.tertiary, marginLeft: spacing.sm }]}
          >
            Search stylists, services...
          </Text>
        </Pressable>
      </View>

      {/* Quick Filters */}
      <View
        style={[
          styles.filtersRow,
          { top: insets.top + spacing.md + 56, paddingHorizontal: spacing.lg },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="Nearby"
            active={activeFilter === 'nearby'}
            onPress={() => handleFilterPress('nearby')}
            colors={colors}
            borderRadius={borderRadius}
            spacing={spacing}
          />
          <FilterChip
            label="Today"
            active={activeFilter === 'today'}
            onPress={() => handleFilterPress('today')}
            colors={colors}
            borderRadius={borderRadius}
            spacing={spacing}
          />
          <FilterChip
            label="Mobile"
            active={activeFilter === 'mobile'}
            onPress={() => handleFilterPress('mobile')}
            colors={colors}
            borderRadius={borderRadius}
            spacing={spacing}
            color="#EF4444"
          />
          <FilterChip
            label="Salon"
            active={activeFilter === 'salon'}
            onPress={() => handleFilterPress('salon')}
            colors={colors}
            borderRadius={borderRadius}
            spacing={spacing}
            color="#22C55E"
          />
        </ScrollView>
      </View>

      {/* Center on Location Button */}
      <Pressable
        style={[
          styles.locationButton,
          {
            backgroundColor: colors.background.primary,
            borderRadius: borderRadius.circle,
            bottom: SHEET_MIN_HEIGHT + spacing.lg,
            right: spacing.lg,
            ...shadows.card,
          },
        ]}
        onPress={handleCenterLocation}
      >
        <VlossomLocationIcon size={24} color={colors.primary} />
      </Pressable>

      {/* Loading Overlay */}
      {(locationLoading || stylistsLoading) && stylists.length === 0 && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.lg,
                ...shadows.card,
              },
            ]}
          >
            <ActivityIndicator color={colors.primary} />
            <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
              {locationLoading ? 'Finding your location...' : 'Loading stylists...'}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: sheetHeight,
            backgroundColor: colors.background.primary,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            ...shadows.elevated,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: colors.border.default, borderRadius: borderRadius.pill },
            ]}
          />
        </View>

        {/* Sheet Content */}
        {selectedStylist ? (
          <StylistDetailCard
            stylist={selectedStylist}
            onClose={collapseSheet}
            onBook={() => {
              router.push(`/stylists/${selectedStylist.id}/book`);
            }}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
            shadows={shadows}
          />
        ) : (
          <QuickActionsContent
            stylists={stylists}
            onStylistPress={handleMarkerPress}
            colors={colors}
            spacing={spacing}
            borderRadius={borderRadius}
          />
        )}
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  color?: string;
}

function FilterChip({
  label,
  active,
  onPress,
  colors,
  borderRadius,
  spacing,
  color,
}: FilterChipProps) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? (color || colors.primary) : colors.background.primary,
          borderRadius: borderRadius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          marginRight: spacing.sm,
        },
      ]}
      onPress={onPress}
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

interface StylistCardType {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  operatingMode: OperatingMode;
  distance?: number | null;
  priceRange: { min: number; max: number };
  services: Array<{ id: string; name: string; priceAmountCents: string; estimatedDurationMin: number }>;
}

interface StylistDetailCardProps {
  stylist: StylistCardType;
  onClose: () => void;
  onBook: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
  shadows: ReturnType<typeof useTheme>['shadows'];
}

function StylistDetailCard({
  stylist,
  onClose,
  onBook,
  colors,
  spacing,
  borderRadius,
  shadows,
}: StylistDetailCardProps) {
  return (
    <ScrollView
      style={styles.sheetContent}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with close button */}
      <View style={styles.stylistHeader}>
        <View style={styles.stylistInfo}>
          {stylist.avatarUrl ? (
            <Image
              source={{ uri: stylist.avatarUrl }}
              style={[styles.avatar, { borderRadius: borderRadius.circle }]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.primary, borderRadius: borderRadius.circle },
              ]}
            >
              <Text style={[textStyles.h3, { color: colors.white }]}>
                {stylist.displayName.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.stylistText}>
            <Text style={[textStyles.h3, { color: colors.text.primary }]}>
              {stylist.displayName}
            </Text>
            <View style={styles.stylistMeta}>
              <View
                style={[
                  styles.modeBadge,
                  {
                    backgroundColor: getPinColor(stylist.operatingMode) + '20',
                    borderRadius: borderRadius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    textStyles.caption,
                    { color: getPinColor(stylist.operatingMode), fontWeight: '600' },
                  ]}
                >
                  {getOperatingModeLabel(stylist.operatingMode)}
                </Text>
              </View>
              {stylist.distance && (
                <Text style={[textStyles.caption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                  {formatDistance(stylist.distance)} away
                </Text>
              )}
            </View>
          </View>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <VlossomCloseIcon size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Bio */}
      {stylist.bio && (
        <Text
          style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.md }]}
          numberOfLines={2}
        >
          {stylist.bio}
        </Text>
      )}

      {/* Services */}
      <Text
        style={[textStyles.body, { color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm, fontWeight: '600' }]}
      >
        Services
      </Text>
      {stylist.services.slice(0, 3).map((service) => (
        <View
          key={service.id}
          style={[
            styles.serviceRow,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View>
            <Text style={[textStyles.body, { color: colors.text.primary }]}>{service.name}</Text>
            <Text style={[textStyles.caption, { color: colors.text.muted }]}>
              {service.estimatedDurationMin} min
            </Text>
          </View>
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: '600' }]}>
            {formatPrice(service.priceAmountCents)}
          </Text>
        </View>
      ))}

      {/* Book Button */}
      <Pressable
        style={[
          styles.bookButton,
          {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            marginTop: spacing.lg,
            ...shadows.soft,
          },
        ]}
        onPress={onBook}
      >
        <VlossomCalendarIcon size={20} color={colors.white} />
        <Text style={[textStyles.body, { color: colors.white, fontWeight: '600', marginLeft: spacing.sm }]}>
          Book Appointment
        </Text>
      </Pressable>
    </ScrollView>
  );
}

interface QuickActionsContentProps {
  stylists: StylistSummary[];
  onStylistPress: (stylist: StylistSummary) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  borderRadius: ReturnType<typeof useTheme>['borderRadius'];
}

function QuickActionsContent({
  stylists,
  onStylistPress,
  colors,
  spacing,
  borderRadius,
}: QuickActionsContentProps) {
  return (
    <View style={[styles.sheetContent, { paddingHorizontal: spacing.lg }]}>
      <Text style={[textStyles.h3, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        {stylists.length} stylists nearby
      </Text>
      <Text style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.md }]}>
        Tap a pin on the map to view details
      </Text>

      {/* Nearby Stylists Preview */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {stylists.slice(0, 5).map((stylist) => (
          <Pressable
            key={stylist.id}
            style={[
              styles.stylistCard,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                marginRight: spacing.md,
              },
            ]}
            onPress={() => onStylistPress(stylist)}
          >
            {stylist.avatarUrl ? (
              <Image
                source={{ uri: stylist.avatarUrl }}
                style={[styles.cardAvatar, { borderRadius: borderRadius.md }]}
              />
            ) : (
              <View
                style={[
                  styles.cardAvatar,
                  { backgroundColor: colors.primary, borderRadius: borderRadius.md },
                ]}
              >
                <Text style={[textStyles.body, { color: colors.white }]}>
                  {stylist.displayName.charAt(0)}
                </Text>
              </View>
            )}
            <Text
              style={[textStyles.bodySmall, { color: colors.text.primary, fontWeight: '600' }]}
              numberOfLines={1}
            >
              {stylist.displayName}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.muted }]}>
              {formatPriceRange(stylist.priceRange.min, stylist.priceRange.max)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    zIndex: 10,
  },
  filterChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  loadingCard: {
    padding: 24,
    alignItems: 'center',
  },
  markerContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
  },
  sheetContent: {
    flex: 1,
  },
  stylistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stylistInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stylistText: {
    marginLeft: 12,
    flex: 1,
  },
  stylistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  closeButton: {
    padding: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  stylistCard: {
    width: 120,
    padding: 12,
    alignItems: 'center',
  },
  cardAvatar: {
    width: 48,
    height: 48,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
