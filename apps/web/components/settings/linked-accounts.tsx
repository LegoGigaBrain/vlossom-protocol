/**
 * Linked Accounts Component
 * V3.2: Displays and manages linked authentication methods (Email, Ethereum wallets)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Button } from "../ui/button";
import { useSiwe } from "../../hooks/use-siwe";
import {
  getLinkedAccounts,
  unlinkAccount,
  type LinkedAccount,
} from "../../lib/auth-client";

interface LinkedAccountsProps {
  className?: string;
}

/**
 * Format an Ethereum address for display
 */
function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get provider icon/label
 */
function getProviderInfo(provider: string): { icon: string; label: string } {
  switch (provider) {
    case "ETHEREUM":
      return { icon: "🔗", label: "Ethereum Wallet" };
    case "EMAIL":
      return { icon: "📧", label: "Email" };
    default:
      return { icon: "🔐", label: provider };
  }
}

export function LinkedAccounts({ className = "" }: LinkedAccountsProps) {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const { address: connectedAddress, isConnected } = useAccount();
  const { linkCurrentWallet, status: siweStatus, error: siweError, reset: resetSiwe } = useSiwe();

  // Fetch linked accounts
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLinkedAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load linked accounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle unlinking an account
  const handleUnlink = async (accountId: string) => {
    // Don't allow unlinking the last account
    if (accounts.length <= 1) {
      setError("You must keep at least one authentication method");
      return;
    }

    try {
      setUnlinkingId(accountId);
      setError(null);
      await unlinkAccount(accountId);
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink account");
    } finally {
      setUnlinkingId(null);
    }
  };

  // Handle linking a new wallet
  const handleLinkWallet = async () => {
    resetSiwe();
    const result = await linkCurrentWallet();
    if (result) {
      await fetchAccounts();
    }
  };

  // Check if current wallet is already linked
  const isCurrentWalletLinked = connectedAddress
    ? accounts.some(
        (acc) =>
          acc.provider === "ETHEREUM" &&
          acc.identifier.toLowerCase() === connectedAddress.toLowerCase()
      )
    : false;

  if (isLoading) {
    return (
      <div className={`p-6 bg-background-primary rounded-card ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background-secondary rounded w-1/3" />
          <div className="h-16 bg-background-secondary rounded" />
          <div className="h-16 bg-background-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-background-primary rounded-card shadow-vlossom ${className}`}>
      <h2 className="text-h3 text-text-primary mb-4">Linked Accounts</h2>
      <p className="text-body-sm text-text-secondary mb-6">
        Manage the authentication methods linked to your account. You can sign in using any of these methods.
      </p>

      {/* Error display */}
      {(error || siweError) && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error rounded-input">
          <p className="text-sm text-status-error">{error || siweError}</p>
        </div>
      )}

      {/* Linked accounts list */}
      <div className="space-y-3 mb-6">
        {accounts.length === 0 ? (
          <p className="text-text-secondary text-center py-4">
            No authentication methods linked
          </p>
        ) : (
          accounts.map((account) => {
            const { icon, label } = getProviderInfo(account.provider);
            const isUnlinking = unlinkingId === account.id;

            return (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 bg-background-secondary rounded-input border border-border-subtle"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="font-medium text-text-primary">{label}</p>
                    <p className="text-sm text-text-secondary">
                      {account.provider === "ETHEREUM"
                        ? formatAddress(account.identifier)
                        : account.identifier}
                    </p>
                  </div>
                  {account.isPrimary && (
                    <span className="px-2 py-0.5 text-xs bg-brand-rose/10 text-brand-rose rounded-full">
                      Primary
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink(account.id)}
                  disabled={isUnlinking || accounts.length <= 1}
                  className="text-status-error hover:bg-status-error/10"
                >
                  {isUnlinking ? "Unlinking..." : "Unlink"}
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Link new wallet section */}
      {isConnected && !isCurrentWalletLinked && (
        <div className="pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Link Connected Wallet</p>
              <p className="text-sm text-text-secondary">
                {formatAddress(connectedAddress || "")}
              </p>
            </div>
            <Button
              onClick={handleLinkWallet}
              disabled={siweStatus !== "idle" && siweStatus !== "error" && siweStatus !== "success"}
            >
              {siweStatus === "connecting" && "Connecting..."}
              {siweStatus === "signing" && "Sign Message..."}
              {siweStatus === "verifying" && "Verifying..."}
              {(siweStatus === "idle" || siweStatus === "error" || siweStatus === "success") && "Link Wallet"}
            </Button>
          </div>
        </div>
      )}

      {/* Connect wallet prompt */}
      {!isConnected && (
        <div className="pt-4 border-t border-border-subtle">
          <p className="text-sm text-text-secondary text-center">
            Connect a wallet to link additional authentication methods
          </p>
        </div>
      )}

      {/* Already linked notice */}
      {isConnected && isCurrentWalletLinked && (
        <div className="pt-4 border-t border-border-subtle">
          <p className="text-sm text-text-secondary text-center">
            Your connected wallet is already linked to this account
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for sidebar/dropdown use
 */
export function LinkedAccountsCompact({ className = "" }: LinkedAccountsProps) {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLinkedAccounts()
      .then(setAccounts)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-background-secondary rounded w-24" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {accounts.map((account) => {
        const { icon } = getProviderInfo(account.provider);
        return (
          <span
            key={account.id}
            title={account.identifier}
            className="inline-flex items-center justify-center w-8 h-8 bg-background-secondary rounded-full"
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
