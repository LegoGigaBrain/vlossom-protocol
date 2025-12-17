"use client";

/**
 * Desktop Navigation Header
 *
 * Design P0: Desktop navigation (bottom nav hidden on desktop with no replacement)
 * Reference: Design Review - Need horizontal header navigation for desktop
 *
 * Features:
 * - Horizontal header navigation for md+ screens
 * - Role-based menu items (Customer, Stylist, Property Owner)
 * - Theme toggle integration
 * - Responsive: hidden on mobile (bottom nav shown instead)
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
import { ThemeSelector } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { MOTION_CLASSES } from "@/lib/motion";

interface NavItem {
  path: string;
  label: string;
  icon: typeof VlossomHome;
}

const navItems: NavItem[] = [
  { path: "/home", label: "Home", icon: VlossomHome },
  { path: "/search", label: "Explore", icon: VlossomSearch },
  { path: "/wallet", label: "Wallet", icon: VlossomWallet },
  { path: "/notifications", label: "Notifications", icon: VlossomNotifications },
  { path: "/profile", label: "Profile", icon: VlossomProfile },
];

interface DesktopNavProps {
  className?: string;
}

export function DesktopNav({ className }: DesktopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/home" && pathname === "/") {
      return true;
    }
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
    <header
      className={cn(
        "hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background-primary dark:bg-background-dark border-b border-border z-50",
        className
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between h-full">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 text-primary font-display text-xl font-semibold"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 8C20 8 12 16 12 22C12 26.4183 15.5817 30 20 30C24.4183 30 28 26.4183 28 22C28 16 20 8 20 8Z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="20" cy="22" r="4" fill="currentColor" />
          </svg>
          <span className="hidden lg:inline">Vlossom</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                onClick={() => router.push(item.path)}
                className={cn(
                  "gap-2 px-3",
                  MOTION_CLASSES.transitionNav,
                  active && "bg-secondary dark:bg-surface-dark"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={18}
                  accent={active}
                  aria-hidden="true"
                />
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeSelector size="default" />
        </div>
      </div>
    </header>
  );
}

/**
 * Spacer component to prevent content from being hidden under fixed header
 */
export function DesktopNavSpacer() {
  return <div className="hidden md:block h-16" />;
}

export default DesktopNav;
