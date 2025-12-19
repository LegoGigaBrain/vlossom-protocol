"use client";

import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Icon } from "@/components/icons";

export type DisputeStatusType =
  | "PENDING"
  | "IN_REVIEW"
  | "AWAITING_RESPONSE"
  | "RESOLVED_CUSTOMER"
  | "RESOLVED_STYLIST"
  | "RESOLVED_PARTIAL"
  | "WITHDRAWN";

interface DisputeStatusProps {
  dispute: {
    id: string;
    status: DisputeStatusType;
    createdAt: string;
    updatedAt: string;
    reason: string;
    desiredResolution: string;
    refundAmount?: string;
    adminNotes?: string;
    resolution?: {
      outcome: string;
      refundAmount?: string;
      notes: string;
      resolvedAt: string;
    };
    messages?: Array<{
      id: string;
      from: "customer" | "stylist" | "admin";
      message: string;
      createdAt: string;
    }>;
  };
  bookingTotal: string;
  onAddMessage?: () => void;
  onWithdraw?: () => void;
  className?: string;
}

const statusConfig: Record<
  DisputeStatusType,
  {
    label: string;
    description: string;
    iconName: IconName;
    color: string;
    bgColor: string;
  }
> = {
  PENDING: {
    label: "Pending Review",
    description: "Your dispute has been submitted and is awaiting review",
    iconName: "clock",
    color: "text-status-warning",
    bgColor: "bg-status-warning/10",
  },
  IN_REVIEW: {
    label: "Under Review",
    description: "Our team is actively reviewing your case",
    iconName: "secure",
    color: "text-status-info",
    bgColor: "bg-status-info/10",
  },
  AWAITING_RESPONSE: {
    label: "Awaiting Response",
    description: "Waiting for a response from the other party",
    iconName: "chat",
    color: "text-brand-rose",
    bgColor: "bg-brand-rose/10",
  },
  RESOLVED_CUSTOMER: {
    label: "Resolved - Full Refund",
    description: "The dispute was resolved in your favor",
    iconName: "check",
    color: "text-status-success",
    bgColor: "bg-status-success/10",
  },
  RESOLVED_STYLIST: {
    label: "Resolved - No Refund",
    description: "The dispute was resolved in favor of the stylist",
    iconName: "close",
    color: "text-status-error",
    bgColor: "bg-status-error/10",
  },
  RESOLVED_PARTIAL: {
    label: "Resolved - Partial Refund",
    description: "The dispute was resolved with a partial refund",
    iconName: "check",
    color: "text-status-info",
    bgColor: "bg-status-info/10",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    description: "You withdrew this dispute",
    iconName: "close",
    color: "text-text-secondary",
    bgColor: "bg-background-tertiary",
  },
};

export function DisputeStatus({
  dispute,
  bookingTotal,
  onAddMessage,
  onWithdraw,
  className,
}: DisputeStatusProps) {
  const config = statusConfig[dispute.status];

  const isResolved = dispute.status.startsWith("RESOLVED") || dispute.status === "WITHDRAWN";
  const canWithdraw = ["PENDING", "IN_REVIEW", "AWAITING_RESPONSE"].includes(dispute.status);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Header */}
      <div className={cn("rounded-card p-4", config.bgColor)}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              config.bgColor
            )}
          >
            <Icon name={config.iconName} size="sm" className={config.color} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className={cn("font-semibold", config.color)}>
                {config.label}
              </h3>
              <span className="text-xs text-text-muted">
                #{dispute.id.slice(0, 8)}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {config.description}
            </p>
            <p className="text-xs text-text-muted mt-2">
              Filed {format(new Date(dispute.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-background-secondary rounded-card p-4">
        <h4 className="font-medium text-text-primary mb-4">Dispute Timeline</h4>
        <div className="space-y-4">
          {/* Filed */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-brand-rose" />
              <div className="w-0.5 flex-1 bg-border-default" />
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-text-primary">
                Dispute Filed
              </p>
              <p className="text-xs text-text-muted">
                {format(new Date(dispute.createdAt), "MMM d, h:mm a")}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {dispute.reason.slice(0, 100)}
                {dispute.reason.length > 100 ? "..." : ""}
              </p>
            </div>
          </div>

          {/* Messages */}
          {dispute.messages?.map((message, index) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    message.from === "admin"
                      ? "bg-status-info"
                      : message.from === "customer"
                      ? "bg-brand-rose"
                      : "bg-text-secondary"
                  )}
                />
                {index < (dispute.messages?.length || 0) - 1 && (
                  <div className="w-0.5 flex-1 bg-border-default" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-text-primary">
                  {message.from === "admin"
                    ? "Vlossom Support"
                    : message.from === "customer"
                    ? "You"
                    : "Stylist"}
                </p>
                <p className="text-xs text-text-muted">
                  {format(new Date(message.createdAt), "MMM d, h:mm a")}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {message.message}
                </p>
              </div>
            </div>
          ))}

          {/* Resolution */}
          {dispute.resolution && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-status-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Dispute Resolved
                </p>
                <p className="text-xs text-text-muted">
                  {format(new Date(dispute.resolution.resolvedAt), "MMM d, h:mm a")}
                </p>
                <div className="mt-2 p-3 bg-background-tertiary rounded-lg">
                  <p className="text-sm text-text-secondary">
                    {dispute.resolution.notes}
                  </p>
                  {dispute.resolution.refundAmount && (
                    <p className="text-sm font-medium text-status-success mt-2">
                      Refund: ${dispute.resolution.refundAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-background-secondary rounded-card p-4">
        <h4 className="font-medium text-text-primary mb-3">Your Request</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Resolution requested</span>
            <span className="text-text-primary font-medium capitalize">
              {dispute.desiredResolution.replace("_", " ")}
            </span>
          </div>
          {dispute.refundAmount && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Amount requested</span>
              <span className="text-text-primary font-medium">
                ${dispute.refundAmount}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-secondary">Booking total</span>
            <span className="text-text-primary font-medium">${bookingTotal}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isResolved && (
        <div className="flex gap-3">
          {onAddMessage && (
            <Button onClick={onAddMessage} className="flex-1">
              <Icon name="chat" size="sm" className="mr-2" />
              Add Message
            </Button>
          )}
          {canWithdraw && onWithdraw && (
            <Button variant="outline" onClick={onWithdraw}>
              Withdraw Dispute
            </Button>
          )}
        </div>
      )}

      {/* Help */}
      <div className="bg-background-tertiary rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="error" size="sm" className="text-text-muted" />
          <span className="text-sm text-text-secondary">
            Need more help?
          </span>
        </div>
        <button className="text-sm text-brand-rose hover:text-brand-clay transition-gentle flex items-center gap-1">
          Contact Support
          <Icon name="chevronRight" size="sm" />
        </button>
      </div>
    </div>
  );
}
