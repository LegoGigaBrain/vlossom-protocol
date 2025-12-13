// Reputation Types
// Reference: docs/vlossom/08-reputation-system-flow.md

/**
 * Actor type for reputation
 */
export type ReputationActorType = "stylist" | "customer" | "property_owner";

/**
 * Stylist reputation scores (0-100 scale)
 */
export interface StylistReputationScores {
  // Time Performance Score
  tps: number;
  // Booking reliability (cancellations, no-shows, response time)
  bookingReliability: number;
  // Customer feedback aggregate
  customerFeedback: number;
  // Property owner feedback (Phase 2)
  propertyFeedback: number;
  // Dispute & compliance score
  disputeCompliance: number;
  // Weighted composite score
  composite: number;
}

/**
 * Customer reputation scores (0-100 scale)
 */
export interface CustomerReputationScores {
  punctuality: number;
  bookingReliability: number;
  behavior: number;
  dispute: number;
  composite: number;
}

/**
 * Property reputation scores (0-100 scale)
 */
export interface PropertyReputationScores {
  spaceQuality: number;
  operationalReliability: number;
  stylistReviews: number;
  disputeHistory: number;
  composite: number;
}

/**
 * Reputation event types
 */
export type ReputationEventType =
  | "booking_completed"
  | "booking_cancelled"
  | "booking_no_show"
  | "review_received"
  | "dispute_raised"
  | "dispute_resolved"
  | "late_start"
  | "early_completion"
  | "on_time";

/**
 * Reputation event log
 */
export interface ReputationEvent {
  id: string;
  actorId: string;
  actorType: ReputationActorType;
  eventType: ReputationEventType;
  relatedBookingId?: string;
  scoreImpact: number; // positive or negative
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Behavioral flags (non-numeric reputation signals)
 */
export type BehavioralFlag =
  | "consistent_lateness"
  | "repeated_cancellations"
  | "hygiene_issues"
  | "policy_violations"
  | "safety_concerns"
  | "dispute_frequency"
  | "inappropriate_behavior";

/**
 * Actor behavioral flag record
 */
export interface ActorBehavioralFlag {
  actorId: string;
  actorType: ReputationActorType;
  flag: BehavioralFlag;
  count: number;
  lastOccurrence: Date;
  decayDate?: Date; // When the flag should be removed
}

/**
 * Structured review (customer → stylist)
 */
export interface StylistReview {
  id: string;
  bookingId: string;
  customerId: string;
  stylistId: string;

  // Structured scores (1-5)
  professionalism: number;
  cleanlinessEquipment: number;
  communication: number;
  qualityOfService: number;
  hairstyleOutcome: number;

  // Optional text
  comment?: string;

  createdAt: Date;
}
