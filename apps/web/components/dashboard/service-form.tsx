/**
 * Service Form Component
 * Reference: docs/specs/stylist-dashboard/F3.3-services-management.md
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { StylistService, CreateServiceInput } from "../../lib/dashboard-client";

const CATEGORIES = ["Hair", "Nails", "Makeup", "Lashes", "Facials"] as const;

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1h", value: 60 },
  { label: "1h 30m", value: 90 },
  { label: "2h", value: 120 },
  { label: "2h 30m", value: 150 },
  { label: "3h", value: 180 },
  { label: "3h 30m", value: 210 },
  { label: "4h", value: 240 },
  { label: "5h", value: 300 },
  { label: "6h", value: 360 },
  { label: "7h", value: 420 },
  { label: "8h", value: 480 },
];

interface ServiceFormProps {
  service?: StylistService | null;
  onSubmit: (data: CreateServiceInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  category?: string;
  priceAmountCents?: string;
  estimatedDurationMin?: string;
}

export function ServiceForm({ service, onSubmit, onCancel, isLoading }: ServiceFormProps) {
  const [name, setName] = useState(service?.name || "");
  const [category, setCategory] = useState(service?.category || "");
  const [description, setDescription] = useState(service?.description || "");
  const [priceRands, setPriceRands] = useState(
    service ? (service.priceAmountCents / 100).toFixed(2) : ""
  );
  const [duration, setDuration] = useState(service?.estimatedDurationMin || 60);
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      setName(service.name);
      setCategory(service.category);
      setDescription(service.description || "");
      setPriceRands((service.priceAmountCents / 100).toFixed(2));
      setDuration(service.estimatedDurationMin);
      setIsActive(service.isActive);
    } else {
      setName("");
      setCategory("");
      setDescription("");
      setPriceRands("");
      setDuration(60);
      setIsActive(true);
    }
    setErrors({});
  }, [service]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim() || name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.length > 100) {
      newErrors.name = "Name must be 100 characters or less";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    const priceNum = parseFloat(priceRands);
    if (isNaN(priceNum) || priceNum < 10) {
      newErrors.priceAmountCents = "Minimum price is R10.00";
    } else if (priceNum > 50000) {
      newErrors.priceAmountCents = "Maximum price is R50,000.00";
    }

    if (!duration || duration < 15 || duration > 480) {
      newErrors.estimatedDurationMin = "Please select a valid duration";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      priceAmountCents: Math.round(parseFloat(priceRands) * 100),
      estimatedDurationMin: duration,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Name */}
      <div>
        <Label htmlFor="name">Service Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Box Braids"
          className={errors.name ? "border-status-error" : ""}
        />
        {errors.name && (
          <p className="text-caption text-status-error mt-1">{errors.name}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category *</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full h-11 px-3 border rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose ${
            errors.category ? "border-status-error" : "border-border-default"
          }`}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-caption text-status-error mt-1">{errors.category}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what's included in this service..."
          rows={3}
          maxLength={500}
          className="w-full p-3 border border-border-default rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose resize-none"
        />
        <p className="text-caption text-text-tertiary mt-1">
          {description.length}/500 characters
        </p>
      </div>

      {/* Price & Duration Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <Label htmlFor="price">Price (ZAR) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R</span>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="10"
              max="50000"
              value={priceRands}
              onChange={(e) => setPriceRands(e.target.value)}
              placeholder="850.00"
              className={`pl-8 ${errors.priceAmountCents ? "border-status-error" : ""}`}
            />
          </div>
          {errors.priceAmountCents && (
            <p className="text-caption text-status-error mt-1">{errors.priceAmountCents}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="duration">Duration *</Label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={`w-full h-11 px-3 border rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose ${
              errors.estimatedDurationMin ? "border-status-error" : "border-border-default"
            }`}
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.estimatedDurationMin && (
            <p className="text-caption text-status-error mt-1">{errors.estimatedDurationMin}</p>
          )}
        </div>
      </div>

      {/* Active Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-5 h-5 rounded border-border-default text-brand-rose focus:ring-brand-rose"
        />
        <span className="text-body text-text-primary">Available for booking</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : service ? "Update Service" : "Add Service"}
        </Button>
      </div>
    </form>
  );
}
