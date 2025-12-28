/**
 * Property Owner Dashboard Layout
 * Reference: docs/vlossom/17-property-owner-module.md
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { cn } from "../../lib/utils";

const navItems = [
  { href: "/property-owner", label: "Overview", icon: "home" as const },
  { href: "/property-owner/chairs", label: "Chairs", icon: "settings" as const },
  { href: "/property-owner/requests", label: "Requests", icon: "notifications" as const },
  { href: "/property-owner/revenue", label: "Revenue", icon: "currency" as const },
];

export default function PropertyOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const navRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Check scroll position to show/hide indicators
  React.useEffect(() => {
    const checkScroll = () => {
      const nav = navRef.current;
      if (!nav) return;

      const { scrollLeft, scrollWidth, clientWidth } = nav;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    const nav = navRef.current;
    if (nav) {
      checkScroll();
      nav.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        nav.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Top Navigation Bar */}
      <header className="bg-background-primary border-b border-border-default sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/property-owner" className="flex items-center gap-2">
              <span className="text-h3 text-brand-rose font-display">Vlossom</span>
              <span className="text-caption text-text-tertiary">Property</span>
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

      {/* Navigation Tabs (Mobile-first horizontal scroll with indicators) */}
      <nav className="bg-background-primary border-b border-border-default relative">
        {/* Left scroll indicator */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background-primary to-transparent z-10 pointer-events-none"
            aria-hidden={true}
          />
        )}

        {/* Right scroll indicator */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background-primary to-transparent z-10 pointer-events-none"
            aria-hidden={true}
          />
        )}

        <div
          ref={navRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 -mb-px">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/property-owner" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-body-small whitespace-nowrap border-b-2 transition-colors min-h-[44px]",
                      isActive
                        ? "border-brand-rose text-brand-rose"
                        : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
                    )}
                  >
                    <Icon name={item.icon} size="md" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
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
