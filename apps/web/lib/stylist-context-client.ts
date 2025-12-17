/**
 * Stylist Context API Client (V5.1)
 *
 * Typed API client for consent-based profile sharing.
 * Enables customers to share hair data with stylists.
 */

import { api } from "./api";
import type { HairProfileResponse } from "./hair-health-client";

// ============================================================================
// Types
// ============================================================================

export type ConsentScope = "TEXTURE" | "POROSITY" | "SENSITIVITY" | "ROUTINE" | "FULL";

export interface StylistContextResponse {
  id: string;
  customerUserId: string;
  stylistUserId: string;
  consentGranted: boolean;
  consentGrantedAt: string | null;
  consentScope: ConsentScope[];
  sharedProfileSnapshot: Partial<HairProfileResponse> | null;
  stylistNotes: string | null;
  lastServiceNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StylistInfo {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  specialties?: string[] | null;
}

export interface CustomerInfo {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface StylistShareResponse extends StylistContextResponse {
  stylist: StylistInfo;
}

export interface CustomerContextResponse {
  context: StylistContextResponse;
  customer: CustomerInfo;
  profileSummary: {
    archetype: string;
    healthGrade: string;
    lastUpdated: string;
  } | null;
}

export interface CustomerDetailResponse {
  context: StylistContextResponse;
  customer: CustomerInfo;
  analysis: {
    healthScore: {
      overall: number;
      grade: string;
    };
    archetype: string;
    recommendations: string[];
  } | null;
}

export interface GrantAccessInput {
  stylistUserId: string;
  consentScope: ConsentScope[];
}

export interface UpdateNotesInput {
  stylistNotes?: string;
  lastServiceNotes?: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface ListResponse<T> {
  data: T[];
  count: number;
}

// ============================================================================
// Customer API Functions (managing their own consent)
// ============================================================================

/**
 * Get shared context for a specific stylist
 */
export async function getStylistContext(
  stylistId: string
): Promise<StylistContextResponse | null> {
  try {
    const response = await api.get<ApiResponse<StylistContextResponse>>(
      `/api/v1/stylist-context/${stylistId}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Grant a stylist access to hair profile data
 */
export async function grantStylistAccess(
  input: GrantAccessInput
): Promise<StylistContextResponse> {
  const response = await api.post<ApiResponse<StylistContextResponse>>(
    "/api/v1/stylist-context/grant",
    input
  );
  return response.data;
}

/**
 * Revoke a stylist's access to hair profile data
 */
export async function revokeStylistAccess(stylistId: string): Promise<void> {
  await api.delete(`/api/v1/stylist-context/${stylistId}`);
}

/**
 * Get all stylists the customer has shared with
 */
export async function getMyStylistShares(): Promise<StylistShareResponse[]> {
  const response = await api.get<ListResponse<StylistShareResponse>>(
    "/api/v1/stylist-context/my-shares"
  );
  return response.data;
}

// ============================================================================
// Stylist API Functions (viewing customer data)
// ============================================================================

/**
 * Get all customers who have shared their profile with the stylist
 */
export async function getMyCustomers(): Promise<CustomerContextResponse[]> {
  const response = await api.get<ListResponse<CustomerContextResponse>>(
    "/api/v1/stylist-context/customers"
  );
  return response.data;
}

/**
 * Get detailed context for a specific customer
 */
export async function getCustomerContext(
  customerId: string
): Promise<CustomerDetailResponse | null> {
  try {
    const response = await api.get<ApiResponse<CustomerDetailResponse>>(
      `/api/v1/stylist-context/customer/${customerId}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Update stylist's notes for a customer
 */
export async function updateCustomerNotes(
  customerId: string,
  input: UpdateNotesInput
): Promise<StylistContextResponse> {
  const response = await api.patch<ApiResponse<StylistContextResponse>>(
    `/api/v1/stylist-context/customer/${customerId}`,
    input
  );
  return response.data;
}
