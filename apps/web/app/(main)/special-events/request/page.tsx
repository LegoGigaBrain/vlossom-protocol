/**
 * Special Events Request Form (V6.6.0)
 *
 * Multi-step form for requesting special event quotes
 * Steps:
 * 1. Event Details (category, date, description)
 * 2. Location Selection
 * 3. Service Requirements
 * 4. Review & Submit
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Event categories
const EVENT_CATEGORIES = [
  { id: "bridal", label: "Bridal / Wedding" },
  { id: "photoshoot", label: "Photoshoot" },
  { id: "corporate", label: "Corporate Event" },
  { id: "party", label: "Party / Celebration" },
  { id: "matric", label: "Matric Dance / Prom" },
  { id: "other", label: "Other Event" },
];

// Location types
const LOCATION_TYPES = [
  {
    id: "customer_home",
    label: "My Location",
    description: "Stylist comes to you",
    icon: "home" as const,
  },
  {
    id: "stylist_base",
    label: "Stylist Location",
    description: "Visit the stylist",
    icon: "profile" as const,
  },
  {
    id: "venue",
    label: "Event Venue",
    description: "At wedding venue, studio, etc.",
    icon: "calendar" as const,
  },
];

// Service types
const SERVICE_TYPES = [
  { id: "styling", label: "Hair Styling" },
  { id: "braiding", label: "Braiding" },
  { id: "locs", label: "Locs / Twists" },
  { id: "coloring", label: "Coloring" },
  { id: "extensions", label: "Extensions / Weave" },
  { id: "treatment", label: "Treatment / Care" },
];

type FormStep = "details" | "location" | "services" | "review";

interface FormData {
  category: string;
  eventDate: string;
  eventTime: string;
  description: string;
  numberOfPeople: string;
  locationType: string;
  address: string;
  services: string[];
  additionalNotes: string;
}

const STEPS: { id: FormStep; label: string }[] = [
  { id: "details", label: "Event Details" },
  { id: "location", label: "Location" },
  { id: "services", label: "Services" },
  { id: "review", label: "Review" },
];

export default function SpecialEventsRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [step, setStep] = useState<FormStep>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    category: initialCategory,
    eventDate: "",
    eventTime: "",
    description: "",
    numberOfPeople: "1",
    locationType: "",
    address: "",
    services: ["styling"],
    additionalNotes: "",
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const updateFormData = (key: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex].id);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Submit to API
    console.log("Submitting request:", formData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    router.push("/special-events?submitted=true");
  };

  const canProceed = () => {
    switch (step) {
      case "details":
        return formData.category && formData.eventDate && formData.description;
      case "location":
        return formData.locationType;
      case "services":
        return formData.services.length > 0;
      case "review":
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-text-secondary hover:text-text-primary mb-4"
          >
            <Icon name="chevronLeft" size="md" className="mr-1" />
            {currentStepIndex === 0 ? "Back to Special Events" : "Back"}
          </button>
          <h1 className="text-2xl font-display font-bold text-text-primary">Request a Quote</h1>
          <p className="text-text-secondary mt-1">
            Tell us about your event and receive custom quotes from stylists
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-accent-orange text-white"
                        : "bg-background-tertiary text-text-muted",
                      isCurrent && "ring-2 ring-accent-orange ring-offset-2"
                    )}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-1.5 hidden sm:block",
                      isActive ? "text-text-primary" : "text-text-muted"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      isActive ? "bg-accent-orange" : "bg-border-default"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Step 1: Event Details */}
            {step === "details" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-text-primary mb-3 block">Event Type *</Label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateFormData("category", cat.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                          formData.category === cat.id
                            ? "bg-accent-orange text-white border-accent-orange"
                            : "bg-background-primary text-text-secondary border-border-default hover:border-accent-orange"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="eventDate" className="text-text-primary mb-2 block">
                      Event Date *
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => updateFormData("eventDate", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime" className="text-text-primary mb-2 block">
                      Preferred Time
                    </Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={formData.eventTime}
                      onChange={(e) => updateFormData("eventTime", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="numberOfPeople" className="text-text-primary mb-2 block">
                    Number of People
                  </Label>
                  <Input
                    id="numberOfPeople"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfPeople}
                    onChange={(e) => updateFormData("numberOfPeople", e.target.value)}
                    placeholder="How many people need styling?"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-text-primary mb-2 block">
                    Describe Your Event *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Tell stylists about your event, style preferences, and any special requirements..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === "location" && (
              <div className="space-y-4">
                <p className="text-text-secondary mb-4">
                  Where will the styling happen?
                </p>

                {LOCATION_TYPES.map((loc) => {
                  const isSelected = formData.locationType === loc.id;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => updateFormData("locationType", loc.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left",
                        isSelected
                          ? "bg-accent-orange/10 border-accent-orange"
                          : "bg-background-primary border-border-default hover:border-brand-rose"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-accent-orange/20" : "bg-background-tertiary"
                        )}
                      >
                        <Icon
                          name={loc.icon}
                          size="lg"
                          className={isSelected ? "text-accent-orange" : "text-text-secondary"}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{loc.label}</p>
                        <p className="text-sm text-text-secondary">{loc.description}</p>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-accent-orange" : "border-border-default"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
                        )}
                      </div>
                    </button>
                  );
                })}

                {(formData.locationType === "customer_home" ||
                  formData.locationType === "venue") && (
                  <div className="mt-6">
                    <Label htmlFor="address" className="text-text-primary mb-2 block">
                      {formData.locationType === "venue" ? "Venue Address" : "Your Address"}
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      placeholder="Enter the full address..."
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Services */}
            {step === "services" && (
              <div className="space-y-4">
                <p className="text-text-secondary mb-4">
                  What services do you need? Select all that apply.
                </p>

                {SERVICE_TYPES.map((service) => {
                  const isSelected = formData.services.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left",
                        isSelected
                          ? "bg-accent-orange/10 border-accent-orange"
                          : "bg-background-primary border-border-default hover:border-brand-rose"
                      )}
                    >
                      <span className="font-medium text-text-primary">{service.label}</span>
                      <div
                        className={cn(
                          "w-6 h-6 rounded flex items-center justify-center border-2",
                          isSelected
                            ? "bg-accent-orange border-accent-orange"
                            : "border-border-default"
                        )}
                      >
                        {isSelected && (
                          <Icon name="check" size="sm" className="text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}

                <div className="mt-6">
                  <Label htmlFor="additionalNotes" className="text-text-primary mb-2 block">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => updateFormData("additionalNotes", e.target.value)}
                    placeholder="Any specific styles, references, or special requests..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === "review" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-text-primary mb-4">Review Your Request</h3>

                  <div className="space-y-3 divide-y divide-border-default">
                    <div className="flex justify-between py-3">
                      <span className="text-text-secondary">Event Type</span>
                      <span className="text-text-primary font-medium">
                        {EVENT_CATEGORIES.find((c) => c.id === formData.category)?.label || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-text-secondary">Date & Time</span>
                      <span className="text-text-primary font-medium">
                        {formData.eventDate}
                        {formData.eventTime && ` at ${formData.eventTime}`}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-text-secondary">People</span>
                      <span className="text-text-primary font-medium">
                        {formData.numberOfPeople} {parseInt(formData.numberOfPeople) === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-text-secondary">Location</span>
                      <span className="text-text-primary font-medium">
                        {LOCATION_TYPES.find((l) => l.id === formData.locationType)?.label || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-text-secondary">Services</span>
                      <span className="text-text-primary font-medium text-right">
                        {formData.services
                          .map((s) => SERVICE_TYPES.find((st) => st.id === s)?.label)
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    <div className="py-3">
                      <span className="text-text-secondary block mb-2">Description</span>
                      <p className="text-text-primary">{formData.description}</p>
                    </div>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="flex gap-3 p-4 rounded-lg bg-accent-orange/10 border border-accent-orange/20">
                  <Icon name="growing" size="lg" className="text-accent-orange flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">What happens next?</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Stylists will review your request and send custom quotes within 24-48 hours.
                      You can review and compare quotes before booking.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 sm:flex-none"
          >
            {currentStepIndex === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            variant="primary"
            onClick={step === "review" ? handleSubmit : handleNext}
            disabled={!canProceed() || isSubmitting}
            className={cn(
              "flex-[2] sm:flex-1 bg-accent-orange hover:bg-accent-orange/90",
              isSubmitting && "opacity-75"
            )}
          >
            {isSubmitting ? (
              <>
                <Icon name="timer" size="md" className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : step === "review" ? (
              <>
                Submit Request
                <Icon name="check" size="md" className="ml-2" />
              </>
            ) : (
              <>
                Continue
                <Icon name="chevronRight" size="md" className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
