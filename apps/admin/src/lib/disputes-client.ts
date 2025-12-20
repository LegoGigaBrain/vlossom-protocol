/**
 * Disputes API Client (V7.0.0)
 *
 * Admin disputes management API client.
 */

import { adminFetch } from "./admin-client";

export type DisputeStatus =
  | "OPEN"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type DisputeType =
  | "SERVICE_QUALITY"
  | "NO_SHOW"
  | "LATE_ARRIVAL"
  | "PRICING_DISPUTE"
  | "SAFETY_CONCERN"
  | "HARASSMENT"
  | "PROPERTY_DAMAGE"
  | "OTHER";

export type DisputeResolution =
  | "FULL_REFUND_CUSTOMER"
  | "PARTIAL_REFUND"
  | "NO_REFUND"
  | "SPLIT_FUNDS"
  | "STYLIST_PENALTY"
  | "CUSTOMER_WARNING"
  | "MUTUAL_CANCELLATION"
  | "ESCALATED_TO_LEGAL";

export interface DisputeUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface DisputeMessage {
  id: string;
  content: string;
  authorId: string;
  author: DisputeUser;
  isInternal: boolean;
  attachmentUrls?: string[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  status: DisputeStatus;
  type: DisputeType;
  priority: number;
  subject: string;
  description: string;
  evidence?: string[];
  filedBy: DisputeUser;
  filedById: string;
  againstUser: DisputeUser;
  againstUserId: string;
  assignedTo?: DisputeUser;
  assignedToId?: string;
  resolution?: DisputeResolution;
  resolutionNotes?: string;
  resolvedById?: string;
  resolvedBy?: DisputeUser;
  escalationReason?: string;
  escalatedById?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages?: DisputeMessage[];
}

export interface DisputesListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  assignedToId?: string;
  priority?: number;
  fromDate?: string;
  toDate?: string;
}

export interface DisputesListResponse {
  disputes: Dispute[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface DisputeStats {
  total: number;
  open: number;
  assigned: number;
  underReview: number;
  escalated: number;
  resolved: number;
  closed: number;
  avgResolutionTime: string;
  byType: Record<DisputeType, number>;
}

/**
 * Fetch paginated list of disputes
 */
export async function fetchDisputes(params: DisputesListParams = {}): Promise<DisputesListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.status) searchParams.set("status", params.status);
  if (params.type) searchParams.set("type", params.type);
  if (params.assignedToId) searchParams.set("assignedToId", params.assignedToId);
  if (params.priority) searchParams.set("priority", String(params.priority));
  if (params.fromDate) searchParams.set("fromDate", params.fromDate);
  if (params.toDate) searchParams.set("toDate", params.toDate);

  const queryString = searchParams.toString();
  const url = `/api/v1/admin/disputes${queryString ? `?${queryString}` : ""}`;

  const response = await adminFetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch disputes");
  }

  return response.json();
}

/**
 * Fetch single dispute details
 */
export async function fetchDispute(id: string): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Dispute not found");
    }
    throw new Error("Failed to fetch dispute");
  }

  return response.json();
}

/**
 * Fetch dispute statistics
 */
export async function fetchDisputeStats(): Promise<{ stats: DisputeStats }> {
  const response = await adminFetch("/api/v1/admin/disputes/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch dispute stats");
  }

  return response.json();
}

/**
 * Assign dispute to admin
 */
export async function assignDispute(id: string, assignedToId: string): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignedToId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to assign dispute");
  }

  return response.json();
}

/**
 * Start reviewing a dispute
 */
export async function startReview(id: string): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}/review`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to start review");
  }

  return response.json();
}

/**
 * Resolve a dispute
 */
export async function resolveDispute(
  id: string,
  data: {
    resolution: DisputeResolution;
    resolutionNotes: string;
    refundPercent?: number;
  }
): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to resolve dispute");
  }

  return response.json();
}

/**
 * Escalate a dispute
 */
export async function escalateDispute(
  id: string,
  escalationReason: string
): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}/escalate`, {
    method: "POST",
    body: JSON.stringify({ escalationReason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to escalate dispute");
  }

  return response.json();
}

/**
 * Close a resolved dispute
 */
export async function closeDispute(id: string): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}/close`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to close dispute");
  }

  return response.json();
}

/**
 * Add message to dispute
 */
export async function addDisputeMessage(
  id: string,
  data: {
    content: string;
    isInternal?: boolean;
    attachmentUrls?: string[];
  }
): Promise<{ dispute: Dispute }> {
  const response = await adminFetch(`/api/v1/admin/disputes/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add message");
  }

  return response.json();
}

// Resolution labels for display
export const RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  FULL_REFUND_CUSTOMER: "Full Refund to Customer",
  PARTIAL_REFUND: "Partial Refund",
  NO_REFUND: "No Refund (Stylist Keeps Funds)",
  SPLIT_FUNDS: "Split Funds 50/50",
  STYLIST_PENALTY: "Stylist Penalty",
  CUSTOMER_WARNING: "Customer Warning",
  MUTUAL_CANCELLATION: "Mutual Cancellation",
  ESCALATED_TO_LEGAL: "Escalated to Legal",
};

// Type labels for display
export const TYPE_LABELS: Record<DisputeType, string> = {
  SERVICE_QUALITY: "Service Quality",
  NO_SHOW: "No Show",
  LATE_ARRIVAL: "Late Arrival",
  PRICING_DISPUTE: "Pricing Dispute",
  SAFETY_CONCERN: "Safety Concern",
  HARASSMENT: "Harassment",
  PROPERTY_DAMAGE: "Property Damage",
  OTHER: "Other",
};

// Status labels for display
export const STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  UNDER_REVIEW: "Under Review",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
