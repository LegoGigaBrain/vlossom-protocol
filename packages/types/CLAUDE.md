# Shared Types

**Version**: V7.4.0 | December 2025

> Purpose: TypeScript type definitions shared across all Vlossom packages and services.

## Canonical References
- [Doc 02: Platform Actors and Feature Map](../../docs/vlossom/02-platform-actors-and-feature-map.md)
- [Doc 06: Database Schema](../../docs/vlossom/06-database-schema.md)
- [Doc 07: Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)
- [Doc 08: Reputation System Flow](../../docs/vlossom/08-reputation-system-flow.md)

## Key Files
- `src/index.ts` — Public exports
- `src/user.ts` — User and actor types (roles, profiles)
- `src/booking.ts` — Booking state machine and related types
- `src/property.ts` — Property and chair rental types
- `src/reputation.ts` — Reputation scores and events

## Local Conventions
- All types should match database schema (Doc 06)
- Use union types for enums (not TypeScript enums)
- Export everything from `src/index.ts`

## Dependencies
- None (pure TypeScript)

## Gotchas
- Booking status follows specific state machine (Doc 07)
- Reputation is multi-dimensional, not a single score
- Role fluidity: users can have multiple roles
