# API Service

> Purpose: Main backend API handling bookings, users, wallet operations, notifications, and all business logic.

## Canonical References
- [Doc 05: System Architecture Blueprint](../../docs/vlossom/05-system-architecture-blueprint.md)
- [Doc 06: Database Schema](../../docs/vlossom/06-database-schema.md)
- [Doc 07: Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)
- [Doc 14: Backend Architecture and APIs](../../docs/vlossom/14-backend-architecture-and-apis.md)

## Current Implementation Status

**V4.0.0 Complete - DeFi Integration** (Dec 16, 2025)

### V4.0.0 Changes

**DeFi Liquidity System:**
- Liquidity pool routes (`routes/liquidity.ts`) — 15 endpoints
- Pool service (`lib/liquidity/pool-service.ts`) — Pool CRUD, deposits
- Yield service (`lib/liquidity/yield-service.ts`) — APY calculations, claims
- Referral engine (`lib/liquidity/referral-engine.ts`) — Tier calculations
- Admin DeFi routes (`routes/admin/defi.ts`) — APY params, fee split, emergency

**New Database Models:**
- `LiquidityPool` — Pool records with tier, TVL, APY
- `LiquidityDeposit` — User deposits with shares
- `YieldClaim` — Yield claim history
- `DefiTierStatus` — User's referral percentile and tier
- `SystemConfig` — Key-value store for DeFi parameters

**New Enums:**
- `PoolTier` — GENESIS/TIER_1/TIER_2/TIER_3
- `PoolStatus` — PENDING/ACTIVE/PAUSED/CLOSED

---

**V3.4.0 Complete - Pre-Styling Completion** (Dec 16, 2025)

### V3.4.0 Changes

**Backend Infrastructure:**
- Kotani Pay integration (`lib/kotani/`) for on/off-ramp flows
- Rewards & XP system (`lib/rewards/`) with badges, streaks, tiers
- Dispute resolution system (`lib/disputes/`) with full workflow
- Audit logging system (`lib/audit/`) for compliance
- Admin routes for disputes, logs, user management, property verification

**New Database Models:**
- `UserXP` — XP tracking by role (customer/stylist/owner)
- `UserBadge` — Badge achievements with metadata
- `Dispute` — Dispute records with resolution workflow
- `DisputeMessage` — Internal/external dispute communication
- `AuditLog` — Admin action audit trail

**New Enums:**
- `UserTier` — Bronze/Silver/Gold/Platinum/Diamond
- `BadgeType` — 10 badge types (FIRST_BOOKING, TEN_BOOKINGS, etc.)
- `DisputeStatus` — OPEN/ASSIGNED/UNDER_REVIEW/RESOLVED/ESCALATED/CLOSED
- `DisputeType` — 9 types (SERVICE_NOT_DELIVERED, POOR_QUALITY, etc.)
- `DisputeResolution` — 8 resolution types

---

**V3.3.0 Complete - Feature Completion (Pre-DeFi)** (Dec 16, 2025)

### V3.3.0 Changes
- Password reset endpoints (`POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`)
- `PasswordResetToken` model added to Prisma schema
- Token-based email verification flow with 1-hour expiry
- SIWE authentication endpoints (V3.2.0)

---

**V1.5 Complete - Property Owner + Reputation** (Dec 15, 2025)

## Key Files
- `src/index.ts` — Express server entry point with security middleware
- `src/routes/` — API route handlers
- `src/lib/` — Business logic and service modules
- `src/middleware/` — Auth, security, and rate limiting
- `prisma/schema.prisma` — Database schema

## API Endpoints (108+ total)

### Authentication (11 endpoints)
```
POST /api/auth/signup          — Create user + AA wallet
POST /api/auth/login           — Email/password login → JWT
POST /api/auth/logout          — Invalidate session
GET  /api/auth/me              — Current user info
POST /api/auth/forgot-password — Send password reset email (V3.3)
POST /api/auth/reset-password  — Reset password with token (V3.3)
GET  /api/auth/siwe/nonce      — Get SIWE nonce (V3.2)
POST /api/auth/siwe/verify     — Verify SIWE signature (V3.2)
POST /api/auth/siwe/login      — Login with SIWE (V3.2)
POST /api/auth/link-wallet     — Link wallet to account (V3.2)
DELETE /api/auth/link-wallet/:id — Unlink wallet (V3.2)
```

