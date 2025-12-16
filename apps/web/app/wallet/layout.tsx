/**
 * Wallet Layout - Shared layout for all wallet pages
 * Includes header and tab navigation
 */

"use client";

import { useAuth } from "../../hooks/use-auth";
import { AppHeader } from "../../components/layout/app-header";
import { BottomNav } from "../../components/layout/bottom-nav";
import { WalletTabs } from "../../components/wallet/wallet-tabs";

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background-secondary pb-20 md:pb-8">
      {/* Header */}
      <AppHeader
        title="Wallet"
        subtitle={`Welcome, ${user?.displayName || user?.email || "User"}`}
        showNotifications
        showProfile
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Tab Navigation */}
        <WalletTabs className="mb-6" />

        {/* Page Content */}
        {children}
      </div>

      {/* Bottom Navigation - Mobile */}
      <BottomNav />
    </div>
  );
}
