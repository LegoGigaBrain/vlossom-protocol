# 08 — Reputation System Flow

A complete model of how Vlossom measures trust, performance, professionalism, reliability, and behavioural outcomes across all three sides of the marketplace.

This is one of the most strategically important documents in the entire Vlossom Protocol.
It defines how trust, professionalism, behaviour, punctuality, and quality are measured, recorded, and rewarded across all three actors:

    Stylists

    Property Owners

    Customers

This reputation system becomes the economic engine and trust substrate of the whole marketplace.

---

## 🌺 1. Purpose of This Document

Vlossom’s marketplace is built on trust, not just discovery.

Our reputation system:

    protects customers

    protects stylists

    protects property owners

    reduces disputes

    improves matching

    improves pricing fairness

    influences incentive eligibility

    powers future financing decisions

    drives ranking + visibility

    becomes permanent professional identity for stylists

    becomes permanent space quality identity for salon owners

This file defines:

    what signals we collect

    how we calculate scores

    how we store data

    how reputation affects ranking and incentives

    how it integrates with bookings, cancellations, disputes, TPS, property reviews, and customer behaviour

This is the backbone of the protocol.

---

## 🌸 2. Reputation Philosophy

Three key principles shape the Vlossom reputation model:

1. Behaviour > Reviews

    Most African beauty industry apps fail because they rely on text reviews that are emotional, inconsistent, or biased.

    Vlossom measures behaviour, timing, professional outcomes, and reliability.

2. Everyone gets a score

    Stylists

    Customers

    Property Owners

All three affect each other — and all three are part of the marketplace’s trust.

3. Scores are recoverable

    We are not punishing people for life.

    Consistent improvement overrides past issues.

---

## 🌼 3. Reputation Entities (Three-Sided Model)

The system tracks 3 distinct reputation graphs, each with different weightings:

### A. Stylist Reputation

The most critical reputation graph in the system.
It includes five categories:

#### 1. Punctuality Score (Time Performance Score — TPS)

Based on:

    start time vs scheduled

    completion time vs estimated

    lateness trends

    frequency of overruns

    buffer violation events

TPS alone becomes a major professional ranking input.

#### 2. Booking Reliability Score

Based on:

    on-time arrivals

    low cancellation rate

    low decline rate

    low no-show rate

    response time to booking requests

This is the strongest predictor of platform trust.

#### 3. Customer Feedback Score

Structured ratings collected after completed service:

    professionalism

    cleanliness & equipment

    communication

    quality of service

    hairstyle outcome

We avoid vague ratings — instead we use clear, discrete, structured scoring.

#### 4. Property Owner Feedback Score

Newly added (per your suggestion):
Property owners review stylists for:

    chair cleanliness

    behaviour in salon

    punctuality in salon environment

    compliance with house rules

    respectful use of amenities

    equipment maintenance

    client-handling professionalism

    overall reliability

This is CRUCIAL for the phase 2 chair marketplace.

#### 5. Dispute & Compliance Score

Behaviour flagged via:

    customer disputes

    stylist-caused cancellations

    pattern of disputes

    hygiene/safety issues

    policy violations

Scores can drop steeply here depending on severity.


### B. Property Owner / Salon Reputation

Property owners also get a reputation graph.

Categories:

#### 1. Space Quality Score

Based on customer and stylist perceptions:

    cleanliness

    lighting

    amenities

    comfort

    reliability

    safety

    professionalism

    decor/experience

#### 2. Operational Reliability Score

Based on:

    no sudden cancellations

    reliable opening hours

    correct chair inventory

    effective communication

    consistent amenity availability

#### 3. Stylist Review Score

Stylists rate:

    how well the space supports their services

    chair quality

    vibes / professionalism

    infrastructure consistency

    how easy the owner is to work with

#### 4. Dispute History Score

Flags if:

    salon overbooks

    amenities break repeatedly

    multiple stylists report issues

    safety concerns arise


### C. Customer Reputation

To protect stylists and prevent abuse:

#### 1. Punctuality Score

Based on:

    arriving late

    disappearing

    causing schedule issues

#### 2. Booking Reliability Score

Based on:

    cancellations (especially last-minute)

    payment failures

    no-shows

#### 3. Behaviour Score

