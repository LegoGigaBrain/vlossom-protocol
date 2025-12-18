/**
 * Settings - Security Page
 * V3.4: Authentication methods and security settings
 */

"use client";

import { useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { LinkedAccounts } from "../../../components/settings/linked-accounts";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "../../../hooks/use-toast";
import { Icon } from "@/components/icons";

export default function SecuritySettingsPage() {
  const { user, isLoading } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mock session data
  const sessions = [
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Johannesburg, South Africa",
      lastActive: "Now",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Cape Town, South Africa",
      lastActive: "2 hours ago",
      current: false,
    },
  ];

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Passwords don't match", "Please make sure your passwords match.");
      return;
    }

    if (passwordForm.new.length < 8) {
      toast.error("Password too short", "Password must be at least 8 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Password changed", "Your password has been updated successfully.");
      setShowPasswordForm(false);
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast.error("Failed to change password", "Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Session revoked", "The device has been signed out.");
    } catch (error) {
      toast.error("Failed to revoke session", "Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="locked" />
            Authentication Methods
          </CardTitle>
          <CardDescription>
            Manage how you sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkedAccounts />
        </CardContent>
      </Card>

      {/* Password */}
      {user?.email && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="locked" />
              Password
            </CardTitle>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-text-secondary">
                    Last changed 30 days ago
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                  Change password
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input
                    id="new"
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new: e.target.value })
                    }
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirm: e.target.value })
                    }
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Password requirements */}
                <div className="p-3 rounded-lg bg-background-tertiary">
                  <p className="text-sm font-medium mb-2">Password requirements:</p>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li className="flex items-center gap-2">
                      {passwordForm.new.length >= 8 ? (
                        <Icon name="check" size="sm" className="text-status-success" />
                      ) : (
                        <Icon name="close" size="sm" className="text-text-muted" />
                      )}
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      {/[A-Z]/.test(passwordForm.new) ? (
                        <Icon name="check" size="sm" className="text-status-success" />
                      ) : (
                        <Icon name="close" size="sm" className="text-text-muted" />
                      )}
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      {/[0-9]/.test(passwordForm.new) ? (
                        <Icon name="check" size="sm" className="text-status-success" />
                      ) : (
                        <Icon name="close" size="sm" className="text-text-muted" />
                      )}
                      One number
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ current: "", new: "", confirm: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordChange}
                    loading={isChangingPassword}
                    disabled={
                      !passwordForm.current ||
                      !passwordForm.new ||
                      !passwordForm.confirm
                    }
                  >
                    Update password
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two-Factor Authentication */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="phone" />
            Two-Factor Authentication
            <span className="px-2 py-0.5 text-xs bg-brand-rose/10 text-brand-rose rounded-full">
              Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div>
              <p className="font-medium">2FA Status</p>
              <p className="text-sm text-text-secondary">
                Not enabled
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="clock" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Devices where you're currently signed in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 rounded-lg bg-background-secondary"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center">
                  <Icon name="trusted" className="text-text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{session.device}</p>
                    {session.current && (
                      <span className="px-2 py-0.5 text-xs bg-status-success/10 text-status-success rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-status-error"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}

          <Button variant="outline" className="w-full text-status-error">
            <Icon name="calmError" size="sm" className="mr-2" />
            Sign out all other devices
          </Button>
        </CardContent>
      </Card>

      {/* Security Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Activity</CardTitle>
          <CardDescription>
            Recent security-related activity on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                action: "Successful login",
                time: "Today at 10:30 AM",
                device: "Chrome on Windows",
              },
              {
                action: "Password changed",
                time: "Dec 10, 2025",
                device: "Safari on iPhone",
              },
              {
                action: "New wallet linked",
                time: "Dec 5, 2025",
                device: "Chrome on Windows",
              },
            ].map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{event.action}</p>
                  <p className="text-xs text-text-muted">{event.device}</p>
                </div>
                <p className="text-xs text-text-secondary">{event.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
