/**
 * Property Owner API Client
 * Handles property management, chair inventory, and rental operations
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ============================================================================
// Types
// ============================================================================

export type PropertyCategory = "LUXURY" | "BOUTIQUE" | "STANDARD" | "HOME_BASED";
export type ApprovalMode = "FULL_APPROVAL" | "NO_APPROVAL" | "CONDITIONAL";
export type ChairType =
  | "BRAID_CHAIR"
  | "BARBER_CHAIR"
  | "STYLING_STATION"
  | "NAIL_STATION"
  | "LASH_BED"
  | "FACIAL_BED"
  | "GENERAL";
export type ChairStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED";
export type RentalMode =
  | "PER_BOOKING"
  | "PER_HOUR"
  | "PER_DAY"
  | "PER_WEEK"
  | "PER_MONTH";

export interface Property {
  id: string;
  name: string;
  category: PropertyCategory;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  description?: string;
  images: string[];
  coverImage?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  approvalMode: ApprovalMode;
  minStylistRating?: number;
  isActive: boolean;
  createdAt: string;
  ownerId: string;
  chairs: Chair[];
  _count?: { chairs: number };
}

export interface Chair {
  id: string;
  name: string;
  type: ChairType;
  status: ChairStatus;
  amenities: string[];
  hourlyRateCents?: number;
  dailyRateCents?: number;
  weeklyRateCents?: number;
  monthlyRateCents?: number;
  perBookingFeeCents?: number;
  rentalModesEnabled: RentalMode[];
  propertyId: string;
}

export interface CreatePropertyRequest {
  name: string;
  category: PropertyCategory;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  description?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  approvalMode: ApprovalMode;
  minStylistRating?: number;
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
  minStylistRating?: number;
  isActive?: boolean;
}

export interface CreateChairRequest {
  name: string;
  type: ChairType;
  status: ChairStatus;
  amenities: string[];
  hourlyRateCents?: number;
  dailyRateCents?: number;
  weeklyRateCents?: number;
  monthlyRateCents?: number;
  perBookingFeeCents?: number;
  rentalModesEnabled: RentalMode[];
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

export interface UploadImageResponse {
  publicId: string;
  url: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("vlossomToken");
}

/**
 * Build fetch headers with authentication
 */
function buildHeaders(includeContentType = true): HeadersInit {
  const headers: HeadersInit = {};
  const token = getAuthToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "An unexpected error occurred",
    }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Property Management
// ============================================================================

/**
 * Get all properties owned by the current user
 */
export async function getMyProperties(): Promise<Property[]> {
  const response = await fetch(`${API_URL}/api/v1/properties/my/all`, {
    headers: buildHeaders(),
  });

  return handleResponse<Property[]>(response);
}

/**
 * Get single property by ID with full details
 */
export async function getProperty(id: string): Promise<Property> {
  const response = await fetch(`${API_URL}/api/v1/properties/${id}`, {
    headers: buildHeaders(),
  });

  return handleResponse<Property>(response);
}

/**
 * Create a new property
 */
export async function createProperty(
  data: CreatePropertyRequest
): Promise<Property> {
  const response = await fetch(`${API_URL}/api/v1/properties`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Property>(response);
}

/**
 * Update an existing property
 */
export async function updateProperty(
  id: string,
  data: UpdatePropertyRequest
): Promise<Property> {
  const response = await fetch(`${API_URL}/api/v1/properties/${id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Property>(response);
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/properties/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to delete property",
    }));
    throw new Error(error.error || "Failed to delete property");
  }
}

// ============================================================================
// Chair Management
// ============================================================================

/**
 * Create a new chair for a property
 */
export async function createChair(
  propertyId: string,
  data: CreateChairRequest
): Promise<Chair> {
  const response = await fetch(
    `${API_URL}/api/v1/properties/${propertyId}/chairs`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<Chair>(response);
}

/**
 * Update an existing chair
 */
export async function updateChair(
  propertyId: string,
  chairId: string,
  data: UpdateChairRequest
): Promise<Chair> {
  const response = await fetch(
    `${API_URL}/api/v1/properties/${propertyId}/chairs/${chairId}`,
    {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }
  );

  return handleResponse<Chair>(response);
}

/**
 * Delete a chair
 */
export async function deleteChair(
  propertyId: string,
  chairId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/v1/properties/${propertyId}/chairs/${chairId}`,
    {
      method: "DELETE",
      headers: buildHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to delete chair",
    }));
    throw new Error(error.error || "Failed to delete chair");
  }
}

