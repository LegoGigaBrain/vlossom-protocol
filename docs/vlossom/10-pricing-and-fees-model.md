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

---

# 10 — Pricing & Fees Model (v1.1)

Transparent, Gentle, Wallet-First Pricing Architecture for the Vlossom Ecosystem

---

## 1. Purpose of This Document

This document defines all pricing, fees, economic routes, and settlement flows in Vlossom Protocol.

It answers:

    How service pricing works

    How add-ons influence totals

    How chair fees are applied

    How platform fees work

    How refunds / cancellations are calculated

    How tips, P2P flows, and special events are handled

    How funds flow on-chain through escrow → stylist → property → treasury → LPs → smoothing buffer

    How to keep pricing clear, kind, and predictable

The pricing architecture must:

    reflect Vlossom’s brand values (rest, clarity, dignity, no surprises)

    support stylists, customers, and property owners fairly

    integrate smoothly with AA wallets and stablecoin escrow

    be fully compatible with future DeFi activation

---

## 2. Design Principles

### 2.1 “No Surprise Pricing”

Vlossom always shows:

    a single all-inclusive total

    a clean breakdown beneath

    zero hidden fees

    zero unexpected charges

This is central to the rest-first, trust-driven brand.

### 2.2 Stylist-Centered Earnings

Stylists should feel:

    respected

    treated fairly

    not exploited

    empowered to price according to skill

The system supports fair earnings through:

    transparent fee structures

    dynamic soft ranges

    flexible add-on logic

    chair rental clarity

    no-fee tipping

### 2.3 Wallet-First Payments

Pricing integrates with AA wallet logic:

    If wallet balance ≥ total → pay instantly → least cognitive load

    If insufficient → top up gracefully

    If card/Google Pay/Apple Pay → funds → stablecoin → escrow

Everything must feel soft and seamless.

### 2.4 Modular, Expandable, Future-Proof

The pricing engine supports:

    new beauty verticals (nails, makeup, etc.)

    multi-day special events

    travel, cross-border service routing

    RWA / salon tokenization (future)

    subscription models (future)

---

## 3. Service Pricing Model

Every service cost is:

Total Price = Base Price 
            + Add-ons
            + Travel Fee (if mobile)
            + Chair Fee (if in property)
            + Platform Fee
            + Buffer Contribution (tiny percentage)

### 3.1 Base Price

Stylist-defined:

    minimum

    maximum

    soft-range classification (market-informed)

Soft ranges do not enforce prices — they guide fairness and UX communication:

    “Gentle pricing”

    “Fair market range”

    “Premium specialist pricing”

### 3.2 Add-Ons

Add-ons include:

    hair length

    thickness/workload

    treatments

    wash

    styling finishing

    premium options (luxury braiding, advanced loc work, etc.)

Each add-on contributes:

    price delta

    duration delta

    The pricing engine recalculates final cost automatically.

### 3.3 Travel Fee

If stylist travels to customer:

    Travel Fee = per-km rate OR zone-based bracket (configurable)

Brand principle:

    Travel fee is clear and honest — never hidden.

    Travel is part of the “rest” philosophy (stylist brings ease to you).

### 3.4 Chair Fee

If booking happens in a property:

    Chair Fee = property-defined (hourly or per booking)

Chair fees are:

    always shown

    always included in the customer’s price

    automatically routed to property owner’s wallet

### 3.5 Platform Fee

Two categories:

    Customer Platform Fee

    Soft, visible, capped.
        
        Supports:

            gas sponsorship

            infrastructure

            real-time scheduling engine

            support & safety

Stylist Platform Fee

    Percentage taken from stylist payout.
    Kept low to avoid burdening stylists.

### 3.6 Buffer Contribution

Tiny percentage (0.1% – 0.5%).

Goes to:

    Smoothing Buffer (instant payouts)

    Risk reserves for dispute resolution

    Paymaster gas fund

This ensures stylists ALWAYS get their money instantly, even if user’s payment is still settling.

---

## 4. Refund, Cancellation & Dispute Pricing Model

### 4.1 Customer-Initiated Cancellation

| Timing     | Refund | Notes                      |
| ---------- | ------ | -------------------------- |
| ≥ 24 hours | 100%   | No penalty                 |
| 4–24 hours | 70%    | Partial penalty to stylist |
| < 4 hours  | 0–50%  | Based on stylist policy    |

### 4.2 Stylist-Initiated Cancellation

Customer receives:

    full refund

        loyalty compensation (points)

        platform credit (optional later)

Stylist receives reputation penalties.

### 4.3 Property-Initiated Cancellation

