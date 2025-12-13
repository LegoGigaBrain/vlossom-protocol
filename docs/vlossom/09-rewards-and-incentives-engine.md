# 09 — Rewards & Incentives Engine

A modular, behaviour-driven incentive architecture for customers, stylists, and property owners — grounded in real-world performance and composable with future DeFi layers.

This is one of the most powerful and flexible components of the Vlossom Protocol.
It turns behaviour → incentives → economic movement → marketplace health.

We designed this to be modular, non-token, non-speculative, and upgradeable, with a strong future pathway into real-world DeFi incentives.

---

## 🌺 1. Purpose of This Document

The Vlossom Rewards Engine exists to:

    reward good behaviour

    elevate professionalism

    encourage platform loyalty

    strengthen trust

    improve marketplace efficiency

     stylists, customers, and salon owners

    prepare for future DeFi incentives

Importantly:

✔ No governance tokens
✔ No volatile tokenomics
✔ No speculation
✔ All incentives tied to real-world usage, behaviour, and economic flows

This document defines the structure, logic, types, and future expandability of the Rewards System.

---

## 🌸 2. Rewards Philosophy

We operate on five core principles:

### 1. Behaviour-first, not volume-first

Unlike typical “loyalty points,” Vlossom rewards healthy behaviour, such as:

    punctuality

    reliability

    professionalism

    consistency

    quality of service

    platform participation

    positive interactions

### 2. Rewards must reinforce the ecosystem — not distort it

    We do not want people spamming bookings or creating artificial behaviour.

    Everything must map to real economic value.

### 3. Rewards must feel luxurious and aspirational

Vlossom is a luxury, professional platform.
Rewards should reflect this:

Prestige tiers

    Elite badges

    VIP benefits

    Priority visibility

    Exclusive salon access

### 4. Rewards must be modular

We don’t hardcode reward logic into the core of the protocol.

Rewards are plug-ins that react to:

    reputation events

    booking events

    payout events

    customer spending events

    property owner performance

### 5. Rewards must align with future DeFi layers

When liquidity pools, credit, or financing activate, rewards will integrate cleanly.

---

## 🌼 3. Reward Entities (“Who Earns What?”)

Rewards apply to three actor classes:

### A. Stylists

Stylists earn rewards for:

    consistent punctuality (high TPS)

    low cancellation rate

    high customer ratings

    high property owner ratings

    completing bookings

    handling special events

    using premium salons

    expanding their portfolio

    long-term platform loyalty

    booking volume (controlled weight)

Stylists receive performance-based perks:

    lower platform fees

    visibility boosts

    instant payout eligibility (when liquidity pools active)

    premium salon access

    chair rental discounts

    professional tier badges

    financing eligibility (Phase 4)

### B. Customers

Customers earn rewards for:

    consistent bookings

    booking high-rated stylists

    punctuality

    good behaviour

    leaving fair reviews

    booking premium salons

    trying new stylists

    referring friends

    returning to the same stylist

    large bookings (special events)

Customer perks include:

    discounts

    credits

    beauty rewards

    early access to premium stylists

    fee waivers

    VIP tiers

    priority booking windows

### C. Property Owners

Property owners earn rewards for:

    consistent chair availability

    maintaining clean, high-quality salon spaces

    high stylist reviews

    reliability

    zero cancellations

    providing premium amenities

    hosting high-reputation stylists

    optimizing chair usage

Property owner perks include:

    platform boosts

    featured listings

    financing opportunities

    renovation funding (future)

    priority access to top stylists

    chair pricing multipliers


## 🌿 4. Reward Types

All rewards belong to one of these modular categories:

### 1. Points (Non-transferable)

A simple, numerical system:

    Earned from bookings

    Earned from behaviour

    Accrues over time

Used for:

    unlocking tiers

    unlocking perks

    redeeming for credits

    status maintenance

Stored in:

    reward_balances table

### 2. Credits (Spendable Credits)

Credits function like:

    booking discounts

    chair rental discounts

    fee discounts

    loyalty cashback

They are not tokens, not transferable, and exist only inside the Vlossom ecosystem.

Stored as:

    reward_credits rows tied to user_id

### 3. Badges & Achievements

Badges represent exceptional behaviour, such as:

    “On-Time Master”

    “Premium Stylist”

    “Chair Champion”

    “5-Star Month”

    “VIP Customer”

    “Elite Property Host”

