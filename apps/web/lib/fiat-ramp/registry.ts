/**
 * Fiat Ramp Provider Registry
 *
 * Manages multiple fiat on/off-ramp providers and selects
 * the best available provider for each user/transaction.
 */

import type {
  FiatRampAdapter,
  FiatRampProvider,
  FiatRampRegistry,
  ProviderAvailability,
} from "./types";
import { transakAdapter } from "./transak-adapter";
import { kotaniAdapter } from "./kotani-adapter";

/**
 * Provider priority order
 * Providers earlier in the list are preferred
 * - Kotani is prioritized for ZAR (South African) users
 * - Transak is the global fallback
 */
const PROVIDER_PRIORITY: FiatRampProvider[] = [
  "kotani",   // Best for ZAR and African currencies
  "transak",  // Global coverage
  "moonpay",  // Future: additional coverage
];

/**
 * Registered adapters
 */
const adapters: Map<FiatRampProvider, FiatRampAdapter> = new Map();

// Register Kotani adapter (Africa-focused - ZAR, KES, GHS, NGN, UGX)
adapters.set("kotani", kotaniAdapter);

// Register Transak adapter (Global coverage)
adapters.set("transak", transakAdapter);

// TODO: Register MoonPay adapter when implemented
// adapters.set("moonpay", moonpayAdapter);

/**
 * Fiat ramp registry implementation
 */
export const fiatRampRegistry: FiatRampRegistry = {
  getProviders(): FiatRampProvider[] {
    return Array.from(adapters.keys());
  },

  getAdapter(provider: FiatRampProvider): FiatRampAdapter | null {
    return adapters.get(provider) || null;
  },

  async getBestProvider(params) {
    const { preferredProvider, ...checkParams } = params;

    // If preferred provider is specified and available, use it
    if (preferredProvider) {
      const adapter = adapters.get(preferredProvider);
      if (adapter) {
        const availability = await adapter.checkAvailability(checkParams);
        if (availability.available) {
          return { provider: preferredProvider, availability };
        }
      }
    }

    // Otherwise, check providers in priority order
    for (const provider of PROVIDER_PRIORITY) {
      const adapter = adapters.get(provider);
      if (!adapter) continue;

      try {
        const availability = await adapter.checkAvailability(checkParams);
        if (availability.available) {
          return { provider, availability };
        }
      } catch (error) {
        console.warn(`Provider ${provider} availability check failed:`, error);
        continue;
      }
    }

    return null;
  },

  async checkAllProviders(params) {
    const results: ProviderAvailability[] = [];

    for (const [provider, adapter] of adapters) {
      try {
        const availability = await adapter.checkAvailability(params);
        results.push(availability);
      } catch (error) {
        console.warn(`Provider ${provider} availability check failed:`, error);
        results.push({
          provider,
          available: false,
          supportedFiatCurrencies: [],
          supportedCryptoCurrencies: [],
          supportedNetworks: [],
          minAmount: 0,
          maxAmount: 0,
          kycRequired: false,
          estimatedTime: "Unknown",
          message: `Provider unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return results;
  },
};

export default fiatRampRegistry;
