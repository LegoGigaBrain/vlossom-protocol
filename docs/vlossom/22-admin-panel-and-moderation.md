# 22 — Admin Panel & Moderation System

Platform Oversight, Safety Controls, Financial Monitoring & Human/Automated Governance for Vlossom

---

## 1. Purpose of This Document

This document defines the full administration, moderation, compliance, safety, and oversight architecture for the Vlossom platform.

It provides:

    Tools for platform admins & support staff

    Automated moderation logic + risk engine

    Manual review workflows

    Dispute resolution systems

    Safety escalation procedures

    Financial oversight (escrow, paymaster, wallet, LP)

    Content moderation (posts, profiles, reviews)

    Actor governance (customers, stylists, property owners)

It ensures:

    Trust

    Safety

    Fraud reduction

    Fairness

    System stability

This supports:

    Backend engineering

    Smart contract interactions

    Admin dashboard UI design

    On-call support operations

    Chain integrity

    Compliance and auditing

---

## 2. Philosophy of Vlossom Admin & Moderation

### 2.1 Safety is a Product Feature

Trust drives retention. Admin tools must prevent fraud, abuse, and unsafe behaviors.

### 2.2 Human + Automated Moderation

Automation manages 90% of detection;
Humans manage nuance & complex cases.

### 2.3 Unified Actor Overview

Customers, stylists, and property owners all have risk scores.
Admin sees a 360° profile for each actor.

### 2.4 Chain Transparency + Web2.5 Clarity

On-chain logic provides verifiability;
Admin tools present it in a friendly visual dashboard.

---

## 3. Admin Roles & Permissions

We define a structured role hierarchy:

### Platform Super Admin

    Full permissions

    Access to treasury, paymaster, chain configs

    Can freeze/unfreeze accounts

    Can override booking states in emergencies

### Operations Admin

    Customer/stylist/property moderation

    Dispute resolution

    Refund approvals

    Review moderation

    No treasury access

### Financial Admin

Oversight of:

    Escrow flows

    Paymaster usage

    Onramp/offramp reconciliation

    LP pools and rewards

Cannot change personal data or ban users

### Support Agent

    Handle tickets

    Perform limited account checks

    Cannot freeze accounts or change booking states

### Automated Moderation Engine

(Not a human role)

    Detects anomalies

    Flags accounts

    Suggests actions

Cannot execute irreversible actions

---

## 4. Admin Dashboard Structure

The Admin Panel should be a modular, tile-based UI showing:

    User Management

    Bookings & Disputes

    Financial Oversight

    Property & Salon Oversight

    Reputation & Reviews

    Content Moderation (Posts / Media)

    Risk & Fraud Monitoring

    System Logs & Alerts

    DeFi & Liquidity Oversight

    Paymaster Monitoring

    Configuration Management

Each section will be detailed below.

---

## 5. User Management (Customers, Stylists, Property Owners)

Admin UI allows viewing:

### Actor Profile Overview

    Personal info (encrypted where needed)

    Role(s): customer, stylist, property owner, LP

    Reputation snapshot

    TPS performance

    Cancellation history

    No-show score

    Referral history

    Linked socials

    Wallet address + activity

### Actions Available

    Freeze account

    Unfreeze account

    Issue warning

    Reset verification requirements

    View risk score

    Override flagged data (rare)

### Actor States

    Active

    Limited (restricted actions allowed)

    Shadowbanned (not visible in search but can see bookings)

    Suspended

---

## 6. Booking & Dispute Moderation


### Admin Dashboard: Bookings Table

#### Filter by:

    Pending

    Active

    Refunded

    Awaiting approval

    Disputed

    Cancelled

### Booking Detail View

#### Shows:

    Customer → Stylist → Property Owner chain

    Payment timeline

    Escrow event logs

    Chat transcripts (Phase 2)

    Location metadata (approximate)

    Time of booking vs scheduled time

### Admin Actions

    Override booking to COMPLETE

    Override booking to CANCEL

    Partial refund

    Full refund

    Penalize actor (affects reputation)

    Issue compensation

    Block future interactions between specific actors

### Dispute Resolution Workflow

#### Automated triage detects:

    mismatch in completion time

        stylist no-show

        customer unresponsive

        property unavailable

    Admin reviews evidence

    Admin selects outcome template

    Smart contract settlement executed accordingly

---

## 7. Financial Oversight Dashboard

Critical for Paymaster, escrow, rewards, and LP safety.

### 7.1 Escrow Monitor

Shows:

    Total escrowed funds

    Funds awaiting settlement

    Funds locked in disputes

    Refund queue

    Split breakdown per booking

### 7.2 Payment Flow Visualizer

Shows chain events:

    lockFunds

    releaseOnCompletion

    refundOnCancellation

    property / stylist / treasury payouts

### 7.3 Paymaster Monitor

Shows:

    Daily gas spend

    Tx count

    Wallet balance

    Flagged anomalies

    Per-user gas quota usage

Additional controls:

    per-user daily gas allowance
    per-role gas profiling (customer vs stylist vs owner)
    emergency gas throttling
    abuse pattern alerts (spam tx attempts)

Admins can:

    top up paymaster from treasury
    pause sponsorship for specific accounts
    globally pause gas sponsorship in emergencies

### 7.4 Onramp / Offramp Reconciliation

Tracks:

    fiat → USDC confirmations

    pending fiat clearances

    flagged chargebacks

    auto-hold logic

### 7.5 Wallet Oversight

Admin view includes:

    freeze wallet

    unfreeze wallet

    inspect suspicious transfers

    check P2P patterns

    enforce limits

### 7.6 Global Wallet & Account Abstraction Governance

