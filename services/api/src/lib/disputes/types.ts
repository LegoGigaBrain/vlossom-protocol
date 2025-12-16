/**
 * Dispute Types
 * Reference: docs/vlossom/22-admin-control-panel.md
 */

export type DisputeStatus =
  | "OPEN"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "ESCALATED"
  | "CLOSED";

export type DisputeType =
  | "SERVICE_NOT_DELIVERED"
  | "POOR_QUALITY"
  | "LATE_ARRIVAL"
  | "NO_SHOW"
  | "PROPERTY_DAMAGE"
  | "PAYMENT_ISSUE"
  | "COMMUNICATION_ISSUE"
  | "SAFETY_CONCERN"
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

export interface CreateDisputeInput {
  bookingId: string;
  filedById: string;
  filedAgainstId: string;
  type: DisputeType;
  title: string;
  description: string;
  evidenceUrls?: string[];
}

export interface AssignDisputeInput {
  disputeId: string;
  assignedToId: string;
}

export interface ResolveDisputeInput {
  disputeId: string;
  resolvedById: string;
  resolution: DisputeResolution;
  resolutionNotes: string;
  refundPercent?: number; // For partial refunds
}

export interface EscalateDisputeInput {
  disputeId: string;
  escalatedById: string;
  escalationReason: string;
}

export interface AddDisputeMessageInput {
  disputeId: string;
  authorId: string;
  content: string;
  isInternal?: boolean;
  attachmentUrls?: string[];
}

export interface DisputeFilters {
  status?: DisputeStatus[];
  type?: DisputeType[];
  assignedToId?: string;
  priority?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface DisputeStats {
  total: number;
  open: number;
  assigned: number;
  underReview: number;
  resolved: number;
  escalated: number;
  avgResolutionTimeHours: number;
  resolutionsByType: Record<DisputeResolution, number>;
}

// Dispute with relations
export interface DisputeWithDetails {
  id: string;
  bookingId: string;
  filedById: string;
  filedAgainstId: string;
  type: DisputeType;
  status: DisputeStatus;
  priority: number;
  title: string;
  description: string;
  evidenceUrls: string[];
  assignedToId: string | null;
  assignedAt: Date | null;
  resolution: DisputeResolution | null;
  resolutionNotes: string | null;
  refundPercent: number | null;
  resolvedAt: Date | null;
  resolvedById: string | null;
  escalatedAt: Date | null;
  escalatedById: string | null;
  escalationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  filedBy?: {
    id: string;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  filedAgainst?: {
    id: string;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
  };
  assignedTo?: {
    id: string;
    displayName: string;
    email: string | null;
  } | null;
  booking?: {
    id: string;
    status: string;
    scheduledStartTime: Date;
    quoteAmountCents: number;
  };
  messages?: DisputeMessageWithAuthor[];
}

export interface DisputeMessageWithAuthor {
  id: string;
  disputeId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  attachmentUrls: string[];
  createdAt: Date;
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}
