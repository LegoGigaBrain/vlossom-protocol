# 17 — Property Owner & Chair Rental Module

Logic, Rules, Smart Contract Integration & UX for Salon Spaces and Chairs

---

## 1. Purpose of This Document

This document defines the full architecture for the Property Owner (Salon Owner) and Chair Rental layer of the Vlossom Protocol.

It formalizes:

    how properties/salons are registered

    how chairs are modeled

    how stylists rent chairs (per booking / per day / per week / per month)

    how availability is computed

    how chair amenities affect booking compatibility

    how approval rules work

    how payouts are routed into the property treasury

    how reputation and reviews apply to property owners

    how property owners interact with stylists, schedules, and wallets

    how these components integrate with booking, escrow, and smart contracts

This module is the backbone for the “third actor” in the marketplace, enabling a hybrid model of:

    mobile stylists + fixed stylists + high-end salon experiences + flexible chair rentals

---

## 2. Philosophy & Goals

Property owners are NOT a passive afterthought. They are:

    revenue generators

    quality amplifiers

    trust anchors

    infrastructure partners

    the “beauty real estate” layer of Vlossom

The chair marketplace differentiates Vlossom from every other beauty booking app.

Core goals:

### 2.1 Reduce friction for property owners

They must feel:

    “this app fills my chairs”

    “this app automates admin I hate doing”

    “this app protects my business”

### 2.2 Empower stylists with access to professional space

Stylists should be able to:

    book a chair instantly

    see prices

    see amenities

    work across locations

### 2.3 Transparency for customers

Customers can choose:

    stylist-only (mobile or fixed)

    stylist + salon space

    salon-only recommendations (future expansion)

### 2.4 Fair pricing & soft guidance system

Vlossom sets soft ranges (average market ranges).
Owners can exceed ranges, but the UI will show:

    “Above market average”

    “Premium pricing”

    “Budget pricing”

This reinforces transparency, not constraints.

---

## 3. Property Owner Lifecycle (High-Level)

A property owner:

    Signs up → becomes a Property Owner

    Registers their salon/property

    Adds chairs + amenities

    Sets pricing & availability

    Sets approval rules

    Receives booking requests involving their property

    Receives chair rental fees (on-chain payout)

    Earns reputation from stylists and customers

    Everything must be simple, predictable, and financially transparent.

---

## 4. Property Registration Flow

### 4.1 Property Setup (Step 1)

Owner provides:

    Property Name

    Full Address

    Map Pin (required for booking logistics and travel computation)

    Photos (interior, chairs, equipment)

    Description (optional but recommended)

    Salon Category (e.g., luxury, boutique, standard, home-based)

Stored Off-chain:

    Images

    Detailed descriptions

    3D/AR future additions

Stored On-chain:

    propertyId

    ownerAddress

    metadataHash

    approval flags

    chair count

    amenity flags

---

## 5. Chair Modeling (The Heart of This Module)

A property is a container.
A chair is the atomic rentable unit.

### 5.1 Chair Attributes

Each chair has:

    chairId

    propertyId

    type (braid chair, barber chair, styling station, etc.)

amenity flags:

    wash basin

    adjustable seat

    mirror

    lighting

    plug points

    premium station tools

base pricing

soft range classification:

    Budget

    Average

    Premium

availability calendar

rental modes enabled:

    per booking (split model)

    per hour

    per day

    per week

    per month

### 5.2 Chair Availability Logic

Availability is computed by merging:

    chair rental periods

    stylist bookings assigned to that chair

    maintenance blocks

    owner-created blackout periods

Rules:

    If a chair is booked for a day/week/month rental → it is unavailable for all other stylists.

    If a chair is assigned to a booking → no overlap allowed.

    If a stylist requests a booking at a property, the system must compute compatible chairs based on:

        amenity compatibility

        availability

        pricing

        stylist blocklist rules

---

## 6. Approval Logic (Hybrid System)

Property owners can enable:

### OPTION A — Full Approval Required

Every booking involving their property requires owner approval.

### OPTION B — No Approval Required (Fast Mode)

Bookings auto-confirm unless stylist is blocklisted.

### OPTION C — Conditional Approval (Hybrid)

Owner defines rules:

    minimum stylist reputation score

    minimum TPS

    banned styles (e.g., color service in a braids-only salon)

    banned service categories

    limit on mobile stylists using space

    time-of-day approval rules

    weekend approval rules

