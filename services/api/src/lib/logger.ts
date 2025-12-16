/**
 * Centralized logging utility using Winston
 *
 * Provides structured logging with different log levels and transports.
 * Logs are written to console and optionally to files in production.
 */

import winston from 'winston';
import { Request, Response } from 'express';

/**
 * Extended request interface for logging
 */
interface RequestWithId extends Request {
  requestId?: string;
}

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;

  // Add stack trace if present (for errors)
  if (stack) {
    msg += `\n${stack}`;
  }

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }

  return msg;
});

// Create Winston logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Capture stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'vlossom-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport with colored output
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

/**
 * Log an HTTP request
 */
export function logRequest(req: RequestWithId) {
  logger.info('HTTP Request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
}

/**
 * Log an HTTP response
 */
export function logResponse(req: RequestWithId, res: Response, duration: number) {
  logger.info('HTTP Response', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`
  });
}

/**
 * Log a blockchain transaction
 */
export function logTransaction(action: string, txHash: string, metadata?: Record<string, unknown>) {
  logger.info('Blockchain Transaction', {
    action,
    txHash,
    ...metadata
  });
}

/**
 * Log an escrow operation
 */
export function logEscrowOperation(operation: string, bookingId: string, success: boolean, metadata?: Record<string, unknown>) {
  const level = success ? 'info' : 'error';
  logger[level]('Escrow Operation', {
    operation,
    bookingId,
    success,
    ...metadata
  });
}

/**
 * Log a booking status change
 */
export function logBookingStatusChange(
  bookingId: string,
  fromStatus: string | null,
  toStatus: string,
  userId: string,
  metadata?: Record<string, unknown>
) {
  logger.info('Booking Status Change', {
    bookingId,
    fromStatus,
    toStatus,
    userId,
    ...metadata
  });
}

/**
 * Log an authentication event
 */
export function logAuthEvent(event: string, userId?: string, metadata?: Record<string, unknown>) {
  logger.info('Authentication Event', {
    event,
    userId,
    ...metadata
  });
}

/**
 * Log a wallet operation
 */
export function logWalletOperation(operation: string, walletAddress: string, metadata?: Record<string, unknown>) {
  logger.info('Wallet Operation', {
    operation,
    walletAddress,
    ...metadata
  });
}

export default logger;
