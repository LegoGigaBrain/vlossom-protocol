"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockRequests = [
  {
    id: "1",
    stylist: {
      name: "Maria Johnson",
      avatar: null,
      rating: 4.8,
      completedBookings: 156,
    },
    property: "Natural Hair Studio",
    chair: "Chair #1",
    requestedMode: "PER_DAY",
    requestedRate: 75,
    startDate: "2024-01-20",
    endDate: null,
    message: "Hi! I'm a licensed braider with 5 years of experience. I'd love to rent a chair at your studio. I have my own clientele and maintain a professional workspace.",
    status: "PENDING",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    stylist: {
      name: "Aaliyah Williams",
      avatar: null,
      rating: 4.9,
      completedBookings: 203,
    },
    property: "Natural Hair Studio",
    chair: "Chair #3",
    requestedMode: "PER_WEEK",
    requestedRate: 350,
    startDate: "2024-01-22",
    endDate: "2024-03-22",
    message: "Looking for a weekly rental for 2 months. I specialize in natural hair care and have excellent reviews on Vlossom.",
    status: "PENDING",
    createdAt: "2024-01-14T14:20:00Z",
  },
  {
    id: "3",
    stylist: {
      name: "Jessica Brown",
      avatar: null,
      rating: 4.5,
      completedBookings: 89,
    },
    property: "Braids & Beauty",
    chair: "Chair #2",
    requestedMode: "PER_BOOKING",
    requestedRate: 15,
    startDate: "2024-01-18",
    endDate: null,
    message: "I'd like to use your chair for specific bookings. I do protective styles and braids.",
    status: "APPROVED",
    createdAt: "2024-01-10T09:15:00Z",
  },
];

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export default function RequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | "ALL">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredRequests =
    filter === "ALL"
      ? mockRequests
      : mockRequests.filter((r) => r.status === filter);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProcessingId(null);
    alert("Request approved! (Demo mode)");
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProcessingId(null);
    alert("Request rejected! (Demo mode)");
  };

  const formatRentalMode = (mode: string) => {
    switch (mode) {
      case "PER_BOOKING":
        return "Per Booking";
      case "PER_HOUR":
        return "Per Hour";
      case "PER_DAY":
        return "Per Day";
      case "PER_WEEK":
        return "Per Week";
      case "PER_MONTH":
        return "Per Month";
      default:
        return mode;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-vlossom-neutral-900">
          Rental Requests
        </h2>
        <p className="text-vlossom-neutral-600">
          Review and manage chair rental requests from stylists
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === status
                ? "bg-vlossom-primary text-white"
                : "bg-white text-vlossom-neutral-600 hover:bg-vlossom-neutral-100"
            }`}
          >
            {status === "ALL" ? "All Requests" : status}
            {status === "PENDING" && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {mockRequests.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Stylist info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-vlossom-neutral-200 rounded-full flex items-center justify-center text-vlossom-neutral-500 font-semibold">
                    {request.stylist.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-vlossom-neutral-900">
                        {request.stylist.name}
                      </h3>
                      <Badge
                        variant={
                          request.status === "PENDING"
                            ? "warning"
                            : request.status === "APPROVED"
                            ? "success"
                            : "danger"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-vlossom-neutral-500">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {request.stylist.rating}
                      </span>
                      <span>
                        {request.stylist.completedBookings} bookings
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-vlossom-neutral-600">
                      {request.message}
                    </p>
                  </div>
                </div>

                {/* Request details */}
                <div className="bg-vlossom-neutral-50 rounded-lg p-4 lg:w-72">
                  <div className="text-sm text-vlossom-neutral-500 mb-3">
                    Request Details
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-vlossom-neutral-600">Property</span>
                      <span className="font-medium text-vlossom-neutral-900">
                        {request.property}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vlossom-neutral-600">Chair</span>
                      <span className="font-medium text-vlossom-neutral-900">
                        {request.chair}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vlossom-neutral-600">
                        Rental Mode
                      </span>
                      <span className="font-medium text-vlossom-neutral-900">
                        {formatRentalMode(request.requestedMode)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vlossom-neutral-600">Rate</span>
                      <span className="font-medium text-vlossom-primary">
                        ${request.requestedRate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vlossom-neutral-600">
                        Start Date
                      </span>
                      <span className="font-medium text-vlossom-neutral-900">
                        {new Date(request.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    {request.endDate && (
                      <div className="flex justify-between">
                        <span className="text-vlossom-neutral-600">
                          End Date
                        </span>
                        <span className="font-medium text-vlossom-neutral-900">
                          {new Date(request.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {request.status === "PENDING" && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-vlossom-neutral-100">
                  <Button
                    onClick={() => handleApprove(request.id)}
                    loading={processingId === request.id}
                    disabled={processingId !== null}
                  >
                    Approve Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    loading={processingId === request.id}
                    disabled={processingId !== null}
                  >
                    Reject
                  </Button>
                  <Button variant="ghost">View Profile</Button>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-4 text-xs text-vlossom-neutral-400">
                Requested {new Date(request.createdAt).toLocaleDateString()} at{" "}
                {new Date(request.createdAt).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-vlossom-neutral-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-vlossom-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-vlossom-neutral-900">
                No {filter.toLowerCase()} requests
              </h3>
              <p className="text-vlossom-neutral-500 mt-1">
                {filter === "PENDING"
                  ? "You're all caught up!"
                  : "No requests match this filter"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
