/**
 * Sentry Integration for Backend (F5.3)
 * Error tracking, performance monitoring, and alerting
 */

import * as Sentry from "@sentry/node";
import { Express, Request, Response, NextFunction } from "express";

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
}

/**
 * Initialize Sentry for the backend API
 */
export function initSentry(config: SentryConfig): void {
  if (!config.dsn) {
    console.warn("Sentry DSN not provided, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release || `vlossom-api@${process.env.npm_package_version || "unknown"}`,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      // Remove sensitive body data
      if (event.request?.data) {
        const data =
          typeof event.request.data === "string"
            ? JSON.parse(event.request.data)
            : event.request.data;
        if (data.password) data.password = "[REDACTED]";
        if (data.token) data.token = "[REDACTED]";
        event.request.data = JSON.stringify(data);
      }
      return event;
    },
  });
}

/**
 * Express middleware for Sentry request handling
 */
export function sentryRequestHandler() {
  return Sentry.expressIntegration().setupOnce;
}

/**
 * Express middleware for Sentry error handling
 * Must be added after all other middleware and routes
 */
export function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Custom data
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Capture exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id: string; email?: string };
  }
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string {
  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Middleware to add request context to Sentry
 */
export function sentryContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add request ID if available
  const requestId = req.headers["x-request-id"] as string;
  if (requestId) {
    Sentry.setTag("request_id", requestId);
  }

  // Add route information
  Sentry.setTag("route", req.path);
  Sentry.setTag("method", req.method);

  next();
}

/**
 * Flush pending events (useful before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

export { Sentry };
