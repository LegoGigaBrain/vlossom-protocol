"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import {
  VlossomHome,
  VlossomSearch,
  VlossomWallet,
  VlossomNotifications,
  VlossomProfile,
} from "../ui/vlossom-icons";
import { MOTION_CLASSES } from "../../lib/motion";

/**
 * V6.0 5-Tab Navigation with Botanical Iconography
 *
 * Structure: Home | Search | Wallet (center) | Notifications | Profile
 *
 * - Home: Map-first discovery + booking (future: full-screen map)
 * - Search: Intentional exploration, following feed, filters
 * - Wallet: Financial hub (center position for emphasis)
 * - Notifications: Global inbox for all system events
 * - Profile: Identity, hair health, schedule, role dashboards
 *
 * Motion: nav transitions use 180-220ms with settle easing
 * Icons: Botanical SVGs derived from Vlossom flower system
 */

interface NavItem {
  path: string;
  label: string;
  icon: typeof VlossomHome;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { path: "/home", label: "Home", icon: VlossomHome },
  { path: "/search", label: "Browse", icon: VlossomSearch },
  { path: "/wallet", label: "Wallet", icon: VlossomWallet, isCenter: true },
  { path: "/notifications", label: "Alerts", icon: VlossomNotifications },
  { path: "/profile", label: "Profile", icon: VlossomProfile },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Handle root path -> home
    if (path === "/home" && pathname === "/") {
      return true;
    }
    // Handle search covering stylists for now (backward compat)
    if (path === "/search") {
      return (
        pathname === "/search" ||
        pathname?.startsWith("/search/") ||
        pathname === "/stylists" ||
        pathname?.startsWith("/stylists/")
      );
    }
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-surface-elevated-light dark:bg-surface-elevated-dark border-t border-border-subtle shadow-vlossom-soft md:hidden pb-safe z-sticky",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-16",
                MOTION_CLASSES.transitionNav,
                item.isCenter
                  ? "-mt-4 bg-primary text-white rounded-full shadow-card hover:shadow-elevated hover:scale-105"
                  : "",
                !item.isCenter && (active ? "text-primary" : "text-text-muted hover:text-text-primary")
              )}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={item.isCenter ? 24 : 24}
                className={cn(
                  MOTION_CLASSES.iconStateChange,
                  active && !item.isCenter && "scale-105"
                )}
                accent={active && !item.isCenter}
                aria-hidden={true}
              />
              <span className={cn(
                "mt-1 text-caption",
                item.isCenter ? "text-[10px] font-medium" : "",
                active && !item.isCenter && "font-medium"
              )}>
                {item.label}
              </span>
              {/* Active indicator dot */}
              {active && !item.isCenter && (
                <span
                  className={cn(
                    "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary",
                    MOTION_CLASSES.navIndicatorActive
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
