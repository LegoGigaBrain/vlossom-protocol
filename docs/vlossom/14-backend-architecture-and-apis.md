# 14 — Backend Architecture & APIs

Service Boundaries, API Contracts & Integration with Smart Contracts

---

## 1. Purpose of This Document

This document defines the backend architecture for Vlossom:

    What backend services exist

    How they talk to the smart contracts (Doc 13)

    What APIs (REST/JSON) each service exposes

    How AA wallets, gasless txs, on/off-ramps, and DeFi are orchestrated

    How we separate:

        customer / stylist / owner UX

        admin / operational tooling

        indexers & background workers

It bridges:

    Doc 05 — System Architecture Blueprint

    Doc 06 — Database Schema

    Doc 13 — Smart Contract Architecture

    Doc 15 — Frontend UX Flows

This is the main reference for:

    Backend engineers

    Claude Code (API & service scaffolding)

    DevOps & infra (Doc 23)

    Security & risk assessment (Doc 21)

---

## 2. Backend Design Principles

### 2.1 Pragmatic Modular Monolith (v1)

v1 can be a modular monolith (e.g., Node/TypeScript, NestJS/Express) with clear service modules:

    auth/identity

    wallet

    booking

    property

    reputation

    rewards/referrals

    defi

    notifications

    admin

These modules can later be split into microservices if needed.

### 2.2 Contract-Driven Architecture

Smart contracts (Doc 13) define the canonical state for:

    bookings (ids, status, amounts)

    escrow

    pools

    on-chain reputation / rewards anchors

Backend mirrors & enriches this via:

    PostgreSQL (or similar)

    Indexers that consume contract events

APIs are designed around:

    user intent (book service, approve booking, pay, stake, etc.)

    and then orchestrate contract calls + DB updates.

### 2.3 Web2.5 UX, Web3 Under the Hood

Frontend always speaks to backend over HTTPS JSON APIs.

Backend is responsible for:

    preparing UserOperations for AA wallets

    passing them through VlossomPaymaster (gasless)

    monitoring transaction status

    reflecting result in DB.

### 2.4 Role-Aware, Not Role-Locked

One user account can be:

    customer

    stylist

    property owner

    LP

Backend enforces role-based permissions but lets roles co-exist on one identity.

### 2.5 Idempotent, Event-Driven

All critical flows (booking, escrow, payouts) must be idempotent:

    retries should not double-charge or double-settle.

Indexers listen to:

    Booking events

    Escrow events

    Pool events

    Rewards/referrals events

Backend updates local DB accordingly.

---

## 3. High-Level Backend Components

Conceptual modules:

    API Gateway / HTTP Layer

    Auth & Identity Service

    Wallet & Payments Service

    Booking & Scheduling Service

    Property & Chair Service

    Reputation & Reviews Service

    Rewards & Referrals Service

    DeFi & Liquidity Service

    Notification Service

    Admin & Moderation Service

    Indexer & Worker Layer

    Chain Integration Layer

---

## 4. API Gateway / HTTP Layer

### 4.1 Responsibilities

Terminate HTTPS, handle:

    auth tokens

    rate limiting

    request logging

Route requests to internal modules.

Provide versioned REST endpoints:

