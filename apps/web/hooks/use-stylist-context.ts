/**
 * Stylist Context Hooks (V5.1)
 * React Query hooks for consent-based profile sharing
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStylistContext,
  grantStylistAccess,
  revokeStylistAccess,
  getMyStylistShares,
  getMyCustomers,
  getCustomerContext,
  updateCustomerNotes,
  type ConsentScope,
  type StylistContextResponse,
  type StylistShareResponse,
  type CustomerContextResponse,
  type CustomerDetailResponse,
  type GrantAccessInput,
  type UpdateNotesInput,
} from "@/lib/stylist-context-client";

// Re-export types for convenience
export type {
  ConsentScope,
  StylistContextResponse,
  StylistShareResponse,
  CustomerContextResponse,
  CustomerDetailResponse,
  GrantAccessInput,
  UpdateNotesInput,
  StylistInfo,
  CustomerInfo,
} from "@/lib/stylist-context-client";

// ============================================================================
// Query Keys
// ============================================================================

export const stylistContextKeys = {
  all: ["stylist-context"] as const,
  context: (stylistId: string) => [...stylistContextKeys.all, "context", stylistId] as const,
  myShares: () => [...stylistContextKeys.all, "my-shares"] as const,
  customers: () => [...stylistContextKeys.all, "customers"] as const,
  customer: (customerId: string) => [...stylistContextKeys.all, "customer", customerId] as const,
};

// ============================================================================
// Customer Hooks (managing their own consent)
// ============================================================================

/**
 * Hook to fetch shared context for a specific stylist
 */
export function useStylistContext(stylistId: string) {
  return useQuery({
    queryKey: stylistContextKeys.context(stylistId),
    queryFn: () => getStylistContext(stylistId),
    enabled: !!stylistId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch all stylists the customer has shared with
 */
export function useMyStylistShares() {
  return useQuery({
    queryKey: stylistContextKeys.myShares(),
    queryFn: getMyStylistShares,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to grant a stylist access to hair profile data
 */
export function useGrantStylistAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GrantAccessInput) => grantStylistAccess(input),
    onSuccess: (newContext) => {
      // Update the specific context cache
      queryClient.setQueryData(
        stylistContextKeys.context(newContext.stylistUserId),
        newContext
      );
      // Invalidate the shares list to refetch
      queryClient.invalidateQueries({ queryKey: stylistContextKeys.myShares() });
    },
  });
}

/**
 * Hook to revoke a stylist's access
 */
export function useRevokeStylistAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stylistId: string) => revokeStylistAccess(stylistId),
    onSuccess: (_, stylistId) => {
      // Invalidate the specific context
      queryClient.invalidateQueries({ queryKey: stylistContextKeys.context(stylistId) });
      // Invalidate the shares list
      queryClient.invalidateQueries({ queryKey: stylistContextKeys.myShares() });
    },
  });
}

// ============================================================================
// Stylist Hooks (viewing customer data)
// ============================================================================

/**
 * Hook to fetch all customers who have shared their profile with the stylist
 */
export function useMyCustomers() {
  return useQuery({
    queryKey: stylistContextKeys.customers(),
    queryFn: getMyCustomers,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch detailed context for a specific customer
 */
export function useCustomerContext(customerId: string) {
  return useQuery({
    queryKey: stylistContextKeys.customer(customerId),
    queryFn: () => getCustomerContext(customerId),
    enabled: !!customerId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to update stylist's notes for a customer
 */
export function useUpdateCustomerNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, input }: { customerId: string; input: UpdateNotesInput }) =>
      updateCustomerNotes(customerId, input),
    onSuccess: (updatedContext, { customerId }) => {
      // Update the customer context cache
      queryClient.setQueryData(stylistContextKeys.customer(customerId), (old: CustomerDetailResponse | null | undefined) => {
        if (!old) return old;
        return {
          ...old,
          context: updatedContext,
        };
      });
      // Invalidate the customers list
      queryClient.invalidateQueries({ queryKey: stylistContextKeys.customers() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if customer has shared with any stylists
 */
export function useHasActiveShares() {
  const { data: shares, isLoading } = useMyStylistShares();
  const activeShares = shares?.filter((s) => s.consentGranted) ?? [];
  return {
    hasActiveShares: activeShares.length > 0,
    activeCount: activeShares.length,
    isLoading,
  };
}

/**
 * Hook to check if stylist has any customers sharing with them
 */
export function useHasCustomers() {
  const { data: customers, isLoading } = useMyCustomers();
  return {
    hasCustomers: (customers?.length ?? 0) > 0,
    customerCount: customers?.length ?? 0,
    isLoading,
  };
}

/**
 * Consent scope labels for UI display
 */
export const CONSENT_SCOPE_LABELS: Record<ConsentScope, string> = {
  TEXTURE: "Texture & Pattern",
  POROSITY: "Porosity & Retention",
  SENSITIVITY: "Sensitivity Levels",
  ROUTINE: "Routine & Habits",
  FULL: "Full Profile Access",
};

/**
 * Consent scope descriptions for UI
 */
export const CONSENT_SCOPE_DESCRIPTIONS: Record<ConsentScope, string> = {
  TEXTURE: "Hair texture class, pattern family, strand thickness, density, and shrinkage",
  POROSITY: "Porosity level and moisture retention risk assessment",
  SENSITIVITY: "Detangle, manipulation, tension, and scalp sensitivity levels",
  ROUTINE: "Wash day frequency, duration, and routine type",
  FULL: "Complete hair health profile with all attributes and analysis",
};
