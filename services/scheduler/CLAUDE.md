# Scheduler Service

> Purpose: Background job scheduler handling auto-confirmations, reminders, reputation recalculation, and escrow operations.

## Current Version

**V6.4.0 Local Development & Service Fixes** (December 18, 2025)

Fixed internal API endpoint routing. Scheduler now successfully calls API at `/api/v1/internal/*` endpoints.

---

### V6.4.0 Changes

**Endpoint Routing Fix:**
- Changed `/api/internal/reputation/recalculate` → `/api/v1/internal/reputation/recalculate`
- Changed `/api/internal/bookings/:id/release-escrow` → `/api/v1/internal/bookings/:id/release-escrow`

**Environment Setup:**
- Created `.env` file for local development
- Requires `INTERNAL_AUTH_SECRET` to match API configuration

---

## Canonical References
- [Doc 18: Stylist Schedule Simulation](../../docs/vlossom/18-stylist-schedule-simulation.md)
- [Doc 07: Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)

## Key Files
- `src/index.ts` — Scheduler entry point and job definitions

## Background Jobs

| Job | Interval | Description |
|-----|----------|-------------|
| Auto-confirm bookings | 60s | Confirms bookings after 24h timeout |
| Booking reminders | 60s | Sends reminders 24h before appointments |
| Payment cleanup | 60s | Expires pending payment requests |
| Reputation recalc | 6h | Triggers batch reputation recalculation |

## Internal API Calls

The scheduler calls these internal API endpoints:

```typescript
POST /api/v1/internal/reputation/recalculate
POST /api/v1/internal/bookings/:id/release-escrow
POST /api/v1/internal/bookings/:id/auto-confirm
```

All calls require `X-Internal-Auth` header matching `INTERNAL_AUTH_SECRET`.

## Environment Variables

```env
DATABASE_URL="postgresql://..."
API_URL="http://localhost:3002"
INTERNAL_AUTH_SECRET="dev-internal-secret-change-in-production"
```

## Local Conventions
- All times stored in UTC
- Auto-confirm timeout: 24 hours
- Reminder window: 24 hours before booking
- Check interval: 60 seconds

## Dependencies
- Internal: `@vlossom/types`, `@prisma/client`
- External: None (uses native fetch)

## Gotchas
- Scheduler starts immediately on `pnpm dev`
- First API call may fail if API isn't ready yet (retries on next interval)
- Must have matching `INTERNAL_AUTH_SECRET` with API
- Does NOT handle scheduling/availability - that's in the API
