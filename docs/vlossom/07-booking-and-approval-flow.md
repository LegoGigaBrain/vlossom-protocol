# 07 — Booking & Approval Flow

## Scope

This document defines how bookings move through the system:

    Request → approval → payment → service → completion

    How stylist & property owner approvals work

    How calendar holds, conflicts, and expiries are handled

    How special events and complex travel bookings differ from normal bookings

    How this ties into escrow, reputation, and chair reservations

This is the canonical state machine for Vlossom bookings.

Database fields and statuses referenced here map to:

    bookings

    booking_status_history

    property_chair_reservations

    stylist_calendar_blocks

    payment_intents

    payment_transactions

    disputes

---

## 1. Booking Principles

### Stylist-first approval

    All bookings require stylist approval before payment is finalized.

    Stylists are never forced into a booking they don’t want (fit, capacity, safety, preference).

### Escrow-based security

    Once approved, the customer must pay (full or deposit in future) into escrow.

    A booking is only fully confirmed once funds are in escrow.

### Calendar-first logic

    Time slots are treated as a scarce resource.

    Holds/expires logic prevents double-booking and calendar chaos.

### Multi-sided clarity

    Customer sees: clear time, price, location, stylist.

    Stylist sees: request details, workload impact, revenue, travel requirements.

    Property owner sees: chair usage windows & revenue impact (when applicable).

### Special cases handled as “special flows”, not hacks:

    Special events / multi-day bookings

    Long-distance / cross-border travel

    Remote “choose stylist + choose salon” combos

---

## 2. Booking Status Model (High-Level)

bookings.status moves through controlled transitions:

    PENDING_STYLIST_APPROVAL

    PENDING_CUSTOMER_PAYMENT

    CONFIRMED

    IN_PROGRESS

    COMPLETED

    CANCELLED_CUSTOMER

    CANCELLED_STYLIST

    NO_SHOW_CUSTOMER

    NO_SHOW_STYLIST

    DISPUTED

Each transition is logged in booking_status_history.

---

## 3. Standard Booking Lifecycle (Default Flow)

This is the most common path:
    Customer → picks stylist + service → picks time/location → stylist approves → customer pays → service completed → escrow settles.

### 3.1 Step 0 — Discovery & Pre-Booking

Customer chooses either:

    Stylist-first route

        Select a specific stylist (e.g. favourite or highly rated).

        Then chooses:

            service

            add-ons

            date & time

            location type:

                STYLIST_BASE

                CUSTOMER_HOME

                PROPERTY (if they want a boutique / premium space)

            Location-first route

                Select a location (area, property, or city).

                See stylists available in that area for chosen date/time + service.

                Then choose a stylist from filtered list.

In both cases, the UI presents:

    Estimated duration (from stylist’s own service config)

    Base price + add-ons

    Estimated total time window

    Any special flags (travel, event, etc.)

When customer hits “Request Booking”:

    A row is created in bookings with:

        status = 'PENDING_STYLIST_APPROVAL'

        service_location_type set

        all pricing fields calculated

    A soft hold is placed on the stylist’s calendar for that time window.

    If a property / chair is involved, a tentative chair hold is created in property_chair_reservations.

### 3.2 Step 1 — Stylist Review & Approval (All bookings)

Stylist receives:

    in-app notification

    optional email / push

They see:

    service + add-ons

    requested date & time

    location type

    travel requirements (if any)

    customer profile summary & past behaviour (if relevant)

    property info (if PROPERTY mode)

Stylist can:

    Approve as requested

        Booking moves to PENDING_CUSTOMER_PAYMENT.

        Calendar hold becomes primary for that window.

        For property bookings:

            A “provisional” chair reservation is created or upgraded to confirmed-if-paid.

Decline

    Booking moves to CANCELLED_STYLIST.

    Reason optionally logged (e.g. “too far”, “not available”, “style not my specialty”).

    Customer notified; slot freed; any property chair holds released.

