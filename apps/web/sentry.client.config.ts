/**
 * Sentry Client Configuration (F5.3)
 * Browser-side error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment and release tracking
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay - capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Don't track in development unless DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture unhandled promise rejections
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out common non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore network errors that users commonly trigger
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("network request failed") ||
        message.includes("failed to fetch") ||
        message.includes("load failed") ||
        message.includes("cancelled")
      ) {
        return null;
      }
    }

    // Ignore errors from extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      frame => frame.filename?.includes("extension")
    )) {
      return null;
    }

    return event;
  },

  // Only report errors in production
  beforeSendTransaction(event) {
    // Filter out noisy transactions
    if (event.transaction?.includes("_next/static")) {
      return null;
    }
    return event;
  },
});
