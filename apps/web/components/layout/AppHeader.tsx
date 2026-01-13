"use client";

/**
 * V8.0 Minimal App Header
 *
 * Design decisions:
 * - Minimal: Logo + Wallet Balance (fiat-first) + Avatar
 * - NO search bar (search IS the map on Home tab)
 * - NO notification bell (sidebar has it - avoid redundancy)
 * - Intentional redundancy: wallet balance here + in sidebar (identity anchor)
 *
 * Reference: Zora-like minimal header pattern
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VlossomIcon, VlossomWordmark } from "@/components/ui/vlossom-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ui/theme-toggle";
import { MOTION_CLASSES } from "@/lib/motion";

interface AppHeaderProps {
  className?: string;
  /** User's wallet balance in cents (e.g., 45000 = R450.00) */
  balanceCents?: number;
  /** User's display name for avatar fallback */
  userName?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Currency code (default: ZAR) */
  currency?: string;
}

/**
 * Format balance in fiat-first display
 * e.g., 45000 cents -> "R450.00"
 */
function formatBalance(cents: number, currency: string = "ZAR"): string {
  const amount = cents / 100;
  const currencySymbols: Record<string, string> = {
    ZAR: "R",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get initials from name for avatar fallback
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppHeader({
  className,
  balanceCents = 0,
  userName = "User",
  avatarUrl,
  currency = "ZAR",
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        // Base styles
        "fixed top-0 right-0 h-16 bg-surface-elevated-light dark:bg-surface-elevated-dark",
        "border-b border-border-subtle z-sticky",
        // Position: accounts for sidebar width
        "left-0 md:left-16 lg:left-52",
        // Transitions
        MOTION_CLASSES.transitionNav,
        className
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Logo (mobile only - sidebar has it on desktop) */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/home" className="flex items-center gap-2">
            <VlossomIcon size={28} variant="auto" />
            <VlossomWordmark height={20} variant="auto" />
          </Link>
        </div>

        {/* Desktop: Empty left space or breadcrumb area */}
        <div className="hidden md:block" />

        {/* Right: Wallet Balance + Avatar */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeSelector size="sm" />

          {/* Wallet Balance - Fiat First */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/wallet")}
            className={cn(
              "gap-2 font-medium text-primary",
              MOTION_CLASSES.transitionNav
            )}
          >
            <span className="text-sm">{formatBalance(balanceCents, currency)}</span>
          </Button>

          {/* Avatar with dropdown trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/profile")}
            className={cn(
              "rounded-full p-0 w-9 h-9",
              MOTION_CLASSES.transitionNav
            )}
            aria-label="Profile menu"
          >
            <Avatar className="w-9 h-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
              <AvatarFallback className="bg-secondary text-primary text-sm font-medium">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Spacer to prevent content from being hidden under fixed header
 */
export function AppHeaderSpacer() {
  return <div className="h-16" />;
}

export default AppHeader;
