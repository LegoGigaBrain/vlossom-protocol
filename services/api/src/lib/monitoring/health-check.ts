/**
 * Health Check Service (F5.3)
 * Provides health status for API and dependencies
 */

import { PrismaClient } from "@prisma/client";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckResult {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: CheckResult;
    blockchain: CheckResult;
    paymaster?: CheckResult;
  };
}

export interface CheckResult {
  status: "ok" | "error";
  latencyMs?: number;
  message?: string;
}

// Track server start time
const startTime = Date.now();

/**
 * Run all health checks
 */
export async function runHealthChecks(
  prisma: PrismaClient,
  config?: {
    paymasterAddress?: string;
  }
): Promise<HealthCheckResult> {
  const checks = await Promise.all([
    checkDatabase(prisma),
    checkBlockchain(),
    config?.paymasterAddress ? checkPaymaster(config.paymasterAddress) : null,
  ]);

  const [database, blockchain, paymaster] = checks;

  // Determine overall status
  const allChecks = [database, blockchain, paymaster].filter(Boolean) as CheckResult[];
  const hasError = allChecks.some((c) => c.status === "error");
  const status: HealthStatus = hasError ? "degraded" : "healthy";

  return {
    status,
    version: process.env.npm_package_version || "1.3.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks: {
      database,
      blockchain,
      ...(paymaster && { paymaster }),
    },
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(prisma: PrismaClient): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Simple query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed",
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check blockchain connectivity
 */
async function checkBlockchain(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const blockNumber = await client.getBlockNumber();
    return {
      status: "ok",
      latencyMs: Date.now() - start,
      message: `Block #${blockNumber}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Blockchain connection failed",
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check paymaster balance
 */
async function checkPaymaster(paymasterAddress: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const balance = await client.getBalance({
      address: paymasterAddress as `0x${string}`,
    });

    // Check if balance is above threshold (0.01 ETH)
    const threshold = BigInt(10000000000000000); // 0.01 ETH in wei
    if (balance < threshold) {
      return {
        status: "error",
        message: "Paymaster balance low",
        latencyMs: Date.now() - start,
      };
    }

    return {
      status: "ok",
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Paymaster check failed",
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Create Express route handler for health check
 */
export function createHealthCheckHandler(
  prisma: PrismaClient,
  config?: { paymasterAddress?: string }
) {
  return async (_req: unknown, res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } }) => {
    try {
      const health = await runHealthChecks(prisma, config);
      const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        version: process.env.npm_package_version || "1.3.0",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: "error", message: "Health check failed" },
          blockchain: { status: "error", message: "Health check failed" },
        },
      });
    }
  };
}

/**
 * Readiness check - is the service ready to accept traffic?
 */
export async function isReady(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Liveness check - is the service running?
 */
export function isAlive(): boolean {
  return true;
}
