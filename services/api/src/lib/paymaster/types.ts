/**
 * Paymaster Monitoring Types (F5.1)
 */

export interface PaymasterStats {
  // Balance
  currentBalanceWei: bigint;
  currentBalanceEth: number;

  // Transaction counts
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;

  // Gas metrics
  totalGasSponsored: bigint;
  totalCostWei: bigint;
  totalCostEth: number;
  averageGasPerTx: bigint;
  averageCostPerTx: bigint;

  // Time-based
  transactionsLast24h: number;
  costLast24hWei: bigint;
  costLast24hEth: number;

  // Unique users
  uniqueUsers: number;
  uniqueUsersLast24h: number;
}

export interface PaymasterTransaction {
  id: string;
  userOpHash: string;
  sender: string;
  gasUsed: bigint;
  gasPrice: bigint;
  totalCost: bigint;
  txHash: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  error: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface GasUsageDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  totalTransactions: number;
  totalGasUsed: bigint;
  totalCostWei: bigint;
  successRate: number;
  uniqueUsers: number;
}

export interface AlertConfig {
  type: "LOW_BALANCE" | "HIGH_USAGE" | "ERROR_RATE";
  threshold: number;
  isActive: boolean;
  notifySlack: boolean;
  notifyEmail: boolean;
  emailRecipients?: string;
}

export interface Alert {
  id: string;
  type: "LOW_BALANCE" | "HIGH_USAGE" | "ERROR_RATE";
  threshold: number;
  isActive: boolean;
  lastTriggered: Date | null;
  lastValue: number | null;
  notifySlack: boolean;
  notifyEmail: boolean;
  emailRecipients: string | null;
}

export interface AlertTriggerResult {
  triggered: boolean;
  alertType: string;
  currentValue: number;
  threshold: number;
  message: string;
}
