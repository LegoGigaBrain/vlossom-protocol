/**
 * MapView Component - Barrel export
 *
 * Metro uses platform extensions to resolve:
 * - MapView.native.tsx for iOS/Android (uses react-native-maps)
 * - MapView.web.tsx for web (placeholder fallback)
 *
 * This file exists only to satisfy TypeScript imports when platform
 * extensions aren't being resolved at type-check time.
 */

// Re-export from web version for type checking
// At runtime, Metro will resolve to the correct platform file
export { MapView, Marker, PROVIDER_GOOGLE, type Region, type LatLng } from './MapView.web';
export default MapView;

import { MapView } from './MapView.web';