### Wallet (10 endpoints)
```
POST /api/wallet/create     — Create AA wallet
GET  /api/wallet/address    — Get wallet address
GET  /api/wallet/balance    — Get USDC balance
GET  /api/wallet/transactions — Transaction history
POST /api/wallet/transfer   — P2P USDC transfer
POST /api/wallet/faucet     — Claim testnet USDC (rate limited)
POST /api/wallet/request    — Create payment request
GET  /api/wallet/request/:id — Get request details
POST /api/wallet/request/:id/pay — Pay request
DELETE /api/wallet/request/:id — Cancel request
```

### Bookings (14 endpoints)
```
POST /api/bookings               — Create booking
GET  /api/bookings/:id           — Get booking details
POST /api/bookings/:id/approve   — Stylist approves
POST /api/bookings/:id/decline   — Stylist declines
GET  /api/bookings/:id/payment-instructions — Payment info
POST /api/bookings/:id/confirm-payment — Verify & confirm payment
POST /api/bookings/:id/start     — Start service
POST /api/bookings/:id/complete  — Complete service
POST /api/bookings/:id/confirm   — Customer confirms (releases escrow)
POST /api/bookings/:id/cancel    — Cancel (triggers refund)
POST /api/bookings/check-availability — Conflict detection (M4)
GET  /api/bookings/available-slots — Get available time slots (M4)
GET  /api/bookings/travel-time   — Calculate travel time (M4)
```

### Stylists (16 endpoints)
```
GET  /api/stylists              — List with search/filter (M4)
GET  /api/stylists/:id          — Get stylist profile
GET  /api/stylists/dashboard    — Dashboard summary (M3)
GET  /api/stylists/bookings     — Stylist's bookings (M3)
POST /api/stylists/services     — Create service (M3)
PUT  /api/stylists/services/:id — Update service (M3)
DELETE /api/stylists/services/:id — Delete service (M3)
GET  /api/stylists/availability — Get weekly schedule (M3)
PUT  /api/stylists/availability — Update schedule (M3)
POST /api/stylists/availability/exceptions — Block dates (M3)
GET  /api/stylists/profile      — Get own profile (M3)
PUT  /api/stylists/profile      — Update profile (M3)
GET  /api/stylists/earnings     — Earnings summary (M3)
GET  /api/stylists/earnings/history — Payout history (M3)
```

### Notifications (4 endpoints) - M4
```
GET  /api/notifications         — List notifications (paginated)
POST /api/notifications/:id/read — Mark as read
POST /api/notifications/read-all — Mark all as read
GET  /api/notifications/unread-count — Badge count
```

### Upload (4 endpoints) - M4
```
POST /api/upload/portfolio      — Upload portfolio image
POST /api/upload/avatar         — Upload avatar
DELETE /api/upload/portfolio/:publicId — Delete image
GET  /api/upload/signature      — Get signed upload params
```

### Admin (4 endpoints) - M5
```
GET  /api/admin/paymaster/stats — Paymaster statistics
GET  /api/admin/paymaster/transactions — Transaction history
GET  /api/admin/paymaster/gas-usage — Gas usage chart data
POST /api/admin/paymaster/alerts/config — Alert configuration
```

### Admin Disputes (6 endpoints) - V3.4
```
GET    /api/v1/admin/disputes              — List disputes with filters
GET    /api/v1/admin/disputes/stats        — Dispute statistics
GET    /api/v1/admin/disputes/:id          — Get dispute details
POST   /api/v1/admin/disputes/:id/assign   — Assign to admin
POST   /api/v1/admin/disputes/:id/resolve  — Resolve dispute
POST   /api/v1/admin/disputes/:id/escalate — Escalate dispute
```

### Admin Logs (2 endpoints) - V3.4
```
GET    /api/v1/admin/logs       — List audit logs with filters
GET    /api/v1/admin/logs/stats — Audit log statistics
```

