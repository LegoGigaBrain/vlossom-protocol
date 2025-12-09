# Global Naming Standards

Good names make code self-explanatory. When in doubt, **choose clarity over brevity**.

## 1. General principles

- Names should answer: **“What is this?”** and **“Why does it exist?”**
- Avoid:
  - abbreviations (`cfg`, `svc`, `usr`) unless universally understood (`id`, `url`, `api`).
  - clever or metaphorical names — be literal.
- Use **domain language** consistently (e.g., `booking`, `wallet`, `stylist`, `property`).

## 2. Files & modules

- File names are **kebab-case** for non-code docs (`user-guide.md`).
- For TypeScript / JS:
  - Components: `PascalCase.tsx` (`BookingCard.tsx`)
  - Hooks: `useCamelCase.ts` (`useBookingQuery.ts`)
  - Utility modules: `camelCase.ts` (`formatCurrency.ts`)
- For Solidity:
  - Contracts: `PascalCase.sol` (`BookingRegistry.sol`)

## 3. Variables & functions

- Use **camelCase** for variables and functions: `bookingId`, `createBooking`.
- Booleans:
  - prefix with `is`, `has`, `can`, `should` (`isActive`, `hasWallet`, `canCancel`).
- Functions:
  - should be **verb-led**:
    - `createBooking`, `cancelBooking`, `calculateFee`.

## 4. Classes, types, interfaces

- Classes / interfaces / types: `PascalCase` (`Booking`, `BookingPayload`, `BookingService`).
- TypeScript interfaces:
  - prefixing with `I` is optional; be consistent per project.
  - prefer descriptive names over generic (`BookingInput` vs `Data`).

## 5. Enums & constants

- Enums: `PascalCase` with `SCREAMING_SNAKE_CASE` values.

  ```ts
  enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
  }

Constants: SCREAMING_SNAKE_CASE (MAX_BOOKING_DURATION_HOURS)

6. API & Database Naming

Choose one for APIs: either camelCase or snake_case — be consistent.

Database columns: snake_case (created_at, booking_status).

7. Avoid These Anti-Patterns

Overloading names (key, data, info).

Generic class names (Manager, Helper, Util) without context.

Single-letter variables outside tight loops.

Consistent naming is the backbone of a maintainable codebase.