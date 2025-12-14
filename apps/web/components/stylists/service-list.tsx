"use client";

import { formatPrice, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/stylist-client";

interface ServiceListProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export function ServiceList({ services, onSelectService }: ServiceListProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        No services available
      </div>
    );
  }

  // Group services by category
  const servicesByCategory = services.reduce<Record<string, Service[]>>(
    (acc, service) => {
      const category = service.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold text-text-primary">
        Services
      </h2>

      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-3">
            {category}
          </h3>
          <div className="space-y-3">
            {categoryServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={() => onSelectService(service)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  onSelect: () => void;
}

function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <div className="bg-surface rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="font-semibold text-text-primary">{service.name}</h4>
          {service.description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDuration(service.estimatedDurationMin)}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-semibold text-primary">
            {formatPrice(service.priceAmountCents)}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            className="mt-2"
          >
            Select
          </Button>
        </div>
      </div>
    </div>
  );
}
