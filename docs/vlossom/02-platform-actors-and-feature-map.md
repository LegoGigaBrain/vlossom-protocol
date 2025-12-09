# 02 — Platform Actors & Feature Map

Defining All User Types, Their Roles, Capabilities, and the Feature Matrix Across MVP → V2 → Protocol Evolution

---

## 🌺 1. Purpose of This Document

This document defines every core actor inside the Vlossom ecosystem, how they interact with the platform, and the full lifecycle of features associated with each role.

## It answers fundamental structural questions:

Who uses Vlossom?

What do they need?

What value does the platform give them?

Which features belong to which actor?

How do these features evolve across stages?

Where do blockchain, payments, and reputation intersect with each actor?


## This file is foundational for:

backend architecture

smart contract roles

scheduling logic

UX flows

API routing

permission systems

agent-based development (Claude Code)

future modular expansion

If Document 01 defines why Vlossom exists,
Document 02 defines for whom Vlossom exists and how the ecosystem coheres.

---

## 🌸 2. The Three Core Actors

## Vlossom is a tri-sided marketplace and economic protocol, built around three primary user types:

    Customers

    Stylists

    Property Owners (Salon Space Providers)

These are the “main triangle.”

### However, Vlossom also includes supporting actors:

    Platform Admin (Vlossom HQ)

    Liquidity Providers (DeFi role; future)

    Accreditation Partners (future)

    Travel Logistics Partners (far future)

The three core actors form the foundation, and the extended actors expand the protocol’s capabilities over time.

---

## 🌿 3. Actor Archetypes (Deep Narrative Profiles)

This section describes each actor NOT as a “user persona” but as a business entity inside the Vlossom economy.

It captures who they are, what they care about, and what problems the platform solves for them.

## 3.1 Customer (Client Seeking Natural Hair Care Services)

## Who they are

Everyday individuals — mostly women, but increasingly men — who seek professional natural hair services:

    Braiding

    Protective styles

    Natural hair treatments

    Locs maintenance

    Styling for events

    Grooming

    Children’s haircare

## They value:

    convenience

    reliability

    safety

    quality

    transparency

    stylist professionalism

## Their Pain Points

    Hard to find reliable stylists

    No trust in Instagram/DM-based bookings

    Hidden fees

    Long unexpected service times

    Traveling far for quality

    Uncertainty about stylist skill

    No-shows or last-minute cancellations

    Poor salon experiences

    No way to verify stylist’s reputation

## What Vlossom solves

    Transparent booking

    Verified stylists

    Accurate time estimates

    Clear pricing

    Secure, escrow-based payment

    Real reviews

    Location-based matching

    Ability to choose salon or home

## Customer Modes

    Local everyday customer

    Premium experience customer

    Travel customer (visiting another city/country)

    Salon-seeking customer (prioritizes space/ambience)

    Stylist-loyal customer (follows stylist wherever)

---

## 3.2 Stylist (Professional Hairstylist / Mobile Hairstylist / Braider)

## Who they are

Independent stylists, often self-taught or trained, working:

    from home

    from mobile setups

    from rented chairs

    from owned salons

## They value:

    business stability

    consistent bookings

    professionalism

    financial empowerment

    exposure to new clients

    career progression

## Their Pain Points

    No reliable scheduling

    No business management tools

    Manual admin

    No digital identity or credentials

    Difficulty finding clean, equipped spaces

    Cancellations disrupt income

    Hard to grow reputation

    No trust infrastructure

## What Vlossom solves

    Full calendar engine

    Booking request + approval workflow

    Professional portfolio

    Structured reputation

    Secure on-chain payments

    Access to salon chairs

    Time accountability metrics

    Customer reviews

    Stylist-to-salon matching

## Stylist Modes

    Fixed stylist (has a base salon)

    Mobile stylist (goes to customers)

    Hybrid stylist

    Chair renter (short-term or long-term)

    Event/travel stylist (weddings, photoshoots, campaigns)

    Elite stylist (future tiers)

---

## 3.3 Property Owner (Salon, Studio, or Chair Provider)

## Who they are

Owners (or managers) of physical spaces:

    salons

    beauty studios

    home salons

    micro-salons

    boutique spaces

    premium luxury salons

## Their Pain Points

    Underutilized chairs

    Rent inconsistencies

    No access to reliable stylists

    No easy scheduling tools

    Hard to advertise available chairs

    No transparent reputation system for stylists

## What Vlossom solves

    Chair listing marketplace

    Automated booking logic

    Per-hour / per-day / per-week / per-month rentals

    Transparent reputation of stylists

    Amenities-based matching

    Passive income stream

    Platform protection rules

    Payment settlement automation

    Dispute resolution

## Property Owner Types

    Daily rental owner

    Premium hourly salon

    Boutique experience salon

    Long-term professional salon

    Home-salon owner

---

## 3.4 Platform Admin (Vlossom HQ)

Responsibilities

    dispute resolution

    fraud protection

    quality control

    managing accreditation partners

    approving premium property listings

    curating top stylist tiers

    platform fee configuration

    marketplace moderation

    safety guidelines

    handling support tickets

This is an internal actor but crucial for system design.

