// Booking State Machine
// Reference: docs/vlossom/07-booking-and-approval-flow.md

import { BookingStatus } from "@prisma/client";

/**
 * Valid state transitions for booking lifecycle
 * Enforces business rules at the service layer
 */
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_STYLIST_APPROVAL: [
    BookingStatus.PENDING_CUSTOMER_PAYMENT, // Stylist approves
    BookingStatus.DECLINED, // Stylist declines
    BookingStatus.CANCELLED, // Customer cancels before approval
  ],
  PENDING_CUSTOMER_PAYMENT: [
    BookingStatus.CONFIRMED, // Payment successful
    BookingStatus.CANCELLED, // Payment timeout or customer cancels
  ],
  CONFIRMED: [
    BookingStatus.IN_PROGRESS, // Service starts
    BookingStatus.CANCELLED, // Either party cancels
  ],
  IN_PROGRESS: [
    BookingStatus.COMPLETED, // Service completes
    BookingStatus.CANCELLED, // Edge case - service interrupted
  ],
  COMPLETED: [
    BookingStatus.AWAITING_CUSTOMER_CONFIRMATION, // Stylist marks complete
    BookingStatus.DISPUTED, // Customer disputes
  ],
  AWAITING_CUSTOMER_CONFIRMATION: [
    BookingStatus.SETTLED, // Customer confirms or auto-confirm
    BookingStatus.DISPUTED, // Customer disputes
  ],
  SETTLED: [], // Terminal state
  CANCELLED: [], // Terminal state
  DECLINED: [], // Terminal state
  DISPUTED: [
    BookingStatus.SETTLED, // Dispute resolved
    BookingStatus.CANCELLED, // Dispute resolved with cancellation
  ],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus
): boolean {
  const validTargets = VALID_TRANSITIONS[currentStatus];
  return validTargets.includes(targetStatus);
}

/**
 * Validate a state transition and throw if invalid
 */
export function validateTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus
): void {
  if (!canTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} -> ${targetStatus}`
    );
  }
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: BookingStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/**
 * Get all valid next states for a given status
 */
export function getValidNextStates(status: BookingStatus): BookingStatus[] {
  return VALID_TRANSITIONS[status];
}
