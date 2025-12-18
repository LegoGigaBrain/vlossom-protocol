/**
 * Wallet History Page - Full transaction history with filters and export
 */

"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/icons";
import { TransactionList } from "../../../components/wallet/transaction-list";
import { useVlossomWallet } from "../../../hooks/use-vlossom-wallet";
import { Button } from "../../../components/ui/button";
import type { WalletTransaction } from "../../../lib/wallet-client";

type DateFilter = "all" | "today" | "week" | "month" | "custom";

export default function WalletHistoryPage() {
  const { transactions, isLoading, refetch } = useVlossomWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [filteredTransactions, setFilteredTransactions] = useState<
    WalletTransaction[]
  >([]);

  // Filter transactions based on search and date
  useEffect(() => {
    let filtered = [...transactions];

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(
        (tx) => new Date(tx.createdAt) >= startDate
      );
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.type.toLowerCase().includes(search) ||
          tx.counterparty?.toLowerCase().includes(search) ||
          tx.memo?.toLowerCase().includes(search) ||
          tx.txHash?.toLowerCase().includes(search)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, dateFilter, searchTerm]);

  // Export transactions to CSV
  const handleExport = () => {
    const headers = ["Date", "Type", "Amount (USDC)", "Status", "Address", "Memo", "Tx Hash"];
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.createdAt).toISOString(),
      tx.type,
      (parseFloat(tx.amount) / 1000000).toFixed(6),
      tx.status,
      tx.counterparty || "",
      tx.memo || "",
      tx.txHash || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vlossom-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = {
    totalIn: filteredTransactions
      .filter((tx) =>
        ["TRANSFER_IN", "FAUCET_CLAIM", "ESCROW_REFUND"].includes(tx.type)
      )
      .reduce((sum, tx) => sum + parseFloat(tx.amount) / 1000000, 0),
    totalOut: filteredTransactions
      .filter((tx) => ["TRANSFER_OUT", "ESCROW_LOCK"].includes(tx.type))
      .reduce((sum, tx) => sum + parseFloat(tx.amount) / 1000000, 0),
    count: filteredTransactions.length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 text-text-primary">Transaction History</h2>
          <p className="text-caption text-text-tertiary">
            {stats.count} transaction{stats.count !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <Icon
              name="refresh"
              size="sm"
              className={`mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
          >
            <Icon name="download" size="sm" className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background-primary rounded-card shadow-vlossom p-4 text-center">
          <p className="text-caption text-text-tertiary mb-1">Total In</p>
          <p className="text-lg font-semibold text-green-600">
            +${stats.totalIn.toFixed(2)}
          </p>
        </div>
        <div className="bg-background-primary rounded-card shadow-vlossom p-4 text-center">
          <p className="text-caption text-text-tertiary mb-1">Total Out</p>
          <p className="text-lg font-semibold text-red-600">
            -${stats.totalOut.toFixed(2)}
          </p>
        </div>
        <div className="bg-background-primary rounded-card shadow-vlossom p-4 text-center">
          <p className="text-caption text-text-tertiary mb-1">Net</p>
          <p
            className={`text-lg font-semibold ${
              stats.totalIn - stats.totalOut >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {stats.totalIn - stats.totalOut >= 0 ? "+" : ""}$
            {(stats.totalIn - stats.totalOut).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Icon name="search" size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by type, address, memo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-border-default rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-rose/20"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Icon name="calendar" size="sm" className="text-text-tertiary" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="px-3 py-2 bg-background-secondary border border-border-default rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-rose/20"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading && transactions.length === 0 ? (
        <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
          <Icon name="refresh" size="lg" className="text-text-tertiary mx-auto mb-4 animate-spin" />
          <p className="text-body text-text-secondary">
            Loading transactions...
          </p>
        </div>
      ) : (
        <TransactionList
          transactions={filteredTransactions}
          hasMore={false}
          isLoading={isLoading}
        />
      )}

      {/* Empty State for Filtered */}
      {!isLoading &&
        filteredTransactions.length === 0 &&
        transactions.length > 0 && (
          <div className="bg-background-primary rounded-card shadow-vlossom p-8 text-center">
            <Icon name="filter" size="xl" className="text-text-tertiary mx-auto mb-4" />
            <p className="text-body text-text-secondary mb-2">
              No transactions match your filters
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setDateFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

      {/* Transaction Details Note */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-4">
        <p className="text-caption text-text-tertiary">
          <strong>Note:</strong> Transaction history is stored on-chain and may
          take a few moments to sync. For detailed transaction information,
          click on any transaction to view it on the block explorer.
        </p>
      </div>
    </div>
  );
}
