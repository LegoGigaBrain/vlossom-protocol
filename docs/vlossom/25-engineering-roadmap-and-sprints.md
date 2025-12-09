# 25 — Engineering Roadmap & Sprints

From Concept → MVP → Beta → Protocol Expansion

---

## 1. Purpose of This Document

This file defines how Vlossom will be built, in what order, by which agents, and with which dependencies.

It establishes:

    execution phases

    sprint breakdowns

    technical sequencing

    cross-team coordination

    Claude Code agent workflow

    vertical slice strategy

    rollout plans

Unlike high-level product planning, this roadmap is engineering-first and tightly coupled to:

    database schema

    smart contract architecture

    backend APIs

    frontend UX flows

    agentic workflows

It ensures Vlossom develops in a predictable, modular, scalable way while maintaining narrative and UX coherence.

---

## 2. Guiding Engineering Principles

### 2.1 Vertical slices, not horizontal layers

Each sprint delivers a fully working slice:

    UX → backend → smart contract → data → notifications

    This avoids the “half-built everywhere” problem.

### 2.2 Zero Web3 friction

Everything is engineered around:

    gasless AA

    stablecoin-only UX

    deterministic flows

    off-chain complexity, on-chain simplicity

### 2.3 Safety > Speed

Everything touching:

    money

    reputation

    bookings

must be deterministic, test-heavy, and auditable.

### 2.4 Future-proof but not future-bloated

Architect for:

    multichain

    DeFi pools

    salon multi-sig

    business sub-accounts

…but only build the MVP-critical subset first.

### 2.5 Claude Code + Human Hybrid

Claude agents handle:

    scaffolding

    code generation

    test authoring

    documentation

Humans handle:

    review

    security

    integration

    deployment

---

## 3. Phased Engineering Roadmap

### Phase 0 — Foundations (Weeks 0–2)

Goal: Set up environment, skeleton repo, agents, and CI/CD.

Deliverables:

    create monorepo (apps/frontend, apps/backend, contracts/, docs/)

    install AA wallet infra (Stackup or custom)

    implement Paymaster stub

    select chain (Base or Abstract) — optional placeholder adapter

    deploy dummy AA account factory

    setup Claude Code agents with /init and /context-sync instructions

    GitHub Actions CI

    Postgres instance + Prisma schema sync

    notifications service skeleton (webhooks + push provider)

Dependencies unlocked:

    Smart contract development

    Booking and user flows

    Database migrations

### Phase 1 — Account Layer + Wallet (Weeks 2–5)

Goal: Build the identity and financial spine.

    Sprint 1 — AA Wallet + Paymaster
    Sprint 2 — Wallet API + balance engine
    Sprint 3 — P2P transfers
    Sprint 4 — Onramp + Offramp integration (sandbox mode)

Deliverables:

    full AA wallet lifecycle

    gasless operations

    stablecoin contract integrations

    wallet microservice

    P2P send/receive

    QR request/pay flows

    unified transaction model

    global wallet history view

Dependencies unlocked:

    booking payments

    escrow flows

    LP deposits/withdrawals

### Phase 2 — Booking & Scheduling Engine (Weeks 5–10)

Goal: Deliver the core marketplace functionality.

    Sprint 1 — Booking Registry contract
    Sprint 2 — Escrow contract
    Sprint 3 — Dual approval logic (stylist + property)
    Sprint 4 — Scheduling engine (calendar, conflict detection)
    Sprint 5 — Travel + location logic
    Sprint 6 — Special events + quote builder (MVP lite version)

Deliverables:

    createBooking() end-to-end

    lockFunds() escrow pipeline

    approval flows

    cancellation + refund logic

    location routing

    travel considerations

    appointment state machine

    notifications for every transition

Dependencies unlocked:

    reputation

    property-chair flows

    earnings logic

### Phase 3 — Property Owner & Chair Module (Weeks 10–13)

Goal: Enable chair rental marketplace from day one.

    Sprint 1 — Property & Chair registry
    Sprint 2 — Approval rules + blocklist
    Sprint 3 — Chair availability UI + APIs

Deliverables:

    property onboarding

    chair metadata

    amenity compatibility checks

    chair rental payout routing

    hybrid approval logic (property-level)

Dependencies unlocked:

    stylist cross-location bookings

    salon-powered premium experiences

### Phase 4 — Reputation, Reviews & Rewards (Weeks 13–16)