### Admin DeFi (8 endpoints) - V4.0
```
GET    /api/v1/admin/defi/stats             — DeFi statistics
GET    /api/v1/admin/defi/config            — Current DeFi configuration
PUT    /api/v1/admin/defi/apy-params        — Update APY parameters
PUT    /api/v1/admin/defi/fee-split         — Update fee split
POST   /api/v1/admin/defi/pools/:id/pause   — Pause pool
POST   /api/v1/admin/defi/pools/:id/unpause — Unpause pool
POST   /api/v1/admin/defi/emergency/pause-all   — Emergency pause all
POST   /api/v1/admin/defi/emergency/unpause-all — Emergency unpause all
```

### Liquidity (15 endpoints) - V4.0
```
GET    /api/v1/liquidity/pools           — List all pools
GET    /api/v1/liquidity/pools/genesis   — Genesis pool details
GET    /api/v1/liquidity/pools/:id       — Pool details
GET    /api/v1/liquidity/pools/:id/stats — Pool statistics
POST   /api/v1/liquidity/pools           — Create community pool
GET    /api/v1/liquidity/deposits        — User's deposits
POST   /api/v1/liquidity/deposit         — Deposit to pool
POST   /api/v1/liquidity/withdraw        — Withdraw from pool
GET    /api/v1/liquidity/yield           — User's yield summary
POST   /api/v1/liquidity/yield/claim     — Claim yield from pool
POST   /api/v1/liquidity/yield/claim-all — Claim all yield
GET    /api/v1/liquidity/tier            — User's referral tier
GET    /api/v1/liquidity/stats           — Global DeFi stats
```

### Admin Users (3 endpoints) - V3.4
```
POST   /api/v1/admin/users/:id/freeze   — Freeze user account
POST   /api/v1/admin/users/:id/unfreeze — Unfreeze user account
POST   /api/v1/admin/users/:id/warn     — Send warning to user
```

### Admin Properties (2 endpoints) - V3.4
```
POST   /api/v1/admin/properties/:id/verify — Verify property
POST   /api/v1/admin/properties/:id/reject — Reject property
```

### Fiat (6 endpoints) - V3.4
```
POST   /api/v1/fiat/onramp/initiate   — Initiate ZAR → USDC
POST   /api/v1/fiat/onramp/confirm    — Confirm onramp payment
GET    /api/v1/fiat/onramp/status/:id — Get onramp status
POST   /api/v1/fiat/offramp/initiate  — Initiate USDC → ZAR
GET    /api/v1/fiat/offramp/status/:id — Get offramp status
GET    /api/v1/fiat/rates             — Current exchange rates
```

### Rewards (5 endpoints) - V3.4
```
GET    /api/v1/rewards/me             — Current user rewards
GET    /api/v1/rewards/:userId        — User public rewards
GET    /api/v1/rewards/badges         — All available badges
GET    /api/v1/rewards/leaderboard    — Top users by XP
POST   /api/v1/rewards/claim/:type    — Claim unlocked reward
```

### Health (1 endpoint) - M5
```
GET  /api/health               — Health check with database/blockchain status
```

### Properties (6 endpoints) - V1.5
```
GET    /api/properties              — List properties with filters
POST   /api/properties              — Create property (owner only)
GET    /api/properties/:id          — Get property details
PUT    /api/properties/:id          — Update property
DELETE /api/properties/:id          — Delete property
GET    /api/properties/:id/chairs   — Get chairs for property
```

### Chairs (5 endpoints) - V1.5
```
GET    /api/chairs                  — List chairs with filters
POST   /api/chairs                  — Create chair
GET    /api/chairs/:id              — Get chair details
PUT    /api/chairs/:id              — Update chair
DELETE /api/chairs/:id              — Delete chair
```

### Chair Rentals (4 endpoints) - V1.5
```
GET    /api/rentals                 — List rental requests
POST   /api/rentals                 — Create rental request
POST   /api/rentals/:id/approve     — Approve rental
POST   /api/rentals/:id/reject      — Reject rental
```

### Reputation (4 endpoints) - V1.5
```
GET    /api/reputation/:userId      — Get reputation score
GET    /api/reputation/:userId/events — Get reputation event history
POST   /api/reputation/:userId/calculate — Trigger score recalculation
GET    /api/reputation/leaderboard  — Get top-rated users
```