Stylists can flag:

    bad behaviour

    disrespect

    unsafe situations

    deliberate damage

Property owners can flag:

    misuse of space

    bad interactions

    harassment

    rule breaking

#### 4. Dispute Score

Customers who frequently escalate disputes may receive:

    reduced ranking

    requirement to prepay

    stricter policy enforcement

---

## 🌺 4. Data Inputs & Event Flow

Reputation is not stored as one number — it is the aggregation of events from the booking lifecycle.

Events come from:

### ✔ From bookings table

    confirmed bookings

    cancellations

    reschedules

    declines

    no-shows

    completion times

    actual duration

    special event handling

    travel behaviour

### ✔ From booking_status_history

    timestamps

    transitions

    sequence patterns

### ✔ From property_chair_reservations

    chair usage reliability

    adherence to assigned times

    cleanliness behaviour

### ✔ From rating tables

    customer → stylist

    stylist → customer

    stylist → property

    property → stylist

### ✔ From disputes

    raised disputes

    resolved disputes

    outcomes (stylist fault / customer fault / property fault / neutral)

### ✔ From TPS (Time Performance Score) engine

    lateness

    overruns

    early finishes

    multi-day consistency

### ✔ From analytics

    daily averages

    peak time behaviour

    geographic behaviour patterns

---

## 🌼 5. Score Architecture (How Scores Are Computed)

Each actor has multiple score types, stored independently in DB.

We do not use a single “5-star global score”.
Instead: modular scoring → composite profile → dynamic weighting.

Example (Stylist):

stylist_score = weighted_sum([
  TPS_score,
  booking_reliability,
  customer_feedback,
  property_feedback,
  dispute_penalties
])

Each sub-score is a 0–100 normalized scale.

Weighting strategy (v1 suggestion):

    TPS: 25%

    Booking Reliability: 25%

    Customer Feedback: 25%

    Property Feedback: 15%

    Dispute & Compliance: 10%

Can evolve over time.

---

## 🌸 6. Behavioural Flags

Not everything is a number.

We track behavioural flags:

    consistent lateness

    repeated cancellations

    hygiene issues

    policy violations

    safety concerns

    dispute frequency

    inappropriate behaviour

These flags:

    influence rankings

    influence property owner approvals

    limit access to premium spaces

    affect eligibility for rewards

    affect financing creditworthiness in future

Flags decay over time with good behaviour.

---

## 🌼 7. Ranking Algorithm Integration

Reputation feeds directly into:

List Ranking for Customers

    top stylists surface first

    poor reputation stylists appear lower

    relevance + location + reputation combine

Salon/Property Search Ranking

    higher quality salons surface higher

Cross-border travel matching

    Only high-reputation stylists should be eligible.

Special event eligibility

    High trust required for weddings, VIP clients, etc.

---

## 🌿 8. Incentives & Rewards Integration

Reputation is used to determine:

Stylist perks:

    lower platform fees

    access to premium salons

    visibility boosts

    rewards multipliers

    instant payout eligibility

    creditworthiness for DeFi financing

Property perks:

    featured salon listings

    higher chair pricing score

    increased exposure

    partnerships/programs

Customer perks:

    VIP discounts

    booking fee discounts

    relaxed cancellation penalties

    loyalty credits

The Rewards Engine (next doc) plugs directly into reputation metrics.

---

## 🌍 9. How the System Handles Bad Behaviour

Reputation drops create:

    limited visibility

    higher fees

    restricted booking types

    reduced access to premium spaces

    requirement for prepayment

    loss of special privileges

    temporary suspensions (in severe cases)

The system is designed to:

    protect the ecosystem

    encourage professionalism

    allow recovery after improvement

No one is permanently punished unless behaviour is severe and repeated.

---

## 🌺 10. Storage Model (Where Data Lives)

Primary DB Tables:

    reputation_scores

    reputation_events

    tps_metrics

    behaviour_flags

    property_reviews

    customer_reviews

    stylist_reviews

Secondary Inputs:

    bookings

    booking_status_history

    disputes

    property_chair_reservations

On-Chain Anchoring (Phase 3+)

We anchor checkpointed scores on-chain for:

    professional identity

    financing eligibility

    rewards integration

    cross-app portability

But not full detail — only aggregate, not raw logs.

---

