/**
 * Map Components (V8.0)
 *
 * Map-first discovery components for finding stylists and salons.
 * V8.0: Added VlossomMap with Google Maps and botanical pins.
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

export { StylistPin, SalonPin, ClusterPin, UserPin } from "./stylist-pin";
export { StylistMap } from "./stylist-map";
export { VlossomMap } from "./vlossom-map";
export { BookingSheet } from "./booking-sheet";

// Re-export types
export type { StylistMarker, SalonMarker, MarkerCluster } from "../../lib/mapbox";
