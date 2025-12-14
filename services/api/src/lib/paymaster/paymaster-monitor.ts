/**
 * Paymaster Monitor Service (F5.1)
 * Tracks gas sponsorship and provides monitoring data
 */

import { PrismaClient } from "@prisma/client";
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import type {
  PaymasterStats,
  PaymasterTransaction,
  GasUsageDataPoint,
  AlertTriggerResult,
} from "./types";

export class PaymasterMonitor {
  private prisma: PrismaClient;
  private paymasterAddress: `0x${string}`;
  private publicClient;

  constructor(prisma: PrismaClient, paymasterAddress: string) {
    this.prisma = prisma;
    this.paymasterAddress = paymasterAddress as `0x${string}`;
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
  }

  /**
   * Get current paymaster balance
   */
  async getBalance(): Promise<{ wei: bigint; eth: number }> {
    const balance = await this.publicClient.getBalance({
      address: this.paymasterAddress,
    });
    return {
      wei: balance,
      eth: parseFloat(formatEther(balance)),
    };
  }

  /**
   * Get comprehensive paymaster stats
   */
  async getStats(): Promise<PaymasterStats> {
    const [balance, totalStats, last24hStats, uniqueUsers] = await Promise.all([
      this.getBalance(),
      this.getTotalStats(),
      this.getLast24hStats(),
      this.getUniqueUserStats(),
    ]);

    const successRate =
      totalStats.total > 0
        ? (totalStats.successful / totalStats.total) * 100
        : 0;

    return {
      currentBalanceWei: balance.wei,
      currentBalanceEth: balance.eth,
      totalTransactions: totalStats.total,
      successfulTransactions: totalStats.successful,
      failedTransactions: totalStats.failed,
      successRate,
      totalGasSponsored: totalStats.totalGas,
      totalCostWei: totalStats.totalCost,
      totalCostEth: parseFloat(formatEther(totalStats.totalCost)),
      averageGasPerTx:
        totalStats.total > 0
          ? totalStats.totalGas / BigInt(totalStats.total)
          : BigInt(0),
      averageCostPerTx:
        totalStats.total > 0
          ? totalStats.totalCost / BigInt(totalStats.total)
          : BigInt(0),
      transactionsLast24h: last24hStats.count,
      costLast24hWei: last24hStats.cost,
      costLast24hEth: parseFloat(formatEther(last24hStats.cost)),
      uniqueUsers: uniqueUsers.total,
      uniqueUsersLast24h: uniqueUsers.last24h,
    };
  }

  /**
   * Get total transaction stats
   */
  private async getTotalStats() {
    const [total, successful, failed, gasStats] = await Promise.all([
      this.prisma.paymasterTransaction.count(),
      this.prisma.paymasterTransaction.count({ where: { status: "SUCCESS" } }),
      this.prisma.paymasterTransaction.count({ where: { status: "FAILED" } }),
      this.prisma.paymasterTransaction.aggregate({
        _sum: {
          gasUsed: true,
          totalCost: true,
        },
        where: { status: "SUCCESS" },
      }),
    ]);

    return {
      total,
      successful,
      failed,
      totalGas: gasStats._sum.gasUsed ?? BigInt(0),
      totalCost: gasStats._sum.totalCost ?? BigInt(0),
    };
  }

  /**
   * Get last 24 hours stats
   */
  private async getLast24hStats() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [count, costStats] = await Promise.all([
      this.prisma.paymasterTransaction.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
      this.prisma.paymasterTransaction.aggregate({
        _sum: { totalCost: true },
        where: {
          createdAt: { gte: oneDayAgo },
          status: "SUCCESS",
        },
      }),
    ]);

