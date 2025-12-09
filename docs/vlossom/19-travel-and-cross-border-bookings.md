# 19 — Travel & Cross-Border Bookings

Mobility Engine, Regional Rules, Travel Estimation, Multi-City & Multi-Country Styling Logistics

---

## 1. Purpose of This Document

This document defines how Vlossom handles:

    mobile stylist travel inside one city

    travel between cities

    cross-border / international bookings

    multi-location special events

    travel-time estimation logic

    mobility rules (stylist preferences + regulatory constraints)

    pricing, approvals & feasibility

    UX + backend + smart contract alignment

It builds on:

    Document 18 — Stylist Schedule Simulation

    Document 07 — Booking & Approval Flow

    Document 03 — Product Scope Overview

    Document 20 — Pricing & Soft Ranges Engine

    Document 15 — Frontend UX Flows

Travel is a core value proposition for the natural hair ecosystem. Vlossom’s mobility engine must feel accurate, premium, and culturally aligned while maintaining operational feasibility and trust.

---

## 2. Philosophy of Mobile & Cross-Border Styling

We design for three truths:

### 2.1 Mobility is a feature, not an edge case

Many stylists are mobile-first or hybrid.

### 2.2 Travel must feel effortless for both stylist and customer

The user should not think about routes, distances, or timing — the app simulates everything.

### 2.3 International & multi-day events are high-value

Weddings, tours, shoots, performances → these become premium Vlossom verticals.

Vlossom must support:

    cross-city

    cross-border

    multi-location

    multi-day travelling stylists

from MVP-forward, even if some flows activate later.

---

## 3. Mobility Profiles (Stylist Settings)

Every stylist chooses a Mobility Profile:

### 3.1 FIXED

    Works only from a property

    No travel allowed

    Any booking requiring travel is auto-rejected

### 3.2 MOBILE

    Travels within defined radius or time limit

    Can accept customer-home bookings

    Can accept salon bookings (chair rentals)

### 3.3 HYBRID

    Combination of both

    Can be location-selective (e.g., no cross-city)

### 3.4 PREMIUM TRAVEL (optional flag)

Stylists who allow:

    long-distance

    cross-border

    multi-day events

This unlocks the “Travel & Special Events” module in booking flows.

---

## 4. Travel Feasibility Engine

The engine determines if a stylist can physically and realistically perform a booking involving travel.

Inputs:

### Stylist variables:

    mobility profile

    max travel radius

    max travel time

    preferred travel methods (car, Uber, taxi, flight)

    travel cost multiplier

    cross-border preference (true/false)

    willingness to travel on short notice

### Booking variables:

    customer location

    property location

    other bookings that day

    service duration

    buffer times

### System variables:

    distance (via Maps API)

    traffic estimation

    flight availability (abstracted for MVP)

    border/city rules

---

## 5. Travel Scenarios

### 5.1 Same-City Travel (Local Mobility)

Supported by:

    MOBILE and HYBRID stylists.

Constraints:

    must fit:

        previous booking → travel time → new booking

        new booking → travel time → next booking

    travel must not exceed stylist’s max travel time

    travel must match stylist’s allowed service regions

Logic:
    if (travelTime <= stylist.maxTravelTime) slotPossible = true
    else slotPossible = false

Pricing integration:

    Travel fee added automatically using:

        distance-based multiplier

        peak-hour multiplier

        minimum travel fee

### 5.2 Cross-City Travel (Domestic Long Distance)

Triggered when:

    pick-up and drop-off locations are in different cities

    travel time exceeds maxTravelTime threshold

Conditions:

    stylist has “Allow Cross-City” enabled

    booking category supports long travel

    adequate buffer exists before next booking

    stylist approves manually (default)

Examples:

    Johannesburg → Pretoria

    Cape Town → Stellenbosch

Pricing:

    distance-tier pricing (banded)

    accommodation (optional for multi-day)

    per diem / food allowance (premium tier stylists)

### 5.3 Cross-Border (International Travel)

Applies when:

    customer is in a different country

    event spans multiple days

    travel requires flight logistics

### Pre-conditions:

Stylist must have:

    “Allow Cross-Border Travel” enabled

    valid passport stored (optional metadata)

    minimum reputation threshold

    premium-tier pricing enabled

### System locks the following blocks:

    home → airport

    check-in buffer

    flight duration

    customs buffer

    hotel travel

