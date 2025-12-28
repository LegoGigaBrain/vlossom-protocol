/**
 * Property Owner Dashboard Overview Page
 * Reference: docs/vlossom/17-property-owner-module.md
 */

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../hooks/use-auth";
import { useMyProperties, type Property, type Chair } from "../../hooks/use-properties";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { cn } from "../../lib/utils";

// Stats card component
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, subtext, icon }: StatCardProps) {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-caption text-text-secondary mb-1">{label}</p>
          <p className="text-h2 text-text-primary">{value}</p>
          {subtext && (
            <p className="text-caption text-text-tertiary mt-1">{subtext}</p>
          )}
        </div>
        <span className="text-text-secondary">{icon}</span>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="space-y-2">
        <div className="h-4 skeleton-shimmer rounded w-24" />
        <div className="h-8 skeleton-shimmer rounded w-20" />
      </div>
    </div>
  );
}

// Property card for the list
interface PropertyCardProps {
  property: Property;
}

function PropertyCard({ property }: PropertyCardProps) {
  const chairs = property.chairs || [];
  const chairCount = property._count?.chairs || chairs.length;
  const availableChairs = chairs.filter(c => c.status === "AVAILABLE").length;
  const occupiedChairs = chairs.filter(c => c.status === "OCCUPIED").length;
  const pendingRequests = property.pendingRentalCount || 0;

  return (
    <Link
      href={`/property-owner/chairs?property=${property.id}`}
      className="block bg-background-primary rounded-card shadow-vlossom overflow-hidden card-hover group"
    >
      {/* Property Image */}
      <div className="relative aspect-[16/9] bg-background-tertiary">
        {property.coverImage || property.images[0] ? (
          <Image
            src={property.coverImage || property.images[0]}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="image" size="2xl" className="text-text-muted" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-background-primary/90 backdrop-blur-sm text-caption font-medium text-text-primary rounded">
            {property.category.replace("_", " ")}
          </span>
        </div>

        {/* Pending Requests Badge */}
        {pendingRequests > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-accent-orange text-white text-caption font-medium rounded flex items-center gap-1">
              <Icon name="notifications" size="sm" />
              {pendingRequests}
            </span>
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4">
        <h3 className="text-body font-medium text-text-primary mb-1 group-hover:text-brand-rose transition-colors">
          {property.name}
        </h3>
        <p className="text-caption text-text-tertiary mb-3 flex items-center gap-1">
          <Icon name="location" size="sm" />
          {property.city}, {property.country}
        </p>

        {/* Chair Stats */}
        <div className="flex items-center gap-4 text-caption">
          <div className="flex items-center gap-1.5">
            <Icon name="settings" size="sm" className="text-text-secondary" />
            <span className="text-text-secondary">{chairCount} chairs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-success" />
            <span className="text-text-secondary">{availableChairs} available</span>
          </div>
          {occupiedChairs > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-warning" />
              <span className="text-text-secondary">{occupiedChairs} occupied</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom overflow-hidden">
      <div className="aspect-[16/9] skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton-shimmer rounded w-3/4" />
        <div className="h-4 skeleton-shimmer rounded w-1/2" />
        <div className="h-4 skeleton-shimmer rounded w-2/3" />
      </div>
    </div>
  );
}

export default function PropertyOwnerDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useMyProperties();

  const properties = data?.properties || [];

  // Calculate aggregate stats
  const totalProperties = properties.length;
  const totalChairs = properties.reduce((sum, p) => sum + (p._count?.chairs || 0), 0);
  const totalPendingRequests = properties.reduce((sum, p) => sum + (p.pendingRentalCount || 0), 0);
  const occupiedChairs = properties.reduce(
    (sum, p) => sum + (p.chairs?.filter(c => c.status === "OCCUPIED").length || 0),
    0
  );

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-text-primary">Overview</h1>
          <p className="text-body text-text-secondary">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <Icon name="calmError" size="xl" className="text-status-error mx-auto mb-2" />
          <p className="text-body text-status-error">Failed to load properties</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Overview</h1>
          <p className="text-body text-text-secondary">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>
        <Link href="/property-owner/add-property">
          <Button size="sm">
            <Icon name="add" size="sm" className="mr-1.5" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Properties"
            value={totalProperties}
            subtext={totalProperties === 1 ? "property" : "properties"}
            icon={<Icon name="home" size="lg" />}
          />
          <StatCard
            label="Total Chairs"
            value={totalChairs}
            subtext={`${occupiedChairs} occupied`}
            icon={<Icon name="settings" size="lg" />}
          />
          <StatCard
            label="Pending Requests"
            value={totalPendingRequests}
            subtext={totalPendingRequests === 1 ? "request" : "requests"}
            icon={<Icon name="notifications" size="lg" />}
          />
          <StatCard
            label="Occupancy Rate"
            value={totalChairs > 0 ? `${Math.round((occupiedChairs / totalChairs) * 100)}%` : "0%"}
            subtext="current"
            icon={<Icon name="growing" size="lg" />}
          />
        </div>
      )}

      {/* Properties Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 text-text-primary">Your Properties</h2>
          {properties.length > 0 && (
            <Link
              href="/property-owner/chairs"
              className="text-caption text-brand-rose hover:underline"
            >
              View all chairs
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        ) : properties.length === 0 ? (
          // Empty state
          <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center">
              <Icon name="home" size="2xl" className="text-text-muted" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-2">
              No properties yet
            </h3>
            <p className="text-caption text-text-secondary mb-4 max-w-md mx-auto">
              Add your first property to start renting chairs to stylists. You can manage
              multiple properties, each with its own chairs and pricing.
            </p>
            <Link href="/property-owner/add-property">
              <Button>
                <Icon name="add" size="sm" className="mr-1.5" />
                Add Your First Property
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {properties.length > 0 && totalPendingRequests > 0 && (
        <div className="bg-accent-orange/10 border border-accent-orange/20 rounded-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-orange/20 flex items-center justify-center">
                <Icon name="notifications" size="md" className="text-accent-orange" />
              </div>
              <div>
                <p className="text-body font-medium text-text-primary">
                  {totalPendingRequests} pending {totalPendingRequests === 1 ? "request" : "requests"}
                </p>
                <p className="text-caption text-text-secondary">
                  Stylists are waiting for your approval
                </p>
              </div>
            </div>
            <Link href="/property-owner/requests">
              <Button variant="outline" size="sm">
                Review Requests
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
