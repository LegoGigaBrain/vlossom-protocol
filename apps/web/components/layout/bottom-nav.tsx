"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Home, Search, Wallet, Bell, User } from "lucide-react";

/**
 * V5.0 5-Tab Navigation
 *
 * Structure: Home | Search | Wallet (center) | Notifications | Profile
 *
 * - Home: Map-first discovery + booking (future: full-screen map)
 * - Search: Intentional exploration, following feed, filters
 * - Wallet: Financial hub (center position for emphasis)
 * - Notifications: Global inbox for all system events
 * - Profile: Identity, hair health, schedule, role dashboards
 */

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/search", label: "Search", icon: Search },
  { path: "/wallet", label: "Wallet", icon: Wallet, isCenter: true },
  { path: "/notifications", label: "Alerts", icon: Bell },
  { path: "/profile", label: "Profile", icon: User },
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
        "fixed bottom-0 left-0 right-0 bg-background-primary border-t border-border-default md:hidden pb-safe z-50",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-end py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              className={cn(
                "flex flex-col items-center min-h-[44px] transition-all duration-200",
                item.isCenter
                  ? "py-2 px-5 -mt-3 bg-brand-rose text-white rounded-full shadow-md hover:shadow-lg hover:scale-105"
                  : "py-3 px-3",
                !item.isCenter && (active ? "text-brand-rose" : "text-text-secondary hover:text-text-primary")
              )}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "aria-hidden",
                  item.isCenter ? "w-6 h-6" : "w-5 h-5"
                )}
                aria-hidden="true"
              />
              <span className={cn(
                "mt-1",
                item.isCenter ? "text-[10px] font-medium" : "text-xs"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
