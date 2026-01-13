/**
 * Platform-specific MapView wrapper - Native version
 *
 * This file is only loaded on iOS/Android via Metro's platform extensions.
 * The web version is in MapView.tsx (or MapView.web.tsx if needed).
 */

import React from 'react';
import RNMapView, {
  Marker as RNMarker,
  PROVIDER_GOOGLE as RN_PROVIDER_GOOGLE,
  type Region,
  type LatLng,
  type MapViewProps as RNMapViewProps,
  type MapMarkerProps as RNMarkerProps,
} from 'react-native-maps';

// Re-export types
export type { Region, LatLng };

// Export PROVIDER_GOOGLE
export const PROVIDER_GOOGLE = RN_PROVIDER_GOOGLE;

// Export MapView component
export const MapView = RNMapView;

// Export Marker component
export const Marker = RNMarker;

// Default export
export default MapView;