Propose changes (later; v2)

    For special events especially:

        propose different time

        propose different location / property

        propose different price / add-ons

    Booking enters a negotiation state (can be modelled as changes + new request or a specific sub-state; v1 may keep this simple).

Timeout logic:

If stylist does nothing within configured window (e.g. 24 hours or configurable):

    Booking auto-expires:

        status → CANCELLED_STYLIST (or EXPIRED in future if we add that state).

    Customer sees “Request expired, stylist did not respond”.

    Calendar and chair holds released.

### 3.3 Step 2 — Customer Payment & Escrow

Once stylist approves:

    bookings.status = 'PENDING_CUSTOMER_PAYMENT'

    Customer is prompted to secure the booking.

Pricing displayed:

    Base service price

    Add-ons

    Travel fee (if applicable)

    Chair fee (if applicable)

    Total price (all inclusive)

v1: we use full prepay into escrow as default:

    Customer chooses payment method (card/onramp).

    payment_intents row created.

    On success:

    payment_status = 'ESCROW'

    status = 'CONFIRMED'

    Escrow deposit mirrored on-chain (if already integrated).

If payment fails:

    Booking remains PENDING_CUSTOMER_PAYMENT.

    We may time-box this state (e.g. 2–6 hours) before auto-cancelling.

    If expired:

        status → CANCELLED_CUSTOMER (or EXPIRED)

        Calendar & chair holds released.

Future:
    Multi-stage payments (deposit + final) are supported by the model:

        Additional fields in bookings to track deposit_amount vs balance_amount.

        Multiple payment_intents tied to same booking.

    For now, v1 keeps flows simple while we architect for future deposits.

### 3.4 Step 3 — Service Day & Time Tracking

On the day:

    Stylist checks in

        Marks booking as “started” in app.

        status → IN_PROGRESS

        Actual start_time_actual (not currently in schema but can be added) is recorded.

        Time Performance Score (TPS) engine now tracks against estimated_duration_min.

Customer arrival & punctuality

    Customer is reminded before the appointment.

    Late arrival can be recorded and feed into tps_metrics as customer behaviour.

Service completion

    When stylist finishes, they mark “Service Completed”:

        IN_PROGRESS stays, but end time is recorded.

    Customer receives:

        “Please confirm your service” prompt.

Customer confirmation

    Customer can:

        Confirm service as completed, or

        Flag a problem and trigger a dispute.

    If confirmed:

        status → COMPLETED

        Settlement is triggered (escrow release logic).

If customer does nothing within grace window (e.g. 12–24 hours):

    Auto-confirmation logic can be triggered:

        status → COMPLETED

        Escrow released according to rules.

If customer flags a dispute:

    status → DISPUTED

    Funds remain in escrow.

    disputes and dispute_events tables are used.

    Admin panel handles resolution.

### 3.5 Step 4 — Settlement (High-Level)

Settlement logic is detailed in DeFi & smart contract docs, but at the booking level:

    Funds in escrow are distributed to:

        Stylist

        Property owner (if applicable)

        Platform (fees)

payment_transactions log the flows:

    ESCROW_RELEASE_STYLIST

    ESCROW_RELEASE_PROPERTY

    FEE_COLLECTION

payouts track aggregated payments to beneficiaries.

---

## 4. Chair & Property Owner Approvals

Property owners can optionally require approval for stylists using their space.

We adopted:

    Option 4 — Hybrid (owner can toggle “require approval”)

        platform-controlled base rules.

### 4.1 Property Owner Settings

At property level, owner can configure:

    requires_manual_approval = true/false

    Auto-approval rules (configurable in config_kv), e.g.:

        Minimum stylist reputation score

        No critical behaviour flags

        Service category compatibility with amenities

        Max concurrent chairs in use

The platform provides defaults and safeguards, but owners retain control.

