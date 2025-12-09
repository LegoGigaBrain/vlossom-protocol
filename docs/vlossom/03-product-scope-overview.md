# 03 — Product Scope Overview

What We Are Building, What We Are Not Building (Yet), and the Phased Expansion of the Vlossom Protocol

---

## 🌺 1. Purpose of This Document

This document defines the explicit scope of the Vlossom product across its entire lifecycle:

    MVP (Phase 1)

    Phase 2 (Property Owners + Chair Marketplace)

    Phase 3 (Travel, Cross-Border, Premium Experiences)

    Phase 4 (DeFi Layer, Liquidity Pools, Financing)

    Phase 5+ (Global Expansion & Protocolization)

It answers:

    What features MUST be in the MVP?

    What features MUST NOT be in the MVP but must be architected now?

    What capabilities evolve in later phases?

    What is the difference between the app vs. the protocol?

        What is “nice to have” vs. “critical for success”?

This file prevents scope confusion and ensures every engineering decision aligns with the Vlossom vision.

---

## 🌸 2. The Scope Philosophy

Vlossom is a multi-layered, multi-actor, multi-flow product.
If you build everything at once, you fail.
If you build too little, you lose momentum.

## So the philosophy is:

    Build the base infrastructure for the entire ecosystem early, but only activate layers when the ecosystem is ready.

## This means:

    Payment settlement engine → built early

    Property owner module → architected early, activated later

    Travel logic → architected early, activated later

    DeFi liquidity pools → architected early, activated much later

    Reputation graph → MVP version built early, expanded gradually

Vlossom grows like a blooming flower—layer by layer, season by season.

---

## 🌍 3. High-Level Product Scope Summary

Vlossom is composed of seven functional pillars:

    User Identity & Profiles

    Service Layer (Services, Categories, Add-ons)

    Booking & Scheduling Engine

    Location & Chair Marketplace

    Payments & On-Chain Escrow

    Reputation & Performance System

    DeFi, Liquidity, and Financing (future)

Each pillar has its own MVP → Phase 5 expansion path.

This document defines exactly what belongs where.

---

## 🟣 4. MVP Scope (Phase 1 — “Connect Customers ↔ Stylists”)

The purpose of the MVP is to prove product-market fit and validate real-world booking behavior.

## ✔️ 4.1 MVP Actors

    Customers

    Stylists

    Platform Admin

Property owners exist in the data model, but not yet active.

## ✔️ 4.2 MVP Core Functionalities

A. Customer MVP Features

    Create account

    Set location

    Browse stylists

    Browse services + pricing

    View stylist profiles

    Booking request flow

    Confirm booking

    Pay full amount into escrow

    Approve completed service

    Rate & review stylist

B. Stylist MVP Features

    Create stylist profile

    Upload portfolio & images

    Set services + durations

    Set pricing

    Toggle mobile / fixed mode

    Set operating location

    Approve / decline bookings

    Manage calendar

    Mark job complete

    Track time performance basics

    View earnings

    On-chain wallet (abstracted)

C. Booking Flow MVP

    Customer → Request

    Stylist → Approve

    Customer → Pay

    Escrow locks funds

    Service occurs

    Completion + rating

D. Payments MVP

    Escrow contract

    Full prepayment

    Revenue split: Stylist + Platform

    Stablecoin payments via AA

    Card → onramp → wallet (abstracted)

    Dispute mechanism (manual admin)

E. Reputation MVP

    Ratings

    Reviews

    Basic punctuality metric

    Basic cancellation rules

F. Admin MVP

    Manage disputes

    Basic moderation

    Stylist verification checkpoints

---

## 🌱 5. Phase 2 — Property Owners & Chair Marketplace

This phase activates the third side of the triangle.

## ✔️ 5.1 Property Owner Activation

Property owners can now:

    List spaces

    List chairs

    List amenities

    Set chair pricing

    Upload photos

    Set availability

    Set surge pricing windows

    Enable “auto-approve stylists” OR “approval required”

## ✔️ 5.2 Chair Booking Integration

Chair booking becomes part of the main flow:

## Case A — Stylist pre-rents chair (daily/weekly/monthly)
    → No chair fees per booking, stylist keeps 100% (minus platform fee).

