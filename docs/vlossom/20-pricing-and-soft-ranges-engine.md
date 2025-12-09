# 20 — Pricing & Soft Ranges Engine

Dynamic Pricing, Soft Bands, Market Calibration, Travel Logic, Add-Ons, Regional Factors & UX Transparency

---

## 1. Purpose of This Document

This document defines how Vlossom calculates price, explains price, and keeps pricing fair and predictable for:

    customers

    stylists

    property owners (chair fees)

    cross-border / travel events

    special events

    multi-day services

This engine is used in:

    Document 15 — Frontend UX Flows

    Document 18 — Schedule Simulation

    Document 19 — Travel & Cross-Border Bookings

    Document 07 — Booking Flow

    Document 10 — Pricing & Fees Model

And is critical for:

    booking quotes

    escrow amounts

    stylist revenue

    property share

    future DeFi yield routing

Vlossom requires pricing to be:

    transparent

    consistent

    culturally aligned to the beauty economy

    adaptable as markets change

---

## 2. Pricing Philosophy

Three guiding principles:

### 2.1 Predictability > Optimization

Users must trust the price.

We avoid surge pricing or unpredictable algorithmic jumps.

### 2.2 Soft Ranges > Hard Fixed Prices

Stylists get creative freedom.
Customers get understandable boundaries.

Soft ranges protect the market from:

    underpricing that hurts stylists

    overpricing that scares customers

    inconsistent pricing across regions

### 2.3 Everything is All-Inclusive

We avoid small line-items that overwhelm:

    base + addons + travel (if needed) + chair fee (if needed) + platform fee
    All shown clearly before asking for payment.

No surprises.

---

## 3. Components of Pricing

Pricing is composed of:

TOTAL PRICE =
  SERVICE PRICE
+ ADD-ONS
+ TRAVEL FEE (if mobile)
+ CHAIR FEE (if salon)
+ SPECIAL EVENT FEE (if multi-day or premium)
+ PLATFORM FEE
= FINAL CUSTOMER PRICE

And on settlement:

STYLIST REVENUE = 
  SERVICE PRICE + ADD-ONS + TRAVEL FEE
  minus stylist cancellation penalties (if any)
  minus optional property owner split


PROPERTY OWNER REVENUE =
  CHAIR FEE (per booking or rental model)
  + EVENT SHARE (if event hosted at salon)


PROTOCOL FEE = PLATFORM FEE

---

## 4. Core Data Model

Stored in DB + Pricing Engine Service:

### 4.1 Variables

    service base price

    add-on base price

    stylist soft-range band

    region soft-range band

    travel distance

    travel time

    chair price

    property soft-range band

    event type multiplier

    volatility index (market calibration)

    stylist experience / tier (optional)

### 4.2 Soft Range Band (per service, per region)

Each service in each region gets a soft band:

minPrice
avgPrice
maxPrice

This band is used to:

    guide stylists during setup

    verify prices are within cultural norms

    warn customers when price is below/above typical

---

## 5. Soft Range System

This is the heart of the engine.
Soft ranges are market-calibrated, not arbitrary.

Each service has:

SoftRange = {
  low: X
  median: Y
  high: Z
}

### 5.1 Stylist Pricing Rules

A stylist can set their own price but must fall within:

    (minPrice - 15%) → (maxPrice + 20%) 

Outside this range:

    system warns stylist (UI)

    still allowed, but shown as “Below Market” or “Above Market”

No hard enforcement unless:

    stylist reputation is low

    region has compliance rules (future)

### 5.2 Customer UI Labels

If stylist price < min band:
“Below Market (Budget-Friendly)”

If within band:
“Standard ▸ Fair Market Rate”

If above median:
“Premium Tier”

If above max band:
“High-End / Luxury”

Small label, big impact on trust.

---

## 6. Add-On Pricing Logic

Add-ons vary massively across stylists.

Example add-ons:

    extra length

    extra volume

    color

    wash / treatment

    wig customization

    travel preparation kit

Rules:

### 6.1 Add-ons must define:

duration impact

cost multiplier OR fixed cost

regional soft band

### 6.2 Add-ons affect timing simulation

Duration affects:

    appointment length

    travel feasibility

    chair availability

    scheduling blocks

---

