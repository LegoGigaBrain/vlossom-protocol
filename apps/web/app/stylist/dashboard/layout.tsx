/**
 * Stylist Dashboard Layout
 * Reference: docs/specs/stylist-dashboard/F3.1-stylist-dashboard.md
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

const navItems = [
  { href: "/stylist/dashboard", label: "Overview", icon: "📊" },
  { href: "/stylist/dashboard/requests", label: "Requests", icon: "📥" },
  { href: "/stylist/dashboard/services", label: "Services", icon: "✂️" },
  { href: "/stylist/dashboard/availability", label: "Availability", icon: "📅" },
  { href: "/stylist/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/stylist/dashboard/earnings", label: "Earnings", icon: "💰" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Top Navigation Bar */}
      <header className="bg-background-primary border-b border-border-default sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/stylist/dashboard" className="flex items-center gap-2">
              <span className="text-h3 text-brand-rose font-display">Vlossom</span>
              <span className="text-caption text-text-tertiary">Stylist</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-body-small text-text-secondary hidden sm:block">
                {user?.displayName || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs (Mobile-first horizontal scroll) */}
      <nav className="bg-background-primary border-b border-border-default overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 -mb-px">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/stylist/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-body-small whitespace-nowrap border-b-2 transition-colors",
                    isActive
                      ? "border-brand-rose text-brand-rose"
                      : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