Badges are:

    non-transferable

    visible on profile

    affect ranking & matching


### 4. Tiers (Bronze → Silver → Gold → Platinum → Diamond)

Each actor class has its own tier progression.

Tiers unlock:

    fee discounts

    priority ranking

    special access

    platform recognition

Tier decay happens when activity drops.

### 5. Multiplier Boosts

Boosts amplify:

    earnings

    points

    discounts

    chair payouts

Examples:

    +10% points for consistent punctuality

    5% chair rental boost for top property owners

    surcharge reduction for high-tier stylists

### 6. Unlockables

Unlockable perks include:

    salon premium access

    early access to booking windows

    ability to charge premium

    international travel eligibility (special events)

    Vlossom “Elite” marketplace badges

    financing / credit eligibility (future DeFi)

## 🌸 5. Reward Triggers

Rewards are triggered by events across the platform.

Examples:

### Event: Booking Completed

Triggers:

    stylist points

    customer points

    property owner points

    visibility boosts

    revenue-based boosts

    tier progression

### Event: High TPS for the month

Triggers:

    “Punctuality Pro” badge

    points multiplier

    visibility boost

### Event: Customer leaves fair, helpful reviews

Triggers:

    customer points

    behavioural score boost

### Event: Stylist hits milestone

Examples:

    100 bookings

    12-month streak

    10 perfect ratings

    zero cancellations for 3 months

Rewards triggered:

    badges

    credits

    discounts

    premium profile frame

    scheduling privileges

### Event: Property owner high reliability

Triggers:

    premium salon badge

    featured listing

    chair rental multiplier

    bonus credits

### Event: Dispute resolved in your favour

Could trigger:

    partial compensation

    points protection

    increased trust score

## 🌿 6. How Reputation and Rewards Interact

Reputation is input → Rewards are output.

For example:

    High punctuality → points multiplier

    Low cancellation → tier upgrade

    High stylist ratings → visibility boost

    High property scores → premium salon certification

    High customer behaviour → discount unlocks

The system reinforces:

    punctual behaviour

    reliable appointments

    low disputes

    professional standards

## 🌎 7. Rewards Storage Model

Database tables:

    reward_points

    reward_credits

    reward_badges

    reward_tiers

    reward_events

    reward_rules

    reward_multiplier_configs

These tables store:

    balances

    event logs

    badge unlocks

    tier progression

    streaks

    decays

## 🌺 8. Rewards Rules Engine (Core Logic)

The engine is rule-based, not hard-coded, allowing future expansion.

A rule consists of:

    trigger_event (e.g., booking_completed)

    conditions (e.g., TPS > 85, rating > 4.5)

    reward_type (points, credits, badge)

    reward_value

    expiry (optional)

Rules are stored in DB for dynamic updates.

Examples:

IF booking_completed AND stylist_tps > 80 THEN give_points(30)
IF monthly_bookings >= 20 THEN upgrade_tier(Silver)
IF property_rating_avg > 4.7 THEN unlock_badge("Premium Host")

This dynamic system means:

    → we evolve incentives without redeploying code
    → admin panel can adjust rules
    → A/B testing becomes possible

## 🌿 9. DeFi Integration (Phase 4 – Future Features)

Rewards integrate with future financial layers:

### 1. Liquidity Pool Multipliers

Stylists/customers providing liquidity earn:

    APY boosts

    fee reductions

    priority payouts

### 2. Credit / Financing Eligibility

Reputation + reward tiers determine:

    access to microloans

    chair financing packages

    salon expansion financing

    credit limits

### 3. Membership Staking Pools

Stake stablecoins → unlock VIP tiers.

## 🌟 10. Summary

The Rewards & Incentives Engine:

    rewards the right behaviours

    improves marketplace quality

    empowers top performers

    supports professional growth

    adds prestige and gamification

    drives long-term loyalty

    prepares the ecosystem for DeFi integration

    remains fully modular and upgradeable

This is the psychological engine that keeps the Vlossom ecosystem healthy, professional, and thriving.

---

# 09 — Rewards & Incentives Engine (v1.1)

Unified Points, Reputation Signals, Referrals, Streaks & Identity-Based Rewards for Vlossom Protocol

---

## 1. Purpose of This Document

This document defines the reward systems that reinforce Vlossom’s core brand philosophy:

    Grow from Rest

    Consistency over hustle

    Dignity, professionalism, and care

    Long-term trust between stylists, properties, and customers

