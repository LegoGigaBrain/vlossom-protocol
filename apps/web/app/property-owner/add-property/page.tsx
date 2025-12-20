/**
 * Add Property Page (V7.0.0)
 *
 * Multi-step form for property owners to create new properties.
 * Steps: Details -> Location -> Settings
 *
 * V7.0.0 (UX-3): Add property route implementation
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";
import {
  useCreateProperty,
  type CreatePropertyRequest,
  type PropertyCategory,
  type ApprovalMode,
} from "../../../hooks/use-properties";
import { cn } from "../../../lib/utils";

type Step = "details" | "location" | "settings";

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: "details", label: "Property Details", description: "Basic information about your property" },
  { id: "location", label: "Location", description: "Address and coordinates" },
  { id: "settings", label: "Settings", description: "Booking preferences" },
];

const CATEGORIES: { value: PropertyCategory; label: string; description: string }[] = [
  { value: "LUXURY", label: "Luxury Venue", description: "High-end salon or spa with premium amenities" },
  { value: "BOUTIQUE", label: "Boutique Salon", description: "Stylish, specialized salon experience" },
  { value: "STANDARD", label: "Standard Salon", description: "Traditional salon setup" },
  { value: "HOME_BASED", label: "Home-Based", description: "Home studio or private space" },
];

const APPROVAL_MODES: { value: ApprovalMode; label: string; description: string }[] = [
  { value: "NO_APPROVAL", label: "Instant Booking", description: "Stylists can book immediately without approval" },
  { value: "CONDITIONAL", label: "Conditional", description: "Auto-approve stylists with high ratings" },
  { value: "FULL_APPROVAL", label: "Manual Approval", description: "Review and approve each booking request" },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const createProperty = useCreateProperty();

  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<CreatePropertyRequest>>({
    name: "",
    category: "STANDARD",
    description: "",
    address: "",
    city: "",
    country: "South Africa",
    lat: 0,
    lng: 0,
    approvalMode: "CONDITIONAL",
    minStylistRating: 4.0,
  });

  const updateField = useCallback(<K extends keyof CreatePropertyRequest>(
    field: K,
    value: CreatePropertyRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateStep = useCallback((step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === "details") {
      if (!formData.name?.trim()) {
        newErrors.name = "Property name is required";
      }
      if (!formData.category) {
        newErrors.category = "Please select a category";
      }
    }

    if (step === "location") {
      if (!formData.address?.trim()) {
        newErrors.address = "Address is required";
      }
      if (!formData.city?.trim()) {
        newErrors.city = "City is required";
      }
      if (!formData.lat || !formData.lng) {
        newErrors.location = "Please set your property location on the map";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;

    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep("settings")) return;

    try {
      const result = await createProperty.mutateAsync(formData as CreatePropertyRequest);
      router.push(`/property-owner/properties/${result.property.id}`);
    } catch (error) {
      console.error("Failed to create property:", error);
    }
  }, [formData, createProperty, router, validateStep]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/property-owner">
          <Button variant="ghost" size="icon">
            <Icon name="back" size="md" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h2 text-text-primary">Add New Property</h1>
          <p className="text-body text-text-secondary">
            Create a new property to list chairs for stylists
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-body font-medium transition-colors",
                    index < currentStepIndex
                      ? "bg-status-success text-white"
                      : index === currentStepIndex
                      ? "bg-brand-rose text-white"
                      : "bg-background-tertiary text-text-secondary"
                  )}
                >
                  {index < currentStepIndex ? (
                    <Icon name="check" size="sm" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-caption text-text-secondary mt-2 hidden sm:block">
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-4",
                    index < currentStepIndex ? "bg-status-success" : "bg-background-tertiary"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6 mb-6">
        {/* Step 1: Details */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-h3 text-text-primary mb-1">Property Details</h2>
              <p className="text-body text-text-secondary">
                Tell us about your property
              </p>
            </div>

            {/* Property Name */}
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Property Name *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Downtown Hair Studio"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose",
                  errors.name ? "border-status-error" : "border-border-default"
                )}
              />
              {errors.name && (
                <p className="text-caption text-status-error mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => updateField("category", cat.value)}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-all",
                      formData.category === cat.value
                        ? "border-brand-rose bg-brand-rose/5"
                        : "border-border-default hover:border-brand-rose/50"
                    )}
                  >
                    <p className="text-body font-medium text-text-primary">{cat.label}</p>
                    <p className="text-caption text-text-secondary mt-1">{cat.description}</p>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-caption text-status-error mt-1">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your property, amenities, and what makes it special..."
                rows={4}
                className="w-full px-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === "location" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-h3 text-text-primary mb-1">Location</h2>
              <p className="text-body text-text-secondary">
                Where is your property located?
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="e.g., 123 Main Street"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose",
                  errors.address ? "border-status-error" : "border-border-default"
                )}
              />
              {errors.address && (
                <p className="text-caption text-status-error mt-1">{errors.address}</p>
              )}
            </div>

            {/* City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-medium text-text-primary mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g., Johannesburg"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose",
                    errors.city ? "border-status-error" : "border-border-default"
                  )}
                />
                {errors.city && (
                  <p className="text-caption text-status-error mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-body font-medium text-text-primary mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country || "South Africa"}
                  onChange={(e) => updateField("country", e.target.value)}
                  className="w-full px-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                />
              </div>
            </div>

            {/* Map Placeholder - coordinates entry */}
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Coordinates
              </label>
              <p className="text-caption text-text-secondary mb-3">
                Enter your property&apos;s coordinates or use the address lookup
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption text-text-secondary mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat || ""}
                    onChange={(e) => updateField("lat", parseFloat(e.target.value) || 0)}
                    placeholder="-26.2041"
                    className="w-full px-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
                <div>
                  <label className="block text-caption text-text-secondary mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng || ""}
                    onChange={(e) => updateField("lng", parseFloat(e.target.value) || 0)}
                    placeholder="28.0473"
                    className="w-full px-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                  />
                </div>
              </div>
              {errors.location && (
                <p className="text-caption text-status-error mt-1">{errors.location}</p>
              )}
              <p className="text-caption text-text-tertiary mt-2">
                Tip: You can find coordinates on Google Maps by right-clicking on your location
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {currentStep === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-h3 text-text-primary mb-1">Booking Settings</h2>
              <p className="text-body text-text-secondary">
                How should stylists book your chairs?
              </p>
            </div>

            {/* Approval Mode */}
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Approval Mode
              </label>
              <div className="space-y-3">
                {APPROVAL_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => updateField("approvalMode", mode.value)}
                    className={cn(
                      "w-full p-4 border rounded-lg text-left transition-all flex items-start gap-3",
                      formData.approvalMode === mode.value
                        ? "border-brand-rose bg-brand-rose/5"
                        : "border-border-default hover:border-brand-rose/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                        formData.approvalMode === mode.value
                          ? "border-brand-rose"
                          : "border-border-default"
                      )}
                    >
                      {formData.approvalMode === mode.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-rose" />
                      )}
                    </div>
                    <div>
                      <p className="text-body font-medium text-text-primary">{mode.label}</p>
                      <p className="text-caption text-text-secondary mt-0.5">{mode.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Settings */}
            {formData.approvalMode === "CONDITIONAL" && (
              <div className="bg-background-secondary rounded-lg p-4">
                <label className="block text-body font-medium text-text-primary mb-2">
                  Minimum Stylist Rating
                </label>
                <p className="text-caption text-text-secondary mb-3">
                  Stylists with this rating or higher can book instantly
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.minStylistRating || 4}
                    onChange={(e) => updateField("minStylistRating", parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 text-body font-medium">
                    <Icon name="star" size="sm" weight="fill" className="text-status-warning" />
                    {formData.minStylistRating?.toFixed(1)}+
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-background-tertiary rounded-lg p-4">
              <h3 className="text-body font-medium text-text-primary mb-3">Summary</h3>
              <dl className="space-y-2 text-caption">
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Property Name</dt>
                  <dd className="text-text-primary font-medium">{formData.name || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Category</dt>
                  <dd className="text-text-primary font-medium">
                    {CATEGORIES.find((c) => c.value === formData.category)?.label || "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Location</dt>
                  <dd className="text-text-primary font-medium">
                    {formData.city ? `${formData.city}, ${formData.country}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Approval</dt>
                  <dd className="text-text-primary font-medium">
                    {APPROVAL_MODES.find((m) => m.value === formData.approvalMode)?.label || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStepIndex > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              <Icon name="back" size="sm" className="mr-2" />
              Back
            </Button>
          ) : (
            <Link href="/property-owner">
              <Button variant="ghost">Cancel</Button>
            </Link>
          )}
        </div>
        <div>
          {currentStepIndex < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <Icon name="chevronRight" size="sm" className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createProperty.isPending}>
              {createProperty.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon name="check" size="sm" className="mr-2" />
                  Create Property
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {createProperty.isError && (
        <div className="mt-4 p-4 bg-status-error/10 border border-status-error rounded-lg">
          <p className="text-body text-status-error">
            Failed to create property. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
