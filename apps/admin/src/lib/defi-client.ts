/**
 * DeFi API Client (V7.0.0)
 *
 * Admin DeFi configuration and monitoring.
 */

import { adminFetch } from "./admin-client";

export interface PoolTierStats {
  tier: string;
  count: number;
  tvl: string;
}

export interface DefiStats {
  totalTVL: string;
  totalPools: number;
  activePools: number;
  totalDepositors: number;
  totalYieldPaid: string;
  avgAPY: string;
  poolsByTier: PoolTierStats[];
}

export interface APYParams {
  baseRate: number;
  slope1: number;
  slope2: number;
  optimalUtilization: number;
}

export interface FeeSplit {
  treasuryPercent: number;
  lpYieldPercent: number;
  bufferPercent: number;
}

export interface DefiConfig {
  apyParams: APYParams;
  feeSplit: FeeSplit;
}

/**
 * Fetch DeFi statistics
 */
export async function fetchDefiStats(): Promise<{ stats: DefiStats }> {
  const response = await adminFetch("/api/v1/admin/defi/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch DeFi stats");
  }

  const data = await response.json();
  return { stats: data.data.stats };
}

/**
 * Fetch DeFi configuration
 */
export async function fetchDefiConfig(): Promise<DefiConfig> {
  const response = await adminFetch("/api/v1/admin/defi/config");

  if (!response.ok) {
    throw new Error("Failed to fetch DeFi config");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update APY parameters
 */
export async function updateAPYParams(params: APYParams): Promise<void> {
  const response = await adminFetch("/api/v1/admin/defi/apy-params", {
    method: "PUT",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update APY params");
  }
}

/**
 * Update fee split configuration
 */
export async function updateFeeSplit(split: FeeSplit): Promise<void> {
  const response = await adminFetch("/api/v1/admin/defi/fee-split", {
    method: "PUT",
    body: JSON.stringify(split),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update fee split");
  }
}

/**
 * Pause a specific pool
 */
export async function pausePool(poolId: string): Promise<void> {
  const response = await adminFetch(`/api/v1/admin/defi/pools/${poolId}/pause`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to pause pool");
  }
}

/**
 * Unpause a specific pool
 */
export async function unpausePool(poolId: string): Promise<void> {
  const response = await adminFetch(`/api/v1/admin/defi/pools/${poolId}/unpause`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to unpause pool");
  }
}

/**
 * Emergency pause all pools
 */
export async function emergencyPauseAll(): Promise<{ poolsPaused: number }> {
  const response = await adminFetch("/api/v1/admin/defi/emergency/pause-all", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to pause all pools");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Emergency unpause all pools
 */
export async function emergencyUnpauseAll(): Promise<{ poolsUnpaused: number }> {
  const response = await adminFetch("/api/v1/admin/defi/emergency/unpause-all", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to unpause all pools");
  }

  const data = await response.json();
  return data.data;
}
