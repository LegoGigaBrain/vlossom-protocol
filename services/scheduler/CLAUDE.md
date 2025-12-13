# Scheduler Service

> Purpose: Calendar and scheduling engine handling stylist availability, booking conflicts, and time calculations.

## Canonical References
- [Doc 18: Stylist Schedule Simulation](../../docs/vlossom/18-stylist-schedule-simulation.md)
- [Doc 07: Booking and Approval Flow](../../docs/vlossom/07-booking-and-approval-flow.md)

## Key Files
- `src/index.ts` — Scheduler entry point

## Responsibilities
- Stylist calendar management
- Chair availability tracking
- Booking conflict detection
- Buffer time calculations between appointments
- Travel time estimation for mobile stylists
- Recurring availability patterns
- Time Performance Score (TPS) calculations

## Local Conventions
- All times stored in UTC
- Buffer times configurable per stylist
- Travel time uses distance API (future)

## Dependencies
- Internal: `@vlossom/types`

## Gotchas
- Must respect stylist operating hours
- Chair reservations have their own availability layer
- Special events may override regular availability
- TPS affects reputation scoring (Doc 08)
