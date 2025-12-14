/**
 * Sentry Edge Configuration (F5.3)
 * Edge runtime error tracking for Next.js middleware
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment and release tracking
  environment: process.env.NODE_ENV,

  // Performance Monitoring - sample fewer edge requests
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.5,

  // Don't track in development unless DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
