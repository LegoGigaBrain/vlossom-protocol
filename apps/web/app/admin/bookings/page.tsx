"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/icons";
import { authFetch } from "@/lib/auth-client";

interface BookingData {
  id: string;
  status: string;
  serviceType: string;
  scheduledAt: string;
  totalAmountCents: number;
  platformFeeCents: number;
  stylistPayoutCents: number;
  createdAt: string;
  customer: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  stylist: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface BookingStats {
  totalBookings: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  monthlyGrowth: string;
  byStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenueThisMonth: number;
}

/**
 * Admin Bookings Page
 * Lists all bookings with search, filtering, and pagination
 */
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20",
      });

      if (statusFilter) params.append("status", statusFilter);

      const response = await authFetch(`/api/v1/admin/bookings?${params}`);

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  }, [currentPage, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/admin/bookings/stats/overview");

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch booking stats:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchBookings(), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchBookings, fetchStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBookings(), fetchStats()]);
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(cents / 100);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING_STYLIST_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "AWAITING_PAYMENT":
        return "bg-orange-100 text-orange-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-indigo-100 text-indigo-800";
      case "AWAITING_CUSTOMER_CONFIRMATION":
        return "bg-purple-100 text-purple-800";
      case "SETTLED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "DECLINED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-500">Monitor and manage all bookings</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <Icon name="settings" size="sm" className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon name="calendar" size="sm" />
              Total Bookings
            </div>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Today</div>
            <div className="text-2xl font-bold">{stats.bookingsToday}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">This Month</div>
            <div className="text-2xl font-bold">{stats.bookingsThisMonth}</div>
            <div className="text-xs text-green-600">+{stats.monthlyGrowth}% growth</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon name="currency" size="sm" />
              Revenue (Month)
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.revenueThisMonth * 100)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_STYLIST_APPROVAL">Pending Approval</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="AWAITING_CUSTOMER_CONFIRMATION">Awaiting Confirmation</option>
            <option value="SETTLED">Settled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stylist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.serviceType}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {booking.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.customer.displayName || "No name"}
                    </div>
                    <div className="text-xs text-gray-500">{booking.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.stylist.displayName || "No name"}
                    </div>
                    <div className="text-xs text-gray-500">{booking.stylist.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(booking.status)}`}
                    >
                      {formatStatus(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(booking.totalAmountCents)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Fee: {formatCurrency(booking.platformFeeCents)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(booking.scheduledAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.pageSize, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Icon name="chevronLeft" size="md" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Icon name="chevronRight" size="md" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
