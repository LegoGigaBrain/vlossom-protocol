"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import { ConnectWalletDialog } from "./connect-wallet-dialog";
import { isTestnet, CHAIN_CONFIG } from "@/lib/wagmi-config";

interface WalletButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

/**
 * Wallet Button Component
 *
 * A compact button for the header/navbar that:
 * - Shows "Connect Wallet" when disconnected
 * - Shows truncated address + balance when connected
 * - Opens ConnectWalletDialog on click
 */
export function WalletButton({
  className = "",
  variant = "outline",
  size = "default",
}: WalletButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className={`${className} ${isConnected ? "font-mono" : ""}`}
      >
        {isConnected && address ? (
          <span className="flex items-center gap-2">
            {/* Connection indicator */}
            <span
              className={`w-2 h-2 rounded-full ${
                isTestnet() ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {/* Address */}
            <span>{truncateAddress(address)}</span>
            {/* Balance (optional, hide on small screens) */}
            {balance && (
              <span className="hidden sm:inline text-text-secondary text-xs">
                ({parseFloat(balance.formatted).toFixed(3)} {balance.symbol})
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <WalletIcon className="w-4 h-4" />
            Connect Wallet
          </span>
        )}
      </Button>

      <ConnectWalletDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

/**
 * Compact wallet indicator for minimal UI
 */
export function WalletIndicator({ className = "" }: { className?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { address, isConnected } = useAccount();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-3)}`;
  };

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
          isConnected
            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        } ${className}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500" : "bg-gray-400"
          }`}
        />
        {isConnected && address ? truncateAddress(address) : "Connect"}
      </button>

      <ConnectWalletDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

/**
 * Wallet status with network info
 */
export function WalletStatus({ className = "" }: { className?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setDialogOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors ${className}`}
        >
          <WalletIcon className="w-5 h-5 text-text-secondary" />
          <span className="text-sm font-medium">Connect Wallet</span>
        </button>
        <ConnectWalletDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors ${className}`}
      >
        {/* Network indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isTestnet() ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <span className="text-xs text-text-secondary">
            {chain?.name || CHAIN_CONFIG.chainName}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-border" />

        {/* Address & Balance */}
        <div className="text-left">
          <div className="text-sm font-mono font-medium">
            {address && truncateAddress(address)}
          </div>
          {balance && (
            <div className="text-xs text-text-secondary">
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </div>
          )}
        </div>
      </button>

      <ConnectWalletDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

// Simple wallet icon
function WalletIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

export default WalletButton;
