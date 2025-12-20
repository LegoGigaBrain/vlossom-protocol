/**
 * Admin Bookings Management Page (V7.0.0)
 *
 * Booking listing with filters and actions.
 */

"use client";

import { useState, useMemo } from "react";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { FilterBar } from "../../../components/ui/filter-bar";
import { StatusBadge } from "../../../components/ui/status-badge";
import { StatCard } from "../../../components/ui/stat-card";
import { Pagination } from "../../../components/ui/pagination";
import { BookingDetailPanel } from "../../../components/bookings/booking-detail-panel";
import { useBookings, useBookingStats } from "../../../hooks/use-bookings";
import { getStatusLabel, type Booking } from "../../../lib/bookings-client";

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_STYLIST_APPROVAL", label: "Pending Approval" },
  { value: "PENDING_CUSTOMER_PAYMENT", label: "Pending Payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SETTLED", label: "Settled" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DISPUTED", label: "Disputed" },
];

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

const formatAmount = (cents: number) => `R${(cents / 100).toFixed(2)}`;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data, isLoading, error } = useBookings({
    page,
    pageSize: 20,
    status: statusFilter || undefined,
    sortBy: "scheduledStartTime",
    sortOrder: "desc",
  });

  const { data: statsData } = useBookingStats();
  const stats = statsData?.stats;

  const columns: Column<Booking>[] = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        render: (booking) => (
          <span className="font-mono text-xs text-gray-500 truncate max-w-[80px] block">
            {booking.id.slice(0, 8)}...
          </span>
        ),
      },
      {
        key: "schedule",
        header: "Schedule",
        render: (booking) => (
          <div>
            <div className="text-sm text-gray-900">
              {formatDate(booking.scheduledStartTime)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTime(booking.scheduledStartTime)}
            </div>
          </div>
        ),
        sortable: true,
        sortKey: "scheduledStartTime",
      },
      {
        key: "customer",
        header: "Customer",
        render: (booking) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
              {booking.customer.displayName?.[0]?.toUpperCase() || booking.customer.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-900 truncate max-w-[100px]">
              {booking.customer.displayName || booking.customer.email.split("@")[0]}
            </span>
          </div>
        ),
      },
      {
        key: "stylist",
        header: "Stylist",
        render: (booking) =>
          booking.stylist ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                {booking.stylist.displayName?.[0]?.toUpperCase() || booking.stylist.email[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-900 truncate max-w-[100px]">
                {booking.stylist.displayName || booking.stylist.email.split("@")[0]}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        key: "service",
        header: "Service",
        render: (booking) => (
          <span className="text-sm text-gray-900 truncate max-w-[120px] block">
            {booking.service?.name || "—"}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        render: (booking) => (
          <span className="text-sm font-medium text-gray-900">
            {formatAmount(booking.quoteAmountCents)}
          </span>
        ),
        sortable: true,
        sortKey: "quoteAmountCents",
      },
      {
        key: "status",
        header: "Status",
        render: (booking) => (
          <StatusBadge
            status={getStatusLabel(booking.status)}
            variant={getStatusVariant(booking.status)}
          />
        ),
      },
    ],
    []
  );

  const filters = [
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
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">
          View and manage all platform bookings.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="Today"
            value={stats.bookingsToday.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="This Month"
            value={stats.bookingsThisMonth.toString()}
            change={
              typeof stats.monthlyGrowth === "number" || !isNaN(parseFloat(String(stats.monthlyGrowth)))
                ? {
                    value: parseFloat(String(stats.monthlyGrowth)),
                    isPositive: parseFloat(String(stats.monthlyGrowth)) >= 0,
                  }
                : undefined
            }
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Revenue (MTD)"
            value={`R${stats.revenueThisMonth.toLocaleString()}`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="orange"
          />
        </div>
      )}

      {/* Status Quick Filters */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatusFilter("PENDING_STYLIST_APPROVAL,PENDING_CUSTOMER_PAYMENT");
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            Pending ({stats.byStatus.pending})
          </button>
          <button
            onClick={() => {
              setStatusFilter("CONFIRMED");
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Confirmed ({stats.byStatus.confirmed})
          </button>
          <button
            onClick={() => {
              setStatusFilter("SETTLED");
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
          >
            Completed ({stats.byStatus.completed})
          </button>
          <button
            onClick={() => {
              setStatusFilter("CANCELLED");
              setPage(1);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            Cancelled ({stats.byStatus.cancelled})
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        filters={filters}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Failed to load bookings. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={data?.bookings || []}
          isLoading={isLoading}
          emptyMessage="No bookings found"
          onRowClick={(booking) => setSelectedBookingId(booking.id)}
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
          Showing {data.bookings.length} of {data.pagination.total} bookings
        </div>
      )}

      {/* Booking Detail Panel */}
      <BookingDetailPanel
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
      />
    </div>
  );
}
