/**
 * MapView Component Wrapper (V7.5.2 Mobile)
 *
 * Wraps react-native-maps with proper TypeScript exports
 * for use throughout the app.
 */

import React, { forwardRef, type Ref } from 'react';
import RNMapView, {
  Marker as RNMarker,
  PROVIDER_GOOGLE as RN_PROVIDER_GOOGLE,
  type Region as RNRegion,
  type MapViewProps as RNMapViewProps,
  type MapMarkerProps as RNMarkerProps,
  type LatLng,
} from 'react-native-maps';

// =============================================================================
// Types
// =============================================================================

export type Region = RNRegion;

/** Type for the MapView ref - use with useRef<MapViewRef>(null) */
export type MapViewRef = RNMapView;

export interface MapViewProps extends RNMapViewProps {
  children?: React.ReactNode;
}

export interface MarkerProps extends Omit<RNMarkerProps, 'coordinate'> {
  coordinate: LatLng;
  children?: React.ReactNode;
}

// =============================================================================
// MapView Component
// =============================================================================

/**
 * MapView component with forwardRef support
 *
 * Usage:
 * ```tsx
 * <MapView
 *   ref={mapRef}
 *   provider={PROVIDER_GOOGLE}
 *   initialRegion={region}
 *   showsUserLocation
 * >
 *   <Marker coordinate={{ latitude: -26.2041, longitude: 28.0473 }}>
 *     <CustomMarkerView />
 *   </Marker>
 * </MapView>
 * ```
 */
const MapView = forwardRef<RNMapView, MapViewProps>(
  function MapView(props, ref: Ref<RNMapView>) {
    return <RNMapView ref={ref} {...props} />;
  }
);

// =============================================================================
// Marker Component
// =============================================================================

/**
 * Marker component for placing pins on the map
 *
 * Supports custom children for custom marker views
 */
function Marker(props: MarkerProps) {
  return <RNMarker {...props} />;
}

// =============================================================================
// Exports
// =============================================================================

export { MapView, Marker };
export const PROVIDER_GOOGLE = RN_PROVIDER_GOOGLE;

// Default export for convenience
export default MapView;
