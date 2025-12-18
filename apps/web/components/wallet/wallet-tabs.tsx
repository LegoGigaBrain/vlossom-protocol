/**
 * WalletTabs - Navigation tabs for the 5-section wallet
 * Sections: Overview, DeFi, Rewards, History, Advanced
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Icon, type IconName } from "@/components/icons";

interface WalletTab {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  description?: string;
}

const walletTabs: WalletTab[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/wallet",
    icon: "wallet",
    description: "Balance and quick actions",
  },
  {
    id: "defi",
    label: "DeFi",
    href: "/wallet/defi",
    icon: "growing",
    description: "Stake and earn yield",
  },
  {
    id: "rewards",
    label: "Rewards",
    href: "/wallet/rewards",
    icon: "star",
    description: "XP, badges, and achievements",
  },
  {
    id: "history",
    label: "History",
    href: "/wallet/history",
    icon: "clock",
    description: "Transaction history",
  },
  {
    id: "advanced",
    label: "Advanced",
    href: "/wallet/advanced",
    icon: "settings",
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
            <Icon name={tab.icon} size="sm" aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { walletTabs };
export type { WalletTab };
