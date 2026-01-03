/**
 * Vlossom Google Maps Style Configuration (V8.0)
 *
 * Uber-inspired muted aesthetic with botanical brand integration:
 * - Desaturated base colors for map elements
 * - Subtle roads and landmarks
 * - Brand-tinted water features (hint of primary purple)
 * - Clean, minimal visual hierarchy
 *
 * Usage:
 * - Web: Pass to @vis.gl/react-google-maps or google.maps.Map
 * - Mobile: Pass to react-native-maps MapView customMapStyle prop
 */

// Vlossom brand colors for reference
const BRAND = {
  primary: "#311E6B", // Deep purple
  primaryLight: "#4A2E8F",
  secondary: "#EFE3D0", // Cream
  tertiary: "#A9D326", // Lime green
  accent: "#FF510D", // Sacred orange
};

// Map color palette (muted/desaturated)
const COLORS = {
  // Base tones
  background: "#F5F5F5", // Light gray background
  backgroundDark: "#1A1A1E", // Dark mode background
  land: "#FAFAFA", // Very light for land
  landDark: "#242428", // Dark mode land
  water: "#E8E0F0", // Hint of purple in water
  waterDark: "#2A2535", // Dark purple-tinted water

  // Road hierarchy
  highway: "#FFFFFF",
  highwayDark: "#3A3A40",
  arterial: "#F5F5F5",
  arterialDark: "#2E2E34",
  local: "#FAFAFA",
  localDark: "#262628",

  // Text and labels
  text: "#666666",
  textDark: "#9A9AA0",
  textPrimary: "#333333",
  textPrimaryDark: "#E0E0E5",

  // Points of interest
  poi: "#EEEEEE",
  poiDark: "#2A2A30",
  park: "#E8F0E8",
  parkDark: "#1E2A1E",

  // Transit
  transit: "#E0E0E0",
  transitDark: "#3A3A40",
};

/**
 * Light mode map style - Uber-inspired muted aesthetic
 */
export const vlossomMapStyleLight: google.maps.MapTypeStyle[] = [
  // =========================================================================
  // BASE GEOMETRY
  // =========================================================================
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -80 }, { lightness: 10 }],
  },
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ saturation: -80 }],
  },

  // =========================================================================
  // WATER - Subtle purple tint
  // =========================================================================
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: COLORS.water }, { lightness: 0 }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: BRAND.primaryLight }],
  },

  // =========================================================================
  // LANDSCAPE
  // =========================================================================
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: COLORS.land }],
  },
  {
    featureType: "landscape.natural.terrain",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.background }],
  },

  // =========================================================================
  // ROADS - Clean hierarchy
  // =========================================================================
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: COLORS.highway }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.highway }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.textPrimary }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.arterial }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.text }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.local }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.text }],
  },

  // =========================================================================
  // POINTS OF INTEREST - Minimal
  // =========================================================================
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: COLORS.poi }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.text }],
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: COLORS.park }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: BRAND.tertiary }],
  },

  // =========================================================================
  // TRANSIT - Subtle
  // =========================================================================
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: COLORS.transit }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.text }],
  },

  // =========================================================================
  // ADMINISTRATIVE - Clean borders
  // =========================================================================
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E0E0E0" }, { weight: 1 }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.text }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#CCCCCC" }],
  },
];

/**
 * Dark mode map style - Uber-inspired dark aesthetic
 */
export const vlossomMapStyleDark: google.maps.MapTypeStyle[] = [
  // =========================================================================
  // BASE GEOMETRY - Dark mode
  // =========================================================================
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: COLORS.backgroundDark }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.textDark }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: COLORS.backgroundDark }, { weight: 2 }],
  },

  // =========================================================================
  // WATER - Dark purple tint
  // =========================================================================
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: COLORS.waterDark }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: BRAND.primaryLight }],
  },

  // =========================================================================
  // LANDSCAPE - Dark mode
  // =========================================================================
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: COLORS.landDark }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.backgroundDark }],
  },

  // =========================================================================
  // ROADS - Dark mode hierarchy
  // =========================================================================
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: COLORS.localDark }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.highwayDark }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: COLORS.textPrimaryDark }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.arterialDark }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: COLORS.localDark }],
  },

  // =========================================================================
  // POINTS OF INTEREST - Dark mode minimal
  // =========================================================================
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: COLORS.poiDark }],
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: COLORS.parkDark }],
  },

  // =========================================================================
  // TRANSIT - Dark mode subtle
  // =========================================================================
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: COLORS.transitDark }],
  },

  // =========================================================================
  // ADMINISTRATIVE - Dark mode borders
  // =========================================================================
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3A3A40" }, { weight: 1 }],
  },
];

/**
 * Map style selector based on theme
 */
export function getVlossomMapStyle(
  theme: "light" | "dark" | "system",
  systemPrefersDark?: boolean
): google.maps.MapTypeStyle[] {
  if (theme === "system") {
    return systemPrefersDark ? vlossomMapStyleDark : vlossomMapStyleLight;
  }
  return theme === "dark" ? vlossomMapStyleDark : vlossomMapStyleLight;
}

/**
 * Map configuration options for Google Maps
 */
export const vlossomMapOptions: Partial<google.maps.MapOptions> = {
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: {
    position: 3, // RIGHT_BOTTOM
  },
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  clickableIcons: false, // Disable POI click popups
};

/**
 * Export for React Native Maps (same styles work with customMapStyle prop)
 */
export const vlossomMapStyleRN = {
  light: vlossomMapStyleLight,
  dark: vlossomMapStyleDark,
};

export default {
  light: vlossomMapStyleLight,
  dark: vlossomMapStyleDark,
  getStyle: getVlossomMapStyle,
  options: vlossomMapOptions,
};