## 🌸 11. Recovery & Decay Model

Reputation decays over time for:

    old bad reviews

    old disputes

    old flags

    old penalties

Conversely:

    consistent good bookings

    high TPS

    positive customer feedback

    clean property owner reviews

Cause scores to rise.

The goal:
    Reward consistency, not perfection.

---

## 🌟 12. V1.5 Implementation Status

The reputation system has been implemented in V1.5 with the following components:

### Database Models (Prisma Schema)

```prisma
model ReputationScore {
  id                 String   @id @default(cuid())
  userId             String   @unique
  userType           UserType
  totalScore         Int      @default(10000)  // 0-10000 (displayed as 0-100%)
  tpsScore           Int      @default(10000)  // Time Performance Score
  reliabilityScore   Int      @default(10000)  // Booking reliability
  feedbackScore      Int      @default(10000)  // Customer/stylist reviews
  disputeScore       Int      @default(10000)  // Dispute-free bonus
  completedBookings  Int      @default(0)
  cancelledBookings  Int      @default(0)
  noShows            Int      @default(0)
  isVerified         Boolean  @default(false)  // 70% + 5 bookings
  lastCalculatedAt   DateTime @default(now())
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model ReputationEvent {
  id         String   @id @default(cuid())
  userId     String
  eventType  String   // BOOKING_COMPLETED, NO_SHOW, CANCELLATION, REVIEW_RECEIVED
  score      Int      // Impact on score (-100 to +100)
  metadata   Json?    // Event-specific data
  createdAt  DateTime @default(now())
}

model Review {
  id            String     @id @default(cuid())
  bookingId     String
  reviewerId    String
  revieweeId    String
  reviewType    ReviewType // CUSTOMER_TO_STYLIST, STYLIST_TO_CUSTOMER, etc.
  overallRating Int        // 10-50 (displayed as 1-5 stars)
  // Sub-ratings (all 10-50 scale)
  punctuality   Int?
  professionalism Int?
  quality       Int?
  communication Int?
  cleanliness   Int?
  comment       String?
  createdAt     DateTime   @default(now())
}
```

### TPS Calculation Pipeline

Located at: `services/api/src/lib/reputation.ts`

**Score Weights (V1 Implementation):**
- TPS: 30%
- Reliability: 30%
- Feedback: 30%
- Disputes: 10%

**TPS Calculation Formula:**
```typescript
// Start Punctuality (50% of TPS)
// - On time or early: 100%
// - 1-5 min late: 90%
// - 5-15 min late: 70%
// - 15-30 min late: 40%
// - 30+ min late: 10%

// Duration Accuracy (50% of TPS)
// - Within 10%: 100%
// - Within 20%: 80%
// - Within 30%: 60%
// - Over 30%: 40%
```

**Verification Threshold:**
- Minimum score: 70%
- Minimum completed bookings: 5

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews` | POST | Create a review |
| `/api/reviews/booking/:bookingId` | GET | Get reviews for a booking |
| `/api/reviews/user/:userId` | GET | Get reviews for a user |
| `/api/reputation/:userId` | GET | Get reputation score |
| `/api/internal/reputation/recalculate` | POST | Batch recalculate all scores |

### Scheduler Integration

The reputation recalculation runs every 6 hours via the scheduler service:
```typescript
const REPUTATION_RECALC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
```

### Smart Contract

`ReputationRegistry.sol` stores on-chain anchors:
- Score commitments (hash of off-chain score)
- Verification status
- Checkpoint timestamps

### UI Components

Located at: `apps/web/src/components/reputation/`

| Component | Description |
|-----------|-------------|
| `ReputationBadge` | Score circle with color coding |
| `ReputationCard` | Full score breakdown with progress bars |
| `StarRating` | Interactive 1-5 star rating input |
| `ReviewList` | List of reviews with avatars and comments |

---

## 🌟 13. Final Summary

The Vlossom Reputation System:

    turns performance into professional identity

    drives platform trust

    fuels incentive distribution

    powers salon matching

    protects chairs/property

    creates a fair customer feedback loop

    mitigates abuse

    unlocks future financing

    becomes globally portable for stylists

This system is the DNA of the Vlossom Protocol — the layer that converts real-world behaviour into measurable trust, powering everything from bookings to payments to future DeFi.























































































