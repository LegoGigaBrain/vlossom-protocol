# Feature Spec – Booking Flow v1

## 1. Summary

Core booking flow enabling customers to discover stylists, request bookings, and complete payments via on-chain escrow. This is the MVP implementation covering the customer ↔ stylist path only, with property owner involvement deferred to Phase 2.

This feature implements the foundational booking lifecycle per [Doc 07: Booking and Approval Flow](../../vlossom/07-booking-and-approval-flow.md).

## 2. User Stories

### Customer Stories
- As a customer, I want to search for stylists by location and service so I can find someone nearby.
- As a customer, I want to see transparent pricing before booking so I know exactly what I'll pay.
- As a customer, I want to request a booking at my preferred time so the stylist can review it.
- As a customer, I want my payment held in escrow until service completion so I'm protected.
- As a customer, I want to confirm service completion so I can release payment.
- As a customer, I want to cancel a booking and receive appropriate refunds based on timing.

### Stylist Stories
- As a stylist, I want to receive booking requests with full details so I can decide to accept.
- As a stylist, I want to approve or decline booking requests so I control my schedule.
- As a stylist, I want to mark a service as started and completed so the timeline is accurate.
- As a stylist, I want instant payout after service confirmation so I get paid reliably.

## 3. Scope

### In Scope (MVP)
- Customer search and discovery (location + service filter)
- Stylist profile viewing (services, pricing, availability)
- Booking request creation (PENDING_STYLIST_APPROVAL)
- Stylist approval/decline flow
- Payment from AA wallet to escrow
- Booking confirmation (CONFIRMED)
- Service start (IN_PROGRESS) and completion (COMPLETED)
- Customer confirmation (AWAITING_CUSTOMER_CONFIRMATION)
- Settlement to stylist wallet + platform fee
- Basic cancellation with refunds
- Booking status history tracking
- Notifications for all state transitions

### Out of Scope (Phase 2+)
- Property owner involvement and chair rental
- Special events and multi-day bookings
- Travel fees calculation
- DeFi/LP integration in settlement
- Reputation display (tracked but not shown)
- Deposit + balance payment model
- P2P tipping (tracked, UI deferred)
- Dispute flow (placeholder status only)
- Calendar blocks by stylists

## 4. UX Overview

### Primary Flow (Happy Path)
1. **Discovery**: Customer searches by location → sees list of stylists
2. **Selection**: Customer views stylist profile → selects service + time
3. **Request**: Customer taps "Book Now" → booking created as PENDING_STYLIST_APPROVAL
4. **Approval**: Stylist receives notification → reviews → approves
5. **Payment**: Customer wallet balance checked → funds locked in escrow → status = PENDING_CUSTOMER_PAYMENT → CONFIRMED
6. **Day of Service**: Stylist starts → marks IN_PROGRESS
7. **Completion**: Stylist marks COMPLETED → customer confirms → SETTLED
8. **Settlement**: Escrow releases to stylist wallet, platform takes fee

### Alternate/Edge Flows
- **Stylist Declines**: Booking cancelled, customer notified, no payment involved
- **Approval Timeout**: 24h timeout → auto-cancel, customer notified
- **Payment Timeout**: 2h timeout for payment → auto-cancel, slot released
- **Insufficient Balance**: Inline onramp prompt → top up → retry payment
- **Customer Cancels (Early)**: Full refund to wallet
- **Customer Cancels (Late)**: Partial refund, stylist compensated
- **Stylist Cancels**: Full refund to customer, stylist reputation affected
- **Customer No-Show**: Marked by stylist → funds to stylist after grace period
- **Auto-Confirm**: If customer doesn't confirm in 24h → auto-complete → settle

## 5. Data & APIs

### New/Changed Entities

**bookings**
```
id, customer_id, stylist_id, service_type, service_category,
scheduled_start_time, scheduled_end_time, estimated_duration_min,
actual_start_time, actual_end_time, actual_duration_min,
location_type (STYLIST_BASE | CUSTOMER_HOME),
location_address, location_lat, location_lng,
quote_amount_cents, platform_fee_cents, stylist_payout_cents,
status, escrow_id, escrow_status,
cancelled_at, cancelled_by, cancellation_reason,
created_at, updated_at
```

**booking_status_history**
```
id, booking_id, from_status, to_status, changed_by, changed_at, reason
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stylists` | Search stylists (location, service) |
| GET | `/api/stylists/:id` | Get stylist profile |
| POST | `/api/bookings` | Create booking request |
| GET | `/api/bookings/:id` | Get booking details |
| POST | `/api/bookings/:id/approve` | Stylist approves |
| POST | `/api/bookings/:id/decline` | Stylist declines |
| POST | `/api/bookings/:id/start` | Mark service started |
| POST | `/api/bookings/:id/complete` | Mark service completed |
| POST | `/api/bookings/:id/confirm` | Customer confirms completion |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/users/:id/bookings` | List user's bookings |

### Smart Contract Functions

**Escrow.sol**
- `lockFunds(bookingId, amount)` — Lock USDC from customer wallet
- `releaseFunds(bookingId, stylistShare, platformShare)` — Settlement
- `refund(bookingId, amount)` — Refund to customer wallet

**BookingRegistry.sol** (Phase 2)
- For MVP, booking state lives off-chain with escrow on-chain only

### Permissions and Roles
- Customer: create booking, confirm, cancel (own bookings)
- Stylist: approve/decline, start, complete (assigned bookings)
- System: auto-cancel, auto-confirm (via cron)

## 6. Risks & Assumptions

### Risks
- **Paymaster drainage**: Rate limiting per user, daily caps
- **Escrow mismatch**: Off-chain status must sync with on-chain state
- **Calendar conflicts**: MVP doesn't enforce — relies on stylist judgment

### Assumptions
- All users have AA wallets with USDC balance or can onramp
- Paymaster is funded and operational
- Base L2 is available and reliable
- Stylists respond within 24h typically
- MVP location is single city (no travel fees)

## 7. Acceptance Criteria

### Booking Creation
- [ ] Customer can search stylists by location
- [ ] Customer can view stylist profile with services and prices
- [ ] Customer can select service and time slot
- [ ] Booking is created with status PENDING_STYLIST_APPROVAL
- [ ] Stylist receives notification of new request

### Stylist Approval
- [ ] Stylist can view booking request details
- [ ] Stylist can approve → triggers payment flow
- [ ] Stylist can decline → booking cancelled, customer notified
- [ ] Request auto-cancels after 24h without response

### Payment & Escrow
- [ ] On approval, funds are locked from customer wallet
- [ ] If insufficient balance, onramp modal appears
- [ ] Booking moves to CONFIRMED after successful lock
- [ ] Escrow amount matches quoted price

### Service Execution
- [ ] Stylist can mark service as IN_PROGRESS
- [ ] Stylist can mark service as COMPLETED
- [ ] Customer receives confirmation prompt
- [ ] Customer can confirm → triggers settlement

### Settlement
- [ ] Funds released to stylist wallet (minus platform fee)
- [ ] Platform fee collected to treasury
- [ ] Transaction history updated for all parties

### Cancellation
- [ ] Customer can cancel before approval (no payment)
- [ ] Customer can cancel after payment (refund per policy)
- [ ] Stylist can cancel after approval (full refund)
- [ ] Status history records all transitions

### Notifications
- [ ] Push notification for each status change
- [ ] In-app notification feed updated
- [ ] Email notification for key events (confirmation, completion)
