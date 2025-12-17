/**
 * Map Components (V5.0)
 *
 * Map-first discovery components for finding stylists and salons.
 *
 * Reference: docs/vlossom/16-ui-components-and-design-system.md Section 11
 */

export { StylistPin, SalonPin, ClusterPin, UserPin } from "./stylist-pin";
export { StylistMap } from "./stylist-map";
export { BookingSheet } from "./booking-sheet";

// Re-export types
export type { StylistMarker, SalonMarker, MarkerCluster } from "../../lib/mapbox";
