"use client";

/**
 * V8.0 Responsive Sidebar Navigation
 *
 * Matches mobile bottom nav mental model but scales to desktop:
 * - Tablet (768-1024px): Icons only (~64px width)
 * - Desktop (1024px+): Icons + labels (~200px width)
 *
 * Structure: Home | Browse | Wallet (elevated) | Alerts | Profile
 *
 * Design decisions:
 * - Wallet is visually elevated (strategic DeFi education)
 * - Uses botanical icons (brand purity - Option A)
 * - Left sidebar pattern (like Spotify, Discord, Zora)
 */

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  VlossomHome,
  VlossomSearch,
  VlossomWallet,
  VlossomNotifications,
  VlossomProfile,
} from "@/components/ui/vlossom-icons";
import { VlossomIcon } from "@/components/ui/vlossom-logo";
import { MOTION_CLASSES } from "@/lib/motion";

interface NavItem {
  path: string;
  label: string;
  icon: typeof VlossomHome;
  isElevated?: boolean;
}

const navItems: NavItem[] = [
  { path: "/home", label: "Home", icon: VlossomHome },
  { path: "/search", label: "Browse", icon: VlossomSearch },
  { path: "/wallet", label: "Wallet", icon: VlossomWallet, isElevated: true },
  { path: "/notifications", label: "Alerts", icon: VlossomNotifications },
  { path: "/profile", label: "Profile", icon: VlossomProfile },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Handle root path -> home
    if (path === "/home" && pathname === "/") {
      return true;
    }
    // Handle search/browse covering stylists
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
    <aside
      className={cn(
        // Base styles
        "fixed left-0 top-0 h-full bg-surface-elevated-light dark:bg-surface-elevated-dark",
        "border-r border-border-subtle z-sticky",
        // Hidden on mobile
        "hidden md:flex flex-col",
        // Width: icons-only on tablet, icons+labels on desktop
        "w-16 lg:w-52",
        // Transitions
        MOTION_CLASSES.transitionNav,
        className
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center justify-center lg:justify-start h-16 px-4 border-b border-border-subtle">
        <Link href="/home" className="flex items-center gap-3">
          <VlossomIcon size={32} variant="auto" />
          <span className="hidden lg:block font-display text-lg text-primary font-semibold">
            Vlossom
          </span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col py-4 px-2 lg:px-3 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                // Base styles
                "relative flex items-center gap-3 rounded-lg",
                "h-12 lg:h-11",
                // Center on tablet, left-align on desktop
                "justify-center lg:justify-start",
                "px-3 lg:px-4",
                // Transitions
                MOTION_CLASSES.transitionNav,
                // Elevated wallet styling
                item.isElevated && [
                  "my-2",
                  active
                    ? "bg-primary text-white shadow-card"
                    : "bg-secondary dark:bg-surface-dark text-primary hover:bg-primary hover:text-white",
                ],
                // Regular item styling
                !item.isElevated && [
                  active
                    ? "bg-secondary dark:bg-surface-dark text-primary"
                    : "text-text-secondary hover:text-primary hover:bg-background-secondary dark:hover:bg-surface-dark",
                ]
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={22}
                className={cn(
                  MOTION_CLASSES.iconStateChange,
                  active && !item.isElevated && "scale-105"
                )}
                aria-hidden={true}
              />
              {/* Label (desktop only) */}
              <span
                className={cn(
                  "hidden lg:block text-sm font-medium",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {/* Active indicator (non-elevated items) */}
              {active && !item.isElevated && (
                <span
                  className={cn(
                    "absolute left-0 w-1 h-6 rounded-r-full bg-primary",
                    "hidden lg:block",
                    MOTION_CLASSES.navIndicatorActive
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section - could add settings or help here */}
      <div className="p-2 lg:p-3 border-t border-border-subtle">
        <div className="flex items-center justify-center lg:justify-start gap-2 px-3 py-2 text-text-muted text-caption">
          <span className="hidden lg:block">V8.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