Admins oversee all user wallets through a unified Account Abstraction (AA) model.

Admin visibility includes:

    AA wallet address (per actor)
    linked external addresses (if any)
    wallet role context (customer / stylist / owner / LP)
    balance snapshots (stablecoin-denominated)
    transaction history (bookings, P2P, LP, refunds)

Admin actions:

    freeze wallet (halts all outgoing actions)
    unfreeze wallet
    temporarily restrict actions (P2P only / booking only / LP only)
    inspect abnormal wallet behavior (velocity, laundering patterns)
    trigger forced refunds (via escrow, not direct wallet drain)

Important invariants:

    Admins cannot arbitrarily seize user funds.
    All wallet freezes are reversible and logged.
    Escrowed funds follow BookingEscrow rules even during wallet freezes.

---

## 8. Property & Salon Moderation Tools

Admin must be able to manage:

### 8.1 Property Verification

    Review submitted salon images

    Validate amenities

    Approve / reject property

### 8.2 Chair Oversight

    Inspect chair availability patterns

    Detect overpriced configuration

    Flag chairs with low ratings

### 8.3 Property Owner Behavior Analysis

Detect:

    repeated last-minute declines

    stylist complaints

    unsafe environment reports

Admin actions:

    reduce discoverability

    temporary freeze

    remove listing

    force re-verification

---

## 9. Reputation & Reviews Moderation

Admins can view:

    all reviews for an actor

    timeline of ratings

    spam patterns

    sentiment anomalies

Moderation Actions

    Delete review

    Edit (rare, but allowed in certain cases)

    Mark review as disputed

    Apply actor reputation penalty

    Auto-weight reviews based on risk engine

---

## 10. Content Moderation (Posts, Media, Announcements)

(Phase 2 functionality but documented now)

Admin can:

    Approve flagged media (photos, videos)

    Delete inappropriate content

    Shadow-hold posts pending review

    Detect spammy announcement behavior

---

## 11. Risk & Fraud Monitoring Engine

A dedicated section showing:

### Alerts Dashboard

Alerts generated by anomaly detection:

    Excessive cancellations

    Suspicious referral chains

    Stylist success rates inconsistent with actual bookings

    Property repeatedly rejecting high-TPS stylists

    P2P laundering indicators

    Unusual LP deposit bursts

### Actor Risk Score

Score components:

    Financial risk

    Behavioral risk

    Fraud risk

    Review quality

    Device fingerprint pattern

    Referral tree analysis

Admin can override scores but logs must persist.

---

## 12. DeFi & Liquidity Oversight (Admins Only)

Admins see:

### 12.1 VLP Metrics

    total liquidity

    active LP distribution

    yield trend

    smoothing buffer balances

### 12.2 Community Pools

    top referrer-created pools

    pool health

    APY

    suspicious patterns

    withdrawal spikes

### 12.3 Governance Actions

    freeze pool

    adjust APY model parameters

    disable new deposits

    initiate emergency withdrawals (if pool hacked)

### 12.4 Treasury Management

Treasury dashboard shows:

    inflows from platform fees

    outflows to paymaster

    LP yield allocations

    grants & ecosystem spend

---

## 13. System Logs & Alerts

### 13.1 Immutable Audit Log

Tracks:

    admin actions

    sensitive changes

    account freezes

    dispute resolutions

    fund movements

Logs must be:

    tamper-proof

    exportable

    filterable

All wallet freezes, escrow overrides, refunds, and paymaster interventions emit immutable on-chain or indexed events for auditability.

### 13.2 System Health Alerts

    chain congestion

    indexer lag

    booking engine time drift

    paymaster low balance

---

## 14. Configuration Management

Admin UI allows safe updates to:

### Booking config

    cancellation windows

    time thresholds

    approval timeout

### Pricing config

    platform fee range

    chair fee minimums

    travel compensation rules

### Reputation weights

    TPS weight

    review computation

### DeFi parameters

    pool caps

    withdrawal cooldown

    yield multipliers

Each change emits on-chain events (via Config contract).

---

## 15. Abuse Prevention Logic

### 15.1 Stylists

Prevent:

    price gouging

    no-shows

    abusive cancellations

    multi-account fraud

### 15.2 Customers

Prevent:

    non-payment

    unsafe homes

    harassment

    fake reviews

### 15.3 Property Owners

Prevent:

    discrimination

    chair overpricing

    unsafe conditions

Admin tool flags patterns and triggers recommendations.

---

## 16. Physical Safety Oversight

Moderators can see:

    mobile appointment risk scores

    flagged unsafe locations

    stylists who repeatedly report unsafe customers

    escalation logs

Supports “Safety Response Workflow” in support tools.

---

## 17. Support Tools

Support agents can manage:

    incoming tickets

    booking problems

    refund requests

    reputation appeals

    identity issues

Tools include:

    actor lookup

    issue tagging

    message templates

    escalation routing

---

## 18. Admin KPIs and Dashboards

Admins track:

Booking KPIs

    completion rate

    cancellation rate

    dispute rate

Financial KPIs

    escrow turnover

    paymaster cost

    LP yield stability

Safety KPIs

    no-show trend

    unsafe location reports

    stylists blocked by properties

---

## 19. Summary

Document 22 provides the full governance framework for:

    Human + automated moderation

    Safety, fairness, and dispute handling

    Financial and on-chain oversight

    Reputation integrity

    Property + stylist ecosystem management

    DeFi & liquidity monitoring

    Abuse prevention

    Admin workflows

This becomes the backbone for:

    Admin UI design

    Backend permissions

    Smart contract safeguards

    Operational security procedures








































































