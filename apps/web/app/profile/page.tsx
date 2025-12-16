"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ProfileForm } from "../../components/profile/profile-form";
import { AvatarUpload } from "../../components/profile/avatar-upload";
import { LinkedAccounts } from "../../components/settings/linked-accounts";
import { AppHeader } from "../../components/layout/app-header";
import { BottomNav } from "../../components/layout/bottom-nav";
import { toast } from "../../hooks/use-toast";
import { Skeleton } from "../../components/ui/skeleton";
import { Input } from "../../components/ui/input";
import {
  User,
  Shield,
  Bell,
  LogOut,
  Trash2,
  Calendar,
  Star,
  Trophy,
  Flame,
  Heart,
  Instagram,
  Scissors,
  ChevronRight,
  Award,
  ExternalLink,
} from "lucide-react";

// Hair type options
const hairTypes = [
  { id: "straight", label: "Straight" },
  { id: "wavy", label: "Wavy" },
  { id: "curly", label: "Curly" },
  { id: "coily", label: "Coily/Kinky" },
  { id: "natural", label: "Natural" },
  { id: "relaxed", label: "Relaxed" },
  { id: "colored", label: "Color Treated" },
  { id: "braids", label: "Braids/Locs" },
];

// Hair texture options
const hairTextures = [
  { id: "fine", label: "Fine" },
  { id: "medium", label: "Medium" },
  { id: "thick", label: "Thick" },
];

// Mock data for demonstration (will be from API)
interface BookingStats {
  total: number;
  thisMonth: number;
  asCustomer: number;
  asStylist: number;
}

interface RewardsSummary {
  xp: number;
  tier: string;
  tierColor: string;
  streak: number;
  badgeCount: number;
}

interface FavoriteStylist {
  id: string;
  name: string;
  avatarUrl?: string;
  specialty: string;
  rating: number;
}

