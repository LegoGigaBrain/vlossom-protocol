"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { PropertyImageUpload } from "@/components/property-owner/property-image-upload";
import {
  useProperty,
  useUpdateProperty,
  useDeleteProperty,
} from "@/hooks/use-properties";
import { getCategoryDisplayName, getApprovalModeDescription } from "@/lib/property-client";
import type { PropertyCategory, ApprovalMode } from "@/hooks/use-properties";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data, isLoading, error } = useProperty(propertyId);
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "STANDARD" as PropertyCategory,
    address: "",
    city: "",
    country: "South Africa",
    description: "",
    approvalMode: "CONDITIONAL" as ApprovalMode,
    minStylistRating: 4.0,
  });

  // Initialize form when property loads
  const property = data?.property;
  if (property && !isEditing && formData.name !== property.name) {
    setFormData({
      name: property.name,
      category: property.category,
      address: property.address,
      city: property.city,
      country: property.country,
      description: property.description || "",
      approvalMode: property.approvalMode,
      minStylistRating: property.minStylistRating || 4.0,
    });
  }

  // Handle image changes
  const handleImagesChange = useCallback(
    (images: string[]) => {
      if (!property) return;
      updateProperty.mutate({
        propertyId,
        data: { images },
      });
    },
    [propertyId, property, updateProperty]
  );

  const handleCoverChange = useCallback(
    (coverImage: string) => {
      if (!property) return;
      updateProperty.mutate({
        propertyId,
        data: { coverImage },
      });
    },
    [propertyId, property, updateProperty]
  );

  // Handle form submission
  const handleSave = async () => {
    await updateProperty.mutateAsync({
      propertyId,
      data: formData,
    });
    setIsEditing(false);
  };

  // Handle delete
  const handleDelete = async () => {
    await deleteProperty.mutateAsync(propertyId);
    router.push("/property-owner/properties");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-rose" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <Icon name="calmError" size="2xl" className="mx-auto mb-4 text-status-error" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Property not found</h2>
        <p className="text-text-secondary mb-4">
          The property you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/property-owner/properties">
          <Button>Back to Properties</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/property-owner/properties">
            <Button variant="ghost" size="icon">
              <Icon name="back" size="md" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{property.name}</h1>
              <Badge variant={property.isActive ? "success" : "default"}>
                {property.isActive ? "Active" : "Inactive"}
              </Badge>
              {property.verificationStatus === "VERIFIED" && (
                <Badge variant="info">
                  <Icon name="check" size="sm" className="mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-text-secondary mt-1">
              {property.address}, {property.city}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateProperty.isPending}>
                {updateProperty.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Icon name="edit" size="sm" className="mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="text-status-error hover:bg-status-error/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Icon name="close" size="sm" className="mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {property.coverImage && (
        <div className="relative h-64 rounded-card overflow-hidden">
          <Image
            src={property.coverImage}
            alt={property.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-sm opacity-80">{getCategoryDisplayName(property.category)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
              <CardDescription>
                Upload photos of your property. The cover image will be shown in search results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyImageUpload
                propertyId={propertyId}
                images={property.images}
                coverImage={property.coverImage || undefined}
                onImagesChange={handleImagesChange}
                onCoverChange={handleCoverChange}
                maxImages={10}
              />
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Property Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value as PropertyCategory })
                        }
                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                      >
                        <option value="LUXURY">Luxury Venue</option>
                        <option value="BOUTIQUE">Boutique Salon</option>
                        <option value="STANDARD">Standard Salon</option>
                        <option value="HOME_BASED">Home-Based</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                    />
                  </div>
                </div>
              ) : (
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Category</dt>
                    <dd className="font-medium text-text-primary">
                      {getCategoryDisplayName(property.category)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Address</dt>
                    <dd className="font-medium text-text-primary">{property.address}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">City</dt>
                    <dd className="font-medium text-text-primary">{property.city}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Country</dt>
                    <dd className="font-medium text-text-primary">{property.country}</dd>
                  </div>
                  {property.description && (
                    <div>
                      <dt className="text-text-secondary mb-2">Description</dt>
                      <dd className="text-text-primary">{property.description}</dd>
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>
                Control how stylists can book chairs at your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Approval Mode
                    </label>
                    <select
                      value={formData.approvalMode}
                      onChange={(e) =>
                        setFormData({ ...formData, approvalMode: e.target.value as ApprovalMode })
                      }
                      className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                    >
                      <option value="FULL_APPROVAL">Manual Approval Required</option>
                      <option value="NO_APPROVAL">Instant Booking</option>
                      <option value="CONDITIONAL">Conditional (Rating-based)</option>
                    </select>
                    <p className="text-sm text-text-tertiary mt-1">
                      {getApprovalModeDescription(formData.approvalMode)}
                    </p>
                  </div>
                  {formData.approvalMode === "CONDITIONAL" && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Minimum Stylist Rating
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={formData.minStylistRating}
                        onChange={(e) =>
                          setFormData({ ...formData, minStylistRating: parseFloat(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-rose"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Approval Mode</dt>
                    <dd className="font-medium text-text-primary">
                      {property.approvalMode === "FULL_APPROVAL" && "Manual Approval"}
                      {property.approvalMode === "NO_APPROVAL" && "Instant Booking"}
                      {property.approvalMode === "CONDITIONAL" && "Conditional"}
                    </dd>
                  </div>
                  {property.approvalMode === "CONDITIONAL" && property.minStylistRating && (
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Minimum Rating</dt>
                      <dd className="font-medium text-text-primary flex items-center">
                        <Icon name="star" size="sm" weight="fill" className="text-accent-orange mr-1" />
                        {property.minStylistRating.toFixed(1)}+
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Total Chairs</span>
                <span className="text-2xl font-bold text-text-primary">
                  {property._count?.chairs || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Pending Rentals</span>
                <span className="text-2xl font-bold text-brand-rose">
                  {property.pendingRentalCount || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/property-owner/chairs?property=${propertyId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="settings" size="sm" className="mr-2" />
                  Manage Chairs
                </Button>
              </Link>
              <Link href={`/property-owner/requests?property=${propertyId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="calendar" size="sm" className="mr-2" />
                  View Rental Requests
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Created Info */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-text-tertiary">
                Created {new Date(property.createdAt).toLocaleDateString()}
              </p>
              {property.verifiedAt && (
                <p className="text-sm text-text-tertiary mt-1">
                  Verified {new Date(property.verifiedAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-status-error">Delete Property</CardTitle>
              <CardDescription>
                Are you sure you want to delete &quot;{property.name}&quot;? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteProperty.isPending}
              >
                {deleteProperty.isPending ? "Deleting..." : "Delete Property"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
