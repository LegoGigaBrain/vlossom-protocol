/**
 * Admin Dispute Detail Page (V7.0.0)
 *
 * Full dispute resolution workflow with messaging.
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "../../../../components/ui/status-badge";
import { ConfirmDialog } from "../../../../components/ui/confirm-dialog";
import { ResolutionForm } from "../../../../components/disputes/resolution-form";
import {
  useDispute,
  useAssignDispute,
  useStartReview,
  useResolveDispute,
  useEscalateDispute,
  useCloseDispute,
  useAddDisputeMessage,
} from "../../../../hooks/use-disputes";
import { useAdminAuth } from "../../../../hooks/use-admin-auth";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  RESOLUTION_LABELS,
  type DisputeResolution,
} from "../../../../lib/disputes-client";

const getStatusVariant = (status: string) => {
  switch (status) {
    case "OPEN":
      return "warning";
    case "ASSIGNED":
    case "UNDER_REVIEW":
      return "info";
    case "ESCALATED":
      return "error";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const { user } = useAdminAuth();
  const { data, isLoading, error } = useDispute(disputeId);
  const dispute = data?.dispute;

  const assignMutation = useAssignDispute();
  const reviewMutation = useStartReview();
  const resolveMutation = useResolveDispute();
  const escalateMutation = useEscalateDispute();
  const closeMutation = useCloseDispute();
  const messageMutation = useAddDisputeMessage();

  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isInternalMessage, setIsInternalMessage] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAssignToMe = async () => {
    if (!user) return;
    await assignMutation.mutateAsync({ id: disputeId, assignedToId: user.id });
  };

  const handleStartReview = async () => {
    await reviewMutation.mutateAsync(disputeId);
  };

  const handleResolve = async (data: {
    resolution: DisputeResolution;
    resolutionNotes: string;
    refundPercent?: number;
  }) => {
    await resolveMutation.mutateAsync({ id: disputeId, data });
    setShowResolutionForm(false);
  };

  const handleEscalate = async () => {
    if (escalationReason.length < 10) return;
    await escalateMutation.mutateAsync({ id: disputeId, reason: escalationReason });
    setShowEscalateDialog(false);
    setEscalationReason("");
  };

  const handleClose = async () => {
    await closeMutation.mutateAsync(disputeId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await messageMutation.mutateAsync({
      id: disputeId,
      data: {
        content: newMessage,
        isInternal: isInternalMessage,
      },
    });
    setNewMessage("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold text-gray-900">Dispute Not Found</h2>
        <p className="text-gray-500 mt-2">The dispute you're looking for doesn't exist.</p>
        <Link
          href="/disputes"
          className="mt-4 inline-block text-purple-600 hover:text-purple-700"
        >
          ← Back to Disputes
        </Link>
      </div>
    );
  }

  const canAssign = dispute.status === "OPEN";
  const canStartReview = dispute.status === "ASSIGNED" && dispute.assignedToId === user?.id;
  const canResolve = ["ASSIGNED", "UNDER_REVIEW", "ESCALATED"].includes(dispute.status);
  const canEscalate = ["ASSIGNED", "UNDER_REVIEW"].includes(dispute.status);
  const canClose = dispute.status === "RESOLVED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/disputes"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Back to Disputes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{dispute.subject}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge
              status={STATUS_LABELS[dispute.status]}
              variant={getStatusVariant(dispute.status)}
            />
            <span className="text-sm text-gray-500">
              Priority {dispute.priority} · {TYPE_LABELS[dispute.type]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canAssign && (
            <button
              onClick={handleAssignToMe}
              disabled={assignMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign to Me"}
            </button>
          )}
          {canStartReview && (
            <button
              onClick={handleStartReview}
              disabled={reviewMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
            >
              {reviewMutation.isPending ? "Starting..." : "Start Review"}
            </button>
          )}
          {canEscalate && (
            <button
              onClick={() => setShowEscalateDialog(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
            >
              Escalate
            </button>
          )}
          {canResolve && (
            <button
              onClick={() => setShowResolutionForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Resolve
            </button>
          )}
          {canClose && (
            <button
              onClick={handleClose}
              disabled={closeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
            >
              {closeMutation.isPending ? "Closing..." : "Close Dispute"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>

            {dispute.evidence && dispute.evidence.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Evidence</h4>
                <div className="flex flex-wrap gap-2">
                  {dispute.evidence.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Attachment {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resolution (if resolved) */}
          {dispute.resolution && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h3 className="text-sm font-medium text-green-800 mb-3">Resolution</h3>
              <p className="font-semibold text-green-900">
                {RESOLUTION_LABELS[dispute.resolution]}
              </p>
              {dispute.resolutionNotes && (
                <p className="text-green-700 mt-2 whitespace-pre-wrap">
                  {dispute.resolutionNotes}
                </p>
              )}
              {dispute.resolvedBy && (
                <p className="text-sm text-green-600 mt-3">
                  Resolved by {dispute.resolvedBy.displayName || dispute.resolvedBy.email} on{" "}
                  {dispute.resolvedAt && formatDate(dispute.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Messages</h3>

            {/* Message list */}
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {dispute.messages && dispute.messages.length > 0 ? (
                dispute.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.isInternal
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.author.displayName || message.author.email}
                        {message.isInternal && (
                          <span className="ml-2 text-xs text-amber-600">(Internal)</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
              )}
            </div>

            {/* New message form */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-100 pt-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternalMessage}
                    onChange={(e) => setIsInternalMessage(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Internal note (not visible to parties)
                </label>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || messageMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {messageMutation.isPending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Parties</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Filed By</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                    {dispute.filedBy.displayName?.[0]?.toUpperCase() ||
                      dispute.filedBy.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dispute.filedBy.displayName || "No name"}
                    </p>
                    <p className="text-xs text-gray-500">{dispute.filedBy.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Against</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-medium">
                    {dispute.againstUser.displayName?.[0]?.toUpperCase() ||
                      dispute.againstUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dispute.againstUser.displayName || "No name"}
                    </p>
                    <p className="text-xs text-gray-500">{dispute.againstUser.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Assignment</h3>
            {dispute.assignedTo ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                  {dispute.assignedTo.displayName?.[0]?.toUpperCase() ||
                    dispute.assignedTo.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {dispute.assignedTo.displayName || "No name"}
                  </p>
                  <p className="text-xs text-gray-500">{dispute.assignedTo.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not assigned</p>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Filed</span>
                <span className="text-gray-900">{formatDate(dispute.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-900">{formatDate(dispute.updatedAt)}</span>
              </div>
              {dispute.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved</span>
                  <span className="text-gray-900">{formatDate(dispute.resolvedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related Booking */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Related Booking</h3>
            <Link
              href={`/bookings?id=${dispute.bookingId}`}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              View Booking →
            </Link>
          </div>
        </div>
      </div>

      {/* Resolution Form Modal */}
      {showResolutionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowResolutionForm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolve Dispute</h2>
              <ResolutionForm
                onSubmit={handleResolve}
                onCancel={() => setShowResolutionForm(false)}
                isLoading={resolveMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Escalate Dialog */}
      {showEscalateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowEscalateDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Escalate Dispute</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Reason
              </label>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Explain why this dispute needs escalation..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 10 characters required
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEscalateDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={escalationReason.length < 10 || escalateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {escalateMutation.isPending ? "Escalating..." : "Escalate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