### OPTION D — “Intelligent Approval” (future)

System auto-approves based on ML models + past performance.

    For MVP, we support A, B, C.

---

## 7. Booking Flow Involving a Property

These steps integrate with Document 07 and Document 13.

### 7.1 Customer Creates Booking Request

Customer chooses:

    stylist

    service

    add-ons

    property/salon location

    date & time

Platform does:

    checks chair compatibility

    chooses a valid chair candidate

    calculates travel time (if mobile stylist meets property)

    displays a final quote (stylist fee + chair fee + platform fee)

### 7.2 Escrow Locks Funds

Smart contract (Escrow) locks:

    customer payment

    full chair fee

    penalties (configurable)

### 7.3 Approval Process

Flow:

    Stylist must approve first

    If property requires approval → send request

    If property auto-approval is enabled and rules are satisfied → auto-confirm

    If property rejects → refund customer

Notifications:

    customer notified

    stylist notified

    property notified

    alternate salon suggestions (future)

---

## 8. Chair Rental Logic (For Stylists)

Stylists can:

    rent a chair per booking

    rent a chair per day

    rent a chair per week

    rent a chair per month

Each rental creates a contract-level "rental lock" similar to booking holds.

### 8.1 Per Booking Split Model

Basic flow:

    stylist uses salon

    property earns chair fee

    payout occurs once booking is confirmed as completed

### 8.2 Fixed-Term (Day/Week/Month)

Flow:

    Stylist selects chair

    Selects rental term

    Platform calculates cost

    Stylist approves rental

    Funds locked in escrow

    Chair is blocked for the rental window

    Owner receives payout after rental begins

    Refund rules apply if stylist cancels early

This is extremely important for stylists who:

    don’t own a salon

    want premium space

    want flexibility

---

## 9. Chair Rental Smart Contract Logic

(Integrates with Doc 13 — Smart Contract Architecture)

### 9.1 VlossomPropertyRegistry

Stores:

    property address

    chairs

    rental modes

    approval rules

### 9.2 BookingEscrow

Handles financial flows:

    chair fee → property treasury

    stylist fee → stylist

    platform fee → treasury

    cancellation logic

### 9.3 Events Emitted:

    ChairReserved

    ChairRentalStarted

    ChairRentalEnded

    ChairRentalCancelled

    ChairApprovalRequired

    ChairApprovalGranted

    ChairApprovalDenied

---

## 10. Pricing Engine for Chair Rentals

Based on Document 20 (later), pricing includes:

    base salon chair fee

    category multipliers

    amenity multipliers

    peak-time multipliers

    soft range indicators

    stylist reputation modifiers (future)

---

## 11. Property Owner Dashboard UX (Document 15 Integration)

The property owner dashboard shows:

### 11.1 Chair Overview

    all chairs

    availability

    rental modes

    pricing

    amenity list

### 11.2 Approvals Queue

    pending stylist approvals

    pending special event proposals

    pending cross-border service requests

### 11.3 Rules

    auto-approval toggle

    reputation thresholds

    stylist blocklist

    allowed service categories

    travel rules

### 11.4 Financials

    chair rental earnings

    per-booking splits

    payout history

    upcoming settlements

    export PDF/CSV

### 11.5 Reputation

Property owner rating is derived from:

    stylist reviews

    customer reviews

    cancellation handling

    chair quality

### 11.6 Notifications

    booking requests

    rental requests

    dispute escalations

    review received

    payout confirmations

### 11.7 Wallet & Escrow Integration (Critical Clarification)

Property owners interact with Vlossom’s Global Wallet System, not a separate “property wallet”.

Each property owner has one primary Vlossom wallet that:

    receives chair rental payouts

    receives per-booking chair fee splits

    processes refunds and dispute resolutions

    interfaces with escrow outcomes

    supports future DeFi participation (via Wallet → DeFi tab)

#### Chair Rental Payout Flow

For any booking or fixed-term chair rental:

    Customer or stylist funds are locked in BookingEscrow

    Upon successful completion or rental start:

        chair fee is released from escrow

        funds are routed to the property owner’s global wallet

    Wallet balance updates immediately

    Transaction appears in:

        Wallet → Transaction History

        Property Owner Dashboard → Financials

#### Refunds & Disputes

