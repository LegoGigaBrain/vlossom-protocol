"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock data
const mockProperties = [
  {
    id: "1",
    name: "Natural Hair Studio",
    address: "123 Main Street",
    city: "Atlanta",
    state: "GA",
    category: "SALON",
    status: "ACTIVE",
    isVerified: true,
    chairCount: 6,
    activeRentals: 4,
  },
  {
    id: "2",
    name: "Braids & Beauty",
    address: "456 Oak Avenue",
    city: "Atlanta",
    state: "GA",
    category: "SALON",
    status: "ACTIVE",
    isVerified: false,
    chairCount: 2,
    activeRentals: 1,
  },
];

export default function PropertiesPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-vlossom-neutral-900">
            My Properties
          </h2>
          <p className="text-vlossom-neutral-600">
            Manage your salon and studio locations
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Property"}
        </Button>
      </div>

      {/* Add property form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register New Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    placeholder="e.g., Natural Hair Studio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Category
                  </label>
                  <select className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary">
                    <option value="SALON">Salon</option>
                    <option value="BARBERSHOP">Barbershop</option>
                    <option value="SPA">Spa</option>
                    <option value="STUDIO">Studio</option>
                    <option value="HOME_BASED">Home Based</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    placeholder="Atlanta"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                      placeholder="GA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                      placeholder="30301"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    rows={3}
                    placeholder="Describe your property..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Register Property</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Properties list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockProperties.map((property) => (
          <Card key={property.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-vlossom-neutral-900">
                      {property.name}
                    </h3>
                    {property.isVerified && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-vlossom-neutral-500 mt-1">
                    {property.address}, {property.city}, {property.state}
                  </p>
                </div>
                <Badge
                  variant={
                    property.status === "ACTIVE" ? "success" : "default"
                  }
                >
                  {property.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 py-4 border-t border-vlossom-neutral-100">
                <div>
                  <div className="text-2xl font-bold text-vlossom-neutral-900">
                    {property.chairCount}
                  </div>
                  <div className="text-xs text-vlossom-neutral-500">
                    Total Chairs
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-vlossom-primary">
                    {property.activeRentals}
                  </div>
                  <div className="text-xs text-vlossom-neutral-500">
                    Active Rentals
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-vlossom-neutral-900">
                    {Math.round(
                      (property.activeRentals / property.chairCount) * 100
                    )}
                    %
                  </div>
                  <div className="text-xs text-vlossom-neutral-500">
                    Occupancy
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-vlossom-neutral-100">
                <Link href={`/property-owner/properties/${property.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
                <Link href={`/property-owner/chairs?property=${property.id}`}>
                  <Button variant="ghost" size="sm">
                    Manage Chairs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockProperties.length === 0 && (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-vlossom-neutral-900">
              No properties yet
            </h3>
            <p className="text-vlossom-neutral-500 mt-1">
              Register your first property to start renting chairs
            </p>
            <Button className="mt-4" onClick={() => setShowAddForm(true)}>
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