---

## 3.5 Liquidity Providers (Future, DeFi Layer)

Not part of MVP — but part of long-term protocol vision.

## They provide:

    liquidity for instant payouts

    liquidity for escrow smoothing

    liquidity for stylist/property financing

## And receive:

    yield from platform fees

    exclusive membership perks

    loyalty rewards

    system-level influence (non-governance)

---

## 🌺 4. Feature Map Overview

This section assigns every platform feature to a specific actor, across three stages:

    MVP

    Phase 2 (Property Owners + Chair Marketplace)

    Phase 3–4 (Cross-border + DeFi + Advanced Reputation)

This map becomes the blueprint for backend architecture and smart contract design.

---

## 🌼 5. Detailed Feature Map by Actor

## 5.1 Customer Feature Map

📍 MVP

    Account creation

    Profile setup

    Location selection

    Browse stylists by:

        distance

        service type

        time availability

        rating

    Service selection

    Booking request flow

    View stylist portfolio

    Confirm booking

    Pay full amount to escrow

    Approve completed jobs

    Submit ratings & reviews

📍 Phase 2

    Choose salon or stylist’s base location

    Filter by salon amenities

    Cross-location stylist matching

    Request special-event styling

    Multi-day booking proposals

    Real-time salon-chair availability

📍 Phase 3–4

    Cross-border bookings

    Premium location tiers

    Automated travel suggestions

    Loyalty points

    Priority booking windows

    Access to elite stylist tiers

---

## 5.2 Stylist Feature Map

📍 MVP

    Stylist profile

    Upload portfolio images

    Set services + durations

    Set pricing

    Set mobile vs fixed

    Booking request approvals

    Calendar management

    Mark job as completed

    Manage time performance metrics

    View earnings history

    On-chain wallet (abstracted)

📍 Phase 2

    Browse and book chairs

    Long-term (monthly) chair rental

    Hourly/daily rental

    Property-based recommendations

    Salon amenity compatibility filters

    KPI dashboards (punctuality, reviews, revenue charts)

📍 Phase 3–4

    International service settings

    Travel pricing presets

    Multi-day event proposals

    Stylist accreditation badges

    Credit line access (financing)

    Preferred property partnerships

    Elite-tier visibility boosts

---

## 5.3 Property Owner Feature Map

📍 MVP (on standby for future activation)

Not fully active in MVP but partially scaffolded:

    Property profile setup

    Chair count setup

    Amenities listing

    Base pricing

    Photo gallery

    Peak pricing rules

    Availability calendar

    Inactive features waiting for Phase 2:

    Rental approvals

    Stylist blocking

    Amenity-based filtering

    Automatic payouts

📍 Phase 2

    Appear in salon search

    Accept / auto-accept stylist requests

    Chair rental:

        hourly

        daily

        weekly

        monthly

    View stylist profiles + reputation metrics

    Property → Stylist reviews

    Dispute logging

📍 Phase 3–4

    Premium tier listing

    Verified salon badge

    Financing eligibility (DeFi)

    Revenue dashboards

    Preferred stylist partnerships

---

## 5.4 Platform Admin Feature Map

    View all bookings

    Approve disputes

    Suspend bad actors

    Configure fee splits

    Configure duration rules

    Override bookings (rare)

    Property verification

    Promote stylists to premium tiers

    Manage accreditation partners

    Monitor fraud patterns

---

## 5.5 Liquidity Provider Feature Map (Future)

    Stake stablecoins

    Earn proportional platform fee yield

    View usage metrics

    Tiered membership perks

    Lockup options

    Withdraw funds

---

## 🌟 6. Inter-Actor Dependencies

This section outlines which actors depend on which features.

## Customer depends on:

    Stylist availability

    Property amenities

    Platform trust & rules

        Reputation integrity

    Scheduling engine

## Stylist depends on:

    Chair availability

    Booking engine

    Payment settlement

    Reputation scoring

    Admin enforcement

## Property Owner depends on:

    Reliable stylists

    Accurate reputation data

    Scheduling alignment

    Platform policies

## Platform depends on:

    All three behaving ethically

    Accurate data

    Reputation signals

    Dispute management

This defines the ecosystem flywheel.

---

## 💠 7. Feature Evolution Chart

A simplified version of the progression:

## MVP

✔ Booking
✔ Reputation basics
✔ Payments + escrow
✔ Stylist approval
✔ Customer → Stylist
(but property owners scaffolded silently)

## Phase 2

✔ Property owners go live
✔ Chair rental logic
✔ Amenities / compatibility
✔ Real estate monetization layer
✔ Stylist–property integrations

## Phase 3–4

✔ Travel + cross-border logic
✔ Accreditation + professional standards
✔ Financial products (credit, financing)
✔ Liquidity pools
✔ Global protocol expansion

---

## 🌈 8. Final Positioning Summary

This document defines the full constellation of actors in the Vlossom ecosystem and assigns every cross-role feature across all product phases.

It is the primary reference point for:

    backend permissions

    API design

    smart contract roles

    UX flows

    scheduling & matching

    DeFi modules

    future marketplace expansion

From this map, all future architecture gains clarity.

































