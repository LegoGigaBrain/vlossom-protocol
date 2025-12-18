/**
 * Profile Page - V5.3 Architecture
 *
 * Structure:
 * - Instagram-style header (avatar, bio, followers from API)
 * - Role-based tabs (Overview, Stylist, Salon)
 * - Hair Health section in Overview tab (wired to API)
 * - Rewards & social stats with mock fallback
 *
 * Feature flag: NEXT_PUBLIC_USE_MOCK_DATA=true for demo mode
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useHairProfile } from "@/hooks/use-hair-health";
import { useBookingStats } from "@/hooks/use-bookings";
import { useFavorites, useFavoritesCount } from "@/hooks/use-favorites";
import { useSocialStats, useRewardsStats } from "@/hooks/use-profile-stats";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ProfileHeader } from "@/components/profile/profile-header";
import {
  RoleTabs,
  OverviewTab,
  StylistTab,
  SalonTab,
  type ProfileTabId,
} from "@/components/profile/role-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/icons";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");

  // Fetch social stats for profile header
  const { stats: socialStats } = useSocialStats(user?.id);

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
          followersCount: socialStats.followers,
          followingCount: socialStats.following,
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
      
    </div>
  );
}

/**
 * Hair Health Card - Links to full Hair Health profile
 * Wired to real API data via useHairProfile hook
 */
