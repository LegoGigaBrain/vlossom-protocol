// Property and Chair Types
// Reference: docs/vlossom/17-property-owner-and-chair-rental-module.md

/**
 * Property status
 */
export type PropertyStatus = "active" | "inactive" | "pending_verification";

/**
 * Chair rental pricing model
 */
export type ChairPricingModel = "hourly" | "daily" | "weekly" | "monthly" | "per_booking";

/**
 * Property entity (salon/space)
 */
export interface Property {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };

  // Details
  totalChairs: number;
  amenities: string[];
  operatingHours: OperatingHours[];
  houseRules?: string[];

  // Media
  photos: string[];
  coverPhoto?: string;

  // Status
  status: PropertyStatus;
  verifiedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Operating hours for a day
 */
export interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
  isClosed: boolean;
}

/**
 * Chair entity within a property
 */
export interface Chair {
  id: string;
  propertyId: string;
  name: string; // "Chair 1", "Station A"
  description?: string;

  // Pricing
  pricingModel: ChairPricingModel;
  pricePerUnit: number; // cents

  // Availability
  isAvailable: boolean;

  // Amenities specific to this chair
  amenities?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chair reservation (when a stylist books a chair)
 */
export interface ChairReservation {
  id: string;
  chairId: string;
  propertyId: string;
  stylistId: string;
  bookingId?: string; // Linked to a customer booking

  startTime: Date;
  endTime: Date;

  status: "pending" | "confirmed" | "cancelled" | "completed";

  priceCents: number;
  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