Examples:

    /v1/auth/*

    /v1/wallet/*

    /v1/bookings/*

    /v1/properties/*

    /v1/reputation/*

    /v1/defi/*

    /v1/admin/*

### 4.2 Authentication & Session

Tokens:

    short-lived JWT access token

    long-lived refresh token

Session metadata includes:

    userId

    AA wallet address

    roles (customer/stylist/owner/LP)

    current locale & currency preference

Frontends never call blockchain directly – always via this backend gateway.

---

## 5. Auth & Identity Service

### 5.1 Responsibilities

Handle:

    signup / login (email, phone, Google, Apple)

    optional “Connect Wallet / Sign in with Wallet”

    profile basics (name, avatar, country)

    role enablement (become stylist, become property owner)

Integrate with:

    VlossomAccountFactory to deploy AA wallet

    VlossomActorRegistry (if/when used on-chain)

### 5.2 Key Endpoints (Examples)

    POST /v1/auth/signup-email

        body: { email, otp / password }

        creates user + AA wallet via AccountFactory

        returns tokens + basic profile

    POST /v1/auth/login-email

    POST /v1/auth/signup-wallet

        body: { externalWalletAddress, signature }

        links EOA, deploys AA wallet if needed.

    POST /v1/auth/enable-role

        body: { role: "stylist" | "owner" }

        sets up relevant profile structures, DB rows, and (later) registry entries.

---

## 6. Wallet & Payments Service

### 6.1 Responsibilities

Present unified wallet view (Doc 15):

    balances

    transaction history

    P2P transfers

    onramp / offramp

    DeFi tab bridging

Talk to smart contracts for:

    P2P transfer (token transfer() via AA wallet)

    VLP deposits/withdrawals

    booking escrow locks & releases

Integrate with:

    Onramp/Offramp partners (Stitch/Ramp/etc.)

    VlossomPaymaster (for gas sponsorship)

### 6.2 Key Endpoints (Examples)

GET /v1/wallet/overview

    returns:

        fiat display balance

        underlying USDC balance

        pending holds (escrow)

        quick actions

GET /v1/wallet/history

    filters: type = booking | chairRental | p2p | defi | onramp | offramp | rewards

POST /v1/wallet/add-funds

    body: { amountFiat, method }

    orchestrates onramp:

        create partner session

        wait for webhook

        credit AA wallet via chain call

POST /v1/wallet/withdraw

    body: { amountFiat, targetBankDetails }

    orchestrates transfer() from AA wallet to off-ramp account + logs.

POST /v1/wallet/send (P2P)

    body: { to: "@username" | phone | walletAddress, amount }

    resolves recipient → AA wallet

    creates UserOp via AA wallet → token transfer

### 6.3 Backend ↔ Chain Pattern

For any operation requiring on-chain calls:

    Backend validates business rules.

    Backend constructs UserOperation for AA wallet.

    Sends UserOp to bundler + paymaster.

    Monitors tx hash via indexer/worker.

    Updates DB on success/failure.

    Returns result to frontend (polling or websockets).

---

## 7. Booking & Scheduling Service

### 7.1 Responsibilities

Orchestrate full booking lifecycle (Doc 07 & Doc 15 UX):

    service selection

    time & location selection

    booking creation

    approvals

    calendar updates

    synchronization with VlossomBookingRegistry & VlossomPaymentEscrow

Provide calendar views for:

    customers

    stylists

    property owners

Integrate:

    Wallet Service (check balance, top-up, escrow)

    Notification Service (requests, approvals, reminders)

    Reputation Service (post-booking ratings)

### 7.2 Key Endpoints (Examples)

POST /v1/bookings/quote

    given:

        serviceId + addons

        actor preferences (location, date)

    returns:

        price breakdown

        duration

        candidate timeslots

POST /v1/bookings/create

    body: { quoteId, slot, locationMode, propertyId?, chairId? }

    steps:

        validate slot still available

        call Wallet service to lock funds (escrow)

        call BookingRegistry → createBooking

        notify stylist + property owner

POST /v1/bookings/approve (stylist)

POST /v1/bookings/property-approve (owner)

POST /v1/bookings/mark-started

POST /v1/bookings/mark-completed (stylist)

POST /v1/bookings/confirm-completion (customer)

POST /v1/bookings/cancel

GET /v1/bookings/my

    filters for:

        upcoming

        past

        pending approvals

### 7.3 Stylist & Property Calendars

GET /v1/stylist/schedule

GET /v1/property/:id/schedule

POST /v1/stylist/blocks (add/remove blocked times)

Backend computes:

    Service blocks

    Travel blocks

    Chair availability overlay

    Conflict detection based on DB + chain state.

---

## 8. Property & Chair Service

### 8.1 Responsibilities

Manage property profiles:

    salons / spaces

    photos, amenities, location

Manage chairs:

    per-chair amenities

    pricing rules

    availability windows

Manage owner rules:

    auto-approval

    minimum stylist TPS / rating

    block/allow lists

Integrate with VlossomPropertyRegistry to anchor properties/chairs on-chain.

### 8.2 Key Endpoints (Examples)

POST /v1/owner/properties

PATCH /v1/owner/properties/:id

POST /v1/owner/properties/:id/chairs

PATCH /v1/owner/chairs/:id

GET /v1/properties/search

    used in:

        customer discovery

        stylist chair rental search

POST /v1/owner/properties/:id/rules

    config auto-approval / thresholds.

Whenever properties/chairs are created or updated, backend:

    writes to DB

    calls VlossomPropertyRegistry to persist core fields on-chain.

---

## 9. Reputation & Reviews Service

### 9.1 Responsibilities

Collect and store rich review content off-chain:

    star ratings

    text feedback

    photos (future)

Keep on-chain aggregates anchored via VlossomReputationRegistry.

Provide read APIs for profiles & booking flows:

    average rating

    TPS summaries

    counts

### 9.2 Key Endpoints (Examples)

POST /v1/reviews/booking/:bookingId

    body: { target: "stylist" | "owner", rating, text }

    ensures:

        booking is completed

        user has right to review

    stores review in DB

    triggers aggregated metrics update

    eventually calls VlossomReputationRegistry via oracle.

GET /v1/reviews/actor/:actorId

GET /v1/reputation/actor/:actorId

Reputation update pipeline:

    Booking completes → event from chain.

    Backend sees “Completed” state and new review entries.

    Indexer/oracle computes new aggregates.

    Oracle calls VlossomReputationRegistry.updateReputation(...).

## 10. Rewards & Referrals Service

### 10.1 Responsibilities

Implement the onboarding flywheel logic:

    referral codes

    volume tracking

    tiered unlocks (Top 30% / 15% / 5%)

Integrate:

    with VlossomReferralRegistry on-chain

    with VlossomRewardsVault / RewardPoints

    with DeFi Service (pool creation rights)

### 10.2 Key Endpoints (Examples)

GET /v1/referrals/me

    returns:

        your code

        total referred actors (by role)

        referral volume

        current percentile tier

POST /v1/referrals/claim (if needed for manual bonuses)

GET /v1/rewards/me

    returns:

        points balances

        badges

        milestones

### 10.3 DeFi Integration

When a user hits tier thresholds, backend allows:

    POST /v1/defi/pools (create community pool)

Service ensures:

    Only wallets with sufficient referrer score and reputation can create pools.

---

## 11. DeFi & Liquidity Service

### 11.1 Responsibilities

Implement UX flows for:

    staking in VLP

    (later) joining community pools

    viewing pool stats & yield

Integrate with:

    VlossomGenesisPool

    VlossomCommunityPool

    VlossomYieldEngine

Always orchestrate operations via Wallet Service (single balance).

### 11.2 Key Endpoints (Examples)

GET /v1/defi/summary

GET /v1/defi/pools

GET /v1/defi/pools/:id

POST /v1/defi/pools/:id/deposit

POST /v1/defi/pools/:id/withdraw

All deposits/withdrawals:

    originate from AA wallet balance

    are performed through VlossomPaymaster (gasless)

    logged in Wallet history as DeFi transactions.

---

## 12. Notification Service

### 12.1 Responsibilities

Central handling of all in-app and push notifications:

    bookings

    approvals

    payouts

    LP yield

    referral milestones

    social follows / posts (later)

Power the Notifications tab (Doc 15).

### 12.2 Sources of Events

    Booking service

    Wallet service

    DeFi service

    Rewards service

    Indexers (on-chain events)

Notification types match those defined in Doc 15, section 12.1.

### 12.3 Key Endpoints (Examples)

GET /v1/notifications

    returns notification cards for logged-in user.

POST /v1/notifications/mark-read

The underlying storage:

    DB table for notifications with:

        actorId

        payload (card type + data)

        read/unread status

---

## 13. Admin & Moderation Service

### 13.1 Responsibilities

Internal (or restricted) interfaces for:

    User management (ban/unban, KYC flags)

    Booking dispute resolution

    Fee & config management (via VlossomConfig)

Wallet oversight:

    freeze/unfreeze wallet

    force-refund in exceptional cases

Integrate with:

    VlossomAccessControl

    VlossomTreasury

    Reputation/Referrals/Rewards registry contracts

### 13.2 Key Endpoints (Examples)

(Behind strong auth; not publicly documented in app.)

    GET /v1/admin/dashboard

    POST /v1/admin/users/:id/freeze

    POST /v1/admin/users/:id/unfreeze

    POST /v1/admin/bookings/:id/resolve-dispute

    POST /v1/admin/config/update

Admin actions will often:

    call chain contracts with admin roles

    and update DB mirrors.

---

## 14. Indexer & Worker Layer

### 14.1 Responsibilities

Listen to contract events from:

    BookingRegistry

    PaymentEscrow

    Pools

    Reputation/Rewards

Update DB tables (Doc 06) to keep off-chain state aligned.

Run background jobs:

    booking timeouts (auto-confirmation)

    reminder notifications

    daily summaries (for LP/yield display)

### 14.2 Key Jobs (Examples)

    job:sync-booking-events

    job:sync-escrow-events

    job:resolve-auto-confirmations

    job:sync-defi-events

    job:update-reputation-snapshots

Workers must be:

    idempotent

    retry-safe

    observable (logging/metrics).

---

## 15. Chain Integration Layer

### 15.1 Responsibilities

Provide generic methods for all services to interact with the chain:

    sendUserOp(user, targetContract, data)

    callReadOnly(targetContract, data)

    subscribeEvents(contract, eventSignature)

Hide chain differences (Base vs Abstract) behind configuration.

### 15.2 Abstract vs Base (Chain Choice)

Business logic is identical.

Only this integration layer changes:

    which AA standard is used

    which Paymaster pattern is best-practice

    how bundlers are reached

Doc 23 (DevOps) will detail actual stack for chosen chain.

---

## 16. Error Handling, Idempotency & Security (Backend View)

### 16.1 Error Handling Patterns

User-facing errors always in plain language.

Internal errors logged with:

    trace IDs

    contract call details (but no secrets).

For financial flows:

    never throw away partial state; always reconcile with chain.

### 16.2 Idempotency

For operations like:

    createBooking

    stake

    withdraw

Backend should use idempotency keys or booking/pool-specific keys to avoid:

    double-creating bookings

    double-charging cards

    double-triggering escrow locks.

### 16.3 Security Hooks

Throttling for:

    P2P sends

    booking creation per user

    LP-related actions

Abuse detection for:

    referral spam

    fake bookings to farm rewards

Cross-reference with:

    Doc 21 — Security & Risk Register

---

## 17. Summary

    This backend architecture:

    Wraps all on-chain logic (Doc 13) in a clean Web2.5 API.

    Ensures global wallet, gasless UX, bookings, chair rentals, DeFi, and referral/rewards all flow through a coherent service layer.

    Stays chain-agnostic, so you can choose Base or Abstract later and only implement a thin integration layer.

    Keeps the door open for future features:

        business sub-accounts

        salon multi-sig treasuries

        subscription manager

        multichain DeFi
















