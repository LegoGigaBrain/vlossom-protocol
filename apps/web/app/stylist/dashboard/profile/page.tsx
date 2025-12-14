/**
 * Profile Management Page
 * Reference: docs/specs/stylist-dashboard/F3.5-profile-management.md
 */

"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { ProfileForm } from "../../../../components/dashboard/profile-form";
import { PortfolioUpload } from "../../../../components/dashboard/portfolio-upload";
import { ProfilePreview } from "../../../../components/dashboard/profile-preview";
import { useStylistProfile, useUpdateProfile } from "../../../../hooks/use-dashboard";
import type { StylistProfile } from "../../../../lib/dashboard-client";

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useStylistProfile();
  const updateMutation = useUpdateProfile();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSubmit = (data: Partial<StylistProfile>) => {
    updateMutation.mutate(data);
  };

  const handlePortfolioChange = (images: string[]) => {
    updateMutation.mutate({ portfolioImages: images });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2 text-text-primary">My Profile</h1>
        <div className="bg-status-error/10 border border-status-error rounded-card p-6 text-center">
          <p className="text-body text-status-error">Failed to load profile</p>
          <p className="text-caption text-text-secondary mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 text-text-primary">My Profile</h1>
            <p className="text-body text-text-secondary">
              Manage your professional profile
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-background-primary rounded-card shadow-vlossom p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-11 bg-background-secondary rounded"></div>
              <div className="h-24 bg-background-secondary rounded"></div>
              <div className="h-11 bg-background-secondary rounded"></div>
              <div className="h-11 bg-background-secondary rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">My Profile</h1>
          <p className="text-body text-text-secondary">
            Manage your professional profile
          </p>
        </div>
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
      </div>

      {/* Success Message */}
      {updateMutation.isSuccess && (
        <div className="p-3 bg-status-success/10 border border-status-success rounded-lg">
          <p className="text-body-small text-status-success">
            Profile updated successfully
          </p>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 bg-background-primary rounded-card shadow-vlossom p-6">
          <ProfileForm
            profile={profile || null}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        </div>

        {/* Portfolio Section */}
        <div className="lg:col-span-1">
          <PortfolioUpload
            images={profile?.portfolioImages || []}
            onImagesChange={handlePortfolioChange}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>

      {/* Preview Dialog */}
      <ProfilePreview
        profile={profile || null}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
