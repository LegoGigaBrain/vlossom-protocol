// Cancellation Policy & Refund Calculation
// Reference: docs/vlossom/07-booking-and-approval-flow.md

import { BookingStatus } from "@prisma/client";

/**
 * Cancellation timing thresholds (in hours before scheduled start)
 */
export const CANCELLATION_THRESHOLDS = {
  FULL_REFUND: 24, // Cancel >24h before = full refund
  PARTIAL_REFUND: 4, // Cancel 4-24h before = 50% refund
  NO_REFUND: 0, // Cancel <4h before = no refund
} as const;

/**
 * Refund percentages based on timing
 */
export const REFUND_PERCENTAGES = {
  FULL: 100,
  PARTIAL: 50,
  NONE: 0,
} as const;

/**
 * Calculate hours until booking start
 */
export function calculateHoursUntilStart(scheduledStartTime: Date): number {
  const now = new Date();
  const msUntilStart = scheduledStartTime.getTime() - now.getTime();
  return msUntilStart / (1000 * 60 * 60);
}

/**
 * Determine refund percentage based on cancellation timing
 */
export function getRefundPercentage(hoursUntilStart: number): number {
  if (hoursUntilStart >= CANCELLATION_THRESHOLDS.FULL_REFUND) {
    return REFUND_PERCENTAGES.FULL;
  }
  if (hoursUntilStart >= CANCELLATION_THRESHOLDS.PARTIAL_REFUND) {
    return REFUND_PERCENTAGES.PARTIAL;
  }
  return REFUND_PERCENTAGES.NONE;
}

/**
 * Calculate refund amount for customer cancellation
 */
export function calculateCustomerRefund(
  quoteAmountCents: bigint,
  scheduledStartTime: Date
): {
  refundAmountCents: bigint;
  refundPercentage: number;
  hoursUntilStart: number;
} {
  const hoursUntilStart = calculateHoursUntilStart(scheduledStartTime);
  const refundPercentage = getRefundPercentage(hoursUntilStart);
  const refundAmountCents =
    (quoteAmountCents * BigInt(refundPercentage)) / BigInt(100);

  return {
    refundAmountCents,
    refundPercentage,
    hoursUntilStart,
  };
}

/**
 * Calculate refund for stylist cancellation (always full refund)
 */
export function calculateStylistCancellationRefund(
  quoteAmountCents: bigint
): bigint {
  return quoteAmountCents; // Full refund for stylist cancellation
}

/**
 * Determine if cancellation is allowed based on current status
 */
export function canCancelBooking(status: BookingStatus): boolean {
  const cancellableStatuses: BookingStatus[] = [
    BookingStatus.PENDING_STYLIST_APPROVAL,
    BookingStatus.PENDING_CUSTOMER_PAYMENT,
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS, // Edge case - rare but allowed
  ];

  return cancellableStatuses.includes(status);
}

/**
 * Calculate compensation for stylist if customer cancels late
 */
export function calculateStylistCompensation(
  quoteAmountCents: bigint,
  scheduledStartTime: Date
): bigint {
  const hoursUntilStart = calculateHoursUntilStart(scheduledStartTime);
  const customerRefundPercentage = getRefundPercentage(hoursUntilStart);

  // Stylist gets what customer doesn't get refunded
  const compensationPercentage = 100 - customerRefundPercentage;
  return (quoteAmountCents * BigInt(compensationPercentage)) / BigInt(100);
}