Property owners may be required to:

    approve refunds

    accept partial payouts

    return funds to escrow (e.g. booking rejection, dispute resolution)

In these cases:

    funds are deducted from the same global wallet

    escrow enforces invariants (no overdrafts, no double-spend)

    all actions are logged for admin oversight

#### Wallet Balance Checks (Fixed-Term Rentals)

For day / week / month chair rentals:

    stylist wallet balance is checked before escrow lock

    if balance is insufficient:

        onramp flow is triggered

        or booking is blocked until funded

This mirrors booking flows and keeps financial logic consistent across the platform.

#### Future Compatibility

Because payouts live in the global wallet:

property owners can later:

    stake into Vlossom LPs

    manage treasury via multi-sig (future)

    allocate earnings across businesses or staff

no migration is required when these features are enabled

This design ensures financial clarity, composability, and future-proofing.

---

## 12. User Stories (Clear Alignment)

### Owner Story 1 — Auto-Approval Streamlined Business

“I want bookings to proceed instantly unless I’ve banned the stylist or they’re below a certain reputation.”

### Owner Story 2 — High-End Salon Premium Pricing

“My salon is ultra-premium, so my chairs cost more. The system should show customers ‘premium pricing’ but not restrict me.”

### Owner Story 3 — Multi-Day Rental

“I want to rent my chair to a stylist for a full week and let the system block out everything else.”

### Owner Story 4 — Stylist Problem

“If a stylist keeps cancelling or damaging tools, I want to block them, and they should never be matched to my chairs again.”

### Owner Story 5 — Special Event Money

“When a stylist is booked for a wedding and needs my salon for prep, I want clear visibility and approval control.”

---

## 13. Edge Cases & Failure Modes

### 13.1 Chair Double Booking

System prevents:

    chair assigned to two stylists at same time

    long-term rental overlapping with per-booking

### 13.2 Property Rejects Booking

    Refunds handled via Escrow.
    Stylist availability recalculated.
    Customer gets alternative suggestions.

### 13.3 Last-Minute Cancellations

Depending on policies:

    property receives partial payout

    stylist loses TPS

    customer may lose partial amount

### 13.4 Overlapping Amenities

    If stylist requires “wash basin” but chair doesn’t have it → chair excluded.

### 13.5 Maintenance Blocks

    Owner blocks chair for repairs → overrides all.

---

## 14. Future Extensions

### 14.1 Multi-Sig Salon Treasury (Aligns with Doc 13 Future Extensions)

Salon owner can upgrade their treasury from single AA wallet to multi-sig.

### 14.2 Staff Management

Property owners add:

    receptionists

    assistants

    salon managers

They can approve bookings or message stylists.

### 14.3 Salon Chain Expansion

One owner → multiple properties under same brand.

### 14.4 Chair Subscription Bundles

Recurring rentals with subscription discounts.

### 14.5 Salon-as-a-Service API

External apps request chair inventory.

---

## 15. V1.5 Implementation Status

The Property Owner module has been implemented in V1.5 with the following components:

### Database Models (Prisma Schema)

