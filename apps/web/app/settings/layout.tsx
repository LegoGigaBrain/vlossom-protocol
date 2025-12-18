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
import { Icon, type IconName } from "@/components/icons";

const settingsNav = [
  {
    label: "Account",
    href: "/settings",
    iconName: "profile" as IconName,
    description: "Profile and personal info",
  },
  {
    label: "Display",
    href: "/settings/display",
    iconName: "sparkle" as IconName,
    description: "Currency and appearance",
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    iconName: "notifications" as IconName,
    description: "Push and email alerts",
  },
  {
    label: "Privacy",
    href: "/settings/privacy",
    iconName: "trusted" as IconName,
    description: "Profile visibility",
  },
  {
    label: "Security",
    href: "/settings/security",
    iconName: "locked" as IconName,
    description: "Authentication and 2FA",
  },
  {
    label: "Advanced",
    href: "/settings/advanced",
    iconName: "settings" as IconName,
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
                    <Icon name={item.iconName} className="flex-shrink-0" />
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
                    <Icon name={item.iconName} size="sm" />
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
