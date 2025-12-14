/**
 * API helpers for E2E tests (F4.6)
 */

import { APIRequestContext, expect } from "@playwright/test";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3002";

/**
 * Create a booking via API
 */
export async function createBookingViaAPI(
  request: APIRequestContext,
  token: string,
  data: {
    customerId: string;
    stylistId: string;
    serviceId: string;
    scheduledStartTime: string;
    locationType: "STYLIST_LOCATION" | "CUSTOMER_LOCATION";
    locationAddress: string;
    locationLat?: number;
    locationLng?: number;
  }
): Promise<any> {
  const response = await request.post(`${API_BASE_URL}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });

  expect(response.status()).toBe(201);
  return response.json();
}

/**
 * Get user's bookings via API
 */
export async function getBookingsViaAPI(
  request: APIRequestContext,
  token: string,
  role: "customer" | "stylist"
): Promise<any[]> {
  const response = await request.get(`${API_BASE_URL}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { role },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.bookings || [];
}

/**
 * Approve a booking via API (stylist action)
 */
export async function approveBookingViaAPI(
  request: APIRequestContext,
  token: string,
  bookingId: string,
  stylistId: string
): Promise<any> {
  const response = await request.post(`${API_BASE_URL}/api/bookings/${bookingId}/approve`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { stylistId },
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Get wallet balance via API
 */
export async function getWalletBalanceViaAPI(
  request: APIRequestContext,
  token: string
): Promise<{ balance: string; address: string }> {
  const response = await request.get(`${API_BASE_URL}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

/**
 * Claim faucet via API
 */
export async function claimFaucetViaAPI(
  request: APIRequestContext,
  token: string
): Promise<any> {
  const response = await request.post(`${API_BASE_URL}/api/wallet/faucet`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Faucet may fail if already claimed
  return {
    success: response.ok(),
    data: await response.json(),
    status: response.status(),
  };
}

/**
 * Get stylists via API
 */
export async function getStylistsViaAPI(
  request: APIRequestContext,
  params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    serviceCategory?: string;
  }
): Promise<any[]> {
  const response = await request.get(`${API_BASE_URL}/api/stylists`, {
    params,
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.items || [];
}

/**
 * Get stylist services via API
 */
export async function getStylistServicesViaAPI(
  request: APIRequestContext,
  stylistId: string
): Promise<any[]> {
  const response = await request.get(`${API_BASE_URL}/api/stylists/${stylistId}`);

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.services || [];
}

/**
 * Create a stylist service via API
 */
export async function createServiceViaAPI(
  request: APIRequestContext,
  token: string,
  data: {
    name: string;
    category: string;
    description?: string;
    priceAmountCents: number;
    estimatedDurationMin: number;
  }
): Promise<any> {
  const response = await request.post(`${API_BASE_URL}/api/stylists/services`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });

  expect(response.status()).toBe(201);
  return response.json();
}

/**
 * Get notifications via API
 */
export async function getNotificationsViaAPI(
  request: APIRequestContext,
  token: string
): Promise<any[]> {
  const response = await request.get(`${API_BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.notifications || [];
}

/**
 * Wait for a specific condition with polling
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("Condition not met within timeout");
}