// ============================================================================
// Image Upload
// ============================================================================

/**
 * Upload a property image
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${API_URL}/api/v1/upload/property/${propertyId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }
  );

  return handleResponse<UploadImageResponse>(response);
}

/**
 * Delete a property image by public ID
 */
export async function deletePropertyImage(
  propertyId: string,
  publicId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/v1/upload/property/${propertyId}/${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Failed to delete image",
    }));
    throw new Error(error.error || "Failed to delete image");
  }
}

/**
 * Set property cover image
 */
export async function setPropertyCoverImage(
  propertyId: string,
  file: File
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${API_URL}/api/v1/upload/property/${propertyId}/cover`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }
  );

  return handleResponse<UploadImageResponse>(response);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display text for property category
 */
export function getCategoryDisplayName(category: PropertyCategory): string {
  switch (category) {
    case "LUXURY":
      return "Luxury Venue";
    case "BOUTIQUE":
      return "Boutique Salon";
    case "STANDARD":
      return "Standard Salon";
    case "HOME_BASED":
      return "Home-Based";
  }
}

/**
 * Get display text for approval mode
 */
export function getApprovalModeDescription(mode: ApprovalMode): string {
  switch (mode) {
    case "FULL_APPROVAL":
      return "Manual approval required for all bookings";
    case "NO_APPROVAL":
      return "Instant booking enabled for all stylists";
    case "CONDITIONAL":
      return "Auto-approve stylists meeting minimum rating";
  }
}

/**
 * Get display text for chair type
 */
export function getChairTypeDisplayName(type: ChairType): string {
  switch (type) {
    case "BRAID_CHAIR":
      return "Braid Chair";
    case "BARBER_CHAIR":
      return "Barber Chair";
    case "STYLING_STATION":
      return "Styling Station";
    case "NAIL_STATION":
      return "Nail Station";
    case "LASH_BED":
      return "Lash Bed";
    case "FACIAL_BED":
      return "Facial Bed";
    case "GENERAL":
      return "General";
  }
}

/**
 * Get display text for chair status
 */
export function getChairStatusDisplayName(status: ChairStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "OCCUPIED":
      return "Occupied";
    case "MAINTENANCE":
      return "Under Maintenance";
    case "BLOCKED":
      return "Blocked";
  }
}

/**
 * Get display text for rental mode
 */
export function getRentalModeDisplayName(mode: RentalMode): string {
  switch (mode) {
    case "PER_BOOKING":
      return "Per Booking";
    case "PER_HOUR":
      return "Per Hour";
    case "PER_DAY":
      return "Per Day";
    case "PER_WEEK":
      return "Per Week";
    case "PER_MONTH":
      return "Per Month";
  }
}

/**
 * Check if chair has a specific rental mode enabled
 */
export function hasRentalMode(chair: Chair, mode: RentalMode): boolean {
  return chair.rentalModesEnabled.includes(mode);
}

/**
 * Get lowest rate for a chair (in cents)
 */
export function getLowestChairRate(chair: Chair): number | null {
  const rates = [
    chair.perBookingFeeCents,
    chair.hourlyRateCents,
    chair.dailyRateCents,
    chair.weeklyRateCents,
    chair.monthlyRateCents,
  ].filter((rate): rate is number => rate !== undefined && rate !== null);

  if (rates.length === 0) {
    return null;
  }

  return Math.min(...rates);
}
