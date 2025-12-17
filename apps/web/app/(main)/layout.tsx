/**
 * Main App Layout (V7.0)
 *
 * Shared layout for main app pages with responsive navigation:
 * - Mobile (< md): BottomNav fixed at bottom
 * - Desktop (md+): DesktopNav fixed header
 *
 * Route groups don't affect URLs, so /home, /schedule, /profile still work.
 */

"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopNav, DesktopNavSpacer } from "@/components/layout/desktop-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-secondary dark:bg-background-dark">
      {/* Desktop header navigation */}
      <DesktopNav />
      <DesktopNavSpacer />

      {/* Main content with responsive padding */}
      <div className="pb-20 md:pb-8">
        {children}
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