### Pricing model:

    base service price

    international travel fee

    accommodation fee

    per diem

e   vent surcharge (weddings, shows, productions)

### Approval:

Customer sends special request → stylist sends quote → customer accepts → funds locked → travel blocks scheduled.

---

## 6. Multi-Location Events

Events like weddings, corporate shoots, concerts often require:

    home → hotel

    hotel → venue

    venue → hotel

    next-day prep

The system supports multi-location itineraries:

Each event segment becomes:

    service block

    travel block

    rest buffer

A multi-day single booking request is broken into:

segments = [
  {start, end, locationA},
  {travel to locationB},
  {prep block},
  {main event block}
]

The schedule engine validates:

    no overlap

    travel feasibility

    block consistency

---

## 7. Travel Time Calculation (MVP Rules)

We define a deterministic travel time engine for MVP:

Base formula:
    travelTime = GoogleDistanceMatrix.duration * trafficMultiplier

Multipliers:

    trafficMultiplier (peak-time factor)

    regionMultiplier (rural / high-density areas)

    stylistMultiplier (stylist sets “I prefer longer buffer” flag)

Cross-City:

    if cityA != cityB:
        travelTime *= longDistanceMultiplier

Cross-Border:

travelTime = 
  homeToAirport + 
  airportBuffer + 
  flightDuration + 
  customsBuffer + 
  hotelBuffer +
  venueTravel

Each component is a separate block in the calendar.

---

## 8. Pricing Integration

The Travel Engine plugs into Document 20.

Base Pricing Inputs:

    distance

    time

    mobility tier

    peak/off-peak travel

    region (urban vs rural)

Calculated Outputs:

    travel_fee

    cross-city_fee

    cross-border_fee

    accommodation_fee

    premium_event_fee

These appear in the customer’s cost breakdown as:

Travel Fee
Chair Fee (if applicable)
Property Fee (if event is at salon)
Service Fee
Platform Fee


---

## 9. Smart Contract Interactions

Travel computation itself is off-chain.

But contract-level booking state contains:

    eventType: Standard / Cross-City / Cross-Border / Multi-Day

    travelFlags

    pricing breakdown (immutable once created)

    requiredApproval flags

When booking is created:

bookingType = computeBookingType(request)
travelParams = hash(travelDetails)
store in BookingRegistry
escrow.lockFunds(totalPrice)

Upgradability:

    Future versions may include:

    travel insurance fee routing

    per diem contract management

    flight/accommodation escrow

---

## 10. UX Integration (Document 15 Hook)

### Customer UX:

    “Travel Fee Included”

    “Stylist will travel X km to your location”

    “This event requires special approval.”

### Stylist UX:

    clear travel preview

    conflict warnings

    travel cost preview

    “Do you accept this travel distance?”

### Property Owner UX:

    chair compatible?

    travel surcharge?

    event logistics summary

### Notifications Module:

    travel conflicts

    long-distance approval required

    flight-time reminders (future)

---

## 11. Failure Modes & Edge Case Handling

### 11.1 Travel estimation unavailable

Fallback to stylist-defined max travel-day duration.

### 11.2 Cross-border visa/logistical issue

Stylist sets “Cannot travel” → booking auto-fails gracefully.

### 11.3 Customer changes event location last minute

Stops the booking, re-runs feasibility → may incur penalty fees.

### 11.4 Travel too high-risk

Stylist can manually decline; customer receives alternatives.

---

## 12. Future Extensions

### 12.1 AI Travel Prediction Engine

Learns patterns:

    traffic

    regional delays

    event-based congestion

### 12.2 Multi-Stylist Travel Teams

Supports bridal party teams and production crews.

### 12.3 Automated Flight Booking Integration

Vendor partnerships.

### 12.4 Live Travel Tracking

Customer sees “Stylist is en route”.

### 12.5 Global Travel Profile

Stylists set:

    passport expiry

    preferred airlines

    preferred hotels

    travel blackout dates

---

## 3. Summary

This module:

    enables mobile, hybrid, and premium travel stylists

    supports city, regional, and international bookings

    integrates with pricing, scheduling, and booking contracts

    is future-proof for high-value global beauty events

    prepares Vlossom to scale into the global marketplace

Travel is a premium unlock for stylists. Its architecture here ensures simple UX for users while maintaining strict feasibility and realism under the hood.


















































































