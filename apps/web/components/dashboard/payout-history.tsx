/**
 * Payout History Component
 * Reference: docs/specs/stylist-dashboard/F3.6-earnings-dashboard.md
 */

"use client";

import { formatPrice, formatDate } from "../../lib/utils";
import { Button } from "../ui/button";
import type { PayoutHistoryItem } from "../../lib/dashboard-client";

interface PayoutHistoryProps {
  payouts: PayoutHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  isLoading?: boolean;
  onLoadMore: () => void;
}

function PayoutItem({ payout }: { payout: PayoutHistoryItem }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border-default last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-caption text-text-tertiary">{formatDate(payout.date)}</p>
        <p className="text-body text-text-primary truncate">
          {payout.serviceName} - {payout.customerName}
        </p>
      </div>
      <span className="text-body font-semibold text-status-success ml-4">
        + {formatPrice(payout.amount)}
      </span>
    </div>
  );
}

function PayoutItemSkeleton() {
  return (
    <div className="p-4 border-b border-border-default last:border-0">
      <div className="animate-pulse flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-background-secondary rounded w-24"></div>
          <div className="h-4 bg-background-secondary rounded w-48"></div>
        </div>
        <div className="h-4 bg-background-secondary rounded w-20 ml-4"></div>
      </div>
    </div>
  );
}

export function PayoutHistory({
  payouts,
  pagination,
  isLoading,
  onLoadMore,
}: PayoutHistoryProps) {
  const showLoadMore = pagination.hasMore && !isLoading;

  return (
    <div className="bg-background-primary rounded-card shadow-vlossom">
      <div className="p-4 border-b border-border-default">
        <h3 className="text-h4 text-text-primary">Payout History</h3>
      </div>

      {isLoading && payouts.length === 0 ? (
        <div>
          <PayoutItemSkeleton />
          <PayoutItemSkeleton />
          <PayoutItemSkeleton />
          <PayoutItemSkeleton />
          <PayoutItemSkeleton />
        </div>
      ) : payouts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-2">💸</div>
          <p className="text-body text-text-secondary">No payouts yet</p>
          <p className="text-caption text-text-tertiary mt-1">
            Complete your first booking to start earning
          </p>
        </div>
      ) : (
        <div>
          {payouts.map((payout) => (
            <PayoutItem key={payout.id} payout={payout} />
          ))}

          {isLoading && (
            <>
              <PayoutItemSkeleton />
              <PayoutItemSkeleton />
            </>
          )}

          {showLoadMore && (
            <div className="p-4 text-center border-t border-border-default">
              <Button variant="ghost" onClick={onLoadMore}>
                Load More
              </Button>
            </div>
          )}

          {!pagination.hasMore && payouts.length > 0 && (
            <div className="p-4 text-center border-t border-border-default">
              <p className="text-caption text-text-tertiary">
                Showing all {pagination.total} payouts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