## 7. Travel Pricing (Integrated with Doc 19)

### 7.1 Local Travel Fee

    travelFee = distance_km * stylist.travelRatePerKm

With minimum fee.

### 7.2 Peak-Time Multiplier

    if (peakHours):
        travelFee *= 1.2

### 7.3 Cross-City Travel Fee

    travelFee = base + (distance_km * crossCityMultiplier)

### 7.4 Cross-Border Travel Fee

Composed of:

homeToAirport
airportBuffer
flightCostEstimate
customsBuffer
hotelTransport

Pricing uses stylists’ Premium Travel settings.

### 7.5 Customer UI

    “Travel Fee Included”

    “Stylist will travel 22km to your location”

    “Cross-Border Travel Required”

---

## 8. Property & Chair Fee Logic

Chair fee depends on:

    property soft band

    peak times

    stylist rating (optional dynamic discount)

    property’s own pricing settings

### 8.1 Chair Fee Formula

    chairFee = property.baseChairPrice

Optional peak multiplier:

    if (peakHours) chairFee *= 1.15

Optional amenity multiplier (advanced salons):

    chairFee *= amenityTierMultiplier


---

## 9. Special Event Pricing

Multi-day events include:

    weddings

    photoshoots

    productions

    tours

    concerts

    brand activations

Components:

eventFee = (service fees per day)
         + (travel fees)
         + (accommodation fees)
         + (premium event multiplier)


Premium Multiplier Examples:

    Bridal: 1.4×

    Production shoots: 1.6×

    Celebrity bookings: custom ranges

---

## 10. Regional Pricing Model

Vlossom supports global scaling.

### 10.1 Regions influence:

    soft ranges

    travel multipliers

    service duration norms

    preferred times

Examples:

    Lagos vs Cape Town

    Joburg vs Durban

    Nairobi vs Accra

Regional pricing is stored as:

servicePriceBand[region][service]
travelMultiplier[region]
chairMultiplier[region]
eventTierDefaults[region]

---

## 11. Smart Contract Pricing Needs

Contracts store immutable pricing snapshot upon booking.

Includes:

    service price

    add-on cost

    travel fee

    chair fee

    platform fee

    total

Why?

    ensures dispute fairness

    prevents manipulation

    settlement is deterministic

All calculations occur off-chain in Pricing Engine → then pushed to chain.

---

## 12. UX Integration

### 12.1 Customer Price Breakdown

Shown before booking:

Service Price
Add-Ons
Travel Fee
Chair Fee
Platform Fee
---------
Total
(Stylist earns X)
(Property earns Y)

### 12.2 Stylist Price Setup

    soft ranges visible

    warning labels

    revenue preview

### 12.3 Dynamic indicators

UI indicators:

    “Travel fee increased due to long distance”

    “Popular time — chair fee adjusted”

    “This stylist is premium tier”

---

## 13. Fraud, Abuse & Undercutting Protections

### 13.1 Reputation throttling

If stylist repeatedly prices at ultra-low:

    ranking down-weight

    warning on set‐up

    platform may enforce minimums

### 13.2 Misleading pricing prevention

If stylist sets ultra-low service price but high add-on prices → flagged by engine.

### 13.3 Price-spike detection

If sudden jumps outside band → notification to stylist.

---

## 14. Future Extensions

### 14.1 AI Market Calibration

Automatically updates soft ranges by analyzing:

    thousands of bookings

    seasonal behaviour

    local market shifts

### 14.2 Dynamic tiering for stylists

Stylists unlock pricing flex based on:

    reputation

    TPS

    volume

### 14.3 Discounts & Promotions Engine

Vendor-led campaigns.

### 14.4 Multi-service bundles

e.g., “Wash + Retwist + Style”
Bundle pricing rules.

### 14.5 True dynamic load balancing

Suggesting optimal stylists during high congestion.

---

## 15. Summary

This Pricing & Soft Ranges Engine:

    keeps pricing consistent and culturally anchored

    gives stylists freedom but protects customers

    supports travel, events, multi-day bookings

    integrates with escrow & booking contracts

    enables rich UX clarity

    is expandable to global markets

    supports all future beauty verticals

This engine becomes one of Vlossom’s strongest trust-building mechanisms.






































