### 4.2 Approval Scenarios

When a booking involves a property:

    Stylist has long-term membership at property

        stylist_property_memberships indicates:

            active membership

            assigned chair (optional)

    For standard bookings:

        no extra owner approval is usually needed.

        chair slots can be auto-reserved per booking as reservation_type = 'BOOKING'.

    Stylist has no existing relationship with property

        Platform checks:

            property rules

            stylist reputation

            amenities vs service requirements

        If property requires approval:

            Booking enters an implicit sub-flow:

                Stylist approves first.

                Then property owner receives a request.

        Owner can approve or decline:

            Approve → booking continues to PENDING_CUSTOMER_PAYMENT.

            Decline → booking cancelled; customer notified.

If property does not require manual approval:

    Platform applies rules automatically.

    If rules are satisfied:

        chair reserved

        booking moves to payment stage.

    If rules not satisfied:

        customer is asked to pick another property or default to stylist base / home visit.

---

### 5. Special Event & Custom Quote Bookings

Special events (weddings, multi-day shoots, tours) are special cases:

    Highly custom

    Often long-duration

    Often require travel + accommodation

    Often large-ticket

We agreed:

    Option A — Special Events as a top-level category
    Option C — Hybrid quote model + special flow

### 5.1 Special Event Flow Overview

    Customer chooses:

        Special event category (e.g., Bridal, Photoshoot, Corporate Event).

        Desired dates / time windows.

        Location (or multiple locations).

        Basic description (occasion, scope, number of people, etc.).

    Stylist receives a special request, not a standard booking:

        They can review details and then:

            propose a full quote (including travel & accommodation if relevant)

            propose schedule structure (multi-day, sessions)

            define a custom total price (and payment schedule later)

    Stylist fills in special event parameters in a dedicated window:

        Travel assumptions

        Accommodation assumptions

        Per-day schedule and hours

        Required assistants (future)

        Total fee for the event

    Customer receives:

        A quoted all-in price (and optionally deposit terms in future).

        A clear timeline.

Customer can:

    Accept → booking moves into PENDING_CUSTOMER_PAYMENT with special flag and context.

    Decline → request ends.

In v1, the implementation can be:

    A “master special-event booking” row in bookings with special_event_flag = true and structured special_event_context JSON, rather than deeply modelling multi-day segments.

---

## 6. Calendar Holds, Conflict Management & Simulation

We want:

    Stylists to approve bookings, not be surprised.

    Customers to see real-time availability as much as possible.

    The system to simulate stylist schedules (current + tentative).

### 6.1 Pre-Approval Holds

When a booking request is created:

    Stylist’s calendar shows the slot as “Requested” (soft hold).

    Other customers:

        may still see the slot, but with lower priority or “likely unavailable" indication, OR

        may be prevented from selecting the exact overlap (configurable).

The system:

    Runs conflict detection whenever a new request arrives.

    Ensures a stylist cannot approve conflicting bookings.

### 6.2 Post-Approval Holds

Once stylist approves:

    The slot becomes a strong hold.

    Other requests that overlap:

        either cannot be approved, or

        are shown as conflicts to be resolved (stylist chooses which to keep; others auto-cancel).

Booking isn’t confirmed until payment is made, but:

    The system still treats the slot as tentatively allocated.

    A timeout is set for PENDING_CUSTOMER_PAYMENT.

### 6.3 Manual Blocks by Stylists

Stylists can create stylist_calendar_blocks:

    UNAVAILABLE for rest days, off days, personal commitments.

    AVAILABLE_OVERRIDE to open extra slots outside normal working hours.

The booking engine ensures:

    No bookings are created or approved within UNAVAILABLE blocks.

    Overrides can temporarily open windows if stylist really wants.

---

## 7. Cancellations & No-Shows

Cancellation/refund/penalty rules are defined in pricing & risk docs, but booking-level behaviour is:

### 7.1 Customer Cancels

