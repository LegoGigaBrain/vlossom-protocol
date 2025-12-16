# Vlossom SDK

> Purpose: Official TypeScript SDK for interacting with Vlossom Protocol APIs. Provides type-safe client methods for authentication, bookings, wallet operations, and stylist discovery.

## Canonical References
- [Doc 13: Smart Contract Architecture](../../docs/vlossom/13-smart-contract-architecture.md)
- [Doc 14: Backend Architecture and APIs](../../docs/vlossom/14-backend-architecture-and-apis.md)

## Quick Start

```typescript
import { createVlossom } from '@vlossom/sdk';

const vlossom = createVlossom({
  baseUrl: 'https://api.vlossom.com/api/v1',
});

// Authenticate
await vlossom.auth.login({ email: 'user@example.com', password: 'secret' });

// Get wallet balance
const balance = await vlossom.wallet.getBalance();

// Create a booking
const booking = await vlossom.bookings.create({
  stylistId: 'stylist-uuid',
  serviceIds: ['service-uuid'],
  scheduledAt: '2024-01-15T10:00:00Z',
});
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Public exports, `createVlossom()` factory |
| `src/client.ts` | Core HTTP client with retry logic |
| `src/auth.ts` | Authentication module (login/signup/logout) |
| `src/bookings.ts` | Booking CRUD and workflow actions |
| `src/wallet.ts` | Wallet balance, transfers, faucet |
| `src/stylists.ts` | Stylist search, profiles, services |
| `src/version.ts` | SDK version constant |

## Architecture

### Client Configuration

```typescript
interface VlossomClientConfig {
  baseUrl?: string;    // Default: http://localhost:3002/api/v1
  token?: string;      // Pre-set auth token (optional)
  timeout?: number;    // Request timeout in ms (default: 30000)
  maxRetries?: number; // Retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
}
```

### Module Pattern

Each module is a factory function that receives the client instance:

```typescript
// Internal pattern
export function createAuthModule(client: VlossomClient): AuthModule {
  return {
    async login(params) { /* uses client.post() */ },
    async signup(params) { /* uses client.post() */ },
    // ...
  };
}
```

### Automatic Retry

The client automatically retries on:
- Server errors (5xx)
- Timeout (408)
- Rate limit (429)
- Network errors

Uses exponential backoff: 1s → 2s → 4s

## Modules

### Auth Module

| Method | Description |
|--------|-------------|
| `login(params)` | Authenticate with email/password |
| `signup(params)` | Create new account |
| `logout()` | Clear session and token |
| `getCurrentUser()` | Get authenticated user info |
| `isAuthenticated()` | Check if token is set |

### Bookings Module

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new booking |
| `get(bookingId)` | Get booking details |
| `list(params)` | List bookings with filters |
| `approve(bookingId)` | Stylist approves booking |
| `decline(bookingId, reason)` | Stylist declines booking |
| `pay(bookingId)` | Customer pays for booking |
| `start(bookingId)` | Stylist starts service |
| `complete(bookingId)` | Stylist marks service complete |
| `confirm(bookingId)` | Customer confirms completion |
| `cancel(bookingId, reason)` | Cancel booking |

**Booking Status Flow:**
```
PENDING_STYLIST_APPROVAL → AWAITING_PAYMENT → CONFIRMED → IN_PROGRESS
    → AWAITING_CUSTOMER_CONFIRMATION → SETTLED
```

### Wallet Module

| Method | Description |
|--------|-------------|
| `getWallet()` | Get wallet info and balance |
| `getBalance()` | Get USDC balance |
| `getAddress()` | Get wallet address and deployment status |
| `getTransactions(page, limit)` | Get transaction history |
| `transfer(params)` | Send USDC to another address |
| `claimFaucet()` | Claim testnet tokens |

**Transaction Types:**
- `SEND` / `RECEIVE` — Direct transfers
- `ESCROW_DEPOSIT` / `ESCROW_RELEASE` / `ESCROW_REFUND` — Booking escrow
- `FAUCET` — Testnet claims

### Stylists Module

| Method | Description |
|--------|-------------|
| `search(params)` | Search stylists by location/specialty |
| `getProfile(userId)` | Get stylist profile with services |
| `getServices(stylistId)` | Get stylist's services list |
| `getAvailability(stylistId, date)` | Get available time slots |
| `getDashboardStats()` | Get stylist dashboard stats |
| `updateProfile(data)` | Update own stylist profile |
| `addService(data)` | Add a new service |
| `updateService(serviceId, data)` | Update existing service |

## Type Exports

The SDK exports all TypeScript interfaces for type-safe usage:

```typescript
// Client types
import type { VlossomClientConfig, ApiResponse, ApiError } from '@vlossom/sdk';

// Auth types
import type { User, LoginParams, SignupParams, AuthResponse } from '@vlossom/sdk';

// Booking types
import type { Booking, BookingWithDetails, BookingStatus, CreateBookingParams } from '@vlossom/sdk';

// Wallet types
import type { WalletInfo, WalletBalance, Transaction, TransferParams } from '@vlossom/sdk';

// Stylist types
import type { StylistProfile, StylistService, SearchStylistsParams } from '@vlossom/sdk';

// Also re-exports all types from @vlossom/types
```

## Error Handling

```typescript
import { VlossomApiError } from '@vlossom/sdk';

try {
  await vlossom.bookings.create(params);
} catch (error) {
  if (error instanceof VlossomApiError) {
    console.error(`Error ${error.code}: ${error.message}`);
    console.error(`Status: ${error.status}`);
    console.error(`Request ID: ${error.requestId}`);
  }
}
```

## Dependencies

- **Internal:** `@vlossom/types` — Shared type definitions
- **Runtime:** Native `fetch` API (no external HTTP libraries)

## Local Conventions

- All methods return typed responses (no `any`)
- Factory pattern for module creation
- Client manages auth token internally
- Consistent error wrapping via `VlossomApiError`
- Pagination uses `{ page, limit, total, hasMore }` pattern

## Development

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Gotchas

- **Token persistence:** The SDK doesn't persist tokens. Store `client.getToken()` and pass to new instances.
- **Gasless transactions:** Wallet transfers are gasless via Account Abstraction — users don't need ETH for gas.
- **Base Sepolia:** Currently configured for testnet. Update `baseUrl` for mainnet.
- **USDC decimals:** All amounts are in USDC with 6 decimals. Use `amountFormatted` for display.
