"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Search, Calendar, Wallet, User } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Search;
}

const navItems: NavItem[] = [
  { path: "/stylists", label: "Discover", icon: Search },
  { path: "/bookings", label: "Bookings", icon: Calendar },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/profile", label: "Profile", icon: User },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/stylists") {
      return pathname === "/stylists" || pathname?.startsWith("/stylists/");
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
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              className={cn(
                "flex flex-col items-center py-3 px-4 min-h-[44px] transition-gentle",
                active ? "text-brand-rose" : "text-text-secondary"
              )}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