If a property double-books or cancels: (although platform should make sure chair booking does not double book)

    customer fully refunded

    stylist receives partial compensation

    property receives penalties

### 4.4 Dispute Flow Pricing

Funds remain locked until:

    amicable resolution → split according to agreement

    admin resolution → weighted split

    timeout → platform decides based on evidence

---

## 5. Special Event Pricing Model

Special events generate custom quotes:

    weddings

    photoshoots

    brand campaigns

    international travel

Pricing parameters:

    base multi-day rate

    travel distance / accommodation

    group sizing

    urgency / special requirements

    stylist tier

Quote Flow:

    Customer submits event request

    Stylist creates custom quote

    Customer reviews and accepts

    Partial deposit → escrow

    inal settlement after event

---

## 6. Tipping, P2P & Non-Booking Payments

### 6.1 Tips

    0,1% platform fee

    0,1% property fee

    100% to stylist

    Encouraged but entirely optional

Tips flow through:

    Customer Wallet → Stylist Wallet

Brand tone: tipping is gratitude, not obligation.

### 6.2 P2P Payments

Used for:

    assistants

    manual reimbursements

    courtesy adjustments

    informal exchanges

0–minimal routing fee for sustainability.

---

## 7. Wallet-Centric Payment Routing

When customer confirms booking:

If wallet balance ≥ total:
    → deduct balance → convert pricing → lock in escrow

If insufficient:
    → ask to “Top Up Wallet”
    → pay difference
    → continue booking

If paying by card:
    → card → onramp → USDC → escrow

---

## 8. Settlement Routing Model

When stylist completes and customer confirms:

Escrow → 
   stylistShare → Stylist AA Wallet
   propertyShare → Property AA Wallet
   platformShare → Treasury
   bufferContribution → Smoothing Buffer
   optionalLPFee → Genesis Pool

### 8.1 Settlement Percentages Example

| Party          | Example Share                |
| -------------- | ---------------------------- |
| Stylist        | 85%                          |
| Property Owner | 5–10% depending on chair fee |
| Platform       | 7–10%                        |
| Buffer         | 0.25%                        |
| LP             | optional 0.5–1%              |

All values configurable in VlossomConfig.

---

## 9. DeFi Integration (LP Yield Model)

As defined in Docs 11 & 12, Vlossom activates LP pools later, but pricing supports them from day 1:

Platform Fee splits support:

    LP yield

    smoothing buffer

    liquidity engine

Referrals fuel pool unlock tiering:

    Top 30% → Tier 3 pools

    Top 15% → Tier 2 pools

    Top 5% → Pool Creators

This pricing model ensures:

    LP yields are stable

    instant payouts are possible

    risk is minimized

---

## 10. Brand Alignment: “Ease, Clarity, Beauty”

Pricing copy, UX, and UI reflect:

    softness

    trust

    forward clarity

    emotional safety

Examples:

    “Everything included.”

    “No surprises.”

    “Your stylist earns most of this payment.”

    “Your payment is safely held until your hair is done.”

    “Instant payout guaranteed.”

Pricing becomes a comforting moment, not a stressful one.

---

## 11. Notifications & Transparency Hooks

Whenever price changes or fees apply:

    Notifications show why

    Explanations always match brand tone

    Users understand exactly what they are paying

For stylists:

    “Your payout for this booking will be R___.”

For customers:

    “Here’s your all-inclusive price, no surprises.”

---

## 12. Smart Contract Touchpoints

From BookingEscrow:

    lockFunds

    releaseFunds

    refund

    dispute

From Config:

    fee percentages

    buffer percentage

    LP yield routing

From PropertyRegistry:

    chair pricing

    approval logic

From ReferralRegistry:

    LP tier unlock impacts fee routing

---

## 13. Summary

This Pricing & Fees Model:

    aligns with brand philosophy (rest, clarity, fairness)

    ensures stylists earn well

    ensures properties earn fairly

    keeps customer pricing predictable

    integrates smoothly with wallet-first UX

    plugs seamlessly into DeFi architecture

    supports future expansion into beauty verticals, subscriptions, and RWAs

It is now fully consistent with all updated documents:
05, 06, 07, 09, 11, 12, 13, 15, 17, 22.

---

## Δ — DELTA LOG (v1.0 → v1.1)

### Added

    wallet-first pricing logic

    soft-range price intelligence

    smoothing buffer contributions

    DeFi LP fee split routing

    refund table and brand-aligned cancellation rules

    special event pricing

    tipping and P2P pricing model

    brand voice aligned transparency rules

    instant payout economics

### Modified

    simplified fee display

    platform fee split clarified

    improved settlement routing

### Removed

    any volatile token pricing

    any incentive structures that could burden stylists



















