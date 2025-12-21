/**
 * Platform-specific MapView wrapper
 *
 * On native (iOS/Android): Uses react-native-maps
 * On web: Shows a placeholder since react-native-maps doesn't support web
 */

import { Platform, View, Text, StyleSheet } from 'react-native';

// Only import react-native-maps on native platforms
let MapViewNative: typeof import('react-native-maps').default | null = null;
let MarkerNative: typeof import('react-native-maps').Marker | null = null;
let PROVIDER_GOOGLE_NATIVE: typeof import('react-native-maps').PROVIDER_GOOGLE | null = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapViewNative = maps.default;
  MarkerNative = maps.Marker;
  PROVIDER_GOOGLE_NATIVE = maps.PROVIDER_GOOGLE;
}

// Re-export types
export type { Region, LatLng } from 'react-native-maps';

// Export PROVIDER_GOOGLE
export const PROVIDER_GOOGLE = PROVIDER_GOOGLE_NATIVE;

// Web fallback component
function MapViewWeb(props: { style?: object; children?: React.ReactNode }) {
  return (
    <View style={[styles.webFallback, props.style]}>
      <Text style={styles.webFallbackText}>Map View</Text>
      <Text style={styles.webFallbackSubtext}>
        Maps are only available on iOS and Android
      </Text>
    </View>
  );
}

function MarkerWeb(_props: object) {
  return null;
}

// Export the appropriate component based on platform
export const MapView = Platform.OS === 'web' ? MapViewWeb : MapViewNative!;
export const Marker = Platform.OS === 'web' ? MarkerWeb : MarkerNative!;

export default MapView;

const styles = StyleSheet.create({
  webFallback: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  webFallbackSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
