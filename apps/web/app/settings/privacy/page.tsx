/**
 * Settings - Privacy Page
 * V3.4: Profile visibility and data privacy settings
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
import { toast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import {
  Shield,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  MapPin,
  Activity,
  Download,
  Trash2,
  Check,
} from "lucide-react";

// Profile visibility options
const visibilityOptions = [
  {
    id: "public",
    name: "Public",
    description: "Anyone can see your profile",
    icon: Globe,
  },
  {
    id: "contacts",
    name: "Contacts Only",
    description: "Only people you've interacted with",
    icon: Users,
  },
  {
    id: "private",
    name: "Private",
    description: "Only you can see your profile",
    icon: Lock,
  },
];

interface PrivacySetting {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

const defaultPrivacySettings: PrivacySetting[] = [
  {
    id: "showLocation",
    label: "Show Location",
    description: "Display your city/province on your profile",
    icon: MapPin,
    enabled: true,
  },
  {
    id: "showActivity",
    label: "Activity Status",
    description: "Show when you were last active",
    icon: Activity,
    enabled: true,
  },
  {
    id: "showBookingHistory",
    label: "Booking History",
    description: "Allow others to see your booking statistics",
    icon: Eye,
    enabled: false,
  },
  {
    id: "searchIndexing",
    label: "Search Indexing",
    description: "Allow your profile to appear in search results",
    icon: Globe,
    enabled: true,
  },
];

export default function PrivacySettingsPage() {
  const [visibility, setVisibility] = useState("public");
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>(defaultPrivacySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vlossom_privacy");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibility(parsed.visibility || "public");
        setPrivacySettings(parsed.privacySettings || defaultPrivacySettings);
      } catch {
        // Use defaults
      }
    }
  }, []);

  const toggleSetting = (settingId: string) => {
    setPrivacySettings((prev) =>
      prev.map((setting) =>
        setting.id === settingId
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(
        "vlossom_privacy",
        JSON.stringify({ visibility, privacySettings })
      );

      // In a real app, also save to backend
      // await api.post("/settings/privacy", { visibility, privacySettings });

      toast.success("Settings saved", "Your privacy preferences have been updated.");
    } catch (error) {
      toast.error("Save failed", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(
        "Export requested",
        "We'll email you a link to download your data within 24 hours."
      );
    } catch (error) {
      toast.error("Export failed", "Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setVisibility(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    visibility === option.id
                      ? "border-brand-rose bg-brand-rose/5"
                      : "border-border-default hover:border-brand-rose/50"
                  )}
                >
                  <Icon className="w-8 h-8" />
                  <p className="font-medium">{option.name}</p>
                  <p className="text-xs text-text-secondary text-center">
                    {option.description}
                  </p>
                  {visibility === option.id && (
                    <Check className="w-5 h-5 text-brand-rose" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control what information is visible on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {privacySettings.map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{setting.label}</p>
                    <p className="text-xs text-text-muted">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={() => toggleSetting(setting.id)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Your Data
          </CardTitle>
          <CardDescription>
            Manage and export your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div>
              <p className="font-medium">Export your data</p>
              <p className="text-sm text-text-secondary">
                Download a copy of all your Vlossom data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              loading={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Data Retention Info */}
          <div className="p-4 rounded-lg bg-background-tertiary">
            <h4 className="font-medium text-sm mb-2">Data Retention Policy</h4>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Booking records: Kept for 7 years (regulatory requirement)</li>
              <li>• Messages: Kept for 90 days after conversation ends</li>
              <li>• Activity logs: Kept for 30 days</li>
              <li>• Profile data: Kept until account deletion</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cookie Preferences</CardTitle>
          <CardDescription>
            Manage how we use cookies on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-sm">Essential Cookies</p>
              <p className="text-xs text-text-muted">
                Required for the app to function
              </p>
            </div>
            <Switch checked={true} disabled />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-sm">Analytics Cookies</p>
              <p className="text-xs text-text-muted">
                Help us improve the app
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-sm">Marketing Cookies</p>
              <p className="text-xs text-text-muted">
                Used for personalized ads
              </p>
            </div>
            <Switch />
          </div>
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
