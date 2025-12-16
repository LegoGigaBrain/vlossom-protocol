/**
 * Authorization utilities for booking access control
 *
 * Provides helper functions to verify that users have the correct
 * permissions to perform actions on bookings.
 *
 * SECURITY AUDIT (V1.9.0):
 * - L-4: Authorization failure logging
 */

import { Booking } from "@prisma/client";
import { logger } from "../lib/logger";

/**
 * L-4: Log authorization failure as security event
 */
function logAuthorizationFailure(
  userId: string,
  bookingId: string,
  requiredRole: "customer" | "stylist" | "any",
  actualRole: "customer" | "stylist" | null
): void {
  logger.warn('Authorization failed', {
    event: 'authz_failure',
    userId,
    bookingId,
    requiredRole,
    actualRole,
  });
}

/**
 * Check if user is authorized to access a booking
 *
 * @param userId - User attempting access
 * @param booking - Booking to check access for
 * @param requiredRole - Required role: 'customer', 'stylist', or 'any'
 * @param logFailure - Whether to log authorization failures (default: true)
 * @returns true if user is authorized
 */
export function authorizeBookingAccess(
  userId: string,
  booking: Booking,
  requiredRole: "customer" | "stylist" | "any",
  logFailure: boolean = true
): boolean {
  const actualRole = getUserBookingRole(userId, booking);
  let authorized = false;

  if (requiredRole === "customer") {
    authorized = userId === booking.customerId;
  } else if (requiredRole === "stylist") {
    authorized = userId === booking.stylistId;
  } else {
    // requiredRole === 'any' - either customer or stylist
    authorized = userId === booking.customerId || userId === booking.stylistId;
  }

  // L-4: Log authorization failures
  if (!authorized && logFailure) {
    logAuthorizationFailure(userId, booking.id, requiredRole, actualRole);
  }

  return authorized;
}

/**
 * Check if user is the customer for a booking
 *
 * @param userId - User to check
 * @param booking - Booking to check
 * @returns true if user is the customer
 */
export function isCustomer(userId: string, booking: Booking): boolean {
  return userId === booking.customerId;
}

/**
 * Check if user is the stylist for a booking
 *
 * @param userId - User to check
 * @param booking - Booking to check
 * @returns true if user is the stylist
 */
export function isStylist(userId: string, booking: Booking): boolean {
  return userId === booking.stylistId;
}

/**
 * Get user's role in a booking
 *
 * @param userId - User to check
 * @param booking - Booking to check
 * @returns 'customer', 'stylist', or null if user is not involved
 */
export function getUserBookingRole(
  userId: string,
  booking: Booking
): "customer" | "stylist" | null {
  if (userId === booking.customerId) return "customer";
  if (userId === booking.stylistId) return "stylist";
  return null;
}

/**
 * Authorization error response
 */
export interface AuthorizationError {
  code: string;
  message: string;
  statusCode: number;
}

/**
 * Create a forbidden error for unauthorized booking access
 *
 * @param action - Action being attempted (e.g., "approve", "cancel")
 * @param requiredRole - Role required for the action
 * @returns Structured error response
 */
export function createForbiddenError(
  action: string,
  requiredRole: "customer" | "stylist" | "any"
): AuthorizationError {
  const roleText =
    requiredRole === "any"
      ? "the customer or stylist"
      : requiredRole === "customer"
      ? "the customer"
      : "the stylist";

  return {
    code: "FORBIDDEN",
    message: `Only ${roleText} can ${action} this booking`,
    statusCode: 403,
  };
}