function HairHealthCard() {
  const router = useRouter();
  const { data: profile, isLoading, error } = useHairProfile();

  // Format display values from API data
  const formatTexture = (textureClass?: string, patternFamily?: string) => {
    if (!textureClass) return "--";
    // e.g. "TYPE_4" + "COILY" → "4C"
    const typeNum = textureClass.replace("TYPE_", "");
    const patternLetter = patternFamily === "COILY" ? "C" :
                          patternFamily === "CURLY" ? "B" :
                          patternFamily === "WAVY" ? "A" : "";
    return `${typeNum}${patternLetter}`;
  };

  const formatPorosity = (level?: string | null) => {
    if (!level) return "--";
    return level.charAt(0) + level.slice(1).toLowerCase();
  };

  const formatRoutine = (routine?: string) => {
    if (!routine) return "--";
    return routine.charAt(0) + routine.slice(1).toLowerCase();
  };

  const hasProfile = !!profile;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-brand-rose/10 via-brand-purple/10 to-accent-gold/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-rose/20 flex items-center justify-center">
              <Icon name="sparkle" size="md" className="text-brand-rose" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Hair Health</h3>
              <p className="text-sm text-text-secondary">
                {hasProfile ? "Your personalized care profile" : "Start your hair journey"}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/profile/hair-health")}
          >
            {hasProfile ? "View Profile" : "Get Started"}
            <Icon name="chevronRight" size="sm" className="ml-1" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-3 text-status-error">
            <Icon name="calmError" size="sm" />
            <p className="text-sm">Unable to load profile</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {formatTexture(profile?.textureClass, profile?.patternFamily)}
                </p>
                <p className="text-xs text-text-secondary">Texture</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {formatPorosity(profile?.porosityLevel)}
                </p>
                <p className="text-xs text-text-secondary">Porosity</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {formatRoutine(profile?.routineType)}
                </p>
                <p className="text-xs text-text-secondary">Routine</p>
              </div>
            </div>
            {!hasProfile && (
              <p className="text-xs text-text-muted text-center mt-3">
                Complete your hair profile to unlock personalized recommendations
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Booking Statistics Card
 * Wired to real booking stats API
 */
function BookingStatsCard() {
  const { data: stats, isLoading, error } = useBookingStats();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="calendar" size="md" className="text-brand-rose" />
          Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-3 text-status-error">
            <Icon name="calmError" size="sm" />
            <p className="text-sm">Unable to load stats</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <p className="text-2xl font-bold text-text-primary">
                  {stats?.combined.total ?? 0}
                </p>
                <p className="text-xs text-text-secondary">Total</p>
              </div>
              <div className="text-center p-3 bg-background-secondary rounded-lg">
                <p className="text-2xl font-bold text-brand-rose">
                  {stats?.combined.thisMonth ?? 0}
                </p>
                <p className="text-xs text-text-secondary">This Month</p>
              </div>
            </div>
            {stats && (stats.asCustomer.total > 0 || stats.asStylist.total > 0) && (
              <div className="mt-2 text-xs text-text-muted text-center">
                {stats.asCustomer.total > 0 && (
                  <span>{stats.asCustomer.completed} completed as customer</span>
                )}
                {stats.asCustomer.total > 0 && stats.asStylist.total > 0 && " · "}
                {stats.asStylist.total > 0 && (
                  <span>{stats.asStylist.completed} completed as stylist</span>
                )}
              </div>
            )}
          </>
        )}
        <Link
          href="/bookings"
          className="mt-3 flex items-center justify-center gap-1 text-sm text-brand-rose hover:underline"
        >
          View all bookings
          <Icon name="chevronRight" size="sm" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Rewards Summary Card
 * Wired to real API with mock data fallback
 */
function RewardsCard() {
  const { stats: rewards, isLoading, error } = useRewardsStats();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="star" size="md" className="text-brand-rose" />
          Rewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-3 text-status-error">
            <Icon name="calmError" size="sm" />
            <p className="text-sm">Unable to load rewards</p>
          </div>
        ) : (
          <>
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
                <Icon name="energy" size="sm" className="text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{rewards.streak}</p>
                  <p className="text-xs text-text-muted">Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background-secondary rounded-lg">
                <Icon name="star" size="sm" className="text-brand-rose" />
                <div>
                  <p className="text-sm font-medium">{rewards.badges}</p>
                  <p className="text-xs text-text-muted">Badges</p>
                </div>
              </div>
            </div>
          </>
        )}
        <Link
          href="/wallet/rewards"
          className="mt-3 flex items-center justify-center gap-1 text-sm text-brand-rose hover:underline"
        >
          View rewards
          <Icon name="chevronRight" size="sm" />
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Favorite Stylists Card
 * Wired to real favorites API
 */
function FavoritesStylistsCard() {
  const router = useRouter();
  const { data: favoritesData, isLoading, error } = useFavorites({ limit: 3 });
  const { data: countData } = useFavoritesCount();

  const favorites = favoritesData?.favorites ?? [];
  const totalCount = countData?.count ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="favorite" size="md" className="text-brand-rose" />
            Favorite Stylists
          </CardTitle>
          {totalCount > 0 && (
            <span className="text-xs text-text-muted">{totalCount} total</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-3 text-status-error">
            <Icon name="calmError" size="sm" />
            <p className="text-sm">Unable to load favorites</p>
          </div>
        ) : favorites.length > 0 ? (
          <div className="space-y-2">
            {favorites.map((stylist) => (
              <div
                key={stylist.id}
                onClick={() => router.push(`/stylists/${stylist.id}`)}
                className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center overflow-hidden">
                    {stylist.avatarUrl ? (
                      <img
                        src={stylist.avatarUrl}
                        alt={stylist.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon name="scissors" size="md" className="text-brand-rose" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      {stylist.displayName}
                    </p>
                    {stylist.profile?.specialties?.[0] && (
                      <p className="text-xs text-text-secondary">
                        {(stylist.profile.specialties as string[])[0]}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {stylist.profile?.isAcceptingBookings ? (
                    <span className="text-xs text-tertiary">Available</span>
                  ) : (
                    <span className="text-xs text-text-muted">Unavailable</span>
                  )}
                </div>
              </div>
            ))}
            {totalCount > 3 && (
              <Link
                href="/stylists"
                className="mt-2 flex items-center justify-center gap-1 text-sm text-brand-rose hover:underline"
              >
                View all {totalCount} favorites
                <Icon name="chevronRight" size="sm" />
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Icon name="favorite" size="xl" className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No favorites yet</p>
            <p className="text-xs text-text-muted">
              Heart stylists to add them here
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push("/stylists")}
            >
              Browse Stylists
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
