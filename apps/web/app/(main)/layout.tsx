/**
 * Main App Layout (V5.1)
 *
 * Shared layout for main app pages with BottomNav.
 * Route groups don't affect URLs, so /home, /schedule, /profile still work.
 */

"use client";

import { BottomNav } from "../../components/layout/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-secondary pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
