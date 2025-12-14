/**
 * PostHog Analytics Integration for Backend (F5.3)
 * Server-side event tracking and feature flags
 */

import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

interface PostHogConfig {
  apiKey: string;
  host?: string;
}

/**
 * Initialize PostHog client
 */
export function initPostHog(config: PostHogConfig): void {
  if (!config.apiKey) {
    console.warn("PostHog API key not provided, analytics disabled");
    return;
  }

  posthogClient = new PostHog(config.apiKey, {
    host: config.host || "https://app.posthog.com",
    // Flush events every 10 seconds or 20 events
    flushAt: 20,
    flushInterval: 10000,
  });
}

/**
 * Get PostHog client instance
 */
export function getPostHog(): PostHog | null {
  return posthogClient;
}

/**
 * Track an event
 */
export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!posthogClient) return;

  posthogClient.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      source: "api",
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Identify a user
 */
export function identifyUser(
  distinctId: string,
  properties: {
    email?: string;
    displayName?: string;
    role?: string;
    createdAt?: Date;
    [key: string]: unknown;
  }
): void {
  if (!posthogClient) return;

  posthogClient.identify({
    distinctId,
    properties: {
      ...properties,
      $set: {
        email: properties.email,
        name: properties.displayName,
        role: properties.role,
      },
    },
  });
}

/**
 * Track user signup
 */
export function trackSignup(
  userId: string,
  properties: {
    email: string;
    role: string;
    referralSource?: string;
  }
): void {
  trackEvent(userId, "user_signup", {
    ...properties,
    $set: {
      email: properties.email,
      role: properties.role,
    },
  });
}

/**
 * Track booking created
 */
export function trackBookingCreated(
  userId: string,
  properties: {
    bookingId: string;
    stylistId: string;
    serviceCategory: string;
    priceCents: number;
    scheduledAt: Date;
  }
): void {
  trackEvent(userId, "booking_created", {
    booking_id: properties.bookingId,
    stylist_id: properties.stylistId,
    service_category: properties.serviceCategory,
    price_cents: properties.priceCents,
    scheduled_at: properties.scheduledAt.toISOString(),
  });
}

/**
 * Track booking completed
 */
export function trackBookingCompleted(
  userId: string,
  properties: {
    bookingId: string;
    stylistId: string;
    durationMin: number;
    priceCents: number;
  }
): void {
  trackEvent(userId, "booking_completed", {
    booking_id: properties.bookingId,
    stylist_id: properties.stylistId,
    duration_min: properties.durationMin,
    price_cents: properties.priceCents,
  });
}

/**
 * Track wallet funded
 */
export function trackWalletFunded(
  userId: string,
  properties: {
    amountUsdc: number;
    method: "faucet" | "moonpay" | "transfer";
    txHash?: string;
  }
): void {
  trackEvent(userId, "wallet_funded", {
    amount_usdc: properties.amountUsdc,
    method: properties.method,
    tx_hash: properties.txHash,
  });
}

/**
 * Track faucet claim
 */
export function trackFaucetClaimed(
  userId: string,
  properties: {
    walletAddress: string;
    amountUsdc: number;
  }
): void {
  trackEvent(userId, "faucet_claimed", {
    wallet_address: properties.walletAddress,
    amount_usdc: properties.amountUsdc,
  });
}

/**
 * Track service created (stylist)
 */
export function trackServiceCreated(
  userId: string,
  properties: {
    serviceId: string;
    category: string;
    priceCents: number;
    durationMin: number;
  }
): void {
  trackEvent(userId, "service_created", {
    service_id: properties.serviceId,
    category: properties.category,
    price_cents: properties.priceCents,
    duration_min: properties.durationMin,
  });
}

/**
 * Track payment events
 */
export function trackPayment(
  userId: string,
  event: "payment_initiated" | "payment_completed" | "payment_failed",
  properties: {
    bookingId: string;
    amountCents: number;
    error?: string;
  }
): void {
  trackEvent(userId, event, {
    booking_id: properties.bookingId,
    amount_cents: properties.amountCents,
    error: properties.error,
  });
}

/**
 * Check feature flag
 */
export async function isFeatureEnabled(
  distinctId: string,
  featureKey: string
): Promise<boolean> {
  if (!posthogClient) return false;

  try {
    return await posthogClient.isFeatureEnabled(featureKey, distinctId) ?? false;
  } catch (error) {
    console.error("PostHog feature flag error:", error);
    return false;
  }
}

/**
 * Get feature flag value
 */
export async function getFeatureFlagValue<T>(
  distinctId: string,
  featureKey: string,
  defaultValue: T
): Promise<T> {
  if (!posthogClient) return defaultValue;

  try {
    const value = await posthogClient.getFeatureFlag(featureKey, distinctId);
    return (value as T) ?? defaultValue;
  } catch (error) {
    console.error("PostHog feature flag error:", error);
    return defaultValue;
  }
}

/**
 * Flush pending events (useful before shutdown)
 */
export async function flushPostHog(): Promise<void> {
  if (!posthogClient) return;
  await posthogClient.flush();
}

/**
 * Shutdown PostHog client
 */
export async function shutdownPostHog(): Promise<void> {
  if (!posthogClient) return;
  await posthogClient.shutdown();
}
