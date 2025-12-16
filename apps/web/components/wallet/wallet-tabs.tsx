/**
 * WalletTabs - Navigation tabs for the 5-section wallet
 * Sections: Overview, DeFi, Rewards, History, Advanced
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import {
  Wallet,
  TrendingUp,
  Gift,
  History,
  Settings2,
} from "lucide-react";

interface WalletTab {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const walletTabs: WalletTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/wallet",
    icon: Wallet,
    description: "Balance and quick actions",
  },
  {
    id: "defi",
    label: "DeFi",
    href: "/wallet/defi",
    icon: TrendingUp,
    description: "Stake and earn yield",
  },
  {
    id: "rewards",
    label: "Rewards",
    href: "/wallet/rewards",
    icon: Gift,
    description: "XP, badges, and achievements",
  },
  {
    id: "history",
    label: "History",
    href: "/wallet/history",
    icon: History,
    description: "Transaction history",
  },
  {
    id: "advanced",
    label: "Advanced",
    href: "/wallet/advanced",
    icon: Settings2,
    description: "Web3 settings",
  },
];

interface WalletTabsProps {
  className?: string;
}

export function WalletTabs({ className }: WalletTabsProps) {
  const pathname = usePathname();

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === "/wallet") return "overview";
    const segment = pathname.split("/wallet/")[1];
    return segment || "overview";
  };

  const activeTab = getActiveTab();

  return (
    <nav
      className={cn(
        "flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
      aria-label="Wallet navigation"
    >
      {walletTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2",
              isActive
                ? "bg-brand-rose text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { walletTabs };
export type { WalletTab };
