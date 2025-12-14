# Vlossom API Service

Backend API service for Vlossom Protocol - beauty services marketplace with Account Abstraction wallet integration.

## Features

- **Booking lifecycle** - Complete booking flow from creation to settlement
- **AA Wallet integration** - Gasless ERC-4337 smart wallets with USDC
- **Escrow payments** - Secure fund locking and release via smart contracts
- **P2P transfers** - Direct wallet-to-wallet USDC transfers
- **Payment requests** - QR code-based payment flow
- **Fiat on/off-ramp** - MoonPay integration for USDC ↔ fiat conversion (plug-and-play)
- **Transaction history** - Paginated wallet transaction list with filters
- **Stylist discovery** - Location-based search with Haversine distance
- **State machine** - Validated booking status transitions
- **Audit trail** - Complete history of all booking changes

## Tech Stack

- **Runtime:** Node.js 20+ / TypeScript 5.3
- **Framework:** Express.js 4.18
- **Database:** PostgreSQL 14+ with Prisma ORM
- **Blockchain:** viem + Account Abstraction (ERC-4337)
- **Validation:** Zod schemas
- **Auth:** JWT Bearer tokens

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# From services/api directory
./setup.sh
```

The script will:
- Check prerequisites (Node.js, pnpm, PostgreSQL)
- Install dependencies
- Create .env file
- Generate Prisma client
- Run database migrations

### Option 2: Manual Setup

```bash
# 1. Install dependencies (from project root)
pnpm install

# 2. Copy environment template
cp .env.example .env

# 3. Update .env with your configuration:
#    - DATABASE_URL
#    - Contract addresses (after deployment)
#    - JWT_SECRET, INTERNAL_AUTH_SECRET
#    - RELAYER_PRIVATE_KEY

# 4. Generate Prisma client
pnpm db:generate

# 5. Run migrations
pnpm db:migrate
```

## Prerequisites

### Required
- Node.js 20+
- PostgreSQL 14+
- pnpm 8+

### For Full Wallet Integration
- Deployed smart contracts (Escrow, Factory, Paymaster)
- Base RPC access (Alchemy or Infura)
- Pimlico bundler API key (for gasless transactions)
- Relayer wallet with gas funds

## Environment Variables

See `.env.example` for complete reference. Key variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vlossom"

# Blockchain
CHAIN_ID=8453                          # 8453=Base, 84532=Base Sepolia, 31337=localhost
RPC_URL="https://mainnet.base.org"
BUNDLER_URL="https://api.pimlico.io/v2/base/rpc?apikey=..."

# Smart Contracts (populated after deployment)
FACTORY_ADDRESS=""
PAYMASTER_ADDRESS=""
ESCROW_ADDRESS=""
USDC_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

# Wallet
RELAYER_PRIVATE_KEY=""  # Generate with: cast wallet new

# Auth
JWT_SECRET="your-secret-here"
INTERNAL_AUTH_SECRET="different-secret-here"

# MoonPay (Fiat On/Off-ramp)
MOONPAY_MODE=mock                     # "mock" or "production"
MOONPAY_API_KEY=                      # Add when you have it
MOONPAY_SECRET_KEY=                   # Add when you have it
MOONPAY_ENV=sandbox                   # "sandbox" or "production"
MOONPAY_WEBHOOK_SECRET=               # For signature verification
```

## Development

```bash
# Start dev server with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Database GUI
pnpm db:studio

# Run migrations
pnpm db:migrate

# Build for production
pnpm build

# Start production server
pnpm start
```

## API Endpoints

### Bookings (Auth: Bearer Token)

- `POST /api/bookings` - Create booking request
- `GET /api/bookings/:id` - Get booking details with history
- `POST /api/bookings/:id/approve` - Stylist approves booking
- `POST /api/bookings/:id/decline` - Stylist declines booking
- `POST /api/bookings/:id/pay` - Customer pays for booking (locks in escrow)
- `POST /api/bookings/:id/start` - Mark service started
- `POST /api/bookings/:id/complete` - Mark service completed
- `POST /api/bookings/:id/confirm` - Customer confirms completion (releases from escrow)
- `POST /api/bookings/:id/cancel` - Cancel booking with refund

