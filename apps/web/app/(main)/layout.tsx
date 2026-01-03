/**
 * Main App Layout (V8.0)
 *
 * Uses AppShell for unified responsive navigation:
 * - Mobile (< 768px): BottomNav fixed at bottom
 * - Tablet (768-1024px): Left sidebar (icons) + minimal header
 * - Desktop (1024px+): Left sidebar (icons + labels) + minimal header
 *
 * V8.0: Web/Mobile alignment - sidebar navigation matching mobile mental model
 */

"use client";

import { AppShell } from "@/components/layout/AppShell";

// TODO: Replace with real user data from auth context
const mockUserData = {
  balanceCents: 45000, // R450.00
  userName: "User",
  avatarUrl: undefined,
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      balanceCents={mockUserData.balanceCents}
      userName={mockUserData.userName}
      avatarUrl={mockUserData.avatarUrl}
    >
      {children}
    </AppShell>
  );
}