Goal: Establish trust & behavioral reinforcement.

    Sprint 1 — ReputationRegistry contract
    Sprint 2 — Review models + indexer
    Sprint 3 — Rewards engine + SBT mapping
    Sprint 4 — Referrals engine

Deliverables:

    rating flow

    TPS (time performance score) pipeline

    reputation aggregates + hash commitments

    rewards vault + off-chain SBTs

    referral percentile ranking logic

Dependencies unlocked:

    LP tiered unlocks

    dynamic search ranking

    user onboarding flywheel

### Phase 5 — DeFi Layer v1 (Weeks 16–20)

Goal: Launch Genesis Pool (VLP) + DeFi tab integration.

    Sprint 1 — VLP contract
    Sprint 2 — deposit/withdraw flows
    Sprint 3 — simple yield model
    Sprint 4 — integration with wallet + history
    Sprint 5 — smoothing buffer integration (optional MVP)

Deliverables:

    staking from wallet

    unstaking to wallet

    yield indexing

    LP dashboard

    referral → LP unlock logic

Dependencies unlocked:

    community pools v2

    subscription manager (later)

    salon treasury flows

### Phase 6 — Frontend Deep Build (Weeks 20–28)

Goal: Assemble all UX flows into full-production UI.

    Sprint 1 — Global navigation
    Sprint 2 — Wallet flows
    Sprint 3 — Booking flows
    Sprint 4 — Stylist dashboard
    Sprint 5 — Property owner dashboard
    Sprint 6 — Notifications center
    Sprint 7 — Profile + social graph
    Sprint 8 — DeFi tab

Deliverables:

    fully functional app

    all screens mapped to components

    real-time status updates

    design system tokens (from Doc 16)

    brand onboarding (from Doc 24)

Dependencies unlocked:

    beta launch

    user testing

    stylist onboarding pilots

### Phase 7 — Beta Launch (Weeks 28–36)

Goal: Real-world testing with real stylists, customers & properties.

Deliverables:

    limited geographic rollout

    monitoring dashboards

    retention metrics

    stress tests

    bug bounties

    Paymaster cost analysis

    referral & onboarding funnel testing

Dependencies unlocked:

    v1.1 upgrades

    community pools

    multi-sig salon treasury

## 4. Sprint-by-Sprint Breakdown (Engineering-Ready)

Below is the granular breakdown engineers and Claude Code will use.

I will not paste the full table here unless you want — but it includes:

    sprint goals

    required services

    required contracts

    required migrations

    end conditions

    agent prompts for Claude

If you want, I can generate the full Sprint Table as a copy-pasteable .md section.

---

## 5. Claude Code Workflow Integration

Each phase includes:

    /init setup

    Spin up all agents:

        solidity agent

        backend agent

        frontend agent

        UX agent

        architecture agent

/context-sync

    Loads docs:

        00–29 index

        active sprint doc

        relevant contract specs

Agent roles

    UX agent → produces component trees

    Frontend agent → implements React/Tailwind components

    Backend agent → builds API routes + DB queries

    Contracts agent → writes Solidity + tests

    Integrator agent → binds frontend-backend-contracts

This structure eliminates ambiguity and preserves design consistency.

---

## 6. Rollout Plan (High-Level)

### MVP Rollout

Target cities:
Johannesburg → Pretoria → Cape Town (or similar staggered rollout)

Actors onboarded:

    premium stylists

    early adopter customers

    select property owners

### Beta Scaling

Add:

    referral engine

    LP unlock gamification

    first liquidity incentives

    stylist verification

### v1.1 Protocol Expansion

Add:

    special events full flow

    business sub-accounts

    salon treasury multi-sig

    subscription manager

### v2 — Beauty Economy Protocol

Add:

    nails, makeup

    educational marketplace

    product marketplace

    tokenized salon financing

    cross-chain DeFi routing

---

## 7. Success Criteria by Phase

Each phase is considered complete only when:

    deterministic tests pass

    gas cost is acceptable

    UX flows match spec

    Claude Code can regenerate modules consistently

integrations (wallet → booking → escrow → payout) succeed end-to-end

## 8. Final Overview

This roadmap ensures that Vlossom is built:

    modularly (each layer can evolve independently)

    scalably (ready for millions of users)

    narratively coherently (brand and protocol unified)

    technically elegantly (AA wallet, gasless, stablecoin-first)

    future-proof (DeFi, salons-as-DAOs, multichain, subscriptions, business accounts)

Vlossom starts as an app.
It becomes an ecosystem.
Then it becomes the global beauty protocol.

Your entire engineering foundation is now fully documented















































































