/**
 * User Detail Panel (V7.0.0)
 *
 * Slide-over panel showing detailed user information.
 */

"use client";

import { useEffect } from "react";
import { useUser } from "../../hooks/use-users";
import { StatusBadge } from "../ui/status-badge";

interface UserDetailPanelProps {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailPanel({ userId, onClose }: UserDetailPanelProps) {
  const { data, isLoading, error } = useUser(userId);
  const user = data?.user;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (userId) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [userId, onClose]);

  if (!userId) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "neutral";
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
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
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
              <p className="text-red-600">Failed to load user details</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700"
              >
                Close
              </button>
            </div>
          )}

          {user && (
            <div className="space-y-6">
              {/* User avatar and name */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xl">
                  {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {user.displayName || "No display name"}
                  </h3>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* Status and roles */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge
                    status={user.verificationStatus}
                    variant={getStatusVariant(user.verificationStatus)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Roles</span>
                  <div className="flex gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Contact Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Phone</span>
                    <span className="text-sm text-gray-900">{user.phone || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              {user.wallet && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Wallet</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Address</span>
                      <span className="text-sm text-gray-900 font-mono truncate max-w-[200px]">
                        {user.wallet.address}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Chain ID</span>
                      <span className="text-sm text-gray-900">{user.wallet.chainId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Deployed</span>
                      <span className={`text-sm ${user.wallet.isDeployed ? "text-green-600" : "text-amber-600"}`}>
                        {user.wallet.isDeployed ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stylist Profile */}
              {user.stylistProfile && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Stylist Profile</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Accepting Bookings</span>
                      <span className={`text-sm ${user.stylistProfile.isAcceptingBookings ? "text-green-600" : "text-red-600"}`}>
                        {user.stylistProfile.isAcceptingBookings ? "Yes" : "No"}
                      </span>
                    </div>
                    {user.stylistProfile.specialties.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500 block mb-2">Specialties</span>
                        <div className="flex flex-wrap gap-1">
                          {user.stylistProfile.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {user.stylistProfile.bio && (
                      <div>
                        <span className="text-sm text-gray-500 block mb-1">Bio</span>
                        <p className="text-sm text-gray-700">{user.stylistProfile.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {user._count.bookingsAsCustomer}
                    </div>
                    <div className="text-sm text-gray-500">Bookings as Customer</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {user._count.bookingsAsStylist}
                    </div>
                    <div className="text-sm text-gray-500">Bookings as Stylist</div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Account Dates</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <span className="text-sm text-gray-900">{formatDate(user.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
