/**
 * Profile Form Component
 * Reference: docs/specs/stylist-dashboard/F3.5-profile-management.md
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { StylistProfile } from "../../lib/dashboard-client";

const OPERATING_MODES = [
  { value: "FIXED", label: "Fixed Location", description: "I work from one location" },
  { value: "MOBILE", label: "Mobile", description: "I travel to customers" },
  { value: "HYBRID", label: "Hybrid", description: "Both fixed and mobile" },
] as const;

const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

interface ProfileFormProps {
  profile: StylistProfile | null;
  onSubmit: (data: Partial<StylistProfile>) => void;
  isLoading?: boolean;
}

interface FormErrors {
  displayName?: string;
  bio?: string;
  operatingMode?: string;
  baseLocationAddress?: string;
  serviceRadius?: string;
}

export function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [operatingMode, setOperatingMode] = useState<"FIXED" | "MOBILE" | "HYBRID">(
    profile?.operatingMode || "MOBILE"
  );
  const [baseLocationAddress, setBaseLocationAddress] = useState(
    profile?.baseLocationAddress || ""
  );
  const [serviceRadius, setServiceRadius] = useState(profile?.serviceRadius || 25);
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [isAcceptingBookings, setIsAcceptingBookings] = useState(
    profile?.isAcceptingBookings ?? true
  );
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio || "");
      setOperatingMode(profile.operatingMode);
      setBaseLocationAddress(profile.baseLocationAddress || "");
      setServiceRadius(profile.serviceRadius || 25);
      setSpecialties(profile.specialties || []);
      setIsAcceptingBookings(profile.isAcceptingBookings);
    }
  }, [profile]);

  const needsLocation = operatingMode === "FIXED" || operatingMode === "HYBRID";
  const needsRadius = operatingMode === "MOBILE" || operatingMode === "HYBRID";

  const addSpecialty = () => {
    if (newSpecialty.trim() && specialties.length < 10) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!displayName.trim() || displayName.length < 2) {
      newErrors.displayName = "Name must be at least 2 characters";
    } else if (displayName.length > 50) {
      newErrors.displayName = "Name must be 50 characters or less";
    }

    if (!bio.trim() || bio.length < 50) {
      newErrors.bio = "Bio must be at least 50 characters";
    } else if (bio.length > 500) {
      newErrors.bio = "Bio must be 500 characters or less";
    }

    if (needsLocation && !baseLocationAddress.trim()) {
      newErrors.baseLocationAddress = "Location is required for this mode";
    }

    if (needsRadius && (!serviceRadius || serviceRadius < 5 || serviceRadius > 100)) {
      newErrors.serviceRadius = "Service radius must be between 5 and 100 km";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      displayName: displayName.trim(),
      bio: bio.trim(),
      operatingMode,
      baseLocationAddress: needsLocation ? baseLocationAddress.trim() : null,
      serviceRadius: needsRadius ? serviceRadius : null,
      specialties,
      isAcceptingBookings,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Name */}
      <div>
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your professional name"
          className={errors.displayName ? "border-status-error" : ""}
        />
        {errors.displayName && (
          <p className="text-caption text-status-error mt-1">{errors.displayName}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <Label htmlFor="bio">Bio *</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell customers about yourself, your experience, and specialties..."
          rows={4}
          maxLength={500}
          className={`w-full p-3 border rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose resize-none ${
            errors.bio ? "border-status-error" : "border-border-default"
          }`}
        />
        <p className="text-caption text-text-tertiary mt-1">
          {bio.length}/500 characters
        </p>
        {errors.bio && (
          <p className="text-caption text-status-error mt-1">{errors.bio}</p>
        )}
      </div>

      {/* Operating Mode */}
      <div>
        <Label>Operating Mode *</Label>
        <div className="space-y-2 mt-2">
          {OPERATING_MODES.map((mode) => (
            <label
              key={mode.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                operatingMode === mode.value
                  ? "border-brand-rose bg-brand-rose/5"
                  : "border-border-default hover:border-border-focus"
              }`}
            >
              <input
                type="radio"
                name="operatingMode"
                value={mode.value}
                checked={operatingMode === mode.value}
                onChange={(e) => setOperatingMode(e.target.value as typeof operatingMode)}
                className="w-4 h-4 mt-0.5 text-brand-rose focus:ring-brand-rose"
              />
              <div>
                <p className="text-body font-medium text-text-primary">{mode.label}</p>
                <p className="text-caption text-text-secondary">{mode.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Base Location (for Fixed/Hybrid) */}
      {needsLocation && (
        <div>
          <Label htmlFor="baseLocation">Base Location *</Label>
          <Input
            id="baseLocation"
            value={baseLocationAddress}
            onChange={(e) => setBaseLocationAddress(e.target.value)}
            placeholder="123 Main Street, Sandton, Johannesburg"
            className={errors.baseLocationAddress ? "border-status-error" : ""}
          />
          {errors.baseLocationAddress && (
            <p className="text-caption text-status-error mt-1">{errors.baseLocationAddress}</p>
          )}
        </div>
      )}

      {/* Service Radius (for Mobile/Hybrid) */}
      {needsRadius && (
        <div>
          <Label htmlFor="serviceRadius">Service Radius *</Label>
          <select
            id="serviceRadius"
            value={serviceRadius}
            onChange={(e) => setServiceRadius(Number(e.target.value))}
            className={`w-full h-11 px-3 border rounded-lg bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose ${
              errors.serviceRadius ? "border-status-error" : "border-border-default"
            }`}
          >
            {RADIUS_OPTIONS.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
          {errors.serviceRadius && (
            <p className="text-caption text-status-error mt-1">{errors.serviceRadius}</p>
          )}
        </div>
      )}

      {/* Specialties */}
      <div>
        <Label>Specialties</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {specialties.map((specialty, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-rose/10 text-brand-rose rounded-full text-body-small"
            >
              {specialty}
              <button
                type="button"
                onClick={() => removeSpecialty(index)}
                className="ml-1 text-brand-rose/70 hover:text-brand-rose"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {specialties.length < 10 && (
          <div className="flex gap-2">
            <Input
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              placeholder="Add specialty"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecialty();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addSpecialty}>
              Add
            </Button>
          </div>
        )}
        <p className="text-caption text-text-tertiary mt-1">
          {specialties.length}/10 specialties
        </p>
      </div>

      {/* Accepting Bookings Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isAcceptingBookings}
          onChange={(e) => setIsAcceptingBookings(e.target.checked)}
          className="w-5 h-5 rounded border-border-default text-brand-rose focus:ring-brand-rose"
        />
        <div>
          <span className="text-body text-text-primary">Accepting bookings</span>
          <p className="text-caption text-text-secondary">
            Turn off to hide your profile from customers
          </p>
        </div>
      </label>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
