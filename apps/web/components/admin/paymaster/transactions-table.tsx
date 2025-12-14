"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  userOpHash: string;
  sender: string;
  gasUsed: string;
  gasPrice: string;
  totalCost: string;
  txHash: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  error: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

interface TransactionsTableProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

/**
 * Transactions Table Component (F5.1)
 * Displays sponsored transaction history
 */
export function TransactionsTable({
  transactions,
  isLoading,
  pagination,
  onPageChange,
}: TransactionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Transactions
          </h3>
        </div>
        <div className="p-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded mb-2 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Transactions
          </h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          No transactions yet
        </div>
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCost = (costWei: string) => {
    const eth = parseFloat(costWei) / 1e18;
    return `${eth.toFixed(6)} ETH`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Transactions
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gas Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tx Hash
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <>
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedRow(expandedRow === tx.id ? null : tx.id)
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusIcon status={tx.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">
                      {formatAddress(tx.sender)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCost(tx.totalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseInt(tx.gasUsed).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tx.txHash ? (
                      <a
                        href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatAddress(tx.txHash)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
                {expandedRow === tx.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">
                            UserOp Hash:
                          </span>
                          <p className="font-mono text-xs break-all">
                            {tx.userOpHash}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">
                            Full Sender:
                          </span>
                          <p className="font-mono text-xs break-all">
                            {tx.sender}
                          </p>
                        </div>
                        {tx.error && (
                          <div className="col-span-2">
                            <span className="font-medium text-red-500">
                              Error:
                            </span>
                            <p className="text-red-600">{tx.error}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} transactions
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