Scenarios:

    Before stylist approval:

        Customer cancels → status → CANCELLED_CUSTOMER; no payment involvement.

After stylist approval, before payment:

    Same as above; no financial penalties.

After payment (escrow) and before configured cut-offs:

    Partial or full refund (depending on policy).

    status → CANCELLED_CUSTOMER.

    payment_status updated; payment_transactions records refund and any kept fee.

Too close to appointment (late cancellation) or no-show:

    Escrow is partially or mostly released to stylist (and property) as compensation.

### 7.2 Stylist Cancels

If stylist cancels after confirmation:

    status → CANCELLED_STYLIST.

    Customer receives:

        full refund

        possibly credits or priority for alternative bookings

    Stylist’s reputation & behaviour flags are updated:

        repeated cancellations → risk flags.

### 7.3 No-Shows

Customer no-show:

    Stylist marks as no-show.

    If customer does not contest within window:

        status → NO_SHOW_CUSTOMER.

        Funds largely go to stylist/property.

        Customer reputation impacted.

Stylist no-show:

    Customer flags.

    If stylist doesn’t contest:

        status → NO_SHOW_STYLIST.

        Full refund + compensation logic (credits) can apply.

        Stylist reputation impacted strongly.


---

## 8. Cross-Border / Long Distance Travel

Travel logic is priced into services & add-ons, but the booking flow remains the same:

    Customer chooses location that implies travel.

    Stylist’s travel preferences + platform rules determine if request is even allowed.

    For international / long-distance:

        Usually handled as special event or special booking.

        Stylist sets travel-inclusive pricing.

        Customer just sees a full amount.

Implementation note:

    Travel mode (flight vs car vs train, etc.) is captured in special_event_context or travel_preferences, not fully automated at v1.

    Over time, we can integrate travel-time calculations for calendar simulation, but that’s a future expansion.

---

## 9. How This Ties into Other Docs

06-database-schema.md

    Tables: bookings, booking_addons, booking_status_history, stylist_calendar_blocks, property_chair_reservations, payment_intents, payment_transactions, disputes.

05-smart-contract-architecture.md

    Booking contract IDs map to bookings.onchain_booking_id.

    Escrow flows follow status transitions defined here.

08-reputation-system-flow.md

    Uses booking lifecycle events (on-time, no-shows, cancellations, disputes) as input to TPS & reputation scores.

09-rewards-and-incentives-engine.md

    Rewards stylists/customers/property owners based on healthy behaviour through this state machine.

This document is the source of truth for how time, money, and trust move through a booking’s life in Vlossom.

---

# 07 — Booking & Approval Flow (v1.1)

End-to-end booking lifecycle with AA wallet logic, gasless UX, property rules, TPS integration, refunds, and multi-actor state machines.

---

## 1. Purpose of This Document

This document defines the complete on-chain + off-chain hybrid booking lifecycle for the Vlossom Platform, now updated for:

    AA wallet–first payments

    Gasless user operations (Paymaster-sponsored)

    Dual-layer approvals (Stylist + Property)

    TPS (Time Performance Score) logging

    Wallet-based refunds

    Special event booking flow

    Real-time notifications

    P2P tipping

    Unified global wallet UX

This ensures that all booking transitions are deterministic, audit-ready, and aligned with:

    Document 05 (System Architecture Blueprint)

    Document 06 (Database Schema)

    Document 13 (Smart Contract Architecture v2)

    Document 15 (Frontend UX Flows v1.1)

---

## 2. Core Booking Principles

### 2.1 Wallet-first Funding

    All bookings pull from AA wallet → escrow.

    If balance is insufficient → inline top-up → resume booking.

### 2.2 Gasless UX

Every user call is a UserOp sponsored by Vlossom Paymaster:

| Actor Action       | Gas Paid By |
| ------------------ | ----------- |
| Create booking     | Paymaster   |
| Stylist approval   | Paymaster   |
| Property approval  | Paymaster   |
| Start + completion | Paymaster   |
| Customer confirm   | Paymaster   |
| Cancel / dispute   | Paymaster   |

Users never see gas, chains, addresses, or signatures.

### 2.3 Mandatory Stylist Approval

    Stylist approval is always required.

### 2.4 Conditional Property Approval

Based on property rules:

    auto-approve allowed stylists

    require approval for new stylists

    blocklist enforcement

    TPS minimum threshold

    amenity compatibility

### 2.5 Immutable Pricing Once Booking Is Created

Price breakdown cannot change after creation:

    service price

    add-ons

    travel

    chair fee

    platform fee

Cancellation modifies how funds are distributed — not the base price.

### 2.6 Booking State Machine (Canonical)

Draft → PendingPayment → PendingStylistApproval → PendingPropertyApproval
    → Confirmed → InProgress → Completed → AwaitingCustomerConfirmation
    → Settled OR Disputed → Resolved

---

## 3. Booking States in Detail

### 3.1 Draft

User has selected:

    service

    add-ons

    stylist

    location type (home, salon, property)

    date/time slot

System computes:

    pricing

    estimated duration

    travel time

    chair availability

No record yet created on-chain.

### 3.2 PendingPayment

Triggered when customer taps Book Now.

Flow:

    Backend creates booking record off-chain

    Calls lockFunds(bookingId) on-chain

    AA wallet signs UserOp

    Paymaster sponsors gas

If insufficient funds:

    Inline onramp modal → top up AA wallet

    Auto-retry lockFunds

### 3.3 Pending Stylist Approval (always required)

Stylist receives:

    full quote

    location

    travel time estimate

    service duration

    customer rating snapshot

Stylist can:

    Accept

    Decline → instant refund to AA wallet

    Timeout → refund to customer AA wallet

    Suggest new time (phase 2)

TPS Logging:

    stylist approval time contributes to responsiveness.

### 3.4 Pending Property Approval (conditional)

Triggered only if property rules require manual checks.

Property sees:

    stylist profile

    customer profile

    chair requested

    time slot

    compatibility flags

    reputation thresholds

Possible outcomes:

    Approve

    Decline → refund (may apply penalties)

    Auto-approve (if rules allow)

TPS Logging:

    property approval responsiveness is logged.

---

## 4. Confirmed State

Booking enters Confirmed only when:

    stylist approved

    property approved (if required)

    funds locked in escrow

Customer receives:

    confirmation card

    calendar integration

    appointment preparation notes

Stylist receives:

    booking added to schedule

    travel time added to itinerary

Property receives:

    chair reserved

    chair visibility updated

---

## 5. In Progress State

Triggered by stylist tapping Start Appointment.

System logs:

    actual start time

    travel delay (if stylist arrived late)

    chair occupancy start

TPS Logging:

    lateness → TPS deduction

    punctuality → TPS positive signal

---

## 6. Completed → AwaitingCustomerConfirmation

Stylist taps Complete Service:

    timestamp stored

    potential add-on verification (future feature)

Customer receives:

    → “Confirm Completion” modal
    with optional P2P tip prompt.

If customer confirms:

    → move to Settled

If customer does not confirm in time window:

    → auto-confirm
    → move to Settled

TPS Logging:

    customer responsiveness tracked

    stylist completion delay tracked

## 7. Settlement Logic

releaseOnComplete(bookingId) triggers:

### 7.1 Revenue Split

| Share                | Destination                 |
| -------------------- | --------------------------- |
| Stylist share        | stylist AA wallet           |
| Property share       | property treasury AA wallet |
| Platform fee         | Vlossom Treasury            |
| Smoothing buffer fee | Vlossom Buffer (if enabled) |

Payout is instant due to VLP + Smoothing Buffer integration.

---

## 8. Cancellation & Refund Logic

