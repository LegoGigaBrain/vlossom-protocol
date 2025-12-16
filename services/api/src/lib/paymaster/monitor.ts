/**
 * Paymaster Monitor (M-6)
 *
 * Monitors paymaster balance and transaction statistics.
 * Provides real-time alerts when balance drops below thresholds.
 *
 * Uses existing Prisma models:
 * - PaymasterTransaction (with PaymasterTxStatus enum)
 * - PaymasterDailyStats
 */

import { PrismaClient, PaymasterTxStatus } from '@prisma/client';
import { createPublicClient, http, formatEther, type Address } from 'viem';
import { CHAIN, RPC_URL } from '../wallet/chain-client';
import logger from '../logger';

// Paymaster statistics interface
export interface PaymasterStats {
  currentBalanceWei: bigint;
  currentBalanceEth: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  totalGasSponsored: bigint;
  totalCostWei: bigint;
  totalCostEth: string;
  averageCostPerTx: bigint;
  transactionsLast24h: number;
  costLast24hWei: bigint;
  costLast24hEth: string;
  uniqueUsers: number;
  uniqueUsersLast24h: number;
}

// Transaction query options
export interface TransactionQueryOptions {
  page?: number;
  pageSize?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  sender?: string;
}

// Gas usage history point
export interface GasUsagePoint {
  date: string;
  totalTransactions: number;
  totalGasUsed: bigint;
  totalCostWei: bigint;
  successRate: number;
  uniqueUsers: number;
}

// Alert trigger
export interface AlertTrigger {
  type: 'LOW_BALANCE' | 'HIGH_USAGE' | 'ERROR_RATE';
  message: string;
  currentValue: number | string;
  threshold: number | string;
  severity: 'WARNING' | 'CRITICAL';
}

/**
 * PaymasterMonitor class for tracking and analyzing paymaster operations
 */
export class PaymasterMonitor {
  private prisma: PrismaClient;
  private paymasterAddress: Address;
  private publicClient;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date | null = null;

  // Alert thresholds (configurable)
  private warningBalanceEth = 0.1; // 0.1 ETH
  private criticalBalanceEth = 0.05; // 0.05 ETH
  // TODO: implement HIGH_USAGE alert with 80% of daily budget threshold
  private errorRateThreshold = 0.1; // 10% error rate

  constructor(prisma: PrismaClient, paymasterAddress: string) {
    this.prisma = prisma;
    this.paymasterAddress = paymasterAddress as Address;
    this.publicClient = createPublicClient({
      chain: CHAIN,
      transport: http(RPC_URL),
    });
  }

  /**
   * Get current paymaster balance
   */
  async getBalance(): Promise<{ wei: bigint; eth: string }> {
    const balance = await this.publicClient.getBalance({
      address: this.paymasterAddress,
    });
    return {
      wei: balance,
      eth: formatEther(balance),
    };
  }

  /**
   * Get comprehensive paymaster statistics
   */
  async getStats(): Promise<PaymasterStats> {
    const balance = await this.getBalance();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all-time transaction stats
    const allTimeStats = await this.prisma.paymasterTransaction.aggregate({
      _count: { _all: true },
      _sum: { gasUsed: true, totalCost: true },
    });

    // Get success/failure counts using the enum
    const statusCounts = await this.prisma.paymasterTransaction.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const successCount = statusCounts.find(s => s.status === PaymasterTxStatus.SUCCESS)?._count._all || 0;
    const failedCount = statusCounts.find(s => s.status === PaymasterTxStatus.FAILED)?._count._all || 0;
    const totalCount = allTimeStats._count._all || 0;

    // Get last 24h stats
    const last24hStats = await this.prisma.paymasterTransaction.aggregate({
      where: { createdAt: { gte: yesterday } },
      _count: { _all: true },
      _sum: { totalCost: true },
    });

    // Get unique users
    const uniqueUsersAll = await this.prisma.paymasterTransaction.findMany({
      select: { sender: true },
      distinct: ['sender'],
    });

    const uniqueUsers24h = await this.prisma.paymasterTransaction.findMany({
      where: { createdAt: { gte: yesterday } },
      select: { sender: true },
      distinct: ['sender'],
    });

    const totalGasSponsored = BigInt(allTimeStats._sum.gasUsed?.toString() || '0');
    const totalCostWei = BigInt(allTimeStats._sum.totalCost?.toString() || '0');
    const costLast24hWei = BigInt(last24hStats._sum.totalCost?.toString() || '0');

    return {
      currentBalanceWei: balance.wei,
      currentBalanceEth: balance.eth,
      totalTransactions: totalCount,
      successfulTransactions: successCount,
      failedTransactions: failedCount,
      successRate: totalCount > 0 ? successCount / totalCount : 1,
      totalGasSponsored,
      totalCostWei,
      totalCostEth: formatEther(totalCostWei),
      averageCostPerTx: totalCount > 0 ? totalCostWei / BigInt(totalCount) : 0n,
      transactionsLast24h: last24hStats._count._all || 0,
      costLast24hWei,
      costLast24hEth: formatEther(costLast24hWei),
      uniqueUsers: uniqueUsersAll.length,
      uniqueUsersLast24h: uniqueUsers24h.length,
    };
  }

