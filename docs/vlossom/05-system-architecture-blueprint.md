# 05 — Vlossom System Architecture Blueprint

A holistic technical blueprint describing how Vlossom’s modules, data flows, contracts, scheduling engines, and marketplace mechanics interact as a unified system.

---

## 🌺 1. Purpose of This Document

This file describes the full macro-architecture of the Vlossom platform.

It explains:

    how data flows through the system

    how the booking engine interacts with the stylist + property layers

    how payments and escrow plug in

    how scheduling simulation works

    how the reputation engine hooks into every major actor

    how the DeFi layer integrates (future)

    how the frontend, backend, and smart contracts communicate

    how cross-border logic sits on top of core architecture

It is the “bird’s-eye view” for:

    backend engineers

    AI agents (Claude Code)

    smart contract developers

    frontend/UX teams

    DevOps and infrastructure teams

This file ensures the entire system works together coherently.

---

## 🌸 2. High-Level System Overview

Vlossom consists of eight major architectural layers:

    Frontend Applications (Mobile + Web)

    Backend Services (API layer & business logic)

    Smart Contract Layer (Escrow, Payments, Reputation Anchoring)

    Database Layer (Postgres)

    Matching & Scheduling Engine

    Reputation Engine

    Chair Marketplace System (Property Owners)

    DeFi Layer (Liquidity Pools, Financing) — future

The system is modular, scalable, and designed to enable progressive activation of features.

---

## 🌍 3. Architecture Diagram (Described Verbally)

## Frontend (Mobile / Web)

⬇ communicates via

## Backend API Gateway

⬇ triggers

## Business Logic Services:

    booking-service

    stylist-service

    customer-service

    property-service

    payments-service

    reputation-service

    scheduling-service

    notification-service

⬇ interacts with

## Smart Contracts:

    escrow-contract

    payout-contract

    (future) liquidity-pool-contract

    (future) credit/financing-contract

⬇ backed by

## Database (PostgreSQL):

    users

    stylists

    properties

    chairs

    services

    categories

    bookings

    addons

    amenities

    reputation_scores

    payouts

    disputes

⬇ powered by

## Matching + Scheduling Engine:

    time availability

    travel time calculation

    chair availability

    amenity compatibility

    pricing logic

    special event timelines

    stylist preference rules

⬇ enriching

## Reputation Engine:

    service quality

    punctuality

    cancellation rate

    dispute history

    chair usage rating

    property owner reviews

    customer reviews

⬇ ultimately evolving into

## DeFi Layer (Phase 4):

    liquidity staking

    instant payouts

    smoothing buffers

    credit lines

    financing pools

---

## 🌼 4. Frontend Architecture (Mobile + Web)

Vlossom will have:

## A. Mobile App (Primary Interface)

Customers and stylists primarily operate via mobile.

Features:

    real-time location

    booking creation

    booking approvals

    portfolio browser

    calendar

    payments

    navigation

    stylist availability toggles

    salon finder (phase 2)

    event proposal flow (phase 3)

## B. Web Dashboard (Admin + Property Owners)

Property owners and platform admins work mostly from desktop.

Modules:

    chair listing management

    amenities setup

    schedule view

    rental history

    financial analytics

    moderate bookings

    manage disputes

    platform configuration

---

##🌿 5. Backend Architecture

The backend follows a service-oriented modular design, with clear separation of concerns.

Core Services:
 
---

## 5.1 Booking Service

Handles:

    booking creation

    booking editing

    booking approvals

    payment initiation

    travel calculations

    conflict detection

    calendar finalization

    booking cancellation

    fee calculation

Integrates with:

    stylist-service

    scheduling-engine

    payments-service

    reputation-engine

---

## 5.2 Stylist Service

Manages:

    stylist profiles

    portfolio

    pricing

    services offered

    durations

    location modes (mobile, fixed, hybrid)

    preferences (travel, special events)

    chair reservations (phase 2)

Interacts heavily with:

    booking-service

    reputation-engine

    property-service

---

## 5.3 Property Service (Phase 2+)

Handles:

    property profiles

    chair inventory

    amenity matrix

    chair eligibility rules

    property → stylist permissions

    property → stylist reviews

Works with:

    scheduling-engine

    booking-service

    matching-engine

---

## 5.4 Payments Service

Bridges backend → smart contract:

    create escrow sessions

    release funds

    dispute locks

    cancellations

    partial payouts

    refunds

    multi-party splits (stylist + property + platform)

---

## 5.5 Scheduling Engine

This is one of the most complex services.

It calculates:

    stylist availability

    travel time

    chair availability

    salon compatibility

    service duration

    multi-day blocks (events)

    mobile route ordering

    buffer times

