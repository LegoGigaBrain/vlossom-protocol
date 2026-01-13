"use client";

/**
 * V8.0 App Shell Layout
 *
 * Combines Sidebar + Header + Content area with responsive behavior:
 * - Mobile (<768px): Bottom nav, full-width content
 * - Tablet (768-1024px): Left sidebar (icons), header, offset content
 * - Desktop (1024px+): Left sidebar (icons+labels), header, offset content
 *
 * This creates the "mobile app scaling to web" feel where the navigation
 * transforms but the mental model stays consistent.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: ReactNode;
  className?: string;
  /** User's wallet balance in cents */
  balanceCents?: number;
  /** User's display name */
  userName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Hide navigation (for full-screen experiences like maps) */
  hideNav?: boolean;
}

export function AppShell({
  children,
  className,
  balanceCents = 0,
  userName = "User",
  avatarUrl,
  hideNav = false,
}: AppShellProps) {
  if (hideNav) {
    // Full-screen mode (e.g., map view)
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-background-primary dark:bg-background-dark overflow-hidden flex flex-col">
      {/* Sidebar - hidden on mobile, visible on tablet+ */}
      <Sidebar />

      {/* Header - visible on all sizes, position adjusts for sidebar */}
      <AppHeader
        balanceCents={balanceCents}
        userName={userName}
        avatarUrl={avatarUrl}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          // Full height minus header (64px = h-16)
          "h-[calc(100vh-4rem)]",
          // Offset for header
          "mt-16",
          // Offset for sidebar (tablet/desktop)
          "md:ml-16 lg:ml-52",
          // Bottom padding for mobile nav
          "pb-20 md:pb-0",
          // Allow internal scrolling
          "overflow-auto",
          className
        )}
      >
        {children}
      </main>

      {/* Bottom Nav - mobile only */}
      <BottomNav />
    </div>
  );
}

/**
 * Content wrapper with consistent padding
 */
export function AppContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 lg:px-6 py-4 lg:py-6", className)}>
      {children}
    </div>
  );
}

export default AppShell;
