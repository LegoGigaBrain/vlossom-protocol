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
import { VlossomIcon, VlossomWordmark } from "@/components/ui/vlossom-logo";
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
  { path: "/search", label: "Browse", icon: VlossomSearch },
  { path: "/wallet", label: "Wallet", icon: VlossomWallet },
  { path: "/notifications", label: "Alerts", icon: VlossomNotifications },
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
        "hidden md:flex fixed top-0 left-0 right-0 h-16 bg-surface-elevated-light dark:bg-surface-elevated-dark border-b border-border-subtle shadow-vlossom-soft z-sticky",
        className
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between h-full">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 text-primary font-display text-xl font-semibold"
        >
          <VlossomIcon size={32} variant="auto" />
          <VlossomWordmark className="hidden lg:block" height={24} variant="auto" />
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
                  size={20}
                  accent={active}
                  aria-hidden={true}
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