export default function ProfilePage() {
  const { user, isLoading, logout, refetch } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Hair preferences state
  const [selectedHairType, setSelectedHairType] = useState<string>("");
  const [selectedTexture, setSelectedTexture] = useState<string>("");
  const [hairPreferencesSaved, setHairPreferencesSaved] = useState(false);

  // Social links state
  const [instagramHandle, setInstagramHandle] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [socialLinksSaved, setSocialLinksSaved] = useState(false);

  // Mock booking stats (will be from API)
  const [bookingStats] = useState<BookingStats>({
    total: 12,
    thisMonth: 3,
    asCustomer: 10,
    asStylist: 2,
  });

  // Mock rewards summary (will be from API)
  const [rewardsSummary] = useState<RewardsSummary>({
    xp: 125,
    tier: "Bronze",
    tierColor: "text-amber-700 bg-amber-100",
    streak: 0,
    badgeCount: 1,
  });

  // Mock favorite stylists (will be from API)
  const [favoriteStylists] = useState<FavoriteStylist[]>([
    { id: "1", name: "Sarah M.", specialty: "Braids & Locs", rating: 4.9 },
    { id: "2", name: "James K.", specialty: "Fades & Cuts", rating: 4.8 },
  ]);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedHairType = localStorage.getItem("vlossom_hair_type");
    const savedTexture = localStorage.getItem("vlossom_hair_texture");
    const savedInstagram = localStorage.getItem("vlossom_instagram");
    const savedTiktok = localStorage.getItem("vlossom_tiktok");

    if (savedHairType) setSelectedHairType(savedHairType);
    if (savedTexture) setSelectedTexture(savedTexture);
    if (savedInstagram) setInstagramHandle(savedInstagram);
    if (savedTiktok) setTiktokHandle(savedTiktok);
  }, []);

  const saveHairPreferences = () => {
    localStorage.setItem("vlossom_hair_type", selectedHairType);
    localStorage.setItem("vlossom_hair_texture", selectedTexture);
    setHairPreferencesSaved(true);
    toast.success("Hair preferences saved", "Your preferences have been updated.");
    setTimeout(() => setHairPreferencesSaved(false), 2000);
  };

  const saveSocialLinks = () => {
    localStorage.setItem("vlossom_instagram", instagramHandle);
    localStorage.setItem("vlossom_tiktok", tiktokHandle);
    setSocialLinksSaved(true);
    toast.success("Social links saved", "Your social links have been updated.");
    setTimeout(() => setSocialLinksSaved(false), 2000);
  };

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

      {/* Stats & Rewards Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Booking Statistics Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-rose" />
              Booking Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <p className="text-2xl font-bold text-text-primary">{bookingStats.total}</p>
                <p className="text-sm text-text-secondary">Total Bookings</p>
              </div>
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <p className="text-2xl font-bold text-brand-rose">{bookingStats.thisMonth}</p>
                <p className="text-sm text-text-secondary">This Month</p>
              </div>
              <div className="text-center p-3 bg-background-tertiary rounded-lg">
                <p className="text-lg font-semibold text-text-primary">{bookingStats.asCustomer}</p>
                <p className="text-xs text-text-tertiary">As Customer</p>
              </div>
              <div className="text-center p-3 bg-background-tertiary rounded-lg">
                <p className="text-lg font-semibold text-text-primary">{bookingStats.asStylist}</p>
                <p className="text-xs text-text-tertiary">As Stylist</p>
              </div>
            </div>
            <Link
              href="/bookings"
              className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-rose hover:underline"
            >
              View all bookings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Rewards Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-rose" />
              Rewards & XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-text-primary">{rewardsSummary.xp}</p>
                <p className="text-sm text-text-secondary">Total XP</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${rewardsSummary.tierColor}`}>
                {rewardsSummary.tier}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{rewardsSummary.streak}</p>
                  <p className="text-xs text-text-tertiary">Day Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg">
                <Award className="w-5 h-5 text-brand-rose" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{rewardsSummary.badgeCount}</p>
                  <p className="text-xs text-text-tertiary">Badges</p>
                </div>
              </div>
            </div>
            <Link
              href="/wallet/rewards"
              className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-rose hover:underline"
            >
              View all rewards
              <ChevronRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Favorite Stylists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-rose" />
            Favorite Stylists
          </CardTitle>
          <CardDescription>
            Stylists you&apos;ve saved for quick booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteStylists.length > 0 ? (
            <div className="space-y-3">
              {favoriteStylists.map((stylist) => (
                <div
                  key={stylist.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-brand-rose" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{stylist.name}</p>
                      <p className="text-sm text-text-secondary">{stylist.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium text-text-primary">{stylist.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No favorite stylists yet</p>
              <p className="text-sm text-text-tertiary">Heart stylists during booking to add them here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hair Preferences (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scissors className="w-5 h-5 text-brand-rose" />
            Hair Preferences
          </CardTitle>
          <CardDescription>
            Help stylists understand your hair type (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Hair Type
            </label>
            <div className="flex flex-wrap gap-2">
              {hairTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedHairType(type.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedHairType === type.id
                      ? "bg-brand-rose text-white"
                      : "bg-background-secondary text-text-secondary hover:bg-background-tertiary"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Hair Texture
            </label>
            <div className="flex flex-wrap gap-2">
              {hairTextures.map((texture) => (
                <button
                  key={texture.id}
                  onClick={() => setSelectedTexture(texture.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTexture === texture.id
                      ? "bg-brand-rose text-white"
                      : "bg-background-secondary text-text-secondary hover:bg-background-tertiary"
                  }`}
                >
                  {texture.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={saveHairPreferences}
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={hairPreferencesSaved}
          >
            {hairPreferencesSaved ? "Saved!" : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Instagram className="w-5 h-5 text-brand-rose" />
            Social Links
          </CardTitle>
          <CardDescription>
            Connect your social profiles to showcase your style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">@</span>
                <Input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
              {instagramHandle && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://instagram.com/${instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">@</span>
                <Input
                  value={tiktokHandle}
                  onChange={(e) => setTiktokHandle(e.target.value)}
                  placeholder="username"
                  className="pl-8"
                />
              </div>
              {tiktokHandle && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://tiktok.com/@${tiktokHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Button
            onClick={saveSocialLinks}
            variant="outline"
            size="sm"
            disabled={socialLinksSaved}
          >
            {socialLinksSaved ? "Saved!" : "Save Social Links"}
          </Button>
        </CardContent>
      </Card>

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