```prisma
model Property {
  id              String         @id @default(cuid())
  ownerId         String
  owner           User           @relation(fields: [ownerId], references: [id])
  name            String
  description     String?
  address         String
  city            String
  postalCode      String?
  country         String         @default("ZA")
  latitude        Float?
  longitude       Float?
  category        PropertyCategory @default(STANDARD)
  photos          String[]       @default([])
  amenities       String[]       @default([])
  operatingHours  Json?
  approvalMode    ApprovalMode   @default(APPROVAL_REQUIRED)
  minReputation   Int?
  isActive        Boolean        @default(true)
  chairs          Chair[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Chair {
  id            String         @id @default(cuid())
  propertyId    String
  property      Property       @relation(fields: [propertyId], references: [id])
  name          String
  type          ChairType      @default(STYLING_STATION)
  amenities     String[]       @default([])
  rentalModes   RentalMode[]   @default([PER_BOOKING])
  // Pricing in cents (BigInt for precision)
  pricePerBooking BigInt?
  pricePerHour    BigInt?
  pricePerDay     BigInt?
  pricePerWeek    BigInt?
  pricePerMonth   BigInt?
  isActive      Boolean        @default(true)
  rentals       ChairRentalRequest[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model ChairRentalRequest {
  id          String              @id @default(cuid())
  chairId     String
  chair       Chair               @relation(fields: [chairId], references: [id])
  stylistId   String
  stylist     User                @relation(fields: [stylistId], references: [id])
  rentalMode  RentalMode
  startDate   DateTime
  endDate     DateTime
  totalPrice  BigInt
  status      ChairRentalStatus   @default(PENDING)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

enum PropertyCategory {
  LUXURY
  BOUTIQUE
  STANDARD
  HOME_BASED
}

enum ChairType {
  BRAID_CHAIR
  BARBER_CHAIR
  STYLING_STATION
  WASH_STATION
  MAKEUP_STATION
}

enum RentalMode {
  PER_BOOKING
  PER_HOUR
  PER_DAY
  PER_WEEK
  PER_MONTH
}

enum ApprovalMode {
  APPROVAL_REQUIRED
  AUTO_APPROVE
  CONDITIONAL
}

enum ChairRentalStatus {
  PENDING
  APPROVED
  REJECTED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | List properties (filterable) |
| `/api/properties` | POST | Create property |
| `/api/properties/:id` | GET | Get property details |
| `/api/properties/:id` | PUT | Update property |
| `/api/properties/:id/chairs` | GET | List chairs for property |
| `/api/chairs` | POST | Create chair |
| `/api/chairs/:id` | PUT | Update chair |
| `/api/chairs/:id` | DELETE | Soft delete chair |
| `/api/chair-rentals` | POST | Request chair rental |
| `/api/chair-rentals/:id/approve` | POST | Approve rental |
| `/api/chair-rentals/:id/reject` | POST | Reject rental |
| `/api/chair-rentals/property/:propertyId` | GET | List rentals for property |

### Smart Contract

`PropertyRegistry.sol` provides on-chain registration:

```solidity
// Property structure stored on-chain
struct Property {
    address owner;
    bytes32 metadataHash;  // Hash of off-chain metadata
    uint256 chairCount;
    bool isActive;
    uint256 createdAt;
}

// Key functions
function registerProperty(bytes32 metadataHash) external returns (uint256)
function updateProperty(uint256 propertyId, bytes32 metadataHash) external
function addChairs(uint256 propertyId, uint256 count) external
function deactivateProperty(uint256 propertyId) external
function getProperty(uint256 propertyId) external view returns (Property memory)
function getPropertiesByOwner(address owner) external view returns (uint256[] memory)
```

### UI Dashboard

Located at: `apps/web/src/app/property-owner/`

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/property-owner` | Stats overview, quick actions |
| Properties | `/property-owner/properties` | List/manage properties |
| Chairs | `/property-owner/chairs` | Chair inventory management |
| Requests | `/property-owner/requests` | Rental request approvals |

**Dashboard Features:**
- Property count and occupancy stats
- Active chair count
- Pending request notifications
- Recent rental requests list
- Quick action buttons (Add Property, Add Chair, View Requests)

**Properties Page:**
- Property cards with photo, address, chair count
- Add new property form
- Occupancy percentage per property
- Edit/manage property details

**Chairs Page:**
- Filter chairs by property
- Chair type badges (Styling Station, Barber Chair, etc.)
- Pricing display (per booking/hour/day/week/month)
- Add new chair form with property selection

**Requests Page:**
- Pending rental requests queue
- Stylist information with reputation badge
- Approve/Reject action buttons
- Request details (dates, pricing, rental mode)

### Implementation Notes

**Approval Modes Supported (V1.5):**
- APPROVAL_REQUIRED (Option A) — Every request needs manual approval
- AUTO_APPROVE (Option B) — Auto-confirm unless blocklisted
- CONDITIONAL (Option C) — Partial implementation (reputation threshold only)

**Not Yet Implemented:**
- Intelligent Approval (Option D) — ML-based auto-approval
- Chair availability calendar UI
- Maintenance block scheduling
- Multi-sig salon treasury
- Staff management

---

## 16. Summary

The Property Owner & Chair Rental Module:

    establishes property owners as equal-value actors

    powers the salon-chair marketplace

    ensures multi-directional trust (customer ↔ stylist ↔ owner)

    integrates cleanly with booking, escrow, smart contracts, UX, reputation

    supports hybrid workflows (mobile, fixed, cross-border, premium salons)

    future-proofs for salon franchises, multi-sig treasuries, and RWA expansions

This is the authoritative reference for all chair rental logic, owner flows, and integrations.





























































