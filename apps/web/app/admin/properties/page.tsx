/**
 * Admin Properties Management Page
 * V3.4: View and verify property listings
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  status: string;
  verificationStatus: string;
  ownerId: string;
  owner?: {
    displayName: string;
    email: string;
  };
  chairCount: number;
  createdAt: string;
  imageUrls?: string[];
}

interface PropertyStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

// Mock data for demonstration
const mockProperties: Property[] = [
  {
    id: "p1",
    name: "Luxe Hair Studio",
    address: "123 Main Street",
    city: "Johannesburg",
    province: "Gauteng",
    status: "ACTIVE",
    verificationStatus: "PENDING",
    ownerId: "u1",
    owner: { displayName: "Jane Smith", email: "jane@example.com" },
    chairCount: 4,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    imageUrls: [],
  },
  {
    id: "p2",
    name: "Urban Salon Collective",
    address: "456 Oak Avenue",
    city: "Cape Town",
    province: "Western Cape",
    status: "ACTIVE",
    verificationStatus: "VERIFIED",
    ownerId: "u2",
    owner: { displayName: "Mike Johnson", email: "mike@example.com" },
    chairCount: 8,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    imageUrls: [],
  },
  {
    id: "p3",
    name: "Beauty Haven",
    address: "789 Park Road",
    city: "Durban",
    province: "KwaZulu-Natal",
    status: "ACTIVE",
    verificationStatus: "REJECTED",
    ownerId: "u3",
    owner: { displayName: "Sarah Williams", email: "sarah@example.com" },
    chairCount: 2,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    imageUrls: [],
  },
];

const mockStats: PropertyStats = {
  total: 156,
  pending: 12,
  verified: 140,
  rejected: 4,
};

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [stats, setStats] = useState<PropertyStats>(mockStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    // In a real app, fetch from API
    await new Promise((r) => setTimeout(r, 500));
    setIsLoading(false);
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProperties();
    setIsRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties();
  };

  const handleVerify = async (propertyId: string) => {
    if (!confirm("Are you sure you want to verify this property?")) return;

    try {
      // In a real app, call API
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, verificationStatus: "VERIFIED" } : p
        )
      );
      alert("Property has been verified.");
    } catch (error) {
      console.error("Failed to verify property:", error);
      alert("Failed to verify property.");
    }
    setShowActionMenu(null);
  };

  const handleReject = async (propertyId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      // In a real app, call API
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, verificationStatus: "REJECTED" } : p
        )
      );
      alert("Property has been rejected.");
    } catch (error) {
      console.error("Failed to reject property:", error);
      alert("Failed to reject property.");
    }
    setShowActionMenu(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Icon name="success" size="sm" className="mr-1" />
            Verified
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Icon name="cancelled" size="sm" className="mr-1" />
            Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Icon name="clock" size="sm" className="mr-1" />
            Pending
          </span>
        );
    }
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-500">Verify and manage salon properties</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Properties</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400">
          <div className="text-sm text-gray-500">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-400">
          <div className="text-sm text-gray-500">Verified</div>
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-400">
          <div className="text-sm text-gray-500">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Icon name="search" size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, address, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Properties Table */}
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
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chairs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Icon name="location" size="md" className="text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {property.name}
                        </div>
                        <div className="text-sm text-gray-500">{property.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Icon name="location" size="sm" className="mr-1" />
                      {property.city}, {property.province}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {property.owner?.displayName || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {property.owner?.email || "No email"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.chairCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(property.verificationStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(property.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() =>
                          setShowActionMenu(
                            showActionMenu === property.id ? null : property.id
                          )
                        }
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <Icon name="more" size="sm" className="text-gray-500" />
                      </button>
                      {showActionMenu === property.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <Link
                              href={`/admin/properties/${property.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Icon name="visible" size="sm" className="mr-2" />
                              View Details
                            </Link>
                            {property.verificationStatus === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleVerify(property.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                                >
                                  <Icon name="check" size="sm" className="mr-2" />
                                  Verify Property
                                </button>
                                <button
                                  onClick={() => handleReject(property.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                                >
                                  <Icon name="close" size="sm" className="mr-2" />
                                  Reject Property
                                </button>
                              </>
                            )}
                            {property.verificationStatus === "REJECTED" && (
                              <button
                                onClick={() => handleVerify(property.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100"
                              >
                                <Icon name="check" size="sm" className="mr-2" />
                                Re-verify Property
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Empty State */}
        {!isLoading && filteredProperties.length === 0 && (
          <div className="p-8 text-center">
            <Icon name="location" size="2xl" className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No properties found</p>
          </div>
        )}
      </div>
    </div>
  );
}
