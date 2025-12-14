# API Service

> Purpose: Main backend API handling bookings, users, wallet operations, notifications, and all business logic.

## Canonical References
- [Doc 05: System Architecture Blueprint](../../docs/vlossom/05-system-architecture-blueprint.md)
- [Doc 06: Database Schema](../../docs/vlossom/06-database-schema.md)
- [Doc 07: Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)
- [Doc 14: Backend Architecture and APIs](../../docs/vlossom/14-backend-architecture-and-apis.md)

## Current Implementation Status

**V1.0 Complete - Beta Launch Ready** (Dec 14, 2025)

## Key Files
- `src/index.ts` — Express server entry point with security middleware
- `src/routes/` — API route handlers
- `src/lib/` — Business logic and service modules
- `src/middleware/` — Auth, security, and rate limiting
- `prisma/schema.prisma` — Database schema

## API Endpoints (60+ total)

### Authentication (4 endpoints)
```
POST /api/auth/signup      — Create user + AA wallet
POST /api/auth/login       — Email/password login → JWT
POST /api/auth/logout      — Invalidate session
GET  /api/auth/me          — Current user info
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

### Health (1 endpoint) - M5
```
GET  /api/health               — Health check with database/blockchain status
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
