# Tasks Breakdown – Booking Flow v1

## 1. Backend

### Database & Models
- [ ] Create Prisma schema for `bookings` table
- [ ] Create Prisma schema for `booking_status_history` table
- [ ] Create Prisma schema for `stylist_services` table (pricing)
- [ ] Add booking-related fields to `users` table if needed
- [ ] Generate and run migrations

### API Routes
- [ ] `GET /api/stylists` — Search with location/service filters
- [ ] `GET /api/stylists/:id` — Stylist profile with services
- [ ] `POST /api/bookings` — Create booking (validate, compute pricing)
- [ ] `GET /api/bookings/:id` — Get booking with status history
- [ ] `POST /api/bookings/:id/approve` — Stylist approval + trigger payment
- [ ] `POST /api/bookings/:id/decline` — Cancel with reason
- [ ] `POST /api/bookings/:id/start` — Mark IN_PROGRESS
- [ ] `POST /api/bookings/:id/complete` — Mark COMPLETED
- [ ] `POST /api/bookings/:id/confirm` — Customer confirms + trigger settlement
- [ ] `POST /api/bookings/:id/cancel` — Cancel with refund logic
- [ ] `GET /api/users/:id/bookings` — List bookings for user

### Business Logic
- [ ] Pricing calculator (service + add-ons + platform fee)
- [ ] Status transition validator (enforce state machine)
- [ ] Cancellation policy calculator (early/late/no-show)
- [ ] Auto-cancel job (24h approval timeout, 2h payment timeout)
- [ ] Auto-confirm job (24h customer confirmation timeout)

### Chain Integration
- [ ] Escrow contract client (lockFunds, releaseFunds, refund)
- [ ] AA wallet balance checker
- [ ] Paymaster integration for gasless calls
- [ ] Transaction monitoring for escrow events

### Notifications
- [ ] Notification service integration
- [ ] Push notification triggers for each status
- [ ] Email templates for key events

## 2. Frontend

### Discovery & Search
- [ ] Stylist search page with filters (location, service)
- [ ] Stylist card component (avatar, rating placeholder, services)
- [ ] Map view (optional, can defer)

### Stylist Profile
- [ ] Profile page with bio, portfolio, services
- [ ] Service selection with pricing
- [ ] Date/time picker component
- [ ] Location type selector (STYLIST_BASE, CUSTOMER_HOME)

### Booking Flow
- [ ] Booking summary/confirmation screen
- [ ] "Book Now" button with loading state
- [ ] Insufficient balance modal → onramp redirect
- [ ] Booking success screen

### Booking Management (Customer)
- [ ] My Bookings list page
- [ ] Booking detail page with status timeline
- [ ] Cancel booking button with confirmation
- [ ] Confirm completion button
- [ ] Rating prompt (UI only, backend Phase 2)

### Booking Management (Stylist)
- [ ] Incoming requests list
- [ ] Request detail with approve/decline buttons
- [ ] My Schedule with confirmed bookings
- [ ] Start/Complete service buttons
- [ ] Earnings summary (basic)

### Notifications
- [ ] Notification bell with unread count
- [ ] Notification feed/list
- [ ] Push notification permission request

## 3. Smart Contracts

### Escrow.sol
- [ ] `lockFunds(bookingId, amount)` — Lock USDC
- [ ] `releaseFunds(bookingId, splits[])` — Multi-party settlement
- [ ] `refund(bookingId, amount, recipient)` — Refund to customer
- [ ] `getEscrowBalance(bookingId)` — Query locked amount
- [ ] Access control (only backend can call via relayer)
- [ ] Events: `FundsLocked`, `FundsReleased`, `FundsRefunded`

### Tests
- [ ] Lock funds test
- [ ] Release with correct splits test
- [ ] Refund test
- [ ] Insufficient balance revert test
- [ ] Access control test
- [ ] Event emission test

### Deployment
- [ ] Deployment script for localhost
- [ ] Deployment script for Base Sepolia
- [ ] Contract verification on Basescan

## 4. Testing

### Unit Tests
- [ ] Pricing calculator tests
- [ ] Status transition tests
- [ ] Cancellation policy tests
- [ ] API route validation tests

### Integration Tests
- [ ] Full booking flow (create → approve → pay → complete → settle)
- [ ] Cancellation flow (customer, stylist)
- [ ] Timeout auto-cancel flow
- [ ] Escrow integration with mock wallet

### E2E Tests (Playwright)
- [ ] Customer searches and books stylist
- [ ] Stylist approves booking
- [ ] Customer confirms and rates
- [ ] Cancellation scenarios

## 5. Verification

### Acceptance Criteria Mapping
| Criterion | Test Type | Location |
|-----------|-----------|----------|
| Search stylists | E2E | `e2e/booking.spec.ts` |
| Create booking | Integration | `tests/booking.test.ts` |
| Stylist approve | Integration | `tests/booking.test.ts` |
| Payment escrow | Contract | `contracts/test/Escrow.test.ts` |
| Settlement | Integration | `tests/settlement.test.ts` |
| Cancellation refund | Integration | `tests/cancellation.test.ts` |
| Notifications | Manual | Checklist |
