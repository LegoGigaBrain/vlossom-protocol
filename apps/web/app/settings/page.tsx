/**
 * Settings - Account Page
 * V3.4: Main account settings with profile info and linked accounts
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ProfileForm } from "../../components/profile/profile-form";
import { AvatarUpload } from "../../components/profile/avatar-upload";
import { LinkedAccounts } from "../../components/settings/linked-accounts";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "../../hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function AccountSettingsPage() {
  const { user, isLoading, logout, refetch } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out", "You have been logged out successfully.");
      router.push("/login");
    } catch (error) {
      toast.error("Logout failed", "Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your personal details visible to other users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <AvatarUpload
                currentUrl={user.avatarUrl}
                displayName={user.displayName}
                onUpload={async () => {
                  await refetch();
                  toast.success("Photo updated", "Your profile photo has been updated.");
                }}
              />
            </div>

            {/* Profile Form */}
            <div className="flex-1">
              <ProfileForm
                user={user}
                onSuccess={() => {
                  refetch();
                  toast.success("Profile updated", "Your changes have been saved.");
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
          <CardDescription>
            Your account information and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                <Mail className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-text-secondary">
                  {user.email || "Not set"}
                </p>
              </div>
            </div>
            {user.email && (
              <span className="px-2 py-1 text-xs bg-status-success/10 text-status-success rounded-full">
                Verified
              </span>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                <Phone className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-text-secondary">
                  {user.phone || "Not set"}
                </p>
              </div>
            </div>
            {user.phone ? (
              <span className="px-2 py-1 text-xs bg-status-success/10 text-status-success rounded-full">
                Verified
              </span>
            ) : (
              <Button variant="outline" size="sm">
                Add phone
              </Button>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-text-secondary">
                  {"city" in user && "province" in user && user.city && user.province
                    ? `${user.city}, ${user.province}`
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-text-secondary">
                  {"createdAt" in user && user.createdAt
                    ? new Date(user.createdAt as string).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Linked Accounts</CardTitle>
          <CardDescription>
            Manage your connected authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkedAccounts />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-status-error/30">
        <CardHeader>
          <CardTitle className="text-lg text-status-error flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logout */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary">
            <div>
              <h3 className="text-sm font-medium">Log out</h3>
              <p className="text-sm text-text-secondary">
                Sign out of your account on this device
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              loading={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-status-error/5 border border-status-error/20">
            <div>
              <h3 className="text-sm font-medium">Delete account</h3>
              <p className="text-sm text-text-secondary">
                Permanently delete your account and all data
              </p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="destructive-outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete account
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    toast.error(
                      "Not available",
                      "Account deletion is not available during beta."
                    );
                    setShowDeleteConfirm(false);
                  }}
                >
                  Confirm delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
