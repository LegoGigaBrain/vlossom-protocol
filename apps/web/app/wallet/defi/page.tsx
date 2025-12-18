/**
 * Wallet DeFi Page - Liquidity pools and yield management
 * V4.0: Full DeFi integration with real data
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";

// ============================================================================
// Types (matching SDK types)
// ============================================================================

interface PoolInfo {
  id: string;
  name: string;
  tier: string;
  isGenesis: boolean;
  totalDeposits: string;
  currentAPY: string;
  cap: string | null;
  depositorCount: number;
}

interface UserDeposit {
  id: string;
  poolId: string;
  poolName: string;
  depositAmount: string;
  currentValue: string;
  pendingYield: string;
}

interface TierInfo {
  referralPercentile: number;
  tier: string | null;
  canCreatePool: boolean;
  poolCapLimit: string | null;
  poolCreationFee: string;
}

interface GlobalStats {
  totalTVL: string;
  totalPools: number;
  totalDepositors: number;
  avgAPY: string;
}

// ============================================================================
// API Helpers
// ============================================================================

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
  const token = typeof window !== "undefined" ? localStorage.getItem("vlossom_token") : null;

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data.data;
}

// ============================================================================
// Skeleton Components
// ============================================================================

function StatCardSkeleton() {
  return (
    <div className="text-center p-4 bg-background-secondary rounded-lg animate-pulse">
      <div className="flex justify-center mb-2">
        <div className="h-5 w-5 bg-background-tertiary rounded" />
      </div>
      <div className="h-8 w-16 bg-background-tertiary rounded mx-auto mb-1" />
      <div className="h-4 w-20 bg-background-tertiary rounded mx-auto" />
    </div>
  );
}

function PoolCardSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-background-tertiary">
          <div className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-5 w-32 bg-background-tertiary rounded" />
          <div className="flex gap-6">
            <div className="space-y-1">
              <div className="h-6 w-16 bg-background-tertiary rounded" />
              <div className="h-3 w-8 bg-background-tertiary rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-6 w-20 bg-background-tertiary rounded" />
              <div className="h-3 w-8 bg-background-tertiary rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-5 w-8 bg-background-tertiary rounded" />
              <div className="h-3 w-16 bg-background-tertiary rounded" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="h-8 w-24 bg-background-tertiary rounded-button" />
        </div>
      </div>
    </div>
  );
}

function GlobalStatSkeleton() {
  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-4 animate-pulse">
      <div className="h-3 w-16 bg-background-tertiary rounded mb-2" />
      <div className="h-6 w-20 bg-background-tertiary rounded" />
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function StatCard({
  label,
  value,
  subValue,
  iconName,
}: {
  label: string;
  value: string;
  subValue?: string;
  iconName?: IconName;
}) {
  return (
    <div className="text-center p-4 bg-background-secondary rounded-lg transition-all duration-medium hover:bg-background-tertiary">
      {iconName && (
        <div className="flex justify-center mb-2">
          <Icon name={iconName} size="sm" className="text-text-tertiary" />
        </div>
      )}
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-caption text-text-tertiary">{label}</p>
      {subValue && <p className="text-xs text-text-tertiary mt-1">{subValue}</p>}
    </div>
  );
}

function PoolCard({
  pool,
  userDeposit,
  onDeposit,
  onWithdraw,
}: {
  pool: PoolInfo;
  userDeposit?: UserDeposit;
  onDeposit: (poolId: string) => void;
  onWithdraw: (poolId: string) => void;
}) {
  const poolIconName: IconName = pool.isGenesis ? "wallet" : "profile";
  const hasDeposit = userDeposit && parseFloat(userDeposit.depositAmount) > 0;

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6 transition-all duration-medium hover:shadow-elevated">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg transition-colors duration-fast ${
            pool.isGenesis
              ? "bg-brand-rose/10"
              : "bg-background-tertiary"
          }`}
        >
          <Icon
            name={poolIconName}
            size="md"
            className={pool.isGenesis ? "text-brand-rose" : "text-text-secondary"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-body font-semibold text-text-primary">
              {pool.name}
            </h4>
            {pool.isGenesis && (
              <span className="px-2 py-0.5 bg-brand-rose/10 text-brand-rose text-xs rounded-full flex items-center gap-1">
                <Icon name="star" size="xs" /> Genesis
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 mt-3">
            <div>
              <p className="text-lg font-bold text-brand-rose">
                {pool.currentAPY}%
              </p>
              <p className="text-caption text-text-tertiary">APY</p>
            </div>
            <div>
              <p className="text-lg font-medium text-text-primary">
                ${pool.totalDeposits}
              </p>
              <p className="text-caption text-text-tertiary">TVL</p>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {pool.depositorCount}
              </p>
              <p className="text-caption text-text-tertiary">Depositors</p>
            </div>
            {pool.cap && (
              <div>
                <p className="text-sm font-medium text-text-primary">
                  ${pool.cap}
                </p>
                <p className="text-caption text-text-tertiary">Cap</p>
              </div>
            )}
          </div>

          {hasDeposit && (
            <div className="mt-4 p-3 bg-background-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-text-tertiary">Your Position</p>
                  <p className="text-body font-semibold text-text-primary">
                    ${userDeposit.currentValue}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-text-tertiary">Pending Yield</p>
                  <p className="text-body font-semibold text-status-success">
                    +${userDeposit.pendingYield}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onDeposit(pool.id)}
          >
            <Icon name="send" size="sm" className="mr-1" /> Deposit
          </Button>
          {hasDeposit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWithdraw(pool.id)}
            >
              <Icon name="receive" size="sm" className="mr-1" /> Withdraw
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TierProgress({ tierInfo }: { tierInfo: TierInfo | null }) {
  const tiers = [
    { level: 3, name: "Tier 3 (Top 30%)", cutoff: 30, benefit: "Create $20k pools" },
    { level: 2, name: "Tier 2 (Top 15%)", cutoff: 15, benefit: "Create $100k pools" },
    { level: 1, name: "Tier 1 (Top 5%)", cutoff: 5, benefit: "Unlimited pools" },
  ];

  const currentTierLevel = tierInfo?.tier
    ? parseInt(tierInfo.tier.split("_")[1] || "0")
    : 0;

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6 transition-all duration-medium hover:shadow-elevated">
      <h3 className="text-body font-semibold text-text-primary mb-2">
        Referral Tier Progress
      </h3>
      <p className="text-caption text-text-tertiary mb-4">
        Top referrers unlock the ability to create community pools.
      </p>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const isActive = currentTierLevel > 0 && currentTierLevel <= tier.level;
          const isCurrentTier = currentTierLevel === tier.level;

          return (
            <div key={tier.level} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-caption font-medium ${
                    isActive
                      ? "bg-brand-rose/10 text-brand-rose"
                      : "bg-background-tertiary text-text-secondary"
                  }`}
                >
                  {tier.level}
                </span>
                <span
                  className={`text-sm ${
                    isActive ? "text-text-primary font-medium" : "text-text-secondary"
                  }`}
                >
                  {tier.name}
                </span>
                {isCurrentTier && (
                  <span className="px-2 py-0.5 bg-brand-rose text-white text-xs rounded-full">
                    You
                  </span>
                )}
              </div>
              <span
                className={`text-caption ${
                  isActive ? "text-brand-rose" : "text-text-tertiary"
                }`}
              >
                {tier.benefit}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border-default">
        {tierInfo ? (
          <>
            <p className="text-caption text-text-tertiary">
              Your percentile:{" "}
              <strong className="text-text-primary">
                Top {tierInfo.referralPercentile.toFixed(1)}%
              </strong>
            </p>
            {tierInfo.canCreatePool && (
              <p className="text-caption text-status-success mt-1">
                You can create community pools!
              </p>
            )}
          </>
        ) : (
          <p className="text-caption text-text-tertiary">
            Refer users to start climbing the leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Dialogs
// ============================================================================

function DepositDialog({
  open,
  onClose,
  poolId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  poolId: string | null;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeposit = async () => {
    if (!poolId || !amount) return;

    setLoading(true);
    try {
      await fetchAPI("/liquidity/deposit", {
        method: "POST",
        body: JSON.stringify({ poolId, amount }),
      });

      toast({
        title: "Deposit Successful",
        description: `Deposited $${amount} USDC`,
      });
      onSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
          <DialogDescription>
            Enter the amount of USDC to deposit into this pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDeposit} disabled={loading || !amount}>
            {loading && <Icon name="loading" size="sm" className="mr-2 animate-spin" />}
            Deposit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({
  open,
  onClose,
  poolId,
  deposit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  poolId: string | null;
  deposit: UserDeposit | null;
  onSuccess: () => void;
}) {
  const [shares, setShares] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleWithdraw = async () => {
    if (!poolId || !shares) return;

    setLoading(true);
    try {
      const result = await fetchAPI<{ amount: string }>("/liquidity/withdraw", {
        method: "POST",
        body: JSON.stringify({ poolId, shares }),
      });

      toast({
        title: "Withdrawal Successful",
        description: `Withdrew $${result.amount} USDC`,
      });
      onSuccess();
      onClose();
      setShares("");
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
          <DialogDescription>
            Enter the amount of shares to withdraw.
          </DialogDescription>
        </DialogHeader>

        {deposit && (
          <div className="p-3 bg-background-secondary rounded-lg">
            <p className="text-caption text-text-tertiary">Current Position</p>
            <p className="text-body font-semibold text-text-primary">
              ${deposit.currentValue}
            </p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="shares">Shares to Withdraw</Label>
            <Input
              id="shares"
              type="number"
              placeholder="0.000000000000000000"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              step="0.000000000000000001"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleWithdraw} disabled={loading || !shares}>
            {loading && <Icon name="loading" size="sm" className="mr-2 animate-spin" />}
            Withdraw
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function WalletDeFiPage() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [deposits, setDeposits] = useState<UserDeposit[]>([]);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog state
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [poolsRes, depositsRes, tierRes, statsRes] = await Promise.all([
        fetchAPI<{ pools: PoolInfo[] }>("/liquidity/pools"),
        fetchAPI<{ deposits: UserDeposit[] }>("/liquidity/deposits").catch(() => ({
          deposits: [],
        })),
        fetchAPI<TierInfo>("/liquidity/tier").catch(() => null),
        fetchAPI<{ stats: GlobalStats }>("/liquidity/stats"),
      ]);

      setPools(poolsRes.pools || []);
      setDeposits(depositsRes.deposits || []);
      setTierInfo(tierRes);
      setStats(statsRes.stats || null);
    } catch (error) {
      toast({
        title: "Failed to load DeFi data",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeposit = (poolId: string) => {
    setSelectedPoolId(poolId);
    setDepositDialogOpen(true);
  };

  const handleWithdraw = (poolId: string) => {
    setSelectedPoolId(poolId);
    setWithdrawDialogOpen(true);
  };

  const handleClaimAll = async () => {
    try {
      const result = await fetchAPI<{ totalClaimed: string }>(
        "/liquidity/yield/claim-all",
        { method: "POST" }
      );

      toast({
        title: "Yield Claimed",
        description: `Claimed $${result.totalClaimed} USDC`,
      });
      loadData(false);
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    }
  };

  // Calculate user totals
  const totalDeposited = deposits.reduce(
    (sum, d) => sum + parseFloat(d.depositAmount || "0"),
    0
  );
  const totalValue = deposits.reduce(
    (sum, d) => sum + parseFloat(d.currentValue || "0"),
    0
  );
  const totalPendingYield = deposits.reduce(
    (sum, d) => sum + parseFloat(d.pendingYield || "0"),
    0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-16 bg-background-tertiary rounded animate-pulse" />
            <div className="h-4 w-48 bg-background-tertiary rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-background-tertiary rounded-button animate-pulse" />
        </div>

        {/* Portfolio skeleton */}
        <div className="bg-background-primary rounded-card shadow-vlossom p-6">
          <div className="h-5 w-28 bg-background-tertiary rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>

        {/* Global stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlobalStatSkeleton />
          <GlobalStatSkeleton />
          <GlobalStatSkeleton />
          <GlobalStatSkeleton />
        </div>

        {/* Pools skeleton */}
        <div>
          <div className="h-5 w-32 bg-background-tertiary rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            <PoolCardSkeleton />
            <PoolCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">DeFi</h2>
          <p className="text-caption text-text-tertiary">
            Earn yield on your USDC in liquidity pools
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(false)}
          disabled={refreshing}
        >
          <Icon
            name="refresh"
            size="sm"
            className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Your DeFi Summary */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-body font-semibold text-text-primary">
            Your Portfolio
          </h3>
          {totalPendingYield > 0 && (
            <Button variant="primary" size="sm" onClick={handleClaimAll}>
              <Icon name="sparkle" size="sm" className="mr-2" /> Claim All Yield
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Deposited"
            value={`$${totalDeposited.toFixed(2)}`}
            iconName="send"
          />
          <StatCard
            label="Current Value"
            value={`$${totalValue.toFixed(2)}`}
            iconName="growing"
          />
          <StatCard
            label="Pending Yield"
            value={`$${totalPendingYield.toFixed(2)}`}
            subValue={totalPendingYield > 0 ? "Ready to claim!" : undefined}
            iconName="sparkle"
          />
          <StatCard
            label="Your Tier"
            value={tierInfo?.tier || "—"}
            subValue={
              tierInfo
                ? `Top ${tierInfo.referralPercentile.toFixed(0)}%`
                : "No referrals"
            }
            iconName="star"
          />
        </div>
      </div>

      {/* Global Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background-primary rounded-card shadow-vlossom p-4 transition-all duration-medium hover:shadow-elevated">
            <p className="text-caption text-text-tertiary">Total TVL</p>
            <p className="text-lg font-bold text-text-primary">${stats.totalTVL}</p>
          </div>
          <div className="bg-background-primary rounded-card shadow-vlossom p-4 transition-all duration-medium hover:shadow-elevated">
            <p className="text-caption text-text-tertiary">Avg APY</p>
            <p className="text-lg font-bold text-brand-rose">{stats.avgAPY}%</p>
          </div>
          <div className="bg-background-primary rounded-card shadow-vlossom p-4 transition-all duration-medium hover:shadow-elevated">
            <p className="text-caption text-text-tertiary">Active Pools</p>
            <p className="text-lg font-bold text-text-primary">{stats.totalPools}</p>
          </div>
          <div className="bg-background-primary rounded-card shadow-vlossom p-4 transition-all duration-medium hover:shadow-elevated">
            <p className="text-caption text-text-tertiary">Depositors</p>
            <p className="text-lg font-bold text-text-primary">{stats.totalDepositors}</p>
          </div>
        </div>
      )}

      {/* Available Pools */}
      <div>
        <h3 className="text-body font-semibold text-text-primary mb-4">
          Liquidity Pools
        </h3>
        {pools.length === 0 ? (
          <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
            <Icon name="wallet" size="2xl" className="mx-auto mb-4 text-text-tertiary" />
            <p className="text-text-secondary">No pools available yet.</p>
            <p className="text-caption text-text-tertiary mt-2">
              Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => {
              const userDeposit = deposits.find((d) => d.poolId === pool.id);
              return (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  userDeposit={userDeposit}
                  onDeposit={handleDeposit}
                  onWithdraw={handleWithdraw}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Referral Tier Progress */}
      <TierProgress tierInfo={tierInfo} />

      {/* Dialogs */}
      <DepositDialog
        open={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
        poolId={selectedPoolId}
        onSuccess={() => loadData(false)}
      />
      <WithdrawDialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        poolId={selectedPoolId}
        deposit={deposits.find((d) => d.poolId === selectedPoolId) || null}
        onSuccess={() => loadData(false)}
      />
    </div>
  );
}
