"use client";

import { isTestnet, getCurrentChain } from "@/lib/wagmi-config";
import { useAccount } from "wagmi";

interface NetworkBadgeProps {
  className?: string;
  showWhenMainnet?: boolean;
}

/**
 * Network Badge Component
 *
 * Displays current blockchain network status.
 * By default, only shows when on testnet to warn users.
 * Can be configured to always show with showWhenMainnet prop.
 */
export function NetworkBadge({ className = "", showWhenMainnet = false }: NetworkBadgeProps) {
  const { isConnected } = useAccount();
  const testnet = isTestnet();
  const chain = getCurrentChain();

  // Don't show if not connected
  if (!isConnected) {
    return null;
  }

  // Don't show on mainnet unless explicitly requested
  if (!testnet && !showWhenMainnet) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        testnet
          ? "bg-amber-100 text-amber-800 border border-amber-200"
          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
      } ${className}`}
      title={`Connected to ${chain.name}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          testnet ? "bg-amber-500" : "bg-emerald-500"
        } animate-pulse`}
      />
      <span>{testnet ? "Testnet" : "Mainnet"}</span>
    </div>
  );
}

/**
 * Compact network indicator for headers/navbars
 */
export function NetworkIndicator({ className = "" }: { className?: string }) {
  const { isConnected } = useAccount();
  const testnet = isTestnet();

  if (!isConnected || !testnet) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 ${className}`}
      title="Connected to Base Sepolia Testnet"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Testnet
    </div>
  );
}

export default NetworkBadge;
