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

// Mock data
const mockChairs = [
  {
    id: "1",
    propertyId: "1",
    propertyName: "Natural Hair Studio",
    name: "Chair #1",
    type: "STYLING_STATION",
    status: "RENTED",
    rentalMode: "PER_DAY",
    hourlyRate: 25,
    dailyRate: 75,
    weeklyRate: 350,
    monthlyRate: 1200,
    currentRenter: "Maria Johnson",
    nextAvailable: null,
    equipment: ["Styling Chair", "Mirror", "Wash Basin"],
  },
  {
    id: "2",
    propertyId: "1",
    propertyName: "Natural Hair Studio",
    name: "Chair #2",
    type: "STYLING_STATION",
    status: "AVAILABLE",
    rentalMode: "PER_DAY",
    hourlyRate: 25,
    dailyRate: 75,
    weeklyRate: 350,
    monthlyRate: 1200,
    currentRenter: null,
    nextAvailable: null,
    equipment: ["Styling Chair", "Mirror"],
  },
  {
    id: "3",
    propertyId: "1",
    propertyName: "Natural Hair Studio",
    name: "Chair #3",
    type: "BRAIDING_STATION",
    status: "RESERVED",
    rentalMode: "PER_WEEK",
    hourlyRate: 20,
    dailyRate: 60,
    weeklyRate: 280,
    monthlyRate: 1000,
    currentRenter: null,
    nextAvailable: "2024-01-22",
    equipment: ["Braiding Chair", "Mirror", "Storage Cabinet"],
  },
  {
    id: "4",
    propertyId: "2",
    propertyName: "Braids & Beauty",
    name: "Station A",
    type: "STYLING_STATION",
    status: "RENTED",
    rentalMode: "PER_MONTH",
    hourlyRate: 30,
    dailyRate: 90,
    weeklyRate: 400,
    monthlyRate: 1400,
    currentRenter: "Jessica Brown",
    nextAvailable: null,
    equipment: ["Premium Chair", "Full Mirror", "Wash Basin", "Dryer Hood"],
  },
];

const statusColors: Record<string, "success" | "warning" | "default" | "info"> = {
  AVAILABLE: "success",
  RENTED: "info",
  RESERVED: "warning",
  MAINTENANCE: "default",
};

export default function ChairsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const properties = Array.from(
    new Set(mockChairs.map((c) => c.propertyName))
  );

  const filteredChairs = selectedProperty
    ? mockChairs.filter((c) => c.propertyName === selectedProperty)
    : mockChairs;

  const formatChairType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-vlossom-neutral-900">
            Chair Management
          </h2>
          <p className="text-vlossom-neutral-600">
            View and manage your chair inventory
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel" : "Add Chair"}
        </Button>
      </div>

      {/* Property filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedProperty(null)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedProperty === null
              ? "bg-vlossom-primary text-white"
              : "bg-white text-vlossom-neutral-600 hover:bg-vlossom-neutral-100"
          }`}
        >
          All Properties
        </button>
        {properties.map((property) => (
          <button
            key={property}
            onClick={() => setSelectedProperty(property)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedProperty === property
                ? "bg-vlossom-primary text-white"
                : "bg-white text-vlossom-neutral-600 hover:bg-vlossom-neutral-100"
            }`}
          >
            {property}
          </button>
        ))}
      </div>

      {/* Add chair form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Chair</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Property
                  </label>
                  <select className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary">
                    <option value="">Select property</option>
                    {properties.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Chair Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    placeholder="e.g., Chair #4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Chair Type
                  </label>
                  <select className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary">
                    <option value="STYLING_STATION">Styling Station</option>
                    <option value="BRAIDING_STATION">Braiding Station</option>
                    <option value="WASH_STATION">Wash Station</option>
                    <option value="MAKEUP_STATION">Makeup Station</option>
                    <option value="NAIL_STATION">Nail Station</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Rental Mode
                  </label>
                  <select className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary">
                    <option value="PER_BOOKING">Per Booking</option>
                    <option value="PER_HOUR">Per Hour</option>
                    <option value="PER_DAY">Per Day</option>
                    <option value="PER_WEEK">Per Week</option>
                    <option value="PER_MONTH">Per Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vlossom-neutral-700 mb-1">
                    Daily Rate ($)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-vlossom-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vlossom-primary"
                    placeholder="75"
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
                <Button type="submit">Add Chair</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Chairs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChairs.map((chair) => (
          <Card key={chair.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-vlossom-neutral-900">
                    {chair.name}
                  </h3>
                  <p className="text-sm text-vlossom-neutral-500">
                    {chair.propertyName}
                  </p>
                </div>
                <Badge variant={statusColors[chair.status] || "default"}>
                  {chair.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-vlossom-neutral-600">Type</span>
                  <span className="font-medium text-vlossom-neutral-900">
                    {formatChairType(chair.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vlossom-neutral-600">
                    Preferred Mode
                  </span>
                  <span className="font-medium text-vlossom-neutral-900">
                    {chair.rentalMode.replace("PER_", "Per ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vlossom-neutral-600">Daily Rate</span>
                  <span className="font-medium text-vlossom-primary">
                    ${chair.dailyRate}
                  </span>
                </div>
                {chair.currentRenter && (
                  <div className="flex justify-between">
                    <span className="text-vlossom-neutral-600">
                      Current Renter
                    </span>
                    <span className="font-medium text-vlossom-neutral-900">
                      {chair.currentRenter}
                    </span>
                  </div>
                )}
                {chair.nextAvailable && (
                  <div className="flex justify-between">
                    <span className="text-vlossom-neutral-600">
                      Next Available
                    </span>
                    <span className="font-medium text-vlossom-neutral-900">
                      {new Date(chair.nextAvailable).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {chair.equipment.length > 0 && (
                <div className="mt-4 pt-4 border-t border-vlossom-neutral-100">
                  <div className="text-xs text-vlossom-neutral-500 mb-2">
                    Equipment
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {chair.equipment.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 bg-vlossom-neutral-100 text-vlossom-neutral-600 text-xs rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-vlossom-neutral-100">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                {chair.status === "AVAILABLE" && (
                  <Button variant="ghost" size="sm" className="flex-1">
                    Set Unavailable
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChairs.length === 0 && (
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-vlossom-neutral-900">
              No chairs found
            </h3>
            <p className="text-vlossom-neutral-500 mt-1">
              {selectedProperty
                ? "This property has no chairs yet"
                : "Add your first chair to start renting"}
            </p>
            <Button className="mt-4" onClick={() => setShowAddForm(true)}>
              Add Chair
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-vlossom-neutral-900">
              {filteredChairs.length}
            </div>
            <div className="text-sm text-vlossom-neutral-500">Total Chairs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredChairs.filter((c) => c.status === "AVAILABLE").length}
            </div>
            <div className="text-sm text-vlossom-neutral-500">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredChairs.filter((c) => c.status === "RENTED").length}
            </div>
            <div className="text-sm text-vlossom-neutral-500">Rented</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredChairs.filter((c) => c.status === "RESERVED").length}
            </div>
            <div className="text-sm text-vlossom-neutral-500">Reserved</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
