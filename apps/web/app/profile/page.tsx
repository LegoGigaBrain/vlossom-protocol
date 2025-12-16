"use client";

import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ProfileForm } from "../../components/profile/profile-form";
import { AvatarUpload } from "../../components/profile/avatar-upload";
import { LinkedAccounts } from "../../components/settings/linked-accounts";
import { AppHeader } from "../../components/layout/app-header";
import { BottomNav } from "../../components/layout/bottom-nav";
import { toast } from "../../hooks/use-toast";
import { Skeleton } from "../../components/ui/skeleton";
import { User, Shield, Wallet, Bell, LogOut, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, logout, refetch } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <AppHeader title="Profile" showNotifications />
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64 col-span-1" />
            <Skeleton className="h-64 col-span-2" />
          </div>
          <Skeleton className="h-48" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <AppHeader
        title="Profile Settings"
        subtitle="Manage your account settings and preferences"
        showNotifications
      />

      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Profile Section */}
        <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentUrl={user.avatarUrl}
              displayName={user.displayName}
              onUpload={async (url) => {
                // Update will be handled by ProfileForm
                await refetch();
                toast.success("Photo updated", "Your profile photo has been updated.");
              }}
            />
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              user={user}
              onSuccess={() => {
                refetch();
                toast.success("Profile updated", "Your changes have been saved.");
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your authentication methods and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Linked Accounts */}
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-4">
              Connected Accounts
            </h3>
            <LinkedAccounts />
          </div>

          {/* Change Password */}
          {user.email && (
            <div className="pt-4 border-t border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Password
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Change your account password
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Notification preferences coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-status-error/30">
        <CardHeader>
          <CardTitle className="text-lg text-status-error">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logout */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-tertiary">
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                Log out
              </h3>
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
              <h3 className="text-sm font-medium text-text-primary">
                Delete account
              </h3>
              <p className="text-sm text-text-secondary">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive-outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Bottom Navigation - Mobile */}
      <BottomNav />
    </div>
  );
}