## Case B — Stylist does not pre-rent
    → Customer + Stylist booking triggers chair fee automatically.

## Case C — Customer chooses a specific salon
    → System verifies stylist-amenity compatibility → calculates travel time → overlays chair availability → finalizes booking.

Chair inventory is now a living schedule, mirrored in real time.

## ✔️ 5.3 Property Owner → Stylist Reviews

    property owners review stylists

    stylists gain a salon-specific reputation metric

## ✔️ 5.4 Matching Engine Expansion

Matching engine now considers:

    stylist location

    chair availability

    salon amenities

    travel distance

    customer preference

---

## 🌼 6. Phase 3 — Travel, Cross-Border, and Premium Experiences

This phase unlocks the “luxury experience” and “global mobility” side of Vlossom.

## ✔️ 6.1 Travel Logic Activation

Stylists can now set:

    travel availability

    city-to-city travel

    cross-country travel

    travel pricing presets

    blackout windows

    preferred travel class (future)

The scheduling engine calculates:

    travel time

    travel buffers

    multi-day blocks

    event-based booking windows

## ✔️ 6.2 Special Events Module

Customers can request:

    weddings

    photoshoots

    corporate events

    multi-day retreats

    personal glam squads

Flow becomes:

    Customer submits event requirements

    Stylist reviews → custom price

    Customer approves → pays

    Escrow locks full amount

    Multi-day schedule blocks

## ✔️ 6.3 Premium Salon Experiences

Customers can choose:

    boutique salons

    luxury salons

    eco-salons

    celebrity stylists

Premium pricing logic becomes active.

---

## 🌾 7. Phase 4 — DeFi Layer & Advanced Financial Tools

This is the economic evolution of the protocol.

## ✔️ 7.1 Liquidity Pools (VLP)

Liquidity providers stake stablecoins to:

    underwrite instant payouts

    smooth escrow

    fund dispute holdbacks

They earn:

    percentage of platform fees

    loyalty bonuses

    membership perks

## ✔️ 7.2 Stylist Financing

Using reputation + income history, stylists can access:

    micro-loans

    chair rent BNPL

    equipment financing

## ✔️ 7.3 Property Owner Financing

Property owners can access:

    renovation loans

    expansion loans

    equipment financing

Repaid through:

    future chair rentals

    property revenue splits

---

## 🌾 8. Phase 5+ — Protocolization & Global Expansion

Eventually, Vlossom becomes more than an app:

## ✔️ 8.1 Vlossom Protocol

Any beauty platform can integrate:

    ratings

    scheduling

    stylist reputation

    chair marketplace

    payments

    financing

## ✔️ 8.2 Cross-App Data Portability

Stylists move across apps, cities, and countries with a portable professional identity.

## ✔️ 8.3 Multi-Market Presence

Expansion to:

    Nigeria

    Kenya

    Ghana

    South Africa (base)

    UK

    USA

    Brazil

    Caribbean

## ✔️ 8.4 Extended Service Categories

Hair → Beauty → Grooming → Make-up → Nails → Skin → Barbering
BUT
natural hair remains the anchor.

---

## 🔍 9. Out-of-Scope (MVP + Early Phases)

To avoid scope creep:

❌ No in-app messaging with voice notes (MVP)

Basic chat only.

❌ No multi-artist teams (future)
❌ No AI style recommendations (future)
❌ No stylist subscription clubs (future)
❌ No NFT-based incentives (never)
❌ No governance tokens (never)

Security, legal, and risk concerns.

❌ No beauty product marketplace (future vertical)

These are intentionally pushed forward to maintain focus.

---

## 🌱 10. Final Scope Summary

MVP = Customer ↔ Stylist + Escrow + Reputation + Scheduling
(Property owner layer dormant but architected)

Phase 2 = Stylists ↔ Property Owners + Chair Rentals + Amenities

Phase 3 = Travel + Cross-Border + Events + Premium Experiences

Phase 4 = DeFi: Liquidity, Credit, Infrastructure Financing

Phase 5+ = Global Protocolization & Full Marketplace Maturity

This scope document ensures the platform scales gracefully, without needing to redesign or refactor core systems.

---





















