Refund always goes to customer AA wallet.

All refund calls are gasless.

### 8.1 Customer-initiated Cancellation

Based on timing:

| Window             | Refund Outcome                                    |
| ------------------ | ------------------------------------------------- |
| Early cancellation | full refund                                       |
| Mid window         | partial refund + penalty to stylist/property      |
| Late / No show     | refund minus cancellation fee to stylist/property |

### 8.2 Stylist-initiated Cancellation

Always:

    full refund to customer

    penalty applied to stylist TPS

    potential fee from stylist to platform (future)

### 8.3 Property-initiated Cancellation

If property revokes chair due to:

    conflict

    maintenance

    emergency

Outcome:

    full refund

    option to rebook elsewhere

    property loses TPS

---

## 9. Dispute Flow

Customer or stylist may open a dispute:

Triggers:

    poor service

    incomplete service

    price manipulation accusations

    misrepresentation

Flow:

    move to Disputed

    escrow frozen

    admin panel opens dispute ticket

    admins resolve: refund / partial / stylist win

After resolution → Resolved

    ReputationRegistry receives signals.

---

## 10. Special Event Booking Flow

Special events differ from standard bookings.

### 10.1 Request Phase

Customer submits:

    detailed brief

    dates

    location(s)

    duration

    required stylists

Stylist receives → builds custom quote.

### 10.2 Quoting Phase

Stylist proposes:

    deposit amount

    total cost

    travel fees

    multi-day breakdown

    optional assistants

Customer accepts → deposit locked in escrow.

### 10.3 Standard Lifecycle

    Approved by stylist → property (if needed) → in-progress → completed.

### 10.4 Settlement

    Deposit + balance release conditions applied.

---

## 11. P2P Tipping & Add-ons

After completion:

    Customer may tip stylist directly

    Tip uses AA wallet → AA wallet

    Recorded in transaction history

    Does not affect service rating

---

## 12. Notifications (Full Coverage)

Every state transition emits:

    push notification

    in-app card

    timeline marker

Categories:

    booking created

    payment success/failure

    stylist approval

    property approval

    start appointment

    completion

    confirmation required

    dispute opened

    dispute resolved

    refund issued

    rebook suggestion

---

## 13. TPS Integration

The system logs:

    approval latency

    travel punctuality

    start time variance

    completion delay

    customer confirmation delay

    cancellation patterns

TPS influences:

    property approval rules

    search ranking

    stylist discovery visibility

    property discovery visibility

    long-term reputation badges

---

## 14. Booking Lifecycle Diagram

Draft
 ↓
PendingPayment
 ↓
PendingStylistApproval
 ↓
(Possible) PendingPropertyApproval
 ↓
Confirmed
 ↓
InProgress
 ↓
Completed
 ↓
AwaitingCustomerConfirmation
 ↓
Settled → Reputation → Rewards
        ↘
         Disputed → Resolved

---

## 15. Summary

This v1.1 version:

    unifies wallet logic

    integrates AA + Paymaster

    clarifies dual approval flow

    improves TPS-driven trust

    formalizes cancellation & refunds

    adds special event flow

    aligns with smart contract architecture

    creates deterministic, audit-ready transitions

This is now the canonical booking flow document for Vlossom Protocol.

---

## Δ — DELTA LOG (v1.0 → v1.1)

Added

    AA wallet–first funding mechanism

    Gasless UserOp transactions

    Property approval logic formalization

    TPS integration across lifecycle

    Special event multi-step flow

    Onramp inline fallback

    P2P tipping model

    Settlement split tables

    Refund always to AA wallet

    Full notification coverage list

    Booking diagram

Modified

    Replaced card-payment→escrow with wallet→escrow

    Enhanced cancellation timing logic

    Improved chair compatibility logic

    Clarified invariants around pricing immutability

Removed

    Direct payment via card

    Any non-AA wallet transaction logic






























































