# API Service

> Purpose: Main backend API handling bookings, users, wallet operations, and all business logic.

## Canonical References
- [Doc 05: System Architecture Blueprint](../../docs/vlossom/05-system-architecture-blueprint.md)
- [Doc 06: Database Schema](../../docs/vlossom/06-database-schema.md)
- [Doc 07: Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)
- [Doc 14: Backend Architecture and APIs](../../docs/vlossom/14-backend-architecture-and-apis.md)

## Key Files
- `src/index.ts` — Express server entry point
- `src/routes/` — API route handlers
- `src/db/` — Database queries and Prisma client

## Local Conventions
- Express.js with TypeScript
- Prisma ORM for database access
- Zod for request validation
- All responses follow consistent format

## API Structure (planned)
```
POST /api/bookings        — Create booking
GET  /api/bookings/:id    — Get booking
POST /api/bookings/:id/approve — Stylist approval
POST /api/users           — Create user
GET  /api/users/:id       — Get user profile
GET  /api/wallet/balance  — Get wallet balance
POST /api/wallet/transfer — P2P transfer
```

## Dependencies
- Internal: `@vlossom/types`
- External: Express, Prisma, Zod

## Gotchas
- All booking state changes must update `booking_status_history`
- Escrow operations require on-chain confirmation
- Never bypass escrow for payments
