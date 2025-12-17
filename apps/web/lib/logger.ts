/**
 * Structured Logger for Vlossom Web App
 *
 * MAJOR-1: Replace console.* with structured logging
 * Reference: Code Review - 41 console statements across 23 files
 *
 * Features:
 * - Strips debug/info logs in production builds
 * - Sends errors to Sentry when configured
 * - Includes correlation context (user, session, etc.)
 * - Type-safe log levels
 *
 * Usage:
 * import { logger } from '@/lib/logger';
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Payment failed', { bookingId, error });
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configuration based on environment
const config: LoggerConfig = {
  minLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
  enableConsole: process.env.NODE_ENV !== "production",
  enableSentry: typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
};

// Correlation context (set per-session)
let correlationContext: LogContext = {};

/**
 * Set correlation context for all subsequent logs
 * Call this after user authentication
 */
export function setLogContext(context: LogContext): void {
  correlationContext = { ...correlationContext, ...context };
}

/**
 * Clear correlation context (call on logout)
 */
export function clearLogContext(): void {
  correlationContext = {};
}

/**
 * Format log message for console output
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Should this log level be output?
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

/**
 * Send error to Sentry
 */
function sendToSentry(
  level: LogLevel,
  message: string,
  context?: LogContext
): void {
  if (!config.enableSentry) return;

  const fullContext = { ...correlationContext, ...context };

  if (level === "error") {
    // Check if context contains an Error object
    const error = context?.error;
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: fullContext,
        tags: { source: "logger" },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        extra: fullContext,
        tags: { source: "logger" },
      });
    }
  } else if (level === "warn") {
    Sentry.captureMessage(message, {
      level: "warning",
      extra: fullContext,
      tags: { source: "logger" },
    });
  }
}

/**
 * Core log function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const fullContext = context
    ? { ...correlationContext, ...context }
    : Object.keys(correlationContext).length > 0
      ? correlationContext
      : undefined;

  // Console output (disabled in production)
  if (config.enableConsole) {
    const formatted = formatMessage(level, message, fullContext);
    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(formatted);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(formatted);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(formatted);
        break;
      case "error":
        // eslint-disable-next-line no-console
        console.error(formatted);
        break;
    }
  }

  // Sentry for warnings and errors
  if (level === "warn" || level === "error") {
    sendToSentry(level, message, fullContext);
  }
}

/**
 * Logger instance with typed methods
 */
export const logger = {
  /**
   * Debug level - development only, stripped in production
   */
  debug(message: string, context?: LogContext): void {
    log("debug", message, context);
  },

  /**
   * Info level - general information, stripped in production
   */
  info(message: string, context?: LogContext): void {
    log("info", message, context);
  },

  /**
   * Warn level - potential issues, sent to Sentry
   */
  warn(message: string, context?: LogContext): void {
    log("warn", message, context);
  },

  /**
   * Error level - errors, always sent to Sentry
   */
  error(message: string, context?: LogContext): void {
    log("error", message, context);
  },

  /**
   * Set correlation context for subsequent logs
   */
  setContext: setLogContext,

  /**
   * Clear correlation context
   */
  clearContext: clearLogContext,
};

export default logger;
