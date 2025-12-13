// Booking Types
// Reference: docs/vlossom/07-booking-and-approval-flow.md

/**
 * Booking status state machine
 * PENDING → APPROVED/DECLINED → IN_PROGRESS → COMPLETED/CANCELLED
 */
export type BookingStatus =
  | "pending"
  | "approved"
  | "declined"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded";

/**
 * Location type for the booking
 */
export type LocationType = "stylist_location" | "customer_location" | "property";

/**
 * Cancellation party
 */
export type CancellationParty =
  | "customer"
  | "stylist"
  | "property_owner"
  | "system";

/**
 * Core booking entity
 */
export interface Booking {
  id: string;
  customerId: string;
  stylistId: string;
  propertyId?: string; // Optional - Phase 2
  chairId?: string; // Optional - Phase 2

  // Service details
  serviceType: string;
  serviceCategory: string;
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes

  // Scheduling
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Location
  locationType: LocationType;
  locationAddress: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };

  // Pricing
  quoteAmountCents: number;
  finalAmountCents?: number;
  platformFeeCents: number;
  stylistPayoutCents: number;
  propertyPayoutCents?: number;

  // Status
  status: BookingStatus;
  statusHistory: BookingStatusChange[];

  // Escrow
  escrowId?: string;
  escrowStatus?: "locked" | "released" | "refunded";

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: CancellationParty;
  cancellationReason?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking status change event
 */
export interface BookingStatusChange {
  from: BookingStatus;
  to: BookingStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

/**
 * Booking request (pre-creation)
 */
export interface BookingRequest {
  customerId: string;
  stylistId: string;
  serviceType: string;
  serviceCategory: string;
  estimatedDuration: number;
  requestedTime: Date;
  locationType: LocationType;
  locationAddress?: string;
  notes?: string;
}
