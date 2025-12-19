/**
 * Property Management Hooks (V1.5)
 *
 * React Query hooks for property owners to manage properties,
 * chairs, rentals, and images.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth-client";
import { queryConfigs } from "@/lib/query-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ============================================================================
// Types
// ============================================================================

export type PropertyCategory = "LUXURY" | "BOUTIQUE" | "STANDARD" | "HOME_BASED";
export type ChairType = "BRAID_CHAIR" | "BARBER_CHAIR" | "STYLING_STATION" | "NAIL_STATION" | "LASH_BED" | "FACIAL_BED" | "GENERAL";
export type ChairStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED";
export type RentalMode = "PER_BOOKING" | "PER_HOUR" | "PER_DAY" | "PER_WEEK" | "PER_MONTH";
export type ApprovalMode = "FULL_APPROVAL" | "NO_APPROVAL" | "CONDITIONAL";

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  category: PropertyCategory;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  description: string | null;
  operatingHours: Record<string, { open: string; close: string }>;
  approvalMode: ApprovalMode;
  images: string[];
  coverImage: string | null;
  minStylistRating: number | null;
  minTpsScore: number | null;
  isActive: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  chairs?: Chair[];
  _count?: {
    chairs: number;
  };
  pendingRentalCount?: number;
  owner?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    verificationStatus: string;
  };
}

export interface Chair {
  id: string;
  propertyId: string;
  name: string;
  type: ChairType;
  status: ChairStatus;
  amenities: string[];
  hourlyRateCents: number | null;
  dailyRateCents: number | null;
  weeklyRateCents: number | null;
  monthlyRateCents: number | null;
  perBookingFeeCents: number | null;
  rentalModesEnabled: RentalMode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyRequest {
  name: string;
  category: PropertyCategory;
  address: string;
  city: string;
  country?: string;
  lat: number;
  lng: number;
  description?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  approvalMode?: ApprovalMode;
  images?: string[];
  coverImage?: string;
  minStylistRating?: number;
  minTpsScore?: number;
}

export interface UpdatePropertyRequest {
  name?: string;
  category?: PropertyCategory;
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  description?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  approvalMode?: ApprovalMode;
  images?: string[];
  coverImage?: string;
  minStylistRating?: number;
  minTpsScore?: number;
}

export interface CreateChairRequest {
  name: string;
  type?: ChairType;
  amenities?: string[];
  hourlyRateCents?: number;
  dailyRateCents?: number;
  weeklyRateCents?: number;
  monthlyRateCents?: number;
  perBookingFeeCents?: number;
  rentalModesEnabled?: RentalMode[];
}

export interface UpdateChairRequest {
  name?: string;
  type?: ChairType;
  status?: ChairStatus;
  amenities?: string[];
  hourlyRateCents?: number;
  dailyRateCents?: number;
  weeklyRateCents?: number;
  monthlyRateCents?: number;
  perBookingFeeCents?: number;
  rentalModesEnabled?: RentalMode[];
}

export interface UploadImageRequest {
  file: File;
}

// ============================================================================
// Query Keys
// ============================================================================

export const propertyKeys = {
  all: ["properties"] as const,
  my: () => [...propertyKeys.all, "my"] as const,
  detail: (propertyId: string) => [...propertyKeys.all, propertyId] as const,
};

// ============================================================================
// API Client Functions
// ============================================================================

async function fetchMyProperties(): Promise<{ properties: Property[] }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/my/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch properties");
  }

  return response.json();
}

async function fetchProperty(propertyId: string): Promise<{ property: Property }> {
  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Property not found");
    }
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch property");
  }

  return response.json();
}

async function createProperty(data: CreatePropertyRequest): Promise<{ property: Property }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create property");
  }

  return response.json();
}

async function updateProperty(propertyId: string, data: UpdatePropertyRequest): Promise<{ property: Property }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update property");
  }

  return response.json();
}

async function deleteProperty(propertyId: string): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete property");
  }

  return response.json();
}

async function createChair(propertyId: string, data: CreateChairRequest): Promise<{ chair: Chair }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}/chairs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create chair");
  }

  return response.json();
}

async function updateChair(
  propertyId: string,
  chairId: string,
  data: UpdateChairRequest
): Promise<{ chair: Chair }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}/chairs/${chairId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update chair");
  }

  return response.json();
}

async function deleteChair(propertyId: string, chairId: string): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}/chairs/${chairId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete chair");
  }

  return response.json();
}

async function uploadPropertyImage(
  propertyId: string,
  file: File
): Promise<{ url: string; publicId: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", `properties/${propertyId}`);

  const response = await fetch(`${API_URL}/api/v1/upload/property`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  return response.json();
}

async function deletePropertyImage(publicId: string): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/upload/property/${encodeURIComponent(publicId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete image");
  }

  return response.json();
}

async function setPropertyCoverImage(propertyId: string, imageUrl: string): Promise<{ property: Property }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/v1/properties/${propertyId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ coverImage: imageUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to set cover image");
  }

  return response.json();
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch owner's properties
 */
