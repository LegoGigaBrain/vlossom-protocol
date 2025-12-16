/**
 * Wallet DeFi Page - Staking and liquidity pools (Coming in V4.0)
 * Stub page showing the future DeFi features
 */

"use client";

import { TrendingUp, Coins, Users, Lock, ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface PoolCard {
  id: string;
  name: string;
  description: string;
  apy: string;
  tvl: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "coming_soon" | "active";
}

const pools: PoolCard[] = [
  {
    id: "vlp",
    name: "Vlossom Liquidity Pool (VLP)",
    description:
      "The genesis pool powering instant stylist payouts and booking escrow. Safest pool with stable yields from real booking fees.",
    apy: "~8-12%",
    tvl: "Coming Soon",
    icon: Coins,
    status: "coming_soon",
  },
  {
    id: "community",
    name: "Community Pools",
    description:
      "Stokvel-inspired pools created by top referrers. Higher yields, community-driven, with tiered access based on referral ranking.",
    apy: "~10-18%",
    tvl: "Coming Soon",
    icon: Users,
    status: "coming_soon",
  },
  {
    id: "financing",
    name: "Financing Pools",
    description:
      "Specialized pools for stylist equipment financing, salon upgrades, and chair lease BNPL. Higher risk, higher reward.",
    apy: "~15-25%",
    tvl: "Coming Soon",
    icon: TrendingUp,
    status: "coming_soon",
  },
];

export default function WalletDeFiPage() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-brand-rose/10 to-brand-clay/10 border border-brand-rose/20 rounded-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-rose/10 rounded-full">
            <Lock className="h-6 w-6 text-brand-rose" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              DeFi Features Coming in V4.0
            </h2>
            <p className="text-body text-text-secondary mb-4">
              Vlossom&apos;s DeFi layer will power real-world yield from booking
              fees, instant stylist payouts, and community-driven liquidity
              pools. No speculation, no inflation—just real economic value from
              the beauty economy.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-background-primary rounded-full text-caption text-text-secondary">
                Yield from bookings
              </span>
              <span className="px-3 py-1 bg-background-primary rounded-full text-caption text-text-secondary">
                Instant payouts
              </span>
              <span className="px-3 py-1 bg-background-primary rounded-full text-caption text-text-secondary">
                Stokvel pools
              </span>
              <span className="px-3 py-1 bg-background-primary rounded-full text-caption text-text-secondary">
                Equipment financing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Your DeFi Summary (Placeholder) */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <h3 className="text-body font-semibold text-text-primary mb-4">
          Your DeFi Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <p className="text-2xl font-bold text-text-primary">$0.00</p>
            <p className="text-caption text-text-tertiary">Total Staked</p>
          </div>
          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <p className="text-2xl font-bold text-text-primary">$0.00</p>
            <p className="text-caption text-text-tertiary">Total Yield</p>
          </div>
          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <p className="text-2xl font-bold text-text-primary">0%</p>
            <p className="text-caption text-text-tertiary">Avg APY</p>
          </div>
          <div className="text-center p-4 bg-background-secondary rounded-lg">
            <p className="text-2xl font-bold text-text-primary">—</p>
            <p className="text-caption text-text-tertiary">Referrer Tier</p>
          </div>
        </div>
      </div>

      {/* Available Pools */}
      <div>
        <h3 className="text-body font-semibold text-text-primary mb-4">
          Available Pools
        </h3>
        <div className="space-y-4">
          {pools.map((pool) => {
            const Icon = pool.icon;
            return (
              <div
                key={pool.id}
                className="bg-background-primary rounded-card shadow-vlossom p-6 opacity-75"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    <Icon className="h-6 w-6 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-body font-semibold text-text-primary">
                        {pool.name}
                      </h4>
                      <span className="px-2 py-0.5 bg-brand-rose/10 text-brand-rose text-xs rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-caption text-text-tertiary mb-3">
                      {pool.description}
                    </p>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {pool.apy}
                        </p>
                        <p className="text-caption text-text-tertiary">
                          Est. APY
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {pool.tvl}
                        </p>
                        <p className="text-caption text-text-tertiary">TVL</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" disabled className="shrink-0">
                    Stake
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Tier Progress */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <h3 className="text-body font-semibold text-text-primary mb-2">
          Referral Tier Progress
        </h3>
        <p className="text-caption text-text-tertiary mb-4">
          Top referrers unlock the ability to create community pools and earn
          captain rewards.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-background-tertiary rounded-full text-caption font-medium">
                3
              </span>
              <span className="text-sm text-text-secondary">
                Tier 3 (Top 30%)
              </span>
            </div>
            <span className="text-caption text-text-tertiary">
              Access micro-pools
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-background-tertiary rounded-full text-caption font-medium">
                2
              </span>
              <span className="text-sm text-text-secondary">
                Tier 2 (Top 15%)
              </span>
            </div>
            <span className="text-caption text-text-tertiary">
              Access larger pools
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center bg-brand-rose/10 rounded-full text-caption font-medium text-brand-rose">
                1
              </span>
              <span className="text-sm text-text-primary font-medium">
                Tier 1 (Top 5%)
              </span>
            </div>
            <span className="text-caption text-brand-rose">
              Create community pools
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border-default">
          <p className="text-caption text-text-tertiary">
            Your current position: <strong>Not ranked yet</strong>
          </p>
          <p className="text-caption text-text-tertiary mt-1">
            Refer users to start climbing the leaderboard.
          </p>
        </div>
      </div>

      {/* Learn More CTA */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6 text-center">
        <h3 className="text-body font-semibold text-text-primary mb-2">
          Want to learn more about Vlossom DeFi?
        </h3>
        <p className="text-caption text-text-tertiary mb-4">
          Our DeFi layer is designed to power the real beauty economy—not
          speculation.
        </p>
        <Button variant="outline" disabled>
          Read the Whitepaper <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