### Reviews (5 endpoints) - V1.5
```
GET    /api/reviews/stylist/:id     — Get reviews for stylist
POST   /api/reviews                 — Create review
PUT    /api/reviews/:id             — Update review
DELETE /api/reviews/:id             — Delete review
GET    /api/reviews/booking/:id     — Get review for booking
```

## Key Directories

### `src/lib/` — Business Logic

**`wallet/`** — Wallet Operations (M1)
- `wallet-service.ts` — Core wallet operations
- `user-operation.ts` — ERC-4337 UserOp builder
- `faucet-service.ts` — Testnet USDC faucet
- `chain-client.ts` — Chain connectivity

**`escrow-client.ts`** — Escrow Contract Integration
- `releaseFundsFromEscrow()` — 90% to stylist, 10% to platform
- `refundFromEscrow()` — Full customer refund
- `getEscrowBalance()` / `getEscrowRecord()` — State queries

**`wallet-booking-bridge.ts`** — Payment Flow Integration
- `checkCustomerBalance()` — USDC balance verification
- `checkEscrowAllowance()` — Approval status check
- `verifyAndConfirmPayment()` — Confirm escrow lock

**`scheduling/`** — Scheduling Engine (M4)
- `scheduling-service.ts` — Conflict detection + buffer calculation
- `travel-time-service.ts` — Google API + Haversine fallback + caching
- `index.ts` — Barrel export

**`notifications/`** — Notification Service (M4)
- `notification-service.ts` — Core notification logic
- `email-provider.ts` — SendGrid integration
- `sms-provider.ts` — Clickatell integration
- `templates.ts` — Email/SMS templates for all events
- `types.ts` — Notification types and enums
- `index.ts` — Barrel export

**`cloudinary/`** — Image Upload (M4)
- `cloudinary-service.ts` — Upload/delete with transformations
- `index.ts` — Barrel export

**`monitoring/`** — Production Monitoring (M5)
- `sentry.ts` — Sentry initialization and error capture
- `posthog.ts` — PostHog server-side analytics
- `health-check.ts` — Health endpoint with database/blockchain checks
- `index.ts` — Barrel export

**`paymaster/`** — Paymaster Monitoring (M5)
- `types.ts` — TypeScript interfaces
- `paymaster-monitor.ts` — Core monitoring service
- `balance-alerts.ts` — Alert service with Slack/email notifications
- `index.ts` — Barrel export

**`property/`** — Property Owner Module (V1.5)
- `property-service.ts` — Property CRUD operations
- `chair-service.ts` — Chair inventory management
- `rental-service.ts` — Chair rental workflow
- `index.ts` — Barrel export

**`reputation/`** — Reputation System (V1.5)
- `reputation-service.ts` — Score calculation with TPS weighting
- `review-service.ts` — Review CRUD operations
- `tps-calculator.ts` — Time Performance Score calculation
- `index.ts` — Barrel export

**`kotani/`** — Fiat On/Off-Ramp (V3.4)
- `kotani-client.ts` — Kotani Pay API client
- `types.ts` — TypeScript interfaces
- `index.ts` — Barrel export

**`rewards/`** — Rewards & XP System (V3.4)
- `xp-service.ts` — XP calculation and awarding
- `badge-service.ts` — Badge unlocking logic
- `streak-service.ts` — Streak tracking
- `tier-service.ts` — Tier progression (Bronze→Diamond)
- `types.ts` — Interfaces and enums
- `index.ts` — Barrel export

**`disputes/`** — Dispute Resolution (V3.4)
- `dispute-service.ts` — Dispute workflow logic
- `types.ts` — Dispute interfaces and enums
- `index.ts` — Barrel export

**`audit/`** — Audit Logging (V3.4)
- `audit-service.ts` — Audit log creation and queries
- `index.ts` — Barrel export

### `src/middleware/` — Middleware

- `auth.ts` — JWT authentication
- `authorize.ts` — Role-based access control
- `error-handler.ts` — Global error handler
- `rate-limiter.ts` — Express rate limit middleware (M4)
- `security-headers.ts` — Helmet.js security headers (M4)

### `src/routes/` — API Routes

