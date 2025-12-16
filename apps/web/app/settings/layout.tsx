/**
 * Settings Layout
 * V3.4: Provides navigation structure for settings sections
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "../../components/layout/app-header";
import { BottomNav } from "../../components/layout/bottom-nav";
import { cn } from "../../lib/utils";
import {
  User,
  Palette,
  Bell,
  Shield,
  Lock,
  Cog,
  ChevronRight,
} from "lucide-react";

const settingsNav = [
  {
    label: "Account",
    href: "/settings",
    icon: User,
    description: "Profile and personal info",
  },
  {
    label: "Display",
    href: "/settings/display",
    icon: Palette,
    description: "Currency and appearance",
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Push and email alerts",
  },
  {
    label: "Privacy",
    href: "/settings/privacy",
    icon: Shield,
    description: "Profile visibility",
  },
  {
    label: "Security",
    href: "/settings/security",
    icon: Lock,
    description: "Authentication and 2FA",
  },
  {
    label: "Advanced",
    href: "/settings/advanced",
    icon: Cog,
    description: "Developer options",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <AppHeader
        title="Settings"
        subtitle="Manage your preferences"
        showBack
        backHref="/profile"
        showNotifications
      />

      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden md:block">
            <nav className="sticky top-24 space-y-1">
              {settingsNav.map((item) => {
                const isActive =
                  item.href === "/settings"
                    ? pathname === "/settings"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-brand-rose/10 text-brand-rose"
                        : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-text-muted truncate">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {settingsNav.map((item) => {
                const isActive =
                  item.href === "/settings"
                    ? pathname === "/settings"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors",
                      isActive
                        ? "bg-brand-rose text-white"
                        : "bg-background-secondary text-text-secondary"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