It describes all mechanisms that allocate non-financial value:

    points

    badges

    streaks

    tier progression

    referral milestones

    TPS-integrated rewards

    LP pool unlock criteria

    compliance & fairness rules

…and how they interact with:

    AA Wallet

    Booking Events

    Reputation Registry (Document 08)

    Referral Registry

    DeFi Tiers (Document 11 & 12)

Rewards in Vlossom are utility-driven and non-transferable.
No speculation, no token volatility — only identity, trust, mastery, and belonging.

---

## 2. Design Principles

### 2.1 Rewards reinforce desired behaviors

We reward:

    punctuality

    consistency

    care for customers

    high hospitality

    low cancellation rate

    property cleanliness & reliability

    customer loyalty

    honest reviews

These directly align with brand values and marketplace health.

### 2.2 Rewards never replace revenue

Stylists are rewarded for good behavior, not exploited for it.
Points = privilege, not payment.

### 2.3 Soulbound, not financial

Points, badges, tiers cannot be traded or sold.

They represent:

    mastery

    identity

    growth

    professionalism

They are earned, not bought.

### 2.4 Vlossom Wallet Integration

Rewards appear in Wallet → Rewards tab, but DO NOT:

    affect wallet balance

    act like crypto tokens

Users feel progression, but the system stays clean & compliant.

### 2.5 Rewards feed into Vlossom ecosystem loops

referrals grow the network

good performance unlocks opportunities

LP tier unlocks build DeFi momentum

positive behavior becomes visible on profiles

high tiers yield better matching (search ranking)

---

## 3. Reward Categories

The Vlossom ecosystem uses five parallel reward systems, all unified under one registry:

| Category                      | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| **Experience Points (XP)**    | Universal progress for all actors                 |
| **Role Points**               | Stylist, Customer, Property Owner specializations |
| **Reputation-Linked Bonuses** | TPS, rating, consistency rewards                  |
| **Referral Scores**           | Unlocks LP pools + bonuses                        |
| **Badges & SBT Achievements** | Identity, milestones, honors                      |

---

## 4. Experience Points (Global XP)

Everyone earns XP through core interactions.

### 4.1 Earning XP (all roles)

| Action                      | XP      |
| --------------------------- | ------- |
| Completing a booking        | +10     |
| Consecutive bookings streak | +5–25   |
| Leaving reviews             | +2      |
| Receiving reviews           | +3      |
| Completing special events   | +20     |
| Early arrival / punctuality | +3      |
| Resolving disputes amicably | +5      |
| Referrals                   | +10–100 |

XP is used to:

show maturity in the system

unlock cosmetic profile elements

unlock special Vlossom experiences

XP is not tied to money — only presence & participation.

---

## 5. Role Points (Per Actor Type)

Each role has its own reward logic.

### 5.1 Stylist Points

Earned through:

| Stylist Behavior                               | Points      |
| ---------------------------------------------- | ----------- |
| 5-star customer rating                         | +10         |
| Completing 10 bookings with no cancellations   | +25         |
| Fast approval (< 20 min)                       | +3          |
| High TPS scores                                | +10 monthly |
| Providing amenities                            | +5          |
| Excellent hospitality (future ML verification) | +?          |

Stylist Points unlock:

    early access to premium customers

    eligibility for community pool creation

    higher ranking in search

    badges (Master Braider, Trusted Stylist, etc.)

### 5.2 Customer Points

Rewards loyalty and good etiquette.

| Customer Behavior                | Points  |
| -------------------------------- | ------- |
| Early confirmation of completion | +2      |
| No-show avoidance streak         | +5      |
| Rebooking within 30 days         | +5      |
| Referral milestones              | +10–500 |
| Consistent tipping (optional)    | +2      |

Customer points unlock:

    priority booking slots

    access to exclusive stylists with limited availability

    loyalty experience badges

    seasonal perks

### 5.3 Property Owner Points

Rewards reliability, cleanliness, and professionalism.

| Property Behavior            | Points |
| ---------------------------- | ------ |
| High stylist satisfaction    | +10    |
| No double-booking mistakes   | +5     |
| Low cancellation rate        | +10    |
| Amenities quality            | +5     |
| Chair utilization milestones | +20    |

Unlocks:

    visibility boost

    better ranking in location-based search

    premium listing badge

