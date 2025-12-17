/**
 * Profile Page - V5.0 Architecture
 *
 * Structure:
 * - Instagram-style header (avatar, bio, followers)
 * - Role-based tabs (Overview, Stylist, Salon)
 * - Hair Health section in Overview tab
 */

"use client";

import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "../../components/layout/bottom-nav";
import { ProfileHeader } from "../../components/profile/profile-header";
import {
  RoleTabs,
  OverviewTab,
  StylistTab,
  SalonTab,
  type ProfileTabId,
} from "../../components/profile/role-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Sparkles,
  Calendar,
  Heart,
  Star,
  Scissors,
  ChevronRight,
  Trophy,
  Flame,
  Award,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary pb-24">
        {/* Header skeleton */}
        <div className="bg-background-primary">
          <div className="h-24 bg-background-tertiary" />
          <div className="px-4 pb-4">
            <div className="flex items-end justify-between -mt-12">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="w-24 h-9" />
            </div>
            <Skeleton className="h-6 w-32 mt-3" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32" />
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

  // Determine user roles - currently single role, will expand in future
  const userRoles: Array<"CUSTOMER" | "STYLIST" | "SALON_OWNER"> = [user.role];

  return (
    <div className="min-h-screen bg-background-secondary pb-24">
      {/* Profile Header */}
      <ProfileHeader
        user={{
          id: user.id,
          displayName: user.displayName,
          username: user.email?.split("@")[0] || user.id.slice(0, 8), // Derive username from email
          email: user.email ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
          bio: undefined, // Not yet in AuthUser
          role: user.role,
          roles: userRoles,
          isVerified: user.verificationStatus === "VERIFIED",
          followersCount: 0, // Not yet implemented
          followingCount: 0, // Not yet implemented
        }}
        isOwnProfile={true}
        onEditProfile={() => router.push("/settings")}
      />

      {/* Role Tabs */}
      <RoleTabs
        userRoles={userRoles}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "overview" && (
          <OverviewTab>
            {/* Hair Health Card */}
            <HairHealthCard />

            {/* Stats & Rewards */}
            <div className="grid gap-4 md:grid-cols-2">
              <BookingStatsCard />
              <RewardsCard />
            </div>

            {/* Favorite Stylists */}
            <FavoritesStylistsCard />
          </OverviewTab>
        )}

        {activeTab === "stylist" && <StylistTab />}
        {activeTab === "salon" && <SalonTab />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

/**
 * Hair Health Card - Links to full Hair Health profile
 */
function HairHealthCard() {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-brand-rose/10 via-brand-purple/10 to-accent-gold/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-rose/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-brand-rose" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Hair Health</h3>
              <p className="text-sm text-text-secondary">
                Your personalized care profile
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/profile/hair-health")}
          >
            View Profile
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-text-primary">--</p>
            <p className="text-xs text-text-secondary">Texture</p>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">--</p>
            <p className="text-xs text-text-secondary">Porosity</p>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">--</p>
            <p className="text-xs text-text-secondary">Routine</p>
          </div>
        </div>
        <p className="text-xs text-text-muted text-center mt-3">
          Complete your hair profile to unlock personalized recommendations
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Booking Statistics Card
 */
function BookingStatsCard() {
  // Mock data - will be from API
  const stats = {
    total: 12,
    thisMonth: 3,
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-rose" />
          Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-background-secondary rounded-lg">
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
            <p className="text-xs text-text-secondary">Total</p>
          </div>
          <div className="text-center p-3 bg-background-secondary rounded-lg">
            <p className="text-2xl font-bold text-brand-rose">{stats.thisMonth}</p>
            <p className="text-xs text-text-secondary">This Month</p>
          </div>
        </div>
        <Link
          href="/bookings"
          className="mt-3 flex items-center justify-center gap-1 text-sm text-brand-rose hover:underline"
        >
          View all bookings
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Rewards Summary Card
 */
function RewardsCard() {
  // Mock data - will be from API
  const rewards = {
    xp: 125,
    tier: "Bronze",
    tierColor: "text-amber-700 bg-amber-100",
    streak: 0,
    badges: 1,
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-rose" />
          Rewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-text-primary">{rewards.xp}</p>
            <p className="text-xs text-text-secondary">Total XP</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${rewards.tierColor}`}
          >
            {rewards.tier}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg">
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">{rewards.streak}</p>
              <p className="text-xs text-text-muted">Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg">
            <Award className="w-4 h-4 text-brand-rose" />
            <div>
              <p className="text-sm font-medium">{rewards.badges}</p>
              <p className="text-xs text-text-muted">Badges</p>
            </div>
          </div>
        </div>
        <Link
          href="/wallet/rewards"
          className="mt-3 flex items-center justify-center gap-1 text-sm text-brand-rose hover:underline"
        >
          View rewards
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Favorite Stylists Card
 */
function FavoritesStylistsCard() {
  // Mock data - will be from API
  const favorites = [
    { id: "1", name: "Sarah M.", specialty: "Braids & Locs", rating: 4.9 },
    { id: "2", name: "James K.", specialty: "Fades & Cuts", rating: 4.8 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-5 h-5 text-brand-rose" />
          Favorite Stylists
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length > 0 ? (
          <div className="space-y-2">
            {favorites.map((stylist) => (
              <div
                key={stylist.id}
                className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-brand-rose" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      {stylist.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {stylist.specialty}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{stylist.rating}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Heart className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No favorites yet</p>
            <p className="text-xs text-text-muted">
              Heart stylists to add them here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
