/**
 * Fiat Ramp Module
 *
 * Multi-provider fiat on/off-ramp integration.
 *
 * Current providers:
 * - Transak (staging API key: 4a85d63b-0fd9-4c43-ad7b-e4fc69253d9c)
 *
 * Future providers:
 * - Kotani Pay (Africa-focused)
 * - MoonPay (global coverage)
 */

// Types
export type {
  FiatRampProvider,
  FiatRampType,
  FiatRampStatus,
  FiatRampConfig,
  FiatRampUserData,
  OnRampRequest,
  OffRampRequest,
  FiatRampQuote,
  FiatRampWidgetResponse,
  FiatRampTransaction,
  ProviderAvailability,
  FiatRampAdapter,
  FiatRampRegistry,
} from "./types";

// Adapters
export { transakAdapter } from "./transak-adapter";
export { kotaniAdapter } from "./kotani-adapter";

// Registry
export { fiatRampRegistry } from "./registry";

// Re-export registry as default
export { default as fiatRamp } from "./registry";
