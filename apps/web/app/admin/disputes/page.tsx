/**
 * Admin Disputes List Page
 * V3.4: View and manage all disputes
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  User,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface Dispute {
  id: string;
  bookingId: string;
  type: string;
  status: string;
  priority: number;
  title: string;
  description: string;
  createdAt: string;
  filedBy?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  filedAgainst?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  assignedTo?: {
    id: string;
    displayName: string;
  } | null;
}

interface DisputeStats {
  total: number;
  open: number;
  assigned: number;
  underReview: number;
  resolved: number;
  escalated: number;
  avgResolutionTimeHours: number;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  RESOLVED: "bg-green-100 text-green-800",
  ESCALATED: "bg-red-100 text-red-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "bg-gray-100 text-gray-700" },
  2: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  3: { label: "High", color: "bg-orange-100 text-orange-700" },
  4: { label: "Urgent", color: "bg-red-100 text-red-700" },
  5: { label: "Critical", color: "bg-red-200 text-red-800" },
};

const typeLabels: Record<string, string> = {
  SERVICE_NOT_DELIVERED: "Service Not Delivered",
  POOR_QUALITY: "Poor Quality",
  LATE_ARRIVAL: "Late Arrival",
  NO_SHOW: "No Show",
  PROPERTY_DAMAGE: "Property Damage",
  PAYMENT_ISSUE: "Payment Issue",
  COMMUNICATION_ISSUE: "Communication Issue",
  SAFETY_CONCERN: "Safety Concern",
  OTHER: "Other",
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDisputes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
      });

      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await api.get(`/admin/disputes?${params}`);
      setDisputes(response.disputes);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError("Failed to load disputes");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/disputes/stats");
      setStats(response.stats);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  useEffect(() => {
    fetchDisputes();
    fetchStats();
  }, [page, statusFilter]);

  // Filter disputes by search query
  const filteredDisputes = disputes.filter((d) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(query) ||
      d.id.toLowerCase().includes(query) ||
      d.filedBy?.displayName.toLowerCase().includes(query) ||
      d.filedAgainst?.displayName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-gray-500">Review and resolve customer disputes</p>
        </div>
        <Button onClick={() => fetchDisputes()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-700">{stats.open}</div>
              <div className="text-sm text-yellow-600">Open</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700">{stats.assigned}</div>
              <div className="text-sm text-blue-600">Assigned</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-700">{stats.underReview}</div>
              <div className="text-sm text-purple-600">In Review</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-700">{stats.escalated}</div>
              <div className="text-sm text-red-600">Escalated</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
              <div className="text-sm text-green-600">Resolved</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Average Resolution Time */}
      {stats && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Average Resolution Time</div>
                <div className="text-xl font-bold">
                  {stats.avgResolutionTimeHours.toFixed(1)} hours
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search disputes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="ESCALATED">Escalated</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Loading disputes...</p>
        </div>
      )}

      {/* Disputes List */}
      {!isLoading && filteredDisputes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No disputes found</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredDisputes.length > 0 && (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <Link key={dispute.id} href={`/admin/disputes/${dispute.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={priorityLabels[dispute.priority]?.color || "bg-gray-100"}>
                          {priorityLabels[dispute.priority]?.label || "P" + dispute.priority}
                        </Badge>
                        <Badge className={statusColors[dispute.status] || "bg-gray-100"}>
                          {dispute.status.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {typeLabels[dispute.type] || dispute.type}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {dispute.title}
                      </h3>

                      {/* Description Preview */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {dispute.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {dispute.filedBy?.displayName || "Unknown"} vs{" "}
                            {dispute.filedAgainst?.displayName || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {dispute.assignedTo && (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600">
                              Assigned to: {dispute.assignedTo.displayName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