It is the brain of the booking system.

---

## 5.6 Matching Engine

For customers searching:

    “Find stylist near me”

    “Find salon near me”

    “Find stylist available at desired salon”

    “Find stylist + chair match at specific time”

Matching uses:

    proximity

    availability

    amenities

    rating

    price tier

    mobile vs fixed

    stylist specialty

    property restrictions

---

## 5.7 Reputation Engine

Receives input from:

    bookings

    punctuality

    customer reviews

    property reviews

    dispute resolutions

    cancellations

    chair cleanliness / discipline

Outputs:

    reputation score

    professional score

    profile ranking

    salon compatibility score

    incentive eligibility

---

## 5.8 Notification Service

Triggers:

    booking requests

    booking approvals

    payment confirmations

    rating reminders

    stylist schedule updates

    property owner alerts

    dispute updates

---

## 🌺 6. Smart Contract Architecture

Smart contracts handle:

    payments

    escrow

    payout splits

    dispute holds

    stablecoin balances

    liquidity settlements (future)

MVP Contracts:

    EscrowContract

    PayoutContract

Phase 4 Contracts:

    LiquidityPoolContract (VLP)

    CreditLineContract

    FinancingContract

The off-chain backend triggers these via account abstraction.

---

## 🌎 7. Database Architecture (High-Level Entity Map)

Users

    customers

    stylists

    property owners

    admins

Stylist Data

    services

    durations

    pricing

    portfolio

    location modes

    reputation metrics

Property Data

    properties

    chairs

    amenities

    eligibility matrix

    property → stylist reviews

Services & Categories

    categories

    subcategories

    addons

    salon requirements

Bookings

    booking core

    add-ons

    payment status

    timeline blocks

    special event metadata

    travel calculation metadata

Reputation

    ratings

    punctuality logs

    complaints/disputes

Finance

    escrow sessions

    payout settlements

    platform fees

    disputes

Database structure is expanded fully in Document 06.

---

## 🌍 8. Booking Flow Architecture (System-Level)

## Step 1 — Customer selects service & location

Backend loads:

    duration range

    pricing

    stylist eligibility

    salon/amenity compatibility

## Step 2 — Matching engine runs

Finds stylists:

    near the customer

    performing the service

    available at timing

    with required amenities (if salon)

## Step 3 — Stylist approval

All bookings require stylist approval.
Stylist may also propose:

    alternative time

    alternative location

    chair rental

    travel fee

## Step 4 — Payment → Escrow contract

Customer pays full amount.
Funds locked.

## Step 5 — Service completion

Stylist marks complete.
Customer confirms.

## Step 6 — Escrow resolves payout

Funds released:

    stylist

    property (if applicable)

    platform fee

## Step 7 — Reputation update

Both sides provide ratings.

---

## 🌸 9. Chair Marketplace Architecture (Phase 2)

When property owners activate:

## Property Owner → lists chairs

Each chair has:

    availability

    amenities

    pricing

## Stylist → browses & books

Short-term or long-term.

## Booking → triggers automated chair reservation

If the customer selects a specific salon:

    system checks stylist compatibility

    checks chair availability

    checks salon amenities

    checks stylist mobility rules

## Payout Split

Escrow now splits:

    stylist

    property owner

    platform

---

## 🌍 10. Travel & Cross-Border Booking Architecture (Phase 3)

Travel module includes:

    travel buffers

    city mapping

    cross-border pricing

    flight/transport logic

    multi-day booking blocks

This interacts with:

    scheduling engine

    special events module

    payment engine

---

## 🪷 11. DeFi Layer Architecture (Phase 4)

When activated:

## Liquidity Pools

    LPs stake stablecoins → earn a share of platform fees.

## Instant Payout Buffer

    Allows stylists to receive funds instantly even if customer confirmation is pending.

## Financing

Reputation + income history → credit line.

This layer plugs directly into:

    payments-service

    smart contracts

    reputation-engine

---

## 🌟 12. Infrastructure & DevOps (High-Level)

Not detailed here (Document 19 will cover fully), but:

    Vercel / Expo for frontend

    Node.js backend

    PostgreSQL

    Hardhat/Foundry for smart contracts

    CI/CD pipelines

    Monitoring dashboards

    Error reporting

    Alerting

    Containerized deployments (future)

---

## 🌈 13. Final Summary

This architecture blueprint defines how the entire Vlossom system operates at a macro level:

    frontend ↔ backend ↔ smart contracts

    booking ↔ scheduling ↔ property owners

    reputation ↔ payments ↔ incentives

    travel ↔ special events ↔ multi-day blocks

    liquidity ↔ financing ↔ yield layers

