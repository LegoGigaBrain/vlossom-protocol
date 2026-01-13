/**
 * @vlossom/sdk - Vlossom Protocol SDK
 *
 * Official SDK for interacting with Vlossom Protocol APIs.
 *
 * @example
 * ```typescript
 * import { createVlossom } from '@vlossom/sdk';
 *
 * const vlossom = createVlossom({
 *   baseUrl: 'https://api.vlossom.com/api/v1',
 * });
 *
 * // Authenticate
 * await vlossom.auth.login({ email: 'user@example.com', password: 'secret' });
 *
 * // Get wallet balance
 * const balance = await vlossom.wallet.getBalance();
 *
 * // Create a booking
 * const booking = await vlossom.bookings.create({
 *   stylistId: 'stylist-uuid',
 *   serviceIds: ['service-uuid'],
 *   scheduledAt: '2024-01-15T10:00:00Z',
 * });
 * ```
 */

export { version } from './version';

// Core client - import for local use
import { VlossomClient as VlossomClientClass } from './client';
export { VlossomClient, VlossomApiError } from './client';
export type { VlossomClientConfig, ApiResponse, ApiError } from './client';

// Auth module - import for local use
import { createAuthModule as createAuth } from './auth';
export { createAuthModule } from './auth';
export type { AuthModule, User, LoginParams, SignupParams, AuthResponse } from './auth';

// Bookings module - import for local use
import { createBookingsModule as createBookings } from './bookings';
export { createBookingsModule } from './bookings';
export type {
  BookingsModule,
  Booking,
  BookingWithDetails,
  BookingStatus,
  CreateBookingParams,
  ListBookingsParams,
  PaginatedBookings,
} from './bookings';

// Wallet module - import for local use
import { createWalletModule as createWallet } from './wallet';
export { createWalletModule } from './wallet';
export type {
  WalletModule,
  WalletInfo,
  WalletBalance,
  Transaction,
  TransferParams,
  TransferResult,
} from './wallet';

// Stylists module
import { createStylistsModule } from './stylists';
export { createStylistsModule };
export type {
  StylistsModule,
  StylistProfile,
  StylistService,
  StylistWithServices,
  SearchStylistsParams,
  DashboardStats,
} from './stylists';

// DeFi module
import { createDefiModule } from './defi';
export { createDefiModule };
export type {
  DefiModule,
  PoolTier,
  PoolStatus,
  PoolInfo,
  PoolDetails,
  UserDeposit,
  YieldSummary,
  YieldPosition,
  TierInfo,
  PoolStats,
  GlobalStats,
  CreatePoolParams,
  DepositResult,
  WithdrawResult,
  ClaimResult,
} from './defi';

// Re-export types for convenience
export * from '@vlossom/types';

/**
 * Vlossom SDK instance with all modules
 */
export interface Vlossom {
  /** Core HTTP client */
  client: import('./client').VlossomClient;
  /** Authentication module */
  auth: import('./auth').AuthModule;
  /** Bookings module */
  bookings: import('./bookings').BookingsModule;
  /** Wallet module */
  wallet: import('./wallet').WalletModule;
  /** Stylists module */
  stylists: import('./stylists').StylistsModule;
  /** DeFi liquidity module */
  defi: import('./defi').DefiModule;
}

/**
 * Create a Vlossom SDK instance with all modules
 *
 * @param config - Client configuration
 * @returns Vlossom SDK instance
 *
 * @example
 * ```typescript
 * const vlossom = createVlossom({
 *   baseUrl: 'https://api.vlossom.com/api/v1',
 *   token: 'jwt-token', // Optional: pre-authenticate
 * });
 * ```
 */
export function createVlossom(config?: import('./client').VlossomClientConfig): Vlossom {
  const client = new VlossomClientClass(config);

  return {
    client,
    auth: createAuth(client),
    bookings: createBookings(client),
    wallet: createWallet(client),
    stylists: createStylistsModule(client),
    defi: createDefiModule(client),
  };
}

// Default export
export default createVlossom;
