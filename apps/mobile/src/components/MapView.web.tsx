/**
 * MapView Web Fallback
 *
 * react-native-maps doesn't support web, so we show a placeholder
 */

import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const PROVIDER_GOOGLE = null;

interface MapViewProps {
  style?: object;
  children?: React.ReactNode;
  provider?: unknown;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
  ref?: React.Ref<unknown>;
}

export const MapView = React.forwardRef<unknown, MapViewProps>((props, _ref) => {
  return (
    <View style={[styles.webFallback, props.style]}>
      <Text style={styles.webFallbackText}>Map View</Text>
      <Text style={styles.webFallbackSubtext}>
        Maps are only available on iOS and Android
      </Text>
    </View>
  );
});

MapView.displayName = 'MapView';

interface MarkerProps {
  coordinate: LatLng;
  onPress?: () => void;
  children?: React.ReactNode;
}

export function Marker(_props: MarkerProps) {
  return null;
}

export default MapView;

const styles = StyleSheet.create({
  webFallback: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
