/**
 * PostHog Analytics Client (F5.3)
 * Browser-side event tracking and feature flags
 */

import posthog from "posthog-js";

// Track initialization state
let initialized = false;

/**
 * Initialize PostHog client
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn("PostHog key not provided, analytics disabled");
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    // Capture page views automatically
    capture_pageview: true,
    // Capture page leaves
    capture_pageleave: true,
    // Enable autocapture for clicks, forms, etc.
    autocapture: true,
    // Respect Do Not Track
    respect_dnt: true,
    // Session recording (disabled by default)
    disable_session_recording: true,
    // Persistence
    persistence: "localStorage+cookie",
    // Only load in production or when explicitly enabled
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        // Disable in development unless explicitly enabled
        if (!process.env.NEXT_PUBLIC_POSTHOG_DEBUG) {
          posthog.opt_out_capturing();
        }
      }
    },
  });

  initialized = true;
}

/**
 * Identify user for tracking
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    displayName?: string;
    role?: string;
    [key: string]: unknown;
  }
): void {
  if (!initialized) return;

  posthog.identify(userId, {
    ...properties,
    $set: {
      email: properties?.email,
      name: properties?.displayName,
      role: properties?.role,
    },
  });
}

/**
 * Reset user (on logout)
 */
export function resetUser(): void {
  if (!initialized) return;
  posthog.reset();
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (!initialized) return;
  posthog.capture(eventName, properties);
}

/**
 * Track page view
 */
export function trackPageView(url?: string): void {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

// Pre-defined event tracking functions

/**
 * Track user signup
 */
export function trackSignup(properties: {
  role: string;
  referralSource?: string;
}): void {
  trackEvent("user_signup", properties);
}

/**
 * Track booking created
 */
export function trackBookingCreated(properties: {
  bookingId: string;
  serviceCategory: string;
  priceCents: number;
}): void {
  trackEvent("booking_created", {
    booking_id: properties.bookingId,
    service_category: properties.serviceCategory,
    price_cents: properties.priceCents,
  });
}

/**
 * Track booking completed
 */
export function trackBookingCompleted(properties: {
  bookingId: string;
  durationMin: number;
}): void {
  trackEvent("booking_completed", {
    booking_id: properties.bookingId,
    duration_min: properties.durationMin,
  });
}

/**
 * Track wallet funded
 */
export function trackWalletFunded(properties: {
  amountUsdc: number;
  method: "faucet" | "moonpay" | "transfer";
}): void {
  trackEvent("wallet_funded", {
    amount_usdc: properties.amountUsdc,
    method: properties.method,
  });
}

/**
 * Track faucet claim
 */
export function trackFaucetClaimed(amountUsdc: number): void {
  trackEvent("faucet_claimed", { amount_usdc: amountUsdc });
}

/**
 * Track service view
 */
export function trackServiceViewed(properties: {
  stylistId: string;
  serviceId: string;
  category: string;
}): void {
  trackEvent("service_viewed", {
    stylist_id: properties.stylistId,
    service_id: properties.serviceId,
    category: properties.category,
  });
}

/**
 * Track search
 */
export function trackSearch(properties: {
  query?: string;
  category?: string;
  resultsCount: number;
}): void {
  trackEvent("stylist_search", {
    query: properties.query,
    category: properties.category,
    results_count: properties.resultsCount,
  });
}

/**
 * Check feature flag
 */
export function isFeatureEnabled(featureKey: string): boolean {
  if (!initialized) return false;
  return posthog.isFeatureEnabled(featureKey) ?? false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlagValue<T>(featureKey: string, defaultValue: T): T {
  if (!initialized) return defaultValue;
  const value = posthog.getFeatureFlag(featureKey);
  return (value as T) ?? defaultValue;
}

/**
 * Get PostHog instance (for advanced usage)
 */
export function getPostHog() {
  return initialized ? posthog : null;
}

export default posthog;
