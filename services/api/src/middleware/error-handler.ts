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
    details?: any;
  };
}

/**
 * Known error types with their HTTP status codes
 */
const ERROR_CODES: Record<string, { status: number; message: string }> = {
  // Authentication errors
  UNAUTHORIZED: { status: 401, message: 'Authentication required' },
  INVALID_TOKEN: { status: 401, message: 'Invalid or expired token' },
  FORBIDDEN: { status: 403, message: 'Insufficient permissions' },

  // Validation errors
  VALIDATION_ERROR: { status: 400, message: 'Invalid input data' },
  MISSING_FIELD: { status: 400, message: 'Required field missing' },

  // Resource errors
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found' },
  WALLET_NOT_FOUND: { status: 404, message: 'Wallet not found' },
  SERVICE_NOT_FOUND: { status: 404, message: 'Service not found' },

  // Business logic errors
  INVALID_STATUS: { status: 400, message: 'Invalid status for this operation' },
  INVALID_STATUS_TRANSITION: { status: 400, message: 'Invalid status transition' },
  CANNOT_CANCEL: { status: 400, message: 'Cannot cancel booking in current status' },
  INSUFFICIENT_BALANCE: { status: 400, message: 'Insufficient wallet balance' },
  INSUFFICIENT_ALLOWANCE: { status: 400, message: 'Insufficient token allowance' },

  // Payment errors
  PAYMENT_FAILED: { status: 400, message: 'Payment processing failed' },
  PAYMENT_VERIFICATION_FAILED: { status: 400, message: 'Payment verification failed' },
  ESCROW_ERROR: { status: 500, message: 'Escrow operation failed' },

  // Blockchain errors
  TRANSACTION_FAILED: { status: 500, message: 'Blockchain transaction failed' },
  CONTRACT_ERROR: { status: 500, message: 'Smart contract error' },

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
function createErrorResponse(code: string, message: string, details?: any): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
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
  next: NextFunction
) {
  // Log the error
  logger.error('Unhandled error', {
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

  // Send error response
  res.status(status).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(
    createErrorResponse(
      'NOT_FOUND',
      `Route ${req.method} ${req.path} not found`
    )
  );
}

/**
 * Create a standardized error
 */
export function createError(code: string, details?: any): AppError {
  const errorDef = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
  return new AppError(code, errorDef.message, errorDef.status, details);
}
