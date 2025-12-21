/**
 * Users API Client (V7.0.0)
 *
 * Admin users management API client.
 */

import { adminFetch } from "./admin-client";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  roles: string[];
  verificationStatus: string;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookingsAsCustomer: number;
    bookingsAsStylist: number;
  };
}

export interface UserDetail extends User {
  phone: string | null;
  stylistProfile: {
    id: string;
    bio: string | null;
    specialties: string[];
    isAcceptingBookings: boolean;
  } | null;
  wallet: {
    id: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
  } | null;
}

export interface UsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: "createdAt" | "email" | "displayName";
  sortOrder?: "asc" | "desc";
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStats {
  totalUsers: number;
  totalCustomers: number;
  totalStylists: number;
  totalPropertyOwners: number;
  newUsersToday: number;
  verifiedUsers: number;
  verificationRate: string | number;
}

/**
 * Fetch paginated list of users
 */
export async function fetchUsers(params: UsersListParams = {}): Promise<UsersListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.search) searchParams.set("search", params.search);
  if (params.role) searchParams.set("role", params.role);
  if (params.status) searchParams.set("status", params.status);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const url = `/api/v1/admin/users${queryString ? `?${queryString}` : ""}`;

  const response = await adminFetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
}

/**
 * Fetch single user details
 */
export async function fetchUser(id: string): Promise<{ user: UserDetail }> {
  const response = await adminFetch(`/api/v1/admin/users/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Failed to fetch user");
  }

  return response.json();
}

/**
 * Update user roles or verification status
 */
export async function updateUser(
  id: string,
  data: { roles?: string[]; verificationStatus?: string }
): Promise<{ user: User }> {
  const response = await adminFetch(`/api/v1/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update user");
  }

  return response.json();
}

/**
 * Fetch user statistics
 */
export async function fetchUserStats(): Promise<{ stats: UserStats }> {
  const response = await adminFetch("/api/v1/admin/users/stats/overview");

  if (!response.ok) {
    throw new Error("Failed to fetch user stats");
  }

  return response.json();
}