This file ensures a unified mental model for all contributors and AI agents.

---

# 05 — System Architecture Blueprint (v1.1)

Lightly Brand-Infused • Updated for Global Wallet, AA Gasless, DeFi Tab, P2P, Onramp/Offramp, and Revised Booking Engine

---

## 1. Purpose of This Document

This Blueprint defines the complete technical architecture of the Vlossom platform.

It describes:

    The system modules (backend, smart contracts, AA wallet infra, paymaster, database, indexer)

    The data flows that orchestrate bookings, escrow, payouts, wallet actions, referrals, rewards, and DeFi

    The frontend → backend → chain interaction pipeline

    The architectural principles that ensure:

        calmness

        predictability

        trust

        low cognitive load

Vlossom must feel effortless and reassuring — this document ensures the technology supports that experience.

This file is the reference for:

    Backend engineers

    Smart contract developers

    DevOps

    API designers

    Claude Code agents

---

## 2. Architecture Overview (Updated v1.1)

Vlossom is built on a multi-layer architecture, optimized for Web2.5 ease with Web3 infrastructure underneath.

CLIENTS
 ├─ Mobile App (iOS/Android)
 ├─ Web App (Customer, Stylist, Owner Dashboards)
 │
BACKEND SERVICES (Orchestrators)
 ├─ API Gateway
 ├─ Booking Service
 ├─ Wallet Orchestration Service (NEW)
 ├─ Payment Orchestration Service
 ├─ Onramp/Offramp Adapter
 ├─ Scheduling Engine
 ├─ Property & Chair Service
 ├─ Stylist Availability Engine
 ├─ Notification Service
 ├─ Identity & Roles Service
 ├─ Reputation Aggregation Service
 ├─ Rewards Service
 │
CHAIN INTERACTION LAYER
 ├─ AA Wallet Factory
 ├─ Paymaster (Gasless)
 ├─ Signing & UserOp Service
 ├─ Tx Relayer
 │
BLOCKCHAIN (Business Logic)
 ├─ BookingRegistry
 ├─ PaymentEscrow
 ├─ PropertyChairRegistry
 ├─ ReputationRegistry
 ├─ ReferralRegistry
 ├─ RewardsVault
 ├─ Liquidity Pools (VLP, community pools)
 ├─ ProtocolTreasury
 │
DATA LAYER
 ├─ PostgreSQL (Primary transactional DB)
 ├─ Redis (Sessions, queues)
 ├─ Event Indexer (From chain → DB)
 ├─ Object Storage (media)
 │
INFRA
 ├─ Kubernetes / Serverless
 ├─ Observability (Logs, Metrics, Tracing)
 ├─ CI/CD

### Brand Principle Infusion:

    The architecture reduces user stress by ensuring smooth transitions, predictable state, and instant feedback loops.

---

## 3. Core Platform Principles (With Light Brand Influence)

### 3.1 Calm by Design

    No abrupt UX moments

    Architecture minimizes edge-case exposure

    All async processes provide state updates

### 3.2 Trust Through Transparency

    Deterministic event logs

    Clear status transitions

    On-chain escrow = visible safety

### 3.3 Ease Through Predictable Automation

    balance-first payment resolution

    silent AA wallet creation

    auto-syncing availability

    automated approvals when rules allow

### 3.4 Stability & Dignity in Performance

    deterministic scheduling engine

    chain interactions abstracted away

    low-latency architecture supports “effortless” feel

---

## 4. Actor-Specific Architecture Paths

### 4.1 Customer Path

User → App → API → Wallet Orchestration → Paymaster → Smart Contracts → Indexer → App

Tasks supported:

    discover services/stylists/salons

    create bookings

    pay from wallet

    P2P payments

    onramp → complete booking

    monitor booking lifecycle

    receive notifications

    withdraw funds

The architecture ensures:

    instant wallet balance updates

    reliable approval flows

    predictable completion and payout events

### 4.2 Stylist Path

User → App → Schedule Engine → Booking Service → Wallet → Chain

Supports:

    approval flows

    travel & availability logic

    earnings & payouts

    special event workflow

Emphasis on predictable schedule updates and minimal friction.

### 4.3 Property Owner Path

User → App → Property Service → Booking Service → Escrow → Payouts

Supports:

    chair registration

    amenity mapping

    rental approval rules

    chair-level scheduling

    payouts to treasury wallet

### 4.4 LP / Referrer Path

User → Wallet → DeFi Tab → API → Pool Contracts

Supports:

    staking

    yield

    pool creation (if eligible)

    referrals influencing pool tiers

### 4.5 Admin Path

Admin → Panel → Admin Service → DB / Chain / Wallets

