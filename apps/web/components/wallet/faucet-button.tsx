"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { claimFaucet } from "@/lib/wallet-client";
import { isTestnet, isArbitrum, CHAIN_CONFIG } from "@/lib/wagmi-config";

interface FaucetButtonProps {
  onSuccess?: () => void;
  className?: string;
}

// External faucet links
const EXTERNAL_FAUCETS = {
  base_sepolia: {
    eth: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
    usdc: "https://faucet.circle.com/",
  },
  arbitrum_sepolia: {
    eth: "https://www.alchemy.com/faucets/arbitrum-sepolia",
    usdc: "https://faucet.circle.com/",
  },
};

/**
 * Faucet Button Component
 *
 * A button that claims testnet USDC from the platform faucet.
 * Only visible on testnet networks.
 * Shows countdown timer when rate-limited.
 */
export function FaucetButton({ onSuccess, className = "" }: FaucetButtonProps) {
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextClaimAt, setNextClaimAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (!nextClaimAt) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextClaimAt.getTime() - now.getTime();

      if (diff <= 0) {
        setNextClaimAt(null);
        setCountdown(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextClaimAt]);

  // Only render on testnet
  if (!isTestnet()) {
    return null;
  }

  const handleClaim = async () => {
    setClaiming(true);
    setMessage(null);
    setError(null);

    try {
      const result = await claimFaucet();

      if (result.success) {
        setMessage(result.message || "Successfully claimed 1000 USDC!");
        onSuccess?.();
      } else {
        setError(result.error || "Failed to claim faucet");
        if (result.nextClaimAt) {
          setNextClaimAt(new Date(result.nextClaimAt));
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }

    setClaiming(false);
  };

  const isDisabled = claiming || !!countdown;

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        onClick={handleClaim}
        disabled={isDisabled}
        className="w-full bg-brand-rose text-background-primary hover:bg-brand-rose/90"
      >
        {claiming ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Claiming...
          </span>
        ) : countdown ? (
          <span className="flex items-center gap-2">
            <ClockIcon />
            Next claim in {countdown}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <FaucetIcon />
            Claim 1000 Test USDC
          </span>
        )}
      </Button>

      {/* Success Message */}
      {message && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckIcon />
            {message}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact faucet indicator with external links
 */
export function FaucetCard({ onSuccess }: { onSuccess?: () => void }) {
  const faucetLinks = isArbitrum()
    ? EXTERNAL_FAUCETS.arbitrum_sepolia
    : EXTERNAL_FAUCETS.base_sepolia;

  if (!isTestnet()) {
    return null;
  }

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      <div className="flex items-center gap-2 mb-2">
        <FaucetIcon className="w-5 h-5 text-brand-rose" />
        <h3 className="text-subtitle font-semibold">Testnet Faucet</h3>
      </div>

      <p className="text-body text-text-tertiary mb-4">
        Get free test tokens to try out the platform. Rate limited to 1 claim per 24 hours.
      </p>

      <FaucetButton onSuccess={onSuccess} />

      {/* External Faucet Links */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-caption text-text-secondary mb-2">Need more testnet tokens?</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={faucetLinks.eth}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon className="w-3 h-3" />
            Get ETH (for gas)
          </a>
          <span className="text-text-tertiary">•</span>
          <a
            href={faucetLinks.usdc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon className="w-3 h-3" />
            Circle USDC Faucet
          </a>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Connected to {CHAIN_CONFIG.chainName}
        </p>
      </div>
    </div>
  );
}

// Icons
function FaucetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function LoadingSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default FaucetButton;
