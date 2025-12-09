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





















































