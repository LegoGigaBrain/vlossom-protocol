/**
 * Admin Audit Logs Page (V7.0.0)
 *
 * View audit trail of all admin actions.
 */

"use client";

import { useState, useMemo } from "react";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { FilterBar } from "../../../components/ui/filter-bar";
import { StatCard } from "../../../components/ui/stat-card";
import { Pagination } from "../../../components/ui/pagination";
import { useAuditLogs, useAuditStats, useAuditActions } from "../../../hooks/use-logs";
import {
  type AuditLog,
  getActionLabel,
  getTargetTypeLabel,
} from "../../../lib/logs-client";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");

  const { data, isLoading, error } = useAuditLogs({
    page,
    pageSize: 50,
    action: actionFilter || undefined,
    targetType: targetTypeFilter || undefined,
  });

  const { data: statsData } = useAuditStats();
  const { data: actionsData } = useAuditActions();
  const stats = statsData?.stats;

  const actionFilterOptions = useMemo(() => {
    const options = [{ value: "", label: "All Actions" }];
    if (actionsData?.actions) {
      actionsData.actions.forEach((action) => {
        options.push({ value: action, label: getActionLabel(action) });
      });
    }
    return options;
  }, [actionsData?.actions]);

  const targetTypeFilterOptions = useMemo(() => {
    const options = [{ value: "", label: "All Types" }];
    if (actionsData?.targetTypes) {
      actionsData.targetTypes.forEach((type) => {
        options.push({ value: type, label: getTargetTypeLabel(type) });
      });
    }
    return options;
  }, [actionsData?.targetTypes]);

  const getActionColor = (action: string) => {
    if (action.includes("FREEZE") || action.includes("CANCEL") || action.includes("ESCALATE")) {
      return "bg-red-100 text-red-700";
    }
    if (action.includes("RESOLVE") || action.includes("VERIFY") || action.includes("UNFREEZE")) {
      return "bg-green-100 text-green-700";
    }
    if (action.includes("ASSIGN") || action.includes("CHANGE")) {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  const columns: Column<AuditLog>[] = useMemo(
    () => [
      {
        key: "timestamp",
        header: "Time",
        render: (log) => (
          <div className="text-sm">
            <div className="text-gray-900">
              {new Date(log.createdAt).toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(log.createdAt).toLocaleDateString()}
            </div>
          </div>
        ),
      },
      {
        key: "admin",
        header: "Admin",
        render: (log) => (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
              {log.admin.displayName?.[0]?.toUpperCase() ||
                log.admin.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-900 truncate max-w-[120px]">
              {log.admin.displayName || log.admin.email.split("@")[0]}
            </span>
          </div>
        ),
      },
      {
        key: "action",
        header: "Action",
        render: (log) => (
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}
          >
            {getActionLabel(log.action)}
          </span>
        ),
      },
      {
        key: "target",
        header: "Target",
        render: (log) => (
          <div className="text-sm">
            <div className="text-gray-900">{getTargetTypeLabel(log.targetType)}</div>
            <div className="text-xs text-gray-500 font-mono truncate max-w-[100px]">
              {log.targetId.slice(0, 8)}...
            </div>
          </div>
        ),
      },
      {
        key: "metadata",
        header: "Details",
        render: (log) => (
          <div className="text-sm text-gray-500 max-w-[200px] truncate">
            {log.metadata ? JSON.stringify(log.metadata) : "—"}
          </div>
        ),
      },
      {
        key: "ip",
        header: "IP",
        render: (log) => (
          <span className="text-sm text-gray-500 font-mono">
            {log.ipAddress || "—"}
          </span>
        ),
      },
    ],
    []
  );

  const filters = [
    {
      key: "action",
      label: "Action",
      value: actionFilter,
      options: actionFilterOptions,
      onChange: (value: string) => {
        setActionFilter(value);
        setPage(1);
      },
    },
    {
      key: "targetType",
      label: "Target Type",
      value: targetTypeFilter,
      options: targetTypeFilterOptions,
      onChange: (value: string) => {
        setTargetTypeFilter(value);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">
          Complete history of admin actions on the platform.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Logs"
            value={stats.totalLogs.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            title="Today"
            value={stats.logsToday.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Active Admins"
            value={stats.topAdmins?.length?.toString() || "0"}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            color="green"
          />
        </div>
      )}

      {/* Top Actions and Admins */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Actions by Type</h3>
            <div className="space-y-2">
              {Object.entries(stats.logsByAction || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([action, count]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">{getActionLabel(action)}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Admins */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Most Active Admins</h3>
            <div className="space-y-3">
              {stats.topAdmins?.slice(0, 5).map(({ admin, count }) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                      {admin.displayName?.[0]?.toUpperCase() ||
                        admin.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">
                      {admin.displayName || admin.email}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{count} actions</span>
                </div>
              ))}
            </div>
          </div>
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
          Failed to load audit logs. Please try again.
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={data?.logs || []}
          isLoading={isLoading}
          emptyMessage="No audit logs found"
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
          Showing {data.logs.length} of {data.pagination.total} logs
        </div>
      )}
    </div>
  );
}