### Stylists (Public)

- `GET /api/stylists` - Search stylists (location + service filters)
- `GET /api/stylists/:id` - Get stylist profile with services

### Wallet (Auth: Bearer Token or Internal)

- `POST /api/wallet/create` - Create wallet (internal - called on signup)
- `GET /api/wallet` - Get wallet info and balance
- `GET /api/wallet/address` - Get user's wallet address
- `GET /api/wallet/balance` - Get USDC balance
- `GET /api/wallet/transactions` - Get paginated transaction history
- `POST /api/wallet/transfer` - Send P2P USDC transfer
- `POST /api/wallet/request` - Create payment request (QR code)
- `GET /api/wallet/request/:id` - Get payment request details
- `POST /api/wallet/request/:id/pay` - Fulfill payment request
- `DELETE /api/wallet/request/:id` - Cancel payment request
- `GET /api/wallet/requests` - Get pending payment requests
- `POST /api/wallet/faucet` - Claim testnet USDC (1000 USDC per 24 hours)

### MoonPay Integration (Auth: Bearer Token)

- `POST /api/wallet/moonpay/deposit` - Create fiat → USDC deposit session
- `POST /api/wallet/moonpay/withdraw` - Create USDC → fiat withdrawal session
- `POST /api/wallet/moonpay/webhook` - Handle MoonPay webhook notifications (public)
- `GET /api/wallet/moonpay/status/:sessionId` - Check MoonPay transaction status

## Booking Status Flow

```
PENDING_STYLIST_APPROVAL
  ├─> PENDING_CUSTOMER_PAYMENT (stylist approves)
  │   └─> CONFIRMED (payment locked)
  │       └─> IN_PROGRESS (service starts)
  │           └─> COMPLETED
  │               └─> AWAITING_CUSTOMER_CONFIRMATION
  │                   └─> SETTLED
  ├─> DECLINED (stylist declines)
  └─> CANCELLED (customer cancels or timeout)
```

## Business Logic

### Pricing
- Platform fee: 10% of service amount
- Stylist payout: 90% of service amount
- All amounts stored as BigInt in cents to avoid floating point issues

### Cancellation Policy
- 24+ hours before: 100% refund
- 4-24 hours before: 50% refund
- <4 hours before: 0% refund
- Stylist cancellation: Always 100% refund

### State Machine
All status transitions are validated. Invalid transitions are rejected with clear error messages.

## Database Schema

See `prisma/schema.prisma` for full schema.

Key models:
- `User` - Core user entity with role fluidity
- `StylistProfile` - Stylist-specific data
- `StylistService` - Individual service offerings
- `Booking` - Core booking entity
- `BookingStatusHistory` - Audit trail
- `Wallet` - AA wallet with balance tracking
- `WalletTransaction` - Transaction history (P2P, escrow, faucet, deposits, withdrawals)
- `MoonPayTransaction` - Fiat on/off-ramp sessions
- `SavedPaymentMethod` - Saved cards and bank accounts

## Error Handling

All errors follow standard format:

```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Human-readable message",
    "details": { /* optional structured data */ }
  }
}
```

## TODO (Phase 2+)

- [ ] Implement escrow contract integration
- [ ] Add notification service (push, email, in-app)
- [ ] Add auto-cancel jobs (cron)
- [ ] Add auto-confirm job (24h timeout)
- [ ] Add property owner integration
- [ ] Add reputation tracking
- [ ] Add authentication middleware
- [ ] Add rate limiting
- [ ] Add comprehensive test suite

## References

- [Feature Spec - Booking Flow v1](../../docs/specs/booking-flow-v1/feature-spec.md)
- [Database Schema](../../docs/vlossom/06-database-schema.md)
- [Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)
- [Backend Architecture](../../docs/vlossom/14-backend-architecture-and-apis.md)