  /**
   * Get paginated transaction history
   */
  async getTransactions(options: TransactionQueryOptions = {}) {
    const { page = 1, pageSize = 20, status, sender } = options;

    const where: Record<string, unknown> = {};
    if (status) {
      // Map string status to enum
      where.status = PaymasterTxStatus[status as keyof typeof PaymasterTxStatus];
    }
    if (sender) where.sender = sender;

    const [items, total] = await Promise.all([
      this.prisma.paymasterTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.paymasterTransaction.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get gas usage history for charting
   * Uses PaymasterDailyStats model with correct field names
   */
  async getGasUsageHistory(days: number = 30): Promise<GasUsagePoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await this.prisma.paymasterDailyStats.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    return dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      totalTransactions: stat.totalTxCount,
      totalGasUsed: stat.totalGasUsed,
      totalCostWei: stat.totalCostWei,
      successRate: stat.totalTxCount > 0 ? stat.successTxCount / stat.totalTxCount : 1,
      uniqueUsers: stat.uniqueUsers,
    }));
  }

  /**
   * Check for alert conditions
   */
  async checkAlerts(): Promise<AlertTrigger[]> {
    const alerts: AlertTrigger[] = [];
    const stats = await this.getStats();

    // Check balance thresholds
    const balanceEth = parseFloat(stats.currentBalanceEth);

    if (balanceEth <= this.criticalBalanceEth) {
      alerts.push({
        type: 'LOW_BALANCE',
        message: `Paymaster balance critically low: ${stats.currentBalanceEth} ETH`,
        currentValue: stats.currentBalanceEth,
        threshold: this.criticalBalanceEth.toString(),
        severity: 'CRITICAL',
      });
    } else if (balanceEth <= this.warningBalanceEth) {
      alerts.push({
        type: 'LOW_BALANCE',
        message: `Paymaster balance low: ${stats.currentBalanceEth} ETH`,
        currentValue: stats.currentBalanceEth,
        threshold: this.warningBalanceEth.toString(),
        severity: 'WARNING',
      });
    }

    // Check error rate
    if (stats.totalTransactions > 10 && (1 - stats.successRate) >= this.errorRateThreshold) {
      alerts.push({
        type: 'ERROR_RATE',
        message: `High error rate: ${((1 - stats.successRate) * 100).toFixed(1)}%`,
        currentValue: (1 - stats.successRate) * 100,
        threshold: this.errorRateThreshold * 100,
        severity: 'WARNING',
      });
    }

    this.lastCheckTime = new Date();
    return alerts;
  }

  /**
   * Update daily statistics (called by cron job)
   * Uses PaymasterDailyStats model with correct field names
   */
  async updateDailyStats(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's transactions
    const todayTxs = await this.prisma.paymasterTransaction.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const successTxs = todayTxs.filter(tx => tx.status === PaymasterTxStatus.SUCCESS);
    const uniqueSenders = new Set(todayTxs.map(tx => tx.sender));

    const totalGasUsed = todayTxs.reduce(
      (sum, tx) => sum + BigInt(tx.gasUsed.toString()),
      0n
    );
    const totalCostWei = todayTxs.reduce(
      (sum, tx) => sum + BigInt(tx.totalCost.toString()),
      0n
    );
    const avgGasPrice = todayTxs.length > 0
      ? todayTxs.reduce((sum, tx) => sum + BigInt(tx.gasPrice.toString()), 0n) / BigInt(todayTxs.length)
      : 0n;

    // Upsert daily stats using correct field names
    await this.prisma.paymasterDailyStats.upsert({
      where: { date: today },
      create: {
        date: today,
        totalTxCount: todayTxs.length,
        successTxCount: successTxs.length,
        failedTxCount: todayTxs.length - successTxs.length,
        totalGasUsed,
        totalCostWei,
        avgGasPrice,
        uniqueUsers: uniqueSenders.size,
      },
      update: {
        totalTxCount: todayTxs.length,
        successTxCount: successTxs.length,
        failedTxCount: todayTxs.length - successTxs.length,
        totalGasUsed,
        totalCostWei,
        avgGasPrice,
        uniqueUsers: uniqueSenders.size,
      },
    });

    logger.info('Daily paymaster stats updated', {
      date: today.toISOString(),
      transactions: todayTxs.length,
      uniqueUsers: uniqueSenders.size,
    });
  }

  /**
   * Start periodic balance monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const alerts = await this.checkAlerts();
        if (alerts.length > 0) {
          logger.warn('Paymaster alerts triggered', { alerts });
          // Alerts will be handled by BalanceAlertService
        }
      } catch (error) {
        logger.error('Error checking paymaster alerts', { error });
      }
    }, intervalMs);

    logger.info('Paymaster monitoring started', { intervalMs });
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Paymaster monitoring stopped');
    }
  }

  /**
   * Set alert thresholds
   */
  setThresholds(options: {
    warningBalanceEth?: number;
    criticalBalanceEth?: number;
    highUsageThreshold?: number;
    errorRateThreshold?: number;
  }): void {
    if (options.warningBalanceEth !== undefined) {
      this.warningBalanceEth = options.warningBalanceEth;
    }
    if (options.criticalBalanceEth !== undefined) {
      this.criticalBalanceEth = options.criticalBalanceEth;
    }
    // TODO: implement HIGH_USAGE alert with highUsageThreshold option
    // if (options.highUsageThreshold !== undefined) {
    //   this.highUsageThreshold = options.highUsageThreshold;
    // }
    if (options.errorRateThreshold !== undefined) {
      this.errorRateThreshold = options.errorRateThreshold;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isMonitoring: boolean; lastCheck: Date | null } {
    return {
      isMonitoring: this.checkInterval !== null,
      lastCheck: this.lastCheckTime,
    };
  }
}
