/**
 * Booking Components (V7.3.0)
 *
 * Reusable components for booking flows
 */

export { LocationSelector, DEFAULT_STYLIST_OPTIONS } from './LocationSelector';
export type { LocationType, LocationOption, SelectedLocation } from './LocationSelector';

export { ChairSelector, MOCK_PROPERTIES } from './ChairSelector';
export type { Chair, Property, SelectedChair } from './ChairSelector';

export { TravelPricing, calculateTravelFee } from './TravelPricing';
export type { TravelPricingProps, TravelFeeBreakdown, TravelMultiplier } from './TravelPricing';

// V7.3: Session Tracking
export { SessionTracker } from './SessionTracker';
export type { SessionTrackerProps } from './SessionTracker';
