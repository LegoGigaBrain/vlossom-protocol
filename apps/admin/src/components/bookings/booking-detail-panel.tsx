/**
 * Booking Detail Panel (V7.0.0)
 *
 * Slide-over panel showing detailed booking information.
 */

"use client";

import { useEffect, useState } from "react";
import { useBooking, useUpdateBookingStatus } from "../../hooks/use-bookings";
import { StatusBadge } from "../ui/status-badge";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { getStatusLabel, BOOKING_STATUSES } from "../../lib/bookings-client";

interface BookingDetailPanelProps {
  bookingId: string | null;
  onClose: () => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "PENDING_STYLIST_APPROVAL":
    case "PENDING_CUSTOMER_PAYMENT":
      return "warning";
    case "CONFIRMED":
    case "IN_PROGRESS":
      return "info";
    case "COMPLETED":
    case "SETTLED":
      return "success";
    case "CANCELLED":
      return "neutral";
    case "DISPUTED":
      return "error";
    default:
      return "neutral";
  }
};

export function BookingDetailPanel({ bookingId, onClose }: BookingDetailPanelProps) {
  const { data, isLoading, error } = useBooking(bookingId);
  const updateStatus = useUpdateBookingStatus();
  const booking = data?.booking;

  const [statusChange, setStatusChange] = useState<{
    status: string;
    reason: string;
  } | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (bookingId) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [bookingId, onClose]);

  if (!bookingId) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (cents: number) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  const handleStatusChange = async () => {
    if (!statusChange || !bookingId) return;

    try {
      await updateStatus.mutateAsync({
        id: bookingId,
        data: statusChange,
      });
      setStatusChange(null);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-73px)]">
          {isLoading && (
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load booking details</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700"
              >
                Close
              </button>
            </div>
          )}

          {booking && (
            <div className="space-y-6">
              {/* Booking ID and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-mono text-sm text-gray-900 truncate max-w-[200px]">
                    {booking.id}
                  </p>
                </div>
                <StatusBadge
                  status={getStatusLabel(booking.status)}
                  variant={getStatusVariant(booking.status)}
                />
              </div>

              {/* Customer and Stylist */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-2">Customer</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                      {booking.customer.displayName?.[0]?.toUpperCase() || booking.customer.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                        {booking.customer.displayName || "No name"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-2">Stylist</p>
                  {booking.stylist ? (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                        {booking.stylist.displayName?.[0]?.toUpperCase() || booking.stylist.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                          {booking.stylist.displayName || "No name"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not assigned</p>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Schedule</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(booking.scheduledStartTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Time</span>
                    <span className="text-sm text-gray-900">
                      {formatTime(booking.scheduledStartTime)} - {formatTime(booking.scheduledEndTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service and Pricing */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Service & Pricing</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {booking.service && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Service</span>
                      <span className="text-sm text-gray-900">{booking.service.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatAmount(booking.quoteAmountCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Platform Fee</span>
                    <span className="text-sm text-gray-900">
                      {formatAmount(booking.platformFeeCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Stylist Payout</span>
                    <span className="text-sm text-gray-900">
                      {formatAmount(booking.stylistPayoutCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status History */}
              {booking.statusHistory && booking.statusHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Status History</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {booking.statusHistory.map((history) => (
                      <div
                        key={history.id}
                        className="flex items-start justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-gray-900">
                            {getStatusLabel(history.fromStatus)} → {getStatusLabel(history.toStatus)}
                          </p>
                          {history.reason && (
                            <p className="text-xs text-gray-500">{history.reason}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(history.changedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Admin Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {booking.status !== "CANCELLED" && (
                    <button
                      onClick={() => setStatusChange({ status: "CANCELLED", reason: "" })}
                      className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {booking.status === "DISPUTED" && (
                    <button
                      onClick={() => setStatusChange({ status: "SETTLED", reason: "" })}
                      className="px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      Resolve & Settle
                    </button>
                  )}
                  {booking.status === "COMPLETED" && (
                    <button
                      onClick={() => setStatusChange({ status: "SETTLED", reason: "" })}
                      className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Force Settle
                    </button>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Record Dates</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Updated</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(booking.updatedAt)} {formatTime(booking.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Change Dialog */}
      {statusChange && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Status to {getStatusLabel(statusChange.status)}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={statusChange.reason}
                onChange={(e) =>
                  setStatusChange({ ...statusChange, reason: e.target.value })
                }
                placeholder="Enter reason for status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusChange(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={updateStatus.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {updateStatus.isPending ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
