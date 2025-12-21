/**
 * Admin Disputes Management Page (V7.0.0)
 *
 * Dispute listing with filters and priority handling.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { FilterBar } from "../../../components/ui/filter-bar";
import { StatusBadge } from "../../../components/ui/status-badge";
import { StatCard } from "../../../components/ui/stat-card";
import { Pagination } from "../../../components/ui/pagination";
import { useDisputes, useDisputeStats } from "../../../hooks/use-disputes";
import {
  type Dispute,
  STATUS_LABELS,
  TYPE_LABELS,
} from "../../../lib/disputes-client";

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const typeFilterOptions = [
  { value: "", label: "All Types" },
  { value: "SERVICE_QUALITY", label: "Service Quality" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "LATE_ARRIVAL", label: "Late Arrival" },
  { value: "PRICING_DISPUTE", label: "Pricing Dispute" },
  { value: "SAFETY_CONCERN", label: "Safety Concern" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "PROPERTY_DAMAGE", label: "Property Damage" },
  { value: "OTHER", label: "Other" },
];

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

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 5:
      return "text-red-600 bg-red-100";
    case 4:
      return "text-orange-600 bg-orange-100";
    case 3:
      return "text-amber-600 bg-amber-100";
    case 2:
      return "text-blue-600 bg-blue-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export default function DisputesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, error } = useDisputes({
    page,
    pageSize: 20,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const { data: statsData } = useDisputeStats();
  const stats = statsData?.stats;

  const columns: Column<Dispute>[] = useMemo(
    () => [
      {
        key: "priority",
        header: "P",
        render: (dispute) => (
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getPriorityColor(dispute.priority)}`}
          >
            {dispute.priority}
          </span>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        render: (dispute) => (
          <div className="max-w-[200px]">
            <Link
              href={`/disputes/${dispute.id}`}
              className="text-sm font-medium text-gray-900 hover:text-purple-600 line-clamp-1"
            >
              {dispute.subject}
            </Link>
            <p className="text-xs text-gray-500 line-clamp-1">
              {dispute.description}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (dispute) => (
          <span className="text-sm text-gray-700">
            {TYPE_LABELS[dispute.type]}
          </span>
        ),
      },
      {
        key: "filedBy",
        header: "Filed By",
        render: (dispute) => (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
              {dispute.filedBy.displayName?.[0]?.toUpperCase() ||
                dispute.filedBy.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-700 truncate max-w-[100px]">
              {dispute.filedBy.displayName || dispute.filedBy.email.split("@")[0]}
            </span>
          </div>
        ),
      },
      {
        key: "againstUser",
        header: "Against",
        render: (dispute) => (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-medium">
              {dispute.againstUser.displayName?.[0]?.toUpperCase() ||
                dispute.againstUser.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-700 truncate max-w-[100px]">
              {dispute.againstUser.displayName || dispute.againstUser.email.split("@")[0]}
            </span>
          </div>
        ),
      },
      {
        key: "assignedTo",
        header: "Assigned",
        render: (dispute) =>
          dispute.assignedTo ? (
            <span className="text-sm text-gray-700">
              {dispute.assignedTo.displayName || dispute.assignedTo.email.split("@")[0]}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Unassigned</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        render: (dispute) => (
          <StatusBadge
            status={STATUS_LABELS[dispute.status]}
            variant={getStatusVariant(dispute.status)}
          />
        ),
      },
      {
        key: "createdAt",
        header: "Filed",
        render: (dispute) => (
          <span className="text-sm text-gray-500">
            {new Date(dispute.createdAt).toLocaleDateString()}
          </span>
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
    {
      key: "type",
      label: "Type",
      value: typeFilter,
      options: typeFilterOptions,
      onChange: (value: string) => {
        setTypeFilter(value);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500 mt-1">
          Manage and resolve customer disputes.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Open Disputes"
            value={(stats.open + stats.assigned).toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="orange"
          />
          <StatCard
            title="Under Review"
            value={stats.underReview.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Escalated"
            value={stats.escalated.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
        </div>
      )}

      {/* Priority Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setStatusFilter("ESCALATED");
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium"
        >
          Escalated First
        </button>
        <button
          onClick={() => {
            setStatusFilter("OPEN");
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
        >
          Unassigned
        </button>
        <button
          onClick={() => {
            setStatusFilter("UNDER_REVIEW");
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          In Review
        </button>
        <button
          onClick={() => {
            setStatusFilter("");
            setTypeFilter("");
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          Clear Filters
        </button>
      </div>

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
          Failed to load disputes. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={data?.disputes || []}
          isLoading={isLoading}
          emptyMessage="No disputes found"
          onRowClick={(dispute) => {
            window.location.href = `/disputes/${dispute.id}`;
          }}
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
          Showing {data.disputes.length} of {data.pagination.total} disputes
        </div>
      )}
    </div>
  );
}
