"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock data for demo
const mockStats = {
  totalProperties: 2,
  totalChairs: 8,
  activeRentals: 3,
  pendingRequests: 2,
  monthlyRevenue: 4500,
  occupancyRate: 75,
};

const mockRecentRequests = [
  {
    id: "1",
    stylistName: "Maria Johnson",
    propertyName: "Natural Hair Studio",
    chairName: "Chair #1",
    requestDate: "2024-01-15",
    status: "PENDING",
  },
  {
    id: "2",
    stylistName: "Aaliyah Williams",
    propertyName: "Natural Hair Studio",
    chairName: "Chair #3",
    requestDate: "2024-01-14",
    status: "PENDING",
  },
];

export default function PropertyOwnerDashboard() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-vlossom-neutral-900">
          Dashboard
        </h2>
        <p className="text-vlossom-neutral-600">
          Manage your properties and chair rentals
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-vlossom-neutral-500">
              Total Properties
            </div>
            <div className="text-3xl font-bold text-vlossom-neutral-900 mt-1">
              {mockStats.totalProperties}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-vlossom-neutral-500">
              Total Chairs
            </div>
            <div className="text-3xl font-bold text-vlossom-neutral-900 mt-1">
              {mockStats.totalChairs}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-vlossom-neutral-500">
              Active Rentals
            </div>
            <div className="text-3xl font-bold text-vlossom-neutral-900 mt-1">
              {mockStats.activeRentals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-vlossom-neutral-500">
              Pending Requests
            </div>
            <div className="text-3xl font-bold text-vlossom-primary mt-1">
              {mockStats.pendingRequests}
            </div>
            {mockStats.pendingRequests > 0 && (
              <Link
                href="/property-owner/requests"
                className="text-sm text-vlossom-primary hover:underline"
              >
                View requests
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue and occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Total earnings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-vlossom-neutral-900">
              ${mockStats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-vlossom-neutral-500 mt-2">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>
              Percentage of chairs rented this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-vlossom-neutral-900">
              {mockStats.occupancyRate}%
            </div>
            <div className="w-full bg-vlossom-neutral-200 rounded-full h-2 mt-4">
              <div
                className="bg-vlossom-primary h-2 rounded-full"
                style={{ width: `${mockStats.occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent rental requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rental Requests</CardTitle>
          <CardDescription>
            Stylists requesting to rent your chairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockRecentRequests.length === 0 ? (
            <p className="text-vlossom-neutral-500 text-sm">
              No pending requests
            </p>
          ) : (
            <div className="space-y-4">
              {mockRecentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-vlossom-neutral-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-vlossom-neutral-900">
                      {request.stylistName}
                    </div>
                    <div className="text-sm text-vlossom-neutral-500">
                      {request.propertyName} - {request.chairName}
                    </div>
                    <div className="text-xs text-vlossom-neutral-400 mt-1">
                      Requested {request.requestDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">{request.status}</Badge>
                    <Link
                      href={`/property-owner/requests`}
                      className="text-sm text-vlossom-primary hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/property-owner/properties">
          <Card className="hover:border-vlossom-primary transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-vlossom-primary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-vlossom-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="font-medium text-vlossom-neutral-900">
                Add Property
              </div>
              <div className="text-sm text-vlossom-neutral-500">
                Register a new salon or studio
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/property-owner/chairs">
          <Card className="hover:border-vlossom-primary transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-vlossom-secondary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-vlossom-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <div className="font-medium text-vlossom-neutral-900">
                Manage Chairs
              </div>
              <div className="text-sm text-vlossom-neutral-500">
                View and edit chair listings
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/property-owner/requests">
          <Card className="hover:border-vlossom-primary transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="font-medium text-vlossom-neutral-900">
                Review Requests
              </div>
              <div className="text-sm text-vlossom-neutral-500">
                Approve or reject rental requests
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
