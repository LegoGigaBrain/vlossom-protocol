/**
 * Global error handler middleware
 *
 * Catches all unhandled errors and returns standardized error responses.
 * Logs errors for debugging and monitoring.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Known error types with their HTTP status codes
 */
export const ERROR_CODES: Record<string, { status: number; message: string }> = {
  // Authentication errors
  UNAUTHORIZED: { status: 401, message: 'Authentication required' },
  INVALID_TOKEN: { status: 401, message: 'Invalid or expired token' },
  INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
  FORBIDDEN: { status: 403, message: 'Insufficient permissions' },
  ACCOUNT_LOCKED: { status: 423, message: 'Account temporarily locked due to too many failed attempts' },

  // SIWE errors (V3.2)
  INVALID_SIWE_MESSAGE: { status: 400, message: 'Invalid SIWE message format' },
  INVALID_SIWE_SIGNATURE: { status: 401, message: 'Invalid signature' },
  SIWE_MESSAGE_EXPIRED: { status: 401, message: 'SIWE message has expired' },
  SIWE_NONCE_INVALID: { status: 401, message: 'Invalid or expired nonce' },
  SIWE_NONCE_USED: { status: 401, message: 'Nonce has already been used' },
  WALLET_ALREADY_LINKED: { status: 409, message: 'This wallet is already linked to another account' },
  CANNOT_UNLINK_LAST_AUTH: { status: 400, message: 'Cannot unlink your only authentication method' },
  AUTH_METHOD_NOT_FOUND: { status: 404, message: 'Authentication method not found' },

  // Validation errors
  VALIDATION_ERROR: { status: 400, message: 'Invalid input data' },
  MISSING_FIELD: { status: 400, message: 'Required field missing' },
  INVALID_EMAIL: { status: 400, message: 'Invalid email format' },
  WEAK_PASSWORD: { status: 400, message: 'Password must be at least 8 characters' },
  INVALID_ROLE: { status: 400, message: 'Role must be either CUSTOMER or STYLIST' },

  // Resource errors
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  USER_NOT_FOUND: { status: 404, message: 'User not found' },
  BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found' },
  WALLET_NOT_FOUND: { status: 404, message: 'Wallet not found' },
  SERVICE_NOT_FOUND: { status: 404, message: 'Service not found' },
  STYLIST_NOT_FOUND: { status: 404, message: 'Stylist profile not found' },
  AVAILABILITY_NOT_FOUND: { status: 404, message: 'Availability not found' },
  PROPERTY_NOT_FOUND: { status: 404, message: 'Property not found' },
  CHAIR_NOT_FOUND: { status: 404, message: 'Chair not found' },
  REVIEW_NOT_FOUND: { status: 404, message: 'Review not found' },
  NOTIFICATION_NOT_FOUND: { status: 404, message: 'Notification not found' },

  // Conflict errors
  EMAIL_EXISTS: { status: 409, message: 'This email is already registered' },
  DUPLICATE_ENTRY: { status: 409, message: 'A record with this value already exists' },
  DUPLICATE_REVIEW: { status: 409, message: 'You have already reviewed this booking' },

  // Business logic errors
  INVALID_STATUS: { status: 400, message: 'Invalid status for this operation' },
  INVALID_STATUS_TRANSITION: { status: 400, message: 'Invalid status transition' },
  CANNOT_CANCEL: { status: 400, message: 'Cannot cancel booking in current status' },
  SERVICE_INACTIVE: { status: 400, message: 'This service is no longer available' },
  STYLIST_NOT_ACCEPTING: { status: 400, message: 'This stylist is not currently accepting bookings' },
  SCHEDULING_CONFLICT: { status: 409, message: 'The requested time slot is not available' },
  SERVICE_HAS_BOOKINGS: { status: 409, message: 'Cannot delete service with active bookings' },
  PAYMENT_INSTRUCTIONS_ERROR: { status: 400, message: 'Failed to get payment instructions' },
  INSUFFICIENT_BALANCE: { status: 400, message: 'Insufficient wallet balance' },
  INSUFFICIENT_ALLOWANCE: { status: 400, message: 'Insufficient token allowance' },
  CANNOT_BOOK_OWN_SERVICE: { status: 400, message: 'You cannot book your own service' },
  SLOT_UNAVAILABLE: { status: 400, message: 'Selected time slot is not available' },
  BOOKING_ALREADY_PAID: { status: 400, message: 'Booking has already been paid' },
  CANNOT_START_SERVICE: { status: 400, message: 'Cannot start service in current status' },
  CANNOT_COMPLETE_SERVICE: { status: 400, message: 'Cannot complete service in current status' },
  FAUCET_RATE_LIMITED: { status: 429, message: 'Faucet can only be used once every 24 hours' },

  // Payment errors
  PAYMENT_FAILED: { status: 400, message: 'Payment processing failed' },
  PAYMENT_VERIFICATION_FAILED: { status: 400, message: 'Payment verification failed' },
  ESCROW_ERROR: { status: 500, message: 'Escrow operation failed' },
  ESCROW_RELEASE_FAILED: { status: 500, message: 'Failed to release escrow funds' },

  // Property errors
  STYLIST_BLOCKED: { status: 403, message: 'You are not allowed to rent chairs at this property' },
  CHAIR_UNAVAILABLE: { status: 400, message: 'Chair is not available for rental' },
  CHAIR_HAS_ACTIVE_RENTALS: { status: 400, message: 'Cannot delete chair with active rentals' },
  RENTAL_NOT_FOUND: { status: 404, message: 'Rental request not found' },
  RENTAL_ALREADY_PROCESSED: { status: 400, message: 'Rental request has already been processed' },
  STYLIST_ALREADY_BLOCKED: { status: 400, message: 'Stylist is already blocked' },

  // Admin errors
  ADMIN_REQUIRED: { status: 403, message: 'Admin access required' },
  SERVICE_NOT_INITIALIZED: { status: 503, message: 'Service not initialized' },

  // Blockchain errors
  TRANSACTION_FAILED: { status: 500, message: 'Blockchain transaction failed' },
  CONTRACT_ERROR: { status: 500, message: 'Smart contract error' },
  WALLET_CREATION_FAILED: { status: 500, message: 'Failed to create wallet' },

  // Upload errors
  UPLOAD_FAILED: { status: 500, message: 'File upload failed' },
  INVALID_FILE_TYPE: { status: 400, message: 'Invalid file type' },
  INVALID_FILE: { status: 400, message: 'Invalid file' },
  INVALID_CONTENT_TYPE: { status: 400, message: 'Invalid content type' },
  NO_FILE: { status: 400, message: 'No file data received' },
  NOT_A_STYLIST: { status: 403, message: 'Only stylists can perform this action' },
  SIGNATURE_FAILED: { status: 500, message: 'Failed to generate upload signature' },
  PORTFOLIO_LIMIT: { status: 400, message: 'Portfolio image limit reached' },

  // Server errors
  INTERNAL_ERROR: { status: 500, message: 'An unexpected error occurred' },
  DATABASE_ERROR: { status: 500, message: 'Database operation failed' },
  SERVICE_UNAVAILABLE: { status: 503, message: 'Service temporarily unavailable' }
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Create a standardized error response
 */
function createErrorResponse(code: string, message: string, details?: unknown): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code,
      message,
    }
  };
  if (details) {
    response.error.details = details;
  }
  return response;
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): { status: number; response: ErrorResponse } {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));

  return {
    status: 400,
    response: createErrorResponse(
      'VALIDATION_ERROR',
      'Invalid input data',
      details
    )
  };
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): { status: number; response: ErrorResponse } {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return {
        status: 409,
        response: createErrorResponse(
          'DUPLICATE_ENTRY',
          'A record with this value already exists',
          { field: error.meta?.target }
        )
      };

    case 'P2025':
      // Record not found
      return {
        status: 404,
        response: createErrorResponse(
          'NOT_FOUND',
          'Record not found'
        )
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        status: 400,
        response: createErrorResponse(
          'INVALID_REFERENCE',
          'Referenced record does not exist',
          { field: error.meta?.field_name }
        )
      };

    default:
      return {
        status: 500,
        response: createErrorResponse(
          'DATABASE_ERROR',
          'Database operation failed',
          process.env.NODE_ENV === 'development' ? { code: error.code } : undefined
        )
      };
  }
}