- `auth.ts` — Authentication endpoints
- `wallet.ts` — Wallet endpoints (10)
- `bookings.ts` — Booking endpoints (14)
- `stylists.ts` — Stylist endpoints (16)
- `notifications.ts` — Notification endpoints (M4)
- `upload.ts` — Cloudinary upload endpoints (M4)
- `admin/paymaster.ts` — Admin paymaster endpoints (M5)
- `admin/disputes.ts` — Admin dispute management (V3.4)
- `admin/logs.ts` — Admin audit logs (V3.4)
- `fiat.ts` — Kotani Pay on/off-ramp (V3.4)
- `rewards.ts` — Rewards and XP system (V3.4)
- `properties.ts` — Property CRUD endpoints (V1.5)
- `chairs.ts` — Chair management endpoints (V1.5)
- `rentals.ts` — Chair rental workflow endpoints (V1.5)
- `reputation.ts` — Reputation score endpoints (V1.5)
- `reviews.ts` — Review CRUD endpoints (V1.5)

## Database Schema

### Key Models
- `User` — User accounts with roles
- `Wallet` — AA wallet addresses
- `WalletTransaction` — Transaction history
- `Booking` — Booking records with state machine
- `StylistProfile` — Stylist profiles
- `StylistService` — Service catalog
- `StylistAvailability` — Weekly schedule + exceptions (M3)
- `Notification` — Multi-channel notifications (M4)
- `PaymasterTransaction` — Sponsored tx history (M5)
- `PaymasterAlert` — Alert configuration (M5)
- `PaymasterDailyStats` — Daily gas stats (M5)
- `Property` — Property owner venues (V1.5)
- `Chair` — Rentable chairs at properties (V1.5)
- `ChairRentalRequest` — Chair rental workflow (V1.5)
- `ReputationScore` — Aggregated user reputation (V1.5)
- `ReputationEvent` — Individual reputation events (V1.5)
- `Review` — Customer/stylist reviews (V1.5)
- `PasswordResetToken` — Password reset tokens with expiry (V3.3)
- `SiweNonce` — SIWE nonce storage (V3.2)
- `LinkedAccount` — External auth providers linked to users (V3.2)
- `ExternalAuthProvider` — Enum for auth provider types (V3.2)
- `UserXP` — XP tracking by role (V3.4)
- `UserBadge` — Badge achievements (V3.4)
- `Dispute` — Dispute records with workflow state (V3.4)
- `DisputeMessage` — Dispute communication (V3.4)
- `AuditLog` — Admin action audit trail (V3.4)

## Security (M4)

### Rate Limiting
```typescript
POST /api/auth/login       → 5 requests / 15 min
POST /api/auth/signup      → 3 requests / 1 hour
POST /api/wallet/faucet    → 1 request / 24 hours
POST /api/bookings         → 20 requests / 1 hour
Global fallback            → 100 requests / 1 min
```

### Security Headers (helmet.js)
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS) - 1 year
- X-Frame-Options - DENY
- X-Content-Type-Options - nosniff
- Referrer-Policy - strict-origin-when-cross-origin

### Account Lockout
- Lock after 5 failed login attempts
- 30-minute lockout duration
- Security event logging

## External Services

| Service | Purpose | Status |
|---------|---------|--------|
| Google Distance Matrix API | Travel time calculation | ✅ Integrated |
| SendGrid | Email notifications | ✅ Integrated |
| Clickatell | SMS notifications (SA) | ✅ Integrated |
| Cloudinary | Image CDN | ✅ Integrated |
| Sentry | Error tracking | ✅ Integrated (M5) |
| PostHog | Product analytics | ✅ Integrated (M5) |

## Local Conventions
- Express.js with TypeScript
- Prisma ORM for database access
- Zod for request validation
- All responses follow consistent format
- JWT authentication with 30-day expiry
- Role-based access control (customer vs stylist vs admin)

## Dependencies
- Internal: `@vlossom/types`
- External: Express, Prisma, Zod, bcrypt, jsonwebtoken, helmet, express-rate-limit

## Gotchas
- All booking state changes must update `booking_status_history`
- Escrow operations require on-chain confirmation
- Never bypass escrow for payments
- Paymaster must not be drainable
- All sensitive endpoints behind rate limiters
