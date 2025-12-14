/**
 * Balance Card Component
 * Displays wallet balance with fiat-first display and currency toggle
 */

"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/wallet-client";
import type { WalletBalance } from "../../lib/wallet-client";

type Currency = "ZAR" | "USD" | "USDC";

interface BalanceCardProps {
  balance: WalletBalance;
  isLoading?: boolean;
}

export function BalanceCard({ balance, isLoading }: BalanceCardProps) {
  const [currency, setCurrency] = useState<Currency>("ZAR");

  if (isLoading) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-background-secondary rounded w-24 mb-4"></div>
          <div className="h-12 bg-background-secondary rounded w-48 mb-4"></div>
          <div className="h-8 bg-background-secondary rounded w-32"></div>
        </div>
      </div>
    );
  }

  const amount = balance.fiatValue; // USD value (1:1 with USDC)
  const displayAmount = formatCurrency(amount, currency);

  const currencies: Currency[] = ["ZAR", "USD", "USDC"];

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      {/* Balance Label */}
      <p className="text-caption text-text-secondary mb-2">Total Balance</p>

      {/* Balance Amount */}
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-h1 text-brand-rose">{displayAmount}</h2>
      </div>

      {/* Currency Toggle */}
      <div className="flex gap-2">
        {currencies.map((curr) => (
          <button
            key={curr}
            onClick={() => setCurrency(curr)}
            className={`px-3 py-1 rounded-full text-caption transition-colors ${
              currency === curr
                ? "bg-brand-rose text-background-primary"
                : "bg-background-secondary text-text-secondary hover:bg-background-tertiary"
            }`}
          >
            {curr}
          </button>
        ))}
      </div>

      {/* Secondary Info */}
      <div className="mt-4 pt-4 border-t border-background-secondary">
        <div className="flex justify-between items-center">
          <span className="text-caption text-text-tertiary">USDC Balance</span>
          <span className="text-caption text-text-secondary font-medium">
            {balance.usdcFormatted.toFixed(2)} USDC
          </span>
        </div>
      </div>
    </div>
  );
}