---

## 6. Reputation-Linked Bonuses (TPS Engine)

TPS (Time Performance Score) feeds into rewards.

Stylists earn bonuses for:

    being on time

    approving quickly

    consistent service duration

    no excessive delays

Customers earn bonuses for:

    arriving on time

    confirming completion on time

    not canceling last minute

Properties earn bonuses for:

    honoring approval requests

    keeping chairs available as scheduled

This ensures rewards reflect professionalism, not just activity.

---

## 7. Referral Engine Rewards

Vlossom referral system is central to growth.

### 7.1 Referral XP + Referral Score

Every new user onboarded through referral gives:

XP (for identity/progression)

Referral Score (for LP pool unlock tiers)

### 7.2 Referral Score → DeFi Unlocks

Top referrers (percentile-based) unlock:

| Percentile | Reward                     |
| ---------- | -------------------------- |
| Top 30%    | Access Tier 3 LP Pools     |
| Top 15%    | Access Tier 2 LP Pools     |
| Top 5%     | Can Create Community Pools |

Score =
    bookings volume of all referred users

    retention

    their referrals

    overall engagement

This builds a network marketing–like onboarding flywheel, but in a healthy, non-exploitative form.

---

## 8. Badges & SBT Achievements

Badges live in Wallet → Rewards and in Profile.

They are soulbound and reflect identity, not speculation.

Examples:

    Master Braider

    Elite Host (Property)

    100 Appointments Club

    Perfect TPS Month

    Top Referrer 2025

    Healing Hands Award (brand-driven)

    Garden of Growth (seasonal badge for consistent care)

Badges are emotional — strengthening belonging and pride.

---

## 9. Streaks (Consistency Engine)

Growth from rest = consistency, not grind.

Streaks measure healthy professionalism, not addiction.

Streak Examples:

    Customer: 3 bookings in 90 days

    Stylist: 5 on-time months

    Property: 30 days of zero double-bookings

---

## 10. Rewards → Wallet Integration

Rewards live in Wallet → Rewards Tab:

    XP

    Points

    Badges

    Referral status

    LP unlock status

Wallet never confuses:

    points with money

    badges with NFTs

    rewards with crypto

This preserves simplicity for Web2.5 users.

---

## 11. Notification Hooks (Cross-System)

Every reward event triggers:

    a push notification

    a card in Notifications tab

    a feed update on the user’s profile

Examples:

    “You earned 15 Stylist Points for perfect punctuality today.”

    “New badge unlocked: Trusted Customer.”

    “Congratulations! You’re now in the Top 15% referrers.”

---

## 12. Smart Contract Touchpoints

(Full spec in Doc 13; here is how contracts integrate.)

### RewardsVault Contract

Stores:

    XP

    Role points

    Referral score

Called by:

    BookingEscrow (on settlement)

    ReputationRegistry (TPS → point deltas)

    ReferralRegistry (referral → score deltas)

### ReputationRegistry

Provides:

    TPS values

    rating aggregates

    cancellation stats

RewardsVault reads these to compute monthly bonuses.

### ReferralRegistry

Feeds referral volume → DeFi tier unlock logic.

---

## 13. Anti-Gaming Rules

To maintain fairness:

    XP caps per day

    Referral fraud detection

    No XP awarded for declined bookings

    No points for fraudulent reviews

    Cancellation penalties outweigh reward gains

    Duplicate device referrals flagged

Rewards should be earned, not exploited.

---

## 4. Summary

This v1.1 unified reward engine now:

    aligns with brand identity

    integrates wallet-first experience

    supports gasless UX

    strengthens trust loops across actors

    powers DeFi onboarding flywheels

    reinforces consistent, dignified professional conduct

    supports non-financial identity through badges & SBTs

It is now fully compatible with all updated documents (05–07 and 13–15).

---

## Δ — DELTA LOG (v1.0 → v1.1)

### Added

    XP + Role Points split

    TPS-based bonuses

    Referral Score → LP unlock tiers

    Wallet Rewards tab integration

    Anti-gaming systems

    Badges (brand-aligned)(SBT)

    Streaks

    Multi-actor rewards (Customers, Stylists, Properties)

    Event-driven notifications

### Modified

    Referrals now include retention + downstream tree

    Points separated from financial incentives

    RewardsVault contract expanded

### Removed

    Any token-like representation

    Any financialized reward mechanic















