/**
 * Chair Form Dialog
 * Dialog for creating or editing a chair with amenity selection
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AmenityPicker } from "./amenity-picker";
import type { ChairType, RentalMode, CreateChairRequest, UpdateChairRequest } from "@/hooks/use-properties";

// Chair type options
const CHAIR_TYPES: { value: ChairType; label: string }[] = [
  { value: "BRAID_CHAIR", label: "Braid Chair" },
  { value: "BARBER_CHAIR", label: "Barber Chair" },
  { value: "STYLING_STATION", label: "Styling Station" },
  { value: "NAIL_STATION", label: "Nail Station" },
  { value: "LASH_BED", label: "Lash Bed" },
  { value: "FACIAL_BED", label: "Facial Bed" },
  { value: "GENERAL", label: "General" },
];

// Rental mode options
const RENTAL_MODES: { value: RentalMode; label: string }[] = [
  { value: "PER_BOOKING", label: "Per Booking" },
  { value: "PER_HOUR", label: "Per Hour" },
  { value: "PER_DAY", label: "Per Day" },
  { value: "PER_WEEK", label: "Per Week" },
  { value: "PER_MONTH", label: "Per Month" },
];

interface ChairFormData {
  name: string;
  type: ChairType;
  amenities: string[];
  hourlyRateCents: number | undefined;
  dailyRateCents: number | undefined;
  weeklyRateCents: number | undefined;
  monthlyRateCents: number | undefined;
  perBookingFeeCents: number | undefined;
  rentalModesEnabled: RentalMode[];
}

interface ChairFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateChairRequest | UpdateChairRequest) => void;
  initialData?: Partial<ChairFormData>;
  isEditing?: boolean;
  isLoading?: boolean;
}

const defaultFormData: ChairFormData = {
  name: "",
  type: "STYLING_STATION",
  amenities: [],
  hourlyRateCents: undefined,
  dailyRateCents: undefined,
  weeklyRateCents: undefined,
  monthlyRateCents: undefined,
  perBookingFeeCents: undefined,
  rentalModesEnabled: ["PER_DAY"],
};

export function ChairFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}: ChairFormDialogProps) {
  const [formData, setFormData] = useState<ChairFormData>(defaultFormData);
  const [step, setStep] = useState(1);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialData ? { ...defaultFormData, ...initialData } : defaultFormData);
      setStep(1);
    }
  }, [open, initialData]);

  // Handle rental mode toggle
  const toggleRentalMode = (mode: RentalMode) => {
    const current = formData.rentalModesEnabled;
    if (current.includes(mode)) {
      if (current.length > 1) {
        setFormData({ ...formData, rentalModesEnabled: current.filter((m) => m !== mode) });
      }
    } else {
      setFormData({ ...formData, rentalModesEnabled: [...current, mode] });
    }
  };

  // Convert dollars to cents
  const dollarsToCents = (dollars: string): number | undefined => {
    const num = parseFloat(dollars);
    return isNaN(num) ? undefined : Math.round(num * 100);
  };

  // Convert cents to dollars string
  const centsToDollars = (cents: number | undefined): string => {
    return cents !== undefined ? (cents / 100).toFixed(2) : "";
  };

  // Handle form submission
  const handleSubmit = () => {
    const data: CreateChairRequest = {
      name: formData.name,
      type: formData.type,
      amenities: formData.amenities,
      hourlyRateCents: formData.hourlyRateCents,
      dailyRateCents: formData.dailyRateCents,
      weeklyRateCents: formData.weeklyRateCents,
      monthlyRateCents: formData.monthlyRateCents,
      perBookingFeeCents: formData.perBookingFeeCents,
      rentalModesEnabled: formData.rentalModesEnabled,
    };
    onSubmit(data);
  };

  const canProceed = step === 1 ? formData.name.trim() !== "" : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Chair" : "Add New Chair"}</DialogTitle>
          <DialogDescription>
            {step === 1 && "Set up the basic details for your chair"}
            {step === 2 && "Select the amenities available at this chair"}
            {step === 3 && "Configure pricing and rental options"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? "bg-brand-rose" : "bg-border-default"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Chair Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Station #1, Corner Chair"
                className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Chair Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ChairType })}
                className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
              >
                {CHAIR_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Amenities */}
        {step === 2 && (
          <div className="space-y-4">
            <AmenityPicker
              selectedAmenities={formData.amenities}
              onChange={(amenities) => setFormData({ ...formData, amenities })}
            />
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Rental Modes */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Rental Modes Enabled
              </label>
              <div className="flex flex-wrap gap-2">
                {RENTAL_MODES.map((mode) => {
                  const isEnabled = formData.rentalModesEnabled.includes(mode.value);
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => toggleRentalMode(mode.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        isEnabled
                          ? "bg-brand-rose text-white border-brand-rose"
                          : "bg-background-primary text-text-secondary border-border-default hover:border-brand-rose"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing inputs */}
            <div className="grid grid-cols-2 gap-4">
              {formData.rentalModesEnabled.includes("PER_BOOKING") && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Per Booking Fee (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={centsToDollars(formData.perBookingFeeCents)}
                    onChange={(e) =>
                      setFormData({ ...formData, perBookingFeeCents: dollarsToCents(e.target.value) })
                    }
                    placeholder="50.00"
                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              )}
              {formData.rentalModesEnabled.includes("PER_HOUR") && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Hourly Rate (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={centsToDollars(formData.hourlyRateCents)}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRateCents: dollarsToCents(e.target.value) })
                    }
                    placeholder="25.00"
                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              )}
              {formData.rentalModesEnabled.includes("PER_DAY") && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Daily Rate (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={centsToDollars(formData.dailyRateCents)}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyRateCents: dollarsToCents(e.target.value) })
                    }
                    placeholder="150.00"
                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              )}
              {formData.rentalModesEnabled.includes("PER_WEEK") && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Weekly Rate (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={centsToDollars(formData.weeklyRateCents)}
                    onChange={(e) =>
                      setFormData({ ...formData, weeklyRateCents: dollarsToCents(e.target.value) })
                    }
                    placeholder="600.00"
                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              )}
              {formData.rentalModesEnabled.includes("PER_MONTH") && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Monthly Rate (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={centsToDollars(formData.monthlyRateCents)}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyRateCents: dollarsToCents(e.target.value) })
                    }
                    placeholder="2000.00"
                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border-default">
          <Button
            variant="outline"
            onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}
          >
            {step > 1 ? "Back" : "Cancel"}
          </Button>
          <Button
            onClick={() => (step < 3 ? setStep(step + 1) : handleSubmit())}
            disabled={!canProceed || (step === 3 && isLoading)}
          >
            {step < 3 ? "Continue" : isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Chair"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
