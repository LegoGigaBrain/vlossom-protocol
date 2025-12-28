/**
 * Profile Header - Instagram-Style (V5.0)
 *
 * Displays:
 * - Avatar with edit option
 * - Display name + @username
 * - Bio
 * - Followers/Following counts
 * - Verified badge (if applicable)
 * - Role badges (Stylist, Salon Owner)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Icon } from "@/components/icons";

export interface ProfileHeaderUser {
  id: string;
  displayName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  roles?: string[];
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
}

interface ProfileHeaderProps {
  user: ProfileHeaderUser;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  className?: string;
}

export function ProfileHeader({
  user,
  isOwnProfile = true,
  onEditProfile,
  className,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);

  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const username = user.username || user.email?.split("@")[0];

  // Determine role badges
  const isStylist = user.role === "STYLIST" || user.roles?.includes("STYLIST");
  const isSalonOwner = user.roles?.includes("SALON_OWNER") || user.roles?.includes("PROPERTY_OWNER");

  const handleFollowToggle = () => {
    // TODO: Implement follow/unfollow API call
    setIsFollowing(!isFollowing);
  };

  return (
    <div className={cn("bg-background-primary", className)}>
      {/* Cover gradient */}
      <div className="h-24 bg-gradient-to-br from-brand-rose/20 via-brand-purple/10 to-accent-gold/10" />

      <div className="px-4 pb-4">
        {/* Avatar + Actions Row */}
        <div className="flex items-end justify-between -mt-12">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-background-primary bg-background-secondary overflow-hidden">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  width={96}
                  height={96}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-rose/10 text-brand-rose text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={onEditProfile}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-rose text-white flex items-center justify-center shadow-md hover:bg-brand-rose/90 transition-colors"
                aria-label="Edit profile photo"
              >
                <Icon name="edit" size="sm" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/settings")}
                >
                  <Icon name="settings" size="sm" className="mr-1" />
                  Settings
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isFollowing ? "outline" : "primary"}
                  size="sm"
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? (
                    <>
                      <Icon name="profile" size="sm" className="mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <Icon name="add" size="sm" className="mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Name + Badges */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold text-text-primary">
              {displayName}
            </h1>
            {user.isVerified && (
              <Icon name="verified" size="sm" className="text-brand-purple" />
            )}
          </div>
          <p className="text-sm text-text-secondary">@{username}</p>
        </div>

        {/* Role Badges */}
        {(isStylist || isSalonOwner) && (
          <div className="flex gap-2 mt-2">
            {isStylist && (
              <Badge variant="secondary" className="gap-1">
                <Icon name="treatment" size="xs" />
                Stylist
              </Badge>
            )}
            {isSalonOwner && (
              <Badge variant="secondary" className="gap-1">
                <Icon name="location" size="xs" />
                Salon Owner
              </Badge>
            )}
          </div>
        )}

        {/* Bio */}
        {user.bio && (
          <p className="mt-3 text-sm text-text-primary leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-border-default">
          <button className="text-center hover:opacity-80 transition-opacity">
            <span className="block text-lg font-bold text-text-primary">
              {user.followersCount ?? 0}
            </span>
            <span className="text-xs text-text-secondary">Followers</span>
          </button>
          <button className="text-center hover:opacity-80 transition-opacity">
            <span className="block text-lg font-bold text-text-primary">
              {user.followingCount ?? 0}
            </span>
            <span className="text-xs text-text-secondary">Following</span>
          </button>
        </div>
      </div>
    </div>
  );
}