Supports:

    risk controls

    dispute resolution

    financial monitoring

    user moderation

    paymaster funding

---

## 5. Domain Modules (Updated)

### 5.1 Wallet Orchestration Module (New)

Handles:

    balance checks

    escrow preflight

    P2P

    onramp/offramp flows

    LP interactions

    payment routing

    currency display logic

Inputs:

    booking engine

    fee engine

    DeFi engine

Outputs:

    signed UserOps

    contract calls

    wallet updates

    notifications

### 5.2 Account Abstraction Layer

    VlossomAccountFactory: creates wallets

    Paymaster: sponsors gas

    Relayer: sends txs

    Session keys (future)

Ensures:

    smooth UX

    no visible blockchain friction

### 5.3 Booking & Scheduling Module

Handles:

    booking creation

    rules for approvals

    chair availability

    travel feasibility

    conflict detection

    TPS inputs

    special events

Consumes:

    DB

    chain events

    property registry

    stylist schedule

### 5.4 Escrow Module

Manages:

    locking funds

    settlement

    cancellation

    penalties

    fee distributions

    buffer integration

    pool incentives

Strict invariants guarantee safety.

### 5.5 DeFi Engine

Handles:

    staking

    yield

    tier unlock logic

    pool creation

    pool APY models

Connected to:

    Wallet

    Rewards

    Referrals

    Treasury

### 5.6 Reputation Engine

Primarily off-chain aggregation.

Chain stores compact hashes.

Inputs:

    booking outcomes

    ratings

    TPS

    cancellations

    disputes

###  5.7 Notification Orchestrator

Consumes events from:

    backend services

    scheduler

    wallet

    pool engine

    chain indexer

Produces UI notifications:

    booking updates

    approvals

    payouts

    yield

    referrals

    social follow

### 5.8 Identity & Roles Module

Controls:

    customer / stylist / owner enabling

    role switching

    permissions

    KYC anchoring (future)

---

## 6. Updated Data Flows

### 6.1 Booking Lifecycle (Updated)

    User creates booking

    Backend computes quote

    Wallet module checks balance

    If insufficient → trigger onramp

    PaymentEscrow.lockFunds

    BookingRegistry.create

    Stylist approval

    Property approval (if required)

    Appointment active

    Completion

    Settlement

    Reputation update

    Rewards update

### 6.2 Wallet & Payments

Flows:

    onramp → wallet

    wallet → escrow

    escrow → distribution

    LP → wallet → pool

    pool → wallet (yield)

    P2P wallet → wallet

All amounts displayed in fiat, stored/transacted in stablecoin.

### 6.3 Notification Flow

Event sources:

    Chain (escrow, bookings)

    Backend (availability, schedule)

    DeFi engine

    Wallet service

Events → Notification Service → User.

---

## 7. Architecture Principles (Light Brand Infusion)

### 7.1 Smoothing User Experience

Architecture must minimize jarring transitions:

    predictable state

    real-time sync

    low latency

    cached fallback views

### 7.2 Clarity is Kindness

Every system state must be:

    observable

    knowable

    explainable

Brand value: reduce stress, empower the user.

### 7.3 Trust is Engineered

    deterministic contract behavior

    transparent state machine

    reliable payouts

    visible histories

### 7.4 Operational Calmness

    circuit breakers

    retry queues

    fail-soft mechanisms

The system must feel “steady.”

---

## 8. Interfaces & Responsibilities

### Frontend

    UI flows

    state machines

    wallet interactions

    notifications

### Backend

    compute orchestration

    rules engines

    validations

    chain adapters

### Blockchain Contracts

    escrow

    booking state

    property registry

    reputation anchors

    liquidity pools

### Paymaster / AA

    gas sponsorship

    transaction bundling

### Indexer

    reflect chain reality into DB

    feed notifications

    feed reputation engine

---

## 9. Non-Functional Requirements

### Performance

    <150ms backend latency

    <1s booking confirmation

    <2s wallet transitions

### Reliability

    99.9% uptime

    replay protection

    deterministic retries

### Security

    strict contract access roles

    encrypted wallet metadata

    protected paymaster

### Scalability

    modular services

    contract upgrade paths

    event-driven backend

### Accessibility

    mobile-first

    readable typography

    high contrast modes

---

## 10. Summary

This v1.1 architecture:

    integrates the global wallet hub

    unifies gasless AA experiences

    cleanly embeds DeFi as a wallet mode

    supports complex booking + chair logic

    ensures predictable, calm, luxurious UX

    remains chain-agnostic

    sets the foundation for all future expansions

It preserves rigor while softly reflecting Vlossom’s brand philosophy:
    ease, dignity, trust, and growth without friction.










