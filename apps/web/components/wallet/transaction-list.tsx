"use client";

import { useState, useRef, useEffect } from "react";
import { formatUSDC, truncateAddress } from "../../lib/wallet-client";
import { WalletIllustration } from "../ui/illustrations";
import type { WalletTransaction } from "../../lib/wallet-client";

interface TransactionListProps {
  transactions: WalletTransaction[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

type TransactionFilter = "ALL" | "SEND" | "RECEIVE" | "FAUCET" | "BOOKINGS";

export function TransactionList({
  transactions,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionFilter>("ALL");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  // Check if filter buttons can scroll
  useEffect(() => {
    const checkScroll = () => {
      if (filterScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    const scrollContainer = filterScrollRef.current;
    if (scrollContainer) {
      checkScroll();
      scrollContainer.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    if (filter === "SEND") return tx.type === "TRANSFER_OUT";
    if (filter === "RECEIVE") return tx.type === "TRANSFER_IN";
    if (filter === "FAUCET") return tx.type === "FAUCET_CLAIM";
    if (filter === "BOOKINGS")
      return ["ESCROW_LOCK", "ESCROW_RELEASE", "ESCROW_REFUND"].includes(tx.type);
    return true;
  });

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "TRANSFER_OUT":
        return "Sent";
      case "TRANSFER_IN":
        return "Received";
      case "FAUCET_CLAIM":
        return "Faucet Claim";
      case "ESCROW_LOCK":
        return "Booking Payment";
      case "ESCROW_RELEASE":
        return "Booking Payout";
      case "ESCROW_REFUND":
        return "Booking Refund";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "TRANSFER_OUT":
        return "↗";
      case "TRANSFER_IN":
        return "↙";
      case "FAUCET_CLAIM":
        return "💧";
      case "ESCROW_LOCK":
        return "🔒";
      case "ESCROW_RELEASE":
        return "✓";
      case "ESCROW_REFUND":
        return "↩";
      default:
        return "•";
    }
  };

  const getAmountColor = (type: string): string => {
    if (type === "TRANSFER_IN" || type === "FAUCET_CLAIM" || type === "ESCROW_REFUND") {
      return "text-green-600 dark:text-green-400";
    }
    if (type === "TRANSFER_OUT" || type === "ESCROW_LOCK") {
      return "text-red-600 dark:text-red-400";
    }
    return "text-text-primary";
  };

  const getAmountPrefix = (type: string): string => {
    if (type === "TRANSFER_IN" || type === "FAUCET_CLAIM" || type === "ESCROW_REFUND") {
      return "+";
    }
    if (type === "TRANSFER_OUT" || type === "ESCROW_LOCK") {
      return "-";
    }
    return "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="text-caption px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="text-caption px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="text-caption px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
        <WalletIllustration className="w-24 h-24 mx-auto mb-4" />
        <p className="text-body text-text-secondary mb-2">No transactions yet</p>
        <p className="text-caption text-text-tertiary">
          Your transaction history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h2 text-text-primary">Transactions</h2>
        <p className="text-caption text-text-tertiary">{transactions.length} total</p>
      </div>

      {/* Filter Buttons with scroll indicators */}
      <div className="relative mb-4">
        {/* Left scroll indicator */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background-primary to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={filterScrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Filter transactions"
        >
          {(["ALL", "SEND", "RECEIVE", "FAUCET", "BOOKINGS"] as TransactionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              role="tab"
              aria-selected={filter === f}
              className={`text-caption px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-brand-rose text-background-primary"
                  : "bg-background-secondary text-text-secondary hover:bg-background-tertiary"
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Right scroll indicator */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background-primary to-transparent z-10 pointer-events-none" />
        )}
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="text-2xl">{getTypeIcon(tx.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-body text-text-primary font-medium">
                    {getTypeLabel(tx.type)}
                  </p>
                  {getStatusBadge(tx.status)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {tx.counterparty && (
                    <p className="text-caption text-text-tertiary font-mono">
                      {truncateAddress(tx.counterparty)}
                    </p>
                  )}
                  <p className="text-caption text-text-tertiary">{formatDate(tx.createdAt)}</p>
                </div>
                {tx.memo && <p className="text-caption text-text-tertiary mt-1">{tx.memo}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-body font-medium ${getAmountColor(tx.type)}`}>
                {getAmountPrefix(tx.type)}
                {formatUSDC(parseFloat(tx.amount) / 1000000)} USDC
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full mt-4 text-body text-brand-rose hover:underline disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}

      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <p className="text-center text-caption text-text-tertiary mt-4">
          No {filter.toLowerCase()} transactions
        </p>
      )}
    </div>
  );
}
