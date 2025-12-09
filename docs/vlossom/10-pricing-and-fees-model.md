# 10 — Pricing & Fees Model

The economic architecture governing services, chair rentals, travel fees, add-ons, cancellations, platform commissions, and future liquidity incentives — optimized for fairness, transparency, and professional flexibility.

This is one of the most strategically important economic documents in the Vlossom Protocol.
It determines how value flows between:

customers

stylists

property owners

the platform

(later) liquidity providers

(much later) financing / credit modules

The goal is a luxury-grade, fair, transparent, scalable pricing meta that respects real-world hairstyling dynamics and prepares the foundation for future DeFi integration.

---

## 🌺 1. Purpose of This Document

This document defines:

    ✔ How stylists set prices
    ✔ How add-ons modify prices
    ✔ How chair fees are calculated
    ✔ How travel fees work
    ✔ How platform fees are structured
    ✔ How cancellations & penalties are determined
    ✔ How pricing soft ranges ensure market fairness
    ✔ How special events and multi-day pricing work
    ✔ How future DeFi integrations plug in cleanly

It must support:

    luxury user experience

    dynamic marketplace behaviour

    cross-border expansion

    administrative clarity

    fairness across all actors

    scalability for DeFi activation

---

## 🌸 2. Pricing Principles

### 1. Stylists should have full pricing freedom

Vlossom provides frameworks, but does not dictate pricing.

Stylists can:

    set any base price

    exceed market averages

    undercut market ranges

    upsell premium or signature services

    use add-ons to construct modular offerings

### 2. Customers deserve full transparency

UI must always show:

    base price

    add-ons

    travel fees

    chair fees

    platform fees

    total price

    "above market average", "market range", or "premium pricing" indicators

### 3. Property owners must have predictable revenue

    Their expected chair revenue is calculated before checkout.

### 4. The system must scale internationally

    Pricing is currency-agnostic, stablecoin-compatible, and ready for multi-country operation.

### 5. Behaviour affects money

Reputation influences:

    fees

    pricing visibility

    boost or reduction of platform commissions

### 6. The pricing model must integrate with DeFi

Once LP pools activate:

    payouts can be instant, smoothed, and protected through buffers

    fees create protocol-level liquidity

---

## 🌍 3. Pricing Components Overview

The total price of a Vlossom booking is calculated as:

TOTAL PRICE = 
    Base Service Price
  + Add-ons
  + Travel Fee
  + Chair Fee
  + Platform Fee
  - Applicable Credits/Rewards

Each element is modular and configurable via admin panel.

---

## 🌿 4. Base Service Pricing (Stylist-Controlled)

Each service in stylist_services defines:

    base_price

    currency

    duration_min

Stylists can:

    set any price

    adjust over time

    duplicate services with premium versions

    define pricing per location (future)

    build signature offerings

UI will automatically surface:

    “Within market average”

    “Premium pricing”

    “Budget pricing”

based on soft range guidelines.

---

## 🌱 5. Add-On Pricing (Modular & Transparent)

Each add-on modifies the base price:

Add-on price types:

    Fixed delta (e.g., +R150)

    Percentage delta (e.g., +15%)

    Duration delta (e.g., +30 minutes)

Add-ons support:

    extra hair length

    braid thickness tiers

    washing/treatments

    special event premium

    international travel premium (future)

    extra effort time

    advanced product usage

Customers see:

    each add-on

    its price

    its duration impact

    the cumulative effect

The system remains modular so stylists can construct infinite service configurations.

---

## 🌸 6. Travel Fee Model (Domestic & Early International Logic)

The goal is to keep travel logic simple, fair, and scalable.

Travel fees apply when:

    service location = CUSTOMER_HOME

    stylist has enabled travel mode

Two levels:

### A. Domestic Travel Model (v1)

Travel fee =

(base_km_rate * distance_km)  
+ time_multiplier(distance_time)
+ stylist_custom_modifier

#### Where:

    distance_km = geospatial distance

    distance_time = estimated travel time

    custom_modifier = stylist-defined premium

The stylist can set:

    max travel distance

    custom per-km rate

    flat travel fees

“free travel within X km”

### B. International Travel Model (v2)

For cross-border, long-distance travel, we do NOT compute flights in-app for MVP.

Instead:

    special event → stylist generates quote → customer accepts

    travel is baked into total price

    system stores details in special_event_context

This gives:

    flexibility

    simplicity

    avoids unnecessary automation

    respects real-world complexity

