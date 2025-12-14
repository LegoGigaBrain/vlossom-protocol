"use client";

import { formatPrice, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/stylist-client";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  onContinue: () => void;
}

export function ServiceSelector({
  services,
  selectedService,
  onSelect,
  onContinue,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Services List */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedService?.id === service.id
                ? "border-primary bg-primary/5"
                : "border-transparent bg-surface hover:border-border"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedService?.id === service.id
                        ? "border-primary"
                        : "border-text-secondary"
                    }`}
                  >
                    {selectedService?.id === service.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold text-text-primary">
                    {service.name}
                  </h3>
                </div>
                <div className="ml-6">
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {service.category}
                  </span>
                  {service.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <p className="text-sm text-text-secondary mt-1">
                    Duration: {formatDuration(service.estimatedDurationMin)}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-primary whitespace-nowrap">
                {formatPrice(service.priceAmountCents)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Total and Continue */}
      <div className="pt-4 border-t border-border">
        {selectedService && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-secondary">Total</span>
            <span className="text-xl font-semibold text-primary">
              {formatPrice(selectedService.priceAmountCents)}
            </span>
          </div>
        )}

        <Button
          onClick={onContinue}
          disabled={!selectedService}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