/**
 * Global error handler middleware
 *
 * This should be the last middleware in the chain.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log the error with request ID for tracing
  logger.error('Unhandled error', {
    requestId: (req as any).requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId
  });

  // Handle different error types
  let status = 500;
  let response: ErrorResponse;

  if (err instanceof AppError) {
    // Custom application error
    status = err.statusCode;
    response = createErrorResponse(err.code, err.message, err.details);
  } else if (err instanceof ZodError) {
    // Zod validation error
    const result = handleZodError(err);
    status = result.status;
    response = result.response;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database error
    const result = handlePrismaError(err);
    status = result.status;
    response = result.response;
  } else if (err.name === 'UnauthorizedError') {
    // JWT authentication error (from express-jwt)
    status = 401;
    response = createErrorResponse('UNAUTHORIZED', 'Invalid or expired token');
  } else {
    // Unknown error - return generic message
    response = createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? { message: err.message } : undefined
    );
  }

  // Include request ID in error response for client-side tracing
  const responseWithRequestId = {
    ...response,
    requestId: (req as any).requestId
  };

  // Send error response
  res.status(status).json(responseWithRequestId);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    ...createErrorResponse(
      'NOT_FOUND',
      `Route ${req.method} ${req.path} not found`
    ),
    requestId: (req as any).requestId
  });
}

/**
 * Create a standardized error
 */
export function createError(code: string, details?: unknown): AppError {
  const errorDef = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
  return new AppError(code, errorDef.message, errorDef.status, details);
}
