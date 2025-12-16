/**
 * Error Classification Utility
 *
 * Provides user-friendly error messages by classifying errors into types.
 * This helps distinguish between network issues, server errors, and app errors.
 */

export type ErrorType = "network" | "timeout" | "server" | "auth" | "validation" | "unknown";

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  retryable: boolean;
}

/**
 * Classifies an error and returns a user-friendly message
 */
export function classifyError(error: unknown): ClassifiedError {
  // Network errors (fetch failed, no internet)
  if (error instanceof TypeError) {
    if (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    ) {
      return {
        type: "network",
        message: "Unable to connect. Please check your internet connection.",
        originalError: error,
        retryable: true,
      };
    }
  }

  // Timeout errors
  if (error instanceof Error) {
    if (
      error.message.toLowerCase().includes("timeout") ||
      error.message.toLowerCase().includes("aborted") ||
      error.name === "AbortError"
    ) {
      return {
        type: "timeout",
        message: "The request timed out. Please try again.",
        originalError: error,
        retryable: true,
      };
    }

    // Authentication errors
    if (
      error.message.toLowerCase().includes("unauthorized") ||
      error.message.toLowerCase().includes("not authenticated") ||
      error.message.includes("401")
    ) {
      return {
        type: "auth",
        message: "Please sign in to continue.",
        originalError: error,
        retryable: false,
      };
    }

    // Validation errors (from API)
    if (
      error.message.toLowerCase().includes("validation") ||
      error.message.toLowerCase().includes("invalid") ||
      error.message.includes("400")
    ) {
      return {
        type: "validation",
        message: error.message || "Please check your input and try again.",
        originalError: error,
        retryable: false,
      };
    }

    // Server errors
    if (
      error.message.includes("500") ||
      error.message.includes("502") ||
      error.message.includes("503") ||
      error.message.toLowerCase().includes("server error")
    ) {
      return {
        type: "server",
        message: "Something went wrong on our end. Please try again later.",
        originalError: error,
        retryable: true,
      };
    }
  }

  // Default: unknown error
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";

  return {
    type: "unknown",
    message,
    originalError: error,
    retryable: true,
  };
}

/**
 * Gets a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  return classifyError(error).message;
}

/**
 * Checks if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  return classifyError(error).retryable;
}

/**
 * Common error messages for specific scenarios
 */
export const errorMessages = {
  // Booking errors
  bookingFailed: "Unable to create booking. Please try again.",
  bookingNotFound: "Booking not found.",
  bookingCancelFailed: "Unable to cancel booking. Please try again.",

  // Payment errors
  paymentFailed: "Payment failed. Please check your balance and try again.",
  insufficientBalance: "Insufficient balance. Please add funds to continue.",
  walletError: "Wallet error. Please try again.",

  // Auth errors
  loginFailed: "Login failed. Please check your credentials.",
  sessionExpired: "Your session has expired. Please sign in again.",

  // General errors
  networkError: "Unable to connect. Please check your internet connection.",
  serverError: "Something went wrong on our end. Please try again later.",
  unknownError: "Something went wrong. Please try again.",
} as const;
