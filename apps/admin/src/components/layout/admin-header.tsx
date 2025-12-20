/**
 * Admin Header (V7.0.0)
 *
 * Top header with user info and actions.
 */

"use client";

import { useAdminAuth } from "../../hooks/use-admin-auth";

export function AdminHeader() {
  const { user, logout, isLoading } = useAdminAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info */}
        {isLoading ? (
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.displayName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
              {user.displayName?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        ) : null}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