A detailed international booking model is expanded in doc 18 — Travel & Cross-Border Bookings.


## 🌺 7. Chair Fee Model (Property Owner → Stylist → Customer)

Chair fees apply when:

    service location = PROPERTY

    stylist uses a salon chair

Chair fee structure can be:

### 1. Per booking

    fixed: e.g., R50 per booking

    percentage: e.g., 10% of service price

### 2. Per hour

    time-based, derived from booking duration

### 3. Daily/Weekly/Monthly rentals

For stylists who pre-rent chairs, chair fee per booking = 0
(they’ve already paid for the slot).

### 4. Premium chair multipliers

Properties with high amenities can define:

    premium chair

    luxury experience

    aircon surcharge

    wash basin surcharge

    lighting surcharge

These appear as:

    “Chair Fee” line item

    breakdowns in expanded rows

## 🌼 8. Platform Fee Model

Platform fees serve multiple future roles:

    marketplace maintenance

    liquidity pool reinforcement

    smoothing buffer funding

    dispute fund

    rewards pool funding

Platform Fee Types

    Percentage fee (e.g., 10–15% per booking)

    Fixed minimum fee (R5–R20)

    Tier-based fee adjustments (reputation sensitive)

    Surge fees (for peak time booking)

    Property-specific partner fee splits (future)

    Reputation-adjusted fees

Examples:

    Stylist with excellent reliability: –2% platform fee

    Stylist with high dispute rate: +3% fee

    Property owner with elite salon: lower platform fee

    Customer with poor behaviour: late cancellation surcharge

## 🌼 9. Cancellation, Refund & Penalty Pricing

Cancellation policy must:

    protect stylists

    protect property owners

    remain fair to customers

    reduce abuse

Default recommendations:

### A. Customer-Initiated Cancellations

Before stylist approval → free
After approval but before payment → free
After payment but >48h from appointment → full refund – platform fee
Within 24–48h → 50% refund
Within <24h → no refund
No-show → no refund + behaviour flag

All numbers configurable.

### B. Stylist-Initiated Cancellations

Customer receives 100% refund

Stylist receives behaviour penalty

Possible impact on search ranking

### C. Property Owner-Initiated Cancellations

Stylist receives full compensation from dispute fund (future)

Customer receives full refund

Property receives reliability penalty

### D. Partial Cancellations / Multi-Day Events

Special event cancellation logic applies (stored in context).


## 🌿 10. Soft Ranges Engine (Transparency Layer)

Soft ranges show customers:

    typical price

    median price

    premium threshold

Ranges are computed using:

    regional averages

    category-specific medians

    stylist level (junior/senior/master)

    peak vs off-peak

Ranges do not limit stylists — they enhance transparency.


## 🌾 11. Special Events Pricing Logic

Special events have custom pricing.

Stylists prepare:

    all-in price

    travel + accommodation if needed

    hours/days required

    assistants required

    premium rate

Customer sees one final quote.

Payment:

    full upfront for now

    deposits and second-stage payments added in future


## 🌸 12. Platform Revenue Streams (Current & Future)

Current

    platform fee (percentage)

    chair fee (split)

    travel fee margin (optional)

    premium salon partnerships

    featured listings

Future

    liquidity pool spread

    instant payout percentage

    financing interest

    DeFi yield strategies

    insurance / risk smoothing fees

    premium membership tiers


## 🌱 13. Stablecoin & Multi-Currency Support

All payments internally settle in stablecoins behind the scenes (long term), even if customers see:

    ZAR

    NGN

    KES

    USD

This ensures:

    liquidity efficiency

    consistent fee logic

    cross-border scalability

    DeFi compatibility


## 🌍 14. On-Chain Integration (Future)

When DeFi activates:

    fees partially routed to liquidity pools

    smoothing buffers protect stylist cashflows

    fee distribution encoded in smart contracts

    creditworthiness engines use behavioural economics

    Vlossom vault funds special financing

This document is the foundation for:

    doc 11 (DeFi & Liquidity Architecture)

    doc 12 (Liquidity Pool Architecture)


## 🌟 15. Summary

Vlossom’s Pricing & Fees Model:

    is modular

    is fair

    respects artistic freedom

    protects customers

    protects stylists

    empowers property owners

    sets a luxury standard

    prepares the economic base layer for the future protocol

It is the financial grammar of the entire Vlossom ecosystem.






















