export function useMyProperties() {
  return useQuery({
    queryKey: propertyKeys.my(),
    queryFn: fetchMyProperties,
    ...queryConfigs.dynamic, // Properties change frequently with bookings
  });
}

/**
 * Hook to fetch single property
 */
export function useProperty(propertyId: string) {
  return useQuery({
    queryKey: propertyKeys.detail(propertyId),
    queryFn: () => fetchProperty(propertyId),
    enabled: !!propertyId,
    ...queryConfigs.standard,
  });
}

// ============================================================================
// Mutation Hooks - Property
// ============================================================================

/**
 * Hook to create a new property
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePropertyRequest) => createProperty(data),
    onSuccess: () => {
      // Invalidate my properties list to refetch
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

/**
 * Hook to update a property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: UpdatePropertyRequest }) =>
      updateProperty(propertyId, data),
    onSuccess: (response, variables) => {
      // Update the property detail cache
      queryClient.setQueryData(propertyKeys.detail(variables.propertyId), response);

      // Invalidate my properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

/**
 * Hook to delete a property
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) => deleteProperty(propertyId),
    onSuccess: (_, propertyId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: propertyKeys.detail(propertyId) });

      // Invalidate my properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

// ============================================================================
// Mutation Hooks - Chairs
// ============================================================================

/**
 * Hook to create a new chair
 */
export function useCreateChair(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChairRequest) => createChair(propertyId, data),
    onSuccess: () => {
      // Invalidate property detail to refetch with new chair
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });

      // Invalidate my properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

/**
 * Hook to update a chair
 */
export function useUpdateChair(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chairId, data }: { chairId: string; data: UpdateChairRequest }) =>
      updateChair(propertyId, chairId, data),
    onSuccess: () => {
      // Invalidate property detail to refetch
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });

      // Invalidate my properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

/**
 * Hook to delete a chair
 */
export function useDeleteChair(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chairId: string) => deleteChair(propertyId, chairId),
    onSuccess: () => {
      // Invalidate property detail to refetch
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });

      // Invalidate my properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

// ============================================================================
// Mutation Hooks - Images
// ============================================================================

/**
 * Hook to upload property image
 */
export function useUploadPropertyImage(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadPropertyImage(propertyId, file),
    onSuccess: (response) => {
      // Optimistically add image to property
      queryClient.setQueryData(propertyKeys.detail(propertyId), (old: { property: Property } | undefined) => {
        if (!old) return old;
        return {
          property: {
            ...old.property,
            images: [...old.property.images, response.url],
          },
        };
      });

      // Invalidate to refetch full data
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

/**
 * Hook to delete property image
 */
export function useDeletePropertyImage(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => deletePropertyImage(publicId),
    onSuccess: () => {
      // Invalidate property to refetch
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}

/**
 * Hook to set property cover image
 */
export function useSetPropertyCoverImage(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUrl: string) => setPropertyCoverImage(propertyId, imageUrl),
    onSuccess: (response) => {
      // Update property detail cache
      queryClient.setQueryData(propertyKeys.detail(propertyId), response);

      // Invalidate my properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.my() });
    },
  });
}