    return {
      count,
      cost: costStats._sum.totalCost ?? BigInt(0),
    };
  }

  /**
   * Get unique user stats
   */
  private async getUniqueUserStats() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalResult, last24hResult] = await Promise.all([
      this.prisma.paymasterTransaction.findMany({
        select: { sender: true },
        distinct: ["sender"],
      }),
      this.prisma.paymasterTransaction.findMany({
        select: { sender: true },
        distinct: ["sender"],
        where: { createdAt: { gte: oneDayAgo } },
      }),
    ]);

    return {
      total: totalResult.length,
      last24h: last24hResult.length,
    };
  }

  /**
   * Get paginated transaction history
   */
  async getTransactions(options: {
    page?: number;
    pageSize?: number;
    status?: "PENDING" | "SUCCESS" | "FAILED";
    sender?: string;
  }): Promise<{
    items: PaymasterTransaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (options.status) where.status = options.status;
    if (options.sender) where.sender = options.sender;

    const [items, total] = await Promise.all([
      this.prisma.paymasterTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.paymasterTransaction.count({ where }),
    ]);

    return {
      items: items.map((tx) => ({
        id: tx.id,
        userOpHash: tx.userOpHash,
        sender: tx.sender,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        totalCost: tx.totalCost,
        txHash: tx.txHash,
        status: tx.status,
        error: tx.error,
        createdAt: tx.createdAt,
        confirmedAt: tx.confirmedAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get gas usage over time for charts
   */
  async getGasUsageHistory(days: number = 30): Promise<GasUsageDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Try to get from daily stats first
    const dailyStats = await this.prisma.paymasterDailyStats.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: "asc" },
    });

    if (dailyStats.length > 0) {
      return dailyStats.map((stat) => ({
        date: stat.date.toISOString().split("T")[0],
        totalTransactions: stat.totalTxCount,
        totalGasUsed: stat.totalGasUsed,
        totalCostWei: stat.totalCostWei,
        successRate:
          stat.totalTxCount > 0
            ? (stat.successTxCount / stat.totalTxCount) * 100
            : 0,
        uniqueUsers: stat.uniqueUsers,
      }));
    }

    // Fallback: Calculate from raw transactions
    const transactions = await this.prisma.paymasterTransaction.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const grouped = new Map<string, GasUsageDataPoint>();

    for (const tx of transactions) {
      const date = tx.createdAt.toISOString().split("T")[0];
      const existing = grouped.get(date) || {
        date,
        totalTransactions: 0,
        totalGasUsed: BigInt(0),
        totalCostWei: BigInt(0),
        successRate: 0,
        uniqueUsers: 0,
      };

      existing.totalTransactions++;
      if (tx.status === "SUCCESS") {
        existing.totalGasUsed += tx.gasUsed;
        existing.totalCostWei += tx.totalCost;
      }

      grouped.set(date, existing);
    }

    return Array.from(grouped.values());
  }

  /**
   * Record a new sponsored transaction
   */
  async recordTransaction(data: {
    userOpHash: string;
    sender: string;
    gasUsed: bigint;
    gasPrice: bigint;
    txHash?: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    error?: string;
  }): Promise<PaymasterTransaction> {
    const tx = await this.prisma.paymasterTransaction.create({
      data: {
        userOpHash: data.userOpHash,
        sender: data.sender,
        gasUsed: data.gasUsed,
        gasPrice: data.gasPrice,
        totalCost: data.gasUsed * data.gasPrice,
        txHash: data.txHash,
        status: data.status,
        error: data.error,
        confirmedAt: data.status !== "PENDING" ? new Date() : null,
      },
    });

    return {
      id: tx.id,
      userOpHash: tx.userOpHash,
      sender: tx.sender,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      totalCost: tx.totalCost,
      txHash: tx.txHash,
      status: tx.status,
      error: tx.error,
      createdAt: tx.createdAt,
      confirmedAt: tx.confirmedAt,
    };
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    userOpHash: string,
    status: "SUCCESS" | "FAILED",
    txHash?: string,
    error?: string
  ): Promise<void> {
    await this.prisma.paymasterTransaction.update({
      where: { userOpHash },
      data: {
        status,
        txHash,
        error,
        confirmedAt: new Date(),
      },
    });
  }

  /**
   * Check and trigger alerts
   */
  async checkAlerts(): Promise<AlertTriggerResult[]> {
    const alerts = await this.prisma.paymasterAlert.findMany({
      where: { isActive: true },
    });

    const results: AlertTriggerResult[] = [];
    const stats = await this.getStats();

    for (const alert of alerts) {
      let currentValue: number;
      let triggered = false;
      let message = "";

      switch (alert.type) {
        case "LOW_BALANCE":
          currentValue = stats.currentBalanceEth;
          triggered = currentValue < alert.threshold;
          message = `Paymaster balance (${currentValue.toFixed(4)} ETH) is below threshold (${alert.threshold} ETH)`;
          break;

        case "HIGH_USAGE":
          // High usage = more than threshold ETH spent in last 24h
          currentValue = stats.costLast24hEth;
          triggered = currentValue > alert.threshold;
          message = `Gas cost in last 24h (${currentValue.toFixed(4)} ETH) exceeds threshold (${alert.threshold} ETH)`;
          break;

        case "ERROR_RATE":
          // Error rate as percentage
          currentValue = 100 - stats.successRate;
          triggered = currentValue > alert.threshold;
          message = `Error rate (${currentValue.toFixed(1)}%) exceeds threshold (${alert.threshold}%)`;
          break;

        default:
          continue;
      }

      if (triggered) {
        // Update last triggered
        await this.prisma.paymasterAlert.update({
          where: { id: alert.id },
          data: {
            lastTriggered: new Date(),
            lastValue: currentValue,
          },
        });

        results.push({
          triggered: true,
          alertType: alert.type,
          currentValue,
          threshold: alert.threshold,
          message,
        });
      }
    }

    return results;
  }

  /**
   * Update daily stats (call this periodically via cron)
   */
  async updateDailyStats(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [txStats, uniqueUsers] = await Promise.all([
      this.prisma.paymasterTransaction.aggregate({
        _count: true,
        _sum: {
          gasUsed: true,
          totalCost: true,
        },
        _avg: {
          gasPrice: true,
        },
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.paymasterTransaction.findMany({
        select: { sender: true },
        distinct: ["sender"],
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    const successCount = await this.prisma.paymasterTransaction.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: "SUCCESS",
      },
    });

    const failedCount = await this.prisma.paymasterTransaction.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: "FAILED",
      },
    });

    await this.prisma.paymasterDailyStats.upsert({
      where: { date: today },
      create: {
        date: today,
        totalTxCount: txStats._count,
        successTxCount: successCount,
        failedTxCount: failedCount,
        totalGasUsed: txStats._sum.gasUsed ?? BigInt(0),
        totalCostWei: txStats._sum.totalCost ?? BigInt(0),
        avgGasPrice: BigInt(Math.floor(txStats._avg.gasPrice ?? 0)),
        uniqueUsers: uniqueUsers.length,
      },
      update: {
        totalTxCount: txStats._count,
        successTxCount: successCount,
        failedTxCount: failedCount,
        totalGasUsed: txStats._sum.gasUsed ?? BigInt(0),
        totalCostWei: txStats._sum.totalCost ?? BigInt(0),
        avgGasPrice: BigInt(Math.floor(txStats._avg.gasPrice ?? 0)),
        uniqueUsers: uniqueUsers.length,
      },
    });
  }
}
