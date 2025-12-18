/**
 * Settings - Notifications Page
 * V3.4: Push and email notification preferences
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Label } from "../../../components/ui/label";
import { toast } from "../../../hooks/use-toast";
import { Icon, type IconName } from "@/components/icons";

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  iconName: IconName;
  push: boolean;
  email: boolean;
}

const defaultCategories: NotificationCategory[] = [
  {
    id: "bookings",
    label: "Bookings",
    description: "New bookings, confirmations, and cancellations",
    iconName: "calendar",
    push: true,
    email: true,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Direct messages from stylists and customers",
    iconName: "chat",
    push: true,
    email: false,
  },
  {
    id: "payments",
    label: "Payments",
    description: "Payment confirmations, refunds, and wallet updates",
    iconName: "wallet",
    push: true,
    email: true,
  },
  {
    id: "reviews",
    label: "Reviews",
    description: "New reviews and rating requests",
    iconName: "star",
    push: true,
    email: false,
  },
  {
    id: "rewards",
    label: "Rewards & XP",
    description: "Badge unlocks, tier upgrades, and streak updates",
    iconName: "gift",
    push: true,
    email: false,
  },
  {
    id: "disputes",
    label: "Disputes",
    description: "Dispute updates and resolution notifications",
    iconName: "error",
    push: true,
    email: true,
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Promotions, new features, and platform updates",
    iconName: "broadcast",
    push: false,
    email: false,
  },
];

export default function NotificationSettingsPage() {
  const [categories, setCategories] = useState<NotificationCategory[]>(defaultCategories);
  const [masterPush, setMasterPush] = useState(true);
  const [masterEmail, setMasterEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vlossom_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCategories(parsed.categories || defaultCategories);
        setMasterPush(parsed.masterPush ?? true);
        setMasterEmail(parsed.masterEmail ?? true);
      } catch {
        // Use defaults
      }
    }
  }, []);

  const toggleCategory = (
    categoryId: string,
    type: "push" | "email"
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [type]: !cat[type] } : cat
      )
    );
  };

  const handleMasterToggle = (type: "push" | "email", value: boolean) => {
    if (type === "push") {
      setMasterPush(value);
      if (!value) {
        // Disable all push notifications
        setCategories((prev) => prev.map((cat) => ({ ...cat, push: false })));
      }
    } else {
      setMasterEmail(value);
      if (!value) {
        // Disable all email notifications
        setCategories((prev) => prev.map((cat) => ({ ...cat, email: false })));
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(
        "vlossom_notifications",
        JSON.stringify({ categories, masterPush, masterEmail })
      );

      // In a real app, also save to backend
      // await api.post("/settings/notifications", { categories, masterPush, masterEmail });

      toast.success("Settings saved", "Your notification preferences have been updated.");
    } catch (error) {
      toast.error("Save failed", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="notifications" size="sm" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                <Icon name="phone" size="sm" className="text-brand-rose" />
              </div>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-text-secondary">
                  Receive notifications on your device
                </p>
              </div>
            </div>
            <Switch
              checked={masterPush}
              onCheckedChange={(checked) => handleMasterToggle("push", checked)}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                <Icon name="email" size="sm" className="text-brand-rose" />
              </div>
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-text-secondary">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={masterEmail}
              onCheckedChange={(checked) => handleMasterToggle("email", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Categories</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-4 text-sm font-medium text-text-secondary pb-2 border-b border-border-default">
              <div>Category</div>
              <div className="text-center">Push</div>
              <div className="text-center">Email</div>
            </div>

            {/* Categories */}
            {categories.map((category) => (
                <div
                  key={category.id}
                  className="grid grid-cols-[1fr_80px_80px] gap-4 items-center py-3 border-b border-border-subtle last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={category.iconName} size="sm" className="text-text-secondary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{category.label}</p>
                      <p className="text-xs text-text-muted">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={category.push && masterPush}
                      onCheckedChange={() => toggleCategory(category.id, "push")}
                      disabled={!masterPush}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={category.email && masterEmail}
                      onCheckedChange={() => toggleCategory(category.id, "email")}
                      disabled={!masterEmail}
                    />
                  </div>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours (Future Feature) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="notifications" size="sm" />
            Quiet Hours
            <span className="px-2 py-0.5 text-xs bg-brand-rose/10 text-brand-rose rounded-full">
              Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            Schedule times when you don&apos;t want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Set quiet hours to avoid notifications during specific times.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={isSaving}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
