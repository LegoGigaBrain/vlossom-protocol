/**
 * Admin Users Management Page (V7.0.0)
 *
 * User listing with search, filters, and actions.
 */

"use client";

import { useState, useMemo } from "react";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { FilterBar } from "../../../components/ui/filter-bar";
import { StatusBadge } from "../../../components/ui/status-badge";
import { StatCard } from "../../../components/ui/stat-card";
import { Pagination } from "../../../components/ui/pagination";
import { UserActionsDropdown } from "../../../components/users/user-actions-dropdown";
import { UserDetailPanel } from "../../../components/users/user-detail-panel";
import { useUsers, useUserStats } from "../../../hooks/use-users";
import type { User } from "../../../lib/users-client";

const roleFilterOptions = [
  { value: "", label: "All Roles" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "STYLIST", label: "Stylist" },
  { value: "PROPERTY_OWNER", label: "Property Owner" },
  { value: "ADMIN", label: "Admin" },
];

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

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

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading, error } = useUsers({
    page,
    pageSize: 20,
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: statsData } = useUserStats();
  const stats = statsData?.stats;

  const columns: Column<User>[] = useMemo(
    () => [
      {
        key: "user",
        header: "User",
        render: (user) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
              {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {user.displayName || "No display name"}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        ),
        sortable: true,
        sortKey: "displayName",
      },
      {
        key: "roles",
        header: "Roles",
        render: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <span
                key={role}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded"
              >
                {role}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: "verificationStatus",
        header: "Status",
        render: (user) => (
          <StatusBadge
            status={user.verificationStatus}
            variant={getStatusVariant(user.verificationStatus)}
          />
        ),
      },
      {
        key: "bookings",
        header: "Bookings",
        render: (user) => (
          <div className="text-sm text-gray-500">
            {user._count.bookingsAsCustomer + user._count.bookingsAsStylist}
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Joined",
        render: (user) => (
          <div className="text-sm text-gray-500">
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        ),
        sortable: true,
        sortKey: "createdAt",
      },
      {
        key: "actions",
        header: "",
        render: (user) => (
          <UserActionsDropdown
            user={user}
            onViewDetails={() => setSelectedUserId(user.id)}
          />
        ),
      },
    ],
    []
  );

  const filters = [
    {
      key: "role",
      label: "Role",
      value: roleFilter,
      options: roleFilterOptions,
      onChange: (value: string) => {
        setRoleFilter(value);
        setPage(1);
      },
    },
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      options: statusFilterOptions,
      onChange: (value: string) => {
        setStatusFilter(value);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">
          Manage user accounts, roles, and verification status.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="New Today"
            value={stats.newUsersToday.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Verified"
            value={stats.verifiedUsers.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Stylists"
            value={stats.totalStylists.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            }
            color="orange"
          />
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name or email..."
        filters={filters}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Failed to load users. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={data?.users || []}
          isLoading={isLoading}
          emptyMessage="No users found"
          onRowClick={(user) => setSelectedUserId(user.id)}
        />

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Total count */}
      {data && (
        <div className="text-sm text-gray-500 text-center">
          Showing {data.users.length} of {data.pagination.total} users
        </div>
      )}

      {/* User Detail Panel */}
      <UserDetailPanel
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
