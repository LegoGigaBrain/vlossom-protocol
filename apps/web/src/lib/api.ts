// API client for Vlossom backend
// Reference: services/api/src/routes/*

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface ApiError {
  error: string;
  details?: unknown;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

// Property types
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  category: string;
  status: string;
  isVerified: boolean;
  description: string | null;
  amenities: string[];
  operatingHours: Record<string, unknown> | null;
  photos: string[];
  _count?: { chairs: number };
}

export interface Chair {
  id: string;
  propertyId: string;
  name: string;
  type: string;
  status: string;
  rentalMode: string;
  hourlyRateCents: number;
  dailyRateCents: number | null;
  weeklyRateCents: number | null;
  monthlyRateCents: number | null;
  equipment: string[];
  photos: string[];
  description: string | null;
}

export interface ChairRentalRequest {
  id: string;
  chairId: string;
  requesterId: string;
  status: string;
  requestedMode: string;
  requestedRateCents: number;
  startTime: string;
  endTime: string | null;
  message: string | null;
  createdAt: string;
  requester?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  chair?: Chair;
}

// Property API
export const propertiesApi = {
  list: (token: string) =>
    fetchApi<{ properties: Property[] }>("/api/properties/my", { token }),

  get: (token: string, propertyId: string) =>
    fetchApi<{ property: Property }>(`/api/properties/${propertyId}`, { token }),

  create: (token: string, data: Partial<Property>) =>
    fetchApi<{ property: Property }>("/api/properties", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, propertyId: string, data: Partial<Property>) =>
    fetchApi<{ property: Property }>(`/api/properties/${propertyId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, propertyId: string) =>
    fetchApi<{ success: boolean }>(`/api/properties/${propertyId}`, {
      method: "DELETE",
      token,
    }),
};

// Chair API
export const chairsApi = {
  list: (token: string, propertyId: string) =>
    fetchApi<{ chairs: Chair[] }>(`/api/properties/${propertyId}/chairs`, {
      token,
    }),

  get: (token: string, chairId: string) =>
    fetchApi<{ chair: Chair }>(`/api/properties/chairs/${chairId}`, { token }),

  create: (token: string, propertyId: string, data: Partial<Chair>) =>
    fetchApi<{ chair: Chair }>(`/api/properties/${propertyId}/chairs`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, chairId: string, data: Partial<Chair>) =>
    fetchApi<{ chair: Chair }>(`/api/properties/chairs/${chairId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, chairId: string) =>
    fetchApi<{ success: boolean }>(`/api/properties/chairs/${chairId}`, {
      method: "DELETE",
      token,
    }),
};

// Chair Rental Request API
export const rentalRequestsApi = {
  listPending: (token: string) =>
    fetchApi<{ requests: ChairRentalRequest[] }>("/api/properties/requests/pending", {
      token,
    }),

  approve: (token: string, requestId: string) =>
    fetchApi<{ request: ChairRentalRequest }>(
      `/api/properties/requests/${requestId}/approve`,
      {
        method: "POST",
        token,
      }
    ),

  reject: (token: string, requestId: string, reason?: string) =>
    fetchApi<{ request: ChairRentalRequest }>(
      `/api/properties/requests/${requestId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
        token,
      }
    ),
};

// Reviews/Reputation API
export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewType: string;
  overallRating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface ReputationScore {
  totalScore: number;
  tpsScore: number;
  reliabilityScore: number;
  feedbackScore: number;
  disputeScore: number;
  completedBookings: number;
  cancelledBookings: number;
  isVerified: boolean;
  scores: {
    total: string;
    tps: string;
    reliability: string;
    feedback: string;
    dispute: string;
  };
}

export const reviewsApi = {
  getForUser: (userId: string, token?: string) =>
    fetchApi<{
      reviews: Review[];
      total: number;
      averageRating: string | null;
      totalReviews: number;
    }>(`/api/reviews/user/${userId}`, token ? { token } : {}),

  getReputation: (userId: string) =>
    fetchApi<{ reputation: ReputationScore }>(`/api/reviews/reputation/${userId}`),

  getPending: (token: string) =>
    fetchApi<{ pendingReviews: unknown[] }>("/api/reviews/pending", { token }),

  create: (
    token: string,
    data: {
      bookingId: string;
      reviewType: string;
      overallRating: number;
      comment?: string;
    }
  ) =>
    fetchApi<{ review: Review }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
};
