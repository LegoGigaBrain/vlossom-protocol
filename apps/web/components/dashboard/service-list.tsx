/**
 * Service List Component
 * Reference: docs/specs/stylist-dashboard/F3.3-services-management.md
 */

"use client";

import { formatPrice, formatDuration } from "../../lib/utils";
import { Button } from "../ui/button";
import type { StylistService } from "../../lib/dashboard-client";

interface ServiceListProps {
  services: StylistService[];
  isLoading?: boolean;
  onEdit: (service: StylistService) => void;
  onToggle: (service: StylistService) => void;
  onDelete: (service: StylistService) => void;
}

function ServiceCard({
  service,
  onEdit,
  onToggle,
  onDelete,
}: {
  service: StylistService;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-body font-semibold text-text-primary truncate">
            {service.name}
          </h3>
          <p className="text-body-small text-text-secondary">{service.category}</p>
        </div>
        <span
          className={`px-2 py-1 text-caption rounded-full ${
            service.isActive
              ? "bg-status-success/10 text-status-success"
              : "bg-background-tertiary text-text-tertiary"
          }`}
        >
          {service.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {service.description && (
        <p className="text-body-small text-text-secondary mb-3 line-clamp-2">
          {service.description}
        </p>
      )}

      <p className="text-body text-text-primary mb-4">
        {formatPrice(service.priceAmountCents)} · {formatDuration(service.estimatedDurationMin)}
      </p>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-border-default">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {service.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-status-error hover:bg-status-error/10"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 sm:p-6">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-background-secondary rounded w-32"></div>
            <div className="h-3 bg-background-secondary rounded w-16"></div>
          </div>
          <div className="h-6 bg-background-secondary rounded w-16"></div>
        </div>
        <div className="h-4 bg-background-secondary rounded w-24 mb-4"></div>
        <div className="flex gap-2 pt-4 border-t border-border-default">
          <div className="h-9 bg-background-secondary rounded w-16"></div>
          <div className="h-9 bg-background-secondary rounded w-24"></div>
          <div className="h-9 bg-background-secondary rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function ServiceList({
  services,
  isLoading,
  onEdit,
  onToggle,
  onDelete,
}: ServiceListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ServiceCardSkeleton />
        <ServiceCardSkeleton />
        <ServiceCardSkeleton />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom p-12 text-center">
        <div className="text-4xl mb-4">✂️</div>
        <h3 className="text-h4 text-text-primary mb-2">No services yet</h3>
        <p className="text-body text-text-secondary">
          Add your first service to start accepting bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={() => onEdit(service)}
          onToggle={() => onToggle(service)}
          onDelete={() => onDelete(service)}
        />
      ))}
    </div>
  );
}
